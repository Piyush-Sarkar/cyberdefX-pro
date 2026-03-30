import os
import sqlite3
import json
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from pydantic import BaseModel
from typing import Optional
from urllib.parse import urlencode

from database import get_db_connection

app = FastAPI()

# Add Session Middleware for OAuth and Login sessions
app.add_middleware(SessionMiddleware, secret_key=os.environ.get('SECRET_KEY', 'your_secret_key'))

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== OAuth Configuration =====
oauth = OAuth()

google = oauth.register(
    name='google',
    client_id=os.environ.get('GOOGLE_CLIENT_ID'),
    client_secret=os.environ.get('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

github = oauth.register(
    name='github',
    client_id=os.environ.get('GITHUB_CLIENT_ID'),
    client_secret=os.environ.get('GITHUB_CLIENT_SECRET'),
    access_token_url='https://github.com/login/oauth/access_token',
    authorize_url='https://github.com/login/oauth/authorize',
    api_base_url='https://api.github.com/',
    client_kwargs={'scope': 'user:email'}
)

# Pydantic models for auth
class SignupData(BaseModel):
    fullname: Optional[str] = None
    name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    password: str

class LoginData(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: str

# ===== Auth Routes =====

@app.post("/api/signup")
async def api_signup(data: SignupData):
    fullname = (data.fullname or data.name or '').strip()
    username = (data.username or data.email or '').strip().lower()
    password = data.password

    if not fullname or not username or not password:
        raise HTTPException(status_code=400, detail="All fields are required")

    try:
        conn = get_db_connection()
        conn.execute("INSERT INTO users (fullname, username, password) VALUES (?, ?, ?)",
                     (fullname, username, password))
        conn.commit()
        conn.close()
        return {'success': True, 'message': 'Account created successfully!'}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="An account with this email already exists. Please login.")
    finally:
        if 'conn' in locals() and conn:
            conn.close()

@app.post("/api/login")
async def api_login(request: Request, data: LoginData):
    username = (data.username or data.email or '').strip().lower()
    password = data.password

    if not username or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    conn = get_db_connection()
    user = conn.execute(
        "SELECT * FROM users WHERE username=? AND password=?",
        (username, password)
    ).fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password. Please try again.")

    request.session['username'] = user['username']
    request.session['fullname'] = user['fullname']

    return {
        'success': True,
        'message': 'Login successful!',
        'user': {
            'name': user['fullname'],
            'email': user['username']
        }
    }

# ===== Data Endpoints for Dashboard =====

@app.get("/api/overview")
async def get_overview():
    conn = get_db_connection()
    c = conn.cursor()
    # Fetch all overview specific data from dashboard_data
    rows = c.execute("SELECT key, data FROM dashboard_data WHERE component='overview'").fetchall()
    conn.close()
    
    response_data = {}
    for row in rows:
        key_name = row['key'].replace('overview_', '')  # strips prefix
        response_data[key_name] = json.loads(row['data'])
    
    return response_data

@app.get("/api/alerts")
async def get_alerts():
    conn = get_db_connection()
    c = conn.cursor()
    rows = c.execute("SELECT * FROM alerts").fetchall()
    conn.close()
    
    alerts = []
    for r in rows:
        alert = dict(r)
        # Parse affectedAssets back to list
        if alert.get('affectedAssets'):
            try:
                alert['affectedAssets'] = json.loads(alert['affectedAssets'])
            except:
                alert['affectedAssets'] = []
        alerts.append(alert)
    return alerts

@app.get("/api/threats")
async def get_threats():
    conn = get_db_connection()
    c = conn.cursor()
    rows = c.execute("SELECT * FROM threats").fetchall()
    conn.close()
    
    threats = []
    for r in rows:
        threat = dict(r)
        if threat.get('indicators'):
            try:
                threat['indicators'] = json.loads(threat['indicators'])
            except:
                threat['indicators'] = []
        threats.append(threat)
    return threats

@app.get("/api/vulnerabilities")
async def get_vulnerabilities():
    conn = get_db_connection()
    c = conn.cursor()
    rows = c.execute("SELECT * FROM vulnerabilities").fetchall()
    
    # Also fetch the dashboard data for pie chart/trend
    dash_rows = c.execute("SELECT key, data FROM dashboard_data WHERE component='vulnerabilities'").fetchall()
    conn.close()
    
    vulns = [dict(r) for r in rows]
    
    response_data = {'vulnerabilities': vulns}
    for row in dash_rows:
        key_name = row['key'].replace('vuln_', '')
        response_data[key_name] = json.loads(row['data'])
    
    return response_data

@app.get("/api/assets")
async def get_assets():
    conn = get_db_connection()
    c = conn.cursor()
    rows = c.execute("SELECT * FROM assets").fetchall()
    conn.close()
    
    return [dict(r) for r in rows]

@app.get("/api/reports")
async def get_reports():
    conn = get_db_connection()
    c = conn.cursor()
    rows = c.execute("SELECT * FROM reports").fetchall()
    
    dash_rows = c.execute("SELECT key, data FROM dashboard_data WHERE component='reports'").fetchall()
    conn.close()
    
    reports = [dict(r) for r in rows]
    
    response_data = {'reportsData': reports}
    for row in dash_rows:
        key_name = row['key'].replace('rep_', '')
        response_data[key_name] = json.loads(row['data'])
    
    return response_data

# ===== OAuth Endpoints =====

@app.get("/api/auth/google/callback")
async def api_google_callback(request: Request):
    code = request.query_params.get('code')
    if not code:
        raise HTTPException(status_code=400, detail="No authorization code provided")
    
    try:
        token = await google.authorize_access_token(request)
        user_info = token.get('userinfo')
        if not user_info:
            user_info = await google.get('https://openidconnect.googleapis.com/v1/userinfo', token=token).json()
        
        oauth_id = user_info.get('sub')
        email = user_info.get('email')
        name = user_info.get('name', email.split('@')[0])
        
        conn = get_db_connection()
        user = conn.execute("SELECT * FROM users WHERE oauth_provider='google' AND oauth_id=?", (oauth_id,)).fetchone()
        
        if not user:
            existing = conn.execute("SELECT * FROM users WHERE username=?", (email,)).fetchone()
            if existing:
                conn.execute("UPDATE users SET oauth_provider='google', oauth_id=? WHERE username=?", (oauth_id, email))
                user = existing
            else:
                conn.execute("INSERT INTO users (fullname, username, oauth_provider, oauth_id) VALUES (?, ?, 'google', ?)", (name, email, oauth_id))
                user = conn.execute("SELECT * FROM users WHERE username=?", (email,)).fetchone()
        conn.commit()
        conn.close()
        
        request.session['username'] = user['username']
        request.session['fullname'] = user['fullname']
        
        return {'success': True, 'user': {'name': user['fullname'], 'email': user['username']}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/auth/github/callback")
async def api_github_callback(request: Request):
    code = request.query_params.get('code')
    if not code:
        raise HTTPException(status_code=400, detail="No authorization code provided")
    
    try:
        token = await github.authorize_access_token(request)
        resp = await github.get('user', token=token)
        user_info = resp.json()
        
        oauth_id = str(user_info.get('id'))
        username = user_info.get('login')
        name = user_info.get('name') or username
        
        email_resp = await github.get('user/emails', token=token)
        emails = email_resp.json()
        email = next((e['email'] for e in emails if e.get('primary')), f"{username}@github.local")
        
        conn = get_db_connection()
        user = conn.execute("SELECT * FROM users WHERE oauth_provider='github' AND oauth_id=?", (oauth_id,)).fetchone()
        if not user:
            existing = conn.execute("SELECT * FROM users WHERE username=?", (username,)).fetchone()
            if existing:
                conn.execute("UPDATE users SET oauth_provider='github', oauth_id=? WHERE username=?", (oauth_id, username))
                user = existing
            else:
                conn.execute("INSERT INTO users (fullname, username, oauth_provider, oauth_id) VALUES (?, ?, 'github', ?)", (name, username, oauth_id))
                user = conn.execute("SELECT * FROM users WHERE username=?", (username,)).fetchone()
        conn.commit()
        conn.close()
        
        request.session['username'] = user['username']
        request.session['fullname'] = user['fullname']
        
        return {'success': True, 'user': {'name': user['fullname'], 'email': email}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/auth/google")
async def google_login(request: Request):
    redirect_uri = 'http://localhost:8000/auth/google/callback'
    return await google.authorize_redirect(request, redirect_uri)

@app.get("/auth/google/callback")
async def google_callback(request: Request):
    try:
        token = await google.authorize_access_token(request)
        user_info = token.get('userinfo')
        if not user_info:
            user_info = (await google.get('https://openidconnect.googleapis.com/v1/userinfo', token=token)).json()
            
        oauth_id = user_info.get('sub')
        email = user_info.get('email')
        name = user_info.get('name', email.split('@')[0])
        
        conn = get_db_connection()
        user = conn.execute("SELECT * FROM users WHERE oauth_provider='google' AND oauth_id=?", (oauth_id,)).fetchone()
        if not user:
            existing = conn.execute("SELECT * FROM users WHERE username=?", (email,)).fetchone()
            if existing:
                conn.execute("UPDATE users SET oauth_provider='google', oauth_id=? WHERE username=?", (oauth_id, email))
                user = existing
            else:
                conn.execute("INSERT INTO users (fullname, username, oauth_provider, oauth_id) VALUES (?, ?, 'google', ?)", (name, email, oauth_id))
                user = conn.execute("SELECT * FROM users WHERE username=?", (email,)).fetchone()
        conn.commit()
        conn.close()
        
        request.session['username'] = user['username']
        request.session['fullname'] = user['fullname']
        
        params = urlencode({'name': user['fullname'], 'email': user['username'], 'provider': 'google'})
        return RedirectResponse(f'http://localhost:3000/oauth/success?{params}')
    except Exception as e:
        params = urlencode({'error': str(e)})
        return RedirectResponse(f'http://localhost:3000/login?{params}')

@app.get("/auth/github")
async def github_login(request: Request):
    redirect_uri = 'http://localhost:8000/auth/github/callback'
    return await github.authorize_redirect(request, redirect_uri)

@app.get("/auth/github/callback")
async def github_callback(request: Request):
    try:
        token = await github.authorize_access_token(request)
        resp = await github.get('user', token=token)
        user_info = resp.json()
        
        oauth_id = str(user_info.get('id'))
        username = user_info.get('login')
        name = user_info.get('name') or username
        
        email_resp = await github.get('user/emails', token=token)
        emails = email_resp.json()
        email = next((e['email'] for e in emails if e.get('primary')), f"{username}@github.local")
        
        conn = get_db_connection()
        user = conn.execute("SELECT * FROM users WHERE oauth_provider='github' AND oauth_id=?", (oauth_id,)).fetchone()
        if not user:
            existing = conn.execute("SELECT * FROM users WHERE username=?", (username,)).fetchone()
            if existing:
                conn.execute("UPDATE users SET oauth_provider='github', oauth_id=? WHERE username=?", (oauth_id, username))
                user = existing
            else:
                conn.execute("INSERT INTO users (fullname, username, oauth_provider, oauth_id) VALUES (?, ?, 'github', ?)", (name, username, oauth_id))
                user = conn.execute("SELECT * FROM users WHERE username=?", (username,)).fetchone()
        conn.commit()
        conn.close()
        
        request.session['username'] = user['username']
        request.session['fullname'] = user['fullname']
        
        params = urlencode({'name': user['fullname'], 'email': email, 'provider': 'github'})
        return RedirectResponse(f'http://localhost:3000/oauth/success?{params}')
    except Exception as e:
        params = urlencode({'error': str(e)})
        return RedirectResponse(f'http://localhost:3000/login?{params}')
