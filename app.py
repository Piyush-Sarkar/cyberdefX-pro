from flask import Flask, render_template, request, redirect, session, flash, jsonify, url_for
from flask_cors import CORS
import sqlite3
import os
from authlib.integrations.flask_client import OAuth

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'your_secret_key')
CORS(app, supports_credentials=True, origins=['http://localhost:3000'])


def get_db_connection():
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    return conn


def ensure_users_schema():
    conn = sqlite3.connect('users.db')
    conn.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullname TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL DEFAULT '',
        oauth_provider TEXT,
        oauth_id TEXT
    )
    ''')

    existing_columns = {
        row[1] for row in conn.execute("PRAGMA table_info(users)").fetchall()
    }
    if 'oauth_provider' not in existing_columns:
        conn.execute("ALTER TABLE users ADD COLUMN oauth_provider TEXT")
    if 'oauth_id' not in existing_columns:
        conn.execute("ALTER TABLE users ADD COLUMN oauth_id TEXT")

    conn.commit()
    conn.close()

# OAuth Configuration
oauth = OAuth(app)

# Google OAuth Configuration
google = oauth.register(
    name='google',
    client_id=os.environ.get('GOOGLE_CLIENT_ID'),
    client_secret=os.environ.get('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

# GitHub OAuth Configuration
github = oauth.register(
    name='github',
    client_id=os.environ.get('GITHUB_CLIENT_ID'),
    client_secret=os.environ.get('GITHUB_CLIENT_SECRET'),
    access_token_url='https://github.com/login/oauth/access_token',
    authorize_url='https://github.com/login/oauth/authorize',
    api_base_url='https://api.github.com/',
    client_kwargs={
        'scope': 'user:email'
    }
)

ensure_users_schema()

@app.route('/api/signup', methods=['POST'])
def api_signup():
    data = request.get_json(silent=True) or {}
    fullname = (data.get('fullname') or data.get('name') or '').strip()
    username = (data.get('username') or data.get('email') or '').strip().lower()
    password = data.get('password', '')

    if not fullname or not username or not password:
        return jsonify({'success': False, 'message': 'All fields are required'}), 400

    try:
        conn = get_db_connection()
        conn.execute("INSERT INTO users (fullname, username, password) VALUES (?, ?, ?)",
                    (fullname, username, password))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Account created successfully!'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'message': 'An account with this email already exists. Please login.'}), 409


@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json(silent=True) or {}
    username = (data.get('username') or data.get('email') or '').strip().lower()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'success': False, 'message': 'Email and password are required'}), 400

    conn = get_db_connection()
    user = conn.execute(
        "SELECT * FROM users WHERE username=? AND password=?",
        (username, password)
    ).fetchone()
    conn.close()

    if not user:
        return jsonify({'success': False, 'message': 'Incorrect email or password. Please try again.'}), 401

    session['username'] = user['username']
    session['fullname'] = user['fullname']

    return jsonify({
        'success': True,
        'message': 'Login successful!',
        'user': {
            'name': user['fullname'],
            'email': user['username']
        }
    })

@app.route('/')
def index():
    return render_template('top.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        fullname = request.form.get('fullname', '')
        username = request.form.get('username', '')
        password = request.form.get('password', '')
        
        if not fullname or not username or not password:
            flash('All fields are required', 'error')
            return render_template('index.html', mode='signup', error='All fields are required')
        
        try:
            conn = get_db_connection()
            conn.execute("INSERT INTO users (fullname, username, password) VALUES (?, ?, ?)", 
                        (fullname, username, password))
            conn.commit()
            conn.close()
            flash('Account created successfully! Please login.', 'success')
            return redirect('/login')
        except sqlite3.IntegrityError:
            flash('Username already exists', 'error')
            return render_template('index.html', mode='signup', error='Username already exists')
    return render_template('index.html', mode='signup')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username', '')
        password = request.form.get('password', '')
        
        if not username or not password:
            flash('Username and password are required', 'error')
            return render_template('index.html', mode='login', error='Username and password are required')
        
        conn = get_db_connection()
        user = conn.execute(
            "SELECT * FROM users WHERE username=? AND password=?",
            (username, password)
        ).fetchone()
        conn.close()
        
        if user:
            session['username'] = username
            session['fullname'] = user['fullname']
            return redirect('/home')
        else:
            flash('Invalid credentials', 'error')
            return render_template('index.html', mode='login', error='Invalid credentials')
    return render_template('index.html', mode='login')

@app.route('/home')
def home():
    if 'username' in session:
        return render_template('home.html', 
                             username=session.get('username'),
                             fullname=session.get('fullname'))
    else:
        return redirect('/login')

@app.route('/logout')
def logout():
    session.pop('username', None)
    session.pop('fullname', None)
    return redirect('/login')

# ===== OAuth Routes =====

@app.route('/auth/google')
def google_login():
    # Callback goes to Flask first, then redirects to React after auth
    redirect_uri = 'http://localhost:5000/auth/google/callback'
    return google.authorize_redirect(redirect_uri)

@app.route('/auth/google/callback')
def google_callback():
    try:
        token = google.authorize_access_token()
        user_info = token.get('userinfo')
        
        if not user_info:
            user_info = google.get('https://openidconnect.googleapis.com/v1/userinfo').json()
        
        oauth_id = user_info.get('sub')
        email = user_info.get('email')
        name = user_info.get('name', email.split('@')[0])
        
        conn = get_db_connection()
        # Check if user exists with this OAuth ID
        user = conn.execute(
            "SELECT * FROM users WHERE oauth_provider=? AND oauth_id=?",
            ('google', oauth_id)
        ).fetchone()
        
        if not user:
            # Check if username (email) already exists
            existing = conn.execute(
                "SELECT * FROM users WHERE username=?",
                (email,)
            ).fetchone()
            
            if existing:
                # Link OAuth to existing account
                conn.execute(
                    "UPDATE users SET oauth_provider=?, oauth_id=? WHERE username=?",
                    ('google', oauth_id, email)
                )
                user = existing
            else:
                # Create new user
                conn.execute(
                    "INSERT INTO users (fullname, username, oauth_provider, oauth_id) VALUES (?, ?, ?, ?)",
                    (name, email, 'google', oauth_id)
                )
                user = conn.execute(
                    "SELECT * FROM users WHERE username=?",
                    (email,)
                ).fetchone()
        
        conn.commit()
        conn.close()
        
        session['username'] = user['username']
        session['fullname'] = user['fullname']
        
        # Redirect to React with user info in URL params
        from urllib.parse import urlencode
        params = urlencode({
            'name': user['fullname'],
            'email': user['username'],
            'provider': 'google'
        })
        return redirect(f'http://localhost:3000/oauth/success?{params}')
        
    except Exception as e:
        from urllib.parse import urlencode
        params = urlencode({'error': str(e)})
        return redirect(f'http://localhost:3000/login?{params}')

# API endpoint for React to exchange Google OAuth code
@app.route('/api/auth/google/callback')
def api_google_callback():
    try:
        code = request.args.get('code')
        if not code:
            return jsonify({'success': False, 'message': 'No authorization code provided'}), 400
        
        # Exchange code for token
        token = google.authorize_access_token()
        user_info = token.get('userinfo')
        
        if not user_info:
            user_info = google.get('https://openidconnect.googleapis.com/v1/userinfo').json()
        
        oauth_id = user_info.get('sub')
        email = user_info.get('email')
        name = user_info.get('name', email.split('@')[0])
        
        conn = get_db_connection()
        user = conn.execute(
            "SELECT * FROM users WHERE oauth_provider=? AND oauth_id=?",
            ('google', oauth_id)
        ).fetchone()
        
        if not user:
            existing = conn.execute("SELECT * FROM users WHERE username=?", (email,)).fetchone()
            
            if existing:
                conn.execute("UPDATE users SET oauth_provider=?, oauth_id=? WHERE username=?",
                           ('google', oauth_id, email))
                user = existing
            else:
                conn.execute("INSERT INTO users (fullname, username, oauth_provider, oauth_id) VALUES (?, ?, ?, ?)",
                           (name, email, 'google', oauth_id))
                user = conn.execute("SELECT * FROM users WHERE username=?", (email,)).fetchone()
        
        conn.commit()
        conn.close()
        
        session['username'] = user['username']
        session['fullname'] = user['fullname']
        
        return jsonify({
            'success': True,
            'user': {
                'name': user['fullname'],
                'email': user['username']
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/auth/github')
def github_login():
    # Callback goes to Flask first, then redirects to React after auth
    redirect_uri = 'http://localhost:5000/auth/github/callback'
    return github.authorize_redirect(redirect_uri)

@app.route('/auth/github/callback')
def github_callback():
    try:
        token = github.authorize_access_token()
        
        # Get user info from GitHub API
        resp = github.get('user')
        user_info = resp.json()
        
        oauth_id = str(user_info.get('id'))
        username = user_info.get('login')
        name = user_info.get('name') or username
        
        # Try to get email
        email_resp = github.get('user/emails')
        emails = email_resp.json()
        email = next((e['email'] for e in emails if e.get('primary')), f"{username}@github.local")
        
        conn = get_db_connection()
        # Check if user exists with this OAuth ID
        user = conn.execute(
            "SELECT * FROM users WHERE oauth_provider=? AND oauth_id=?",
            ('github', oauth_id)
        ).fetchone()
        
        if not user:
            # Check if username already exists
            existing = conn.execute(
                "SELECT * FROM users WHERE username=?",
                (username,)
            ).fetchone()
            
            if existing:
                # Link OAuth to existing account
                conn.execute(
                    "UPDATE users SET oauth_provider=?, oauth_id=? WHERE username=?",
                    ('github', oauth_id, username)
                )
                user = existing
            else:
                # Create new user
                conn.execute(
                    "INSERT INTO users (fullname, username, oauth_provider, oauth_id) VALUES (?, ?, ?, ?)",
                    (name, username, 'github', oauth_id)
                )
                user = conn.execute(
                    "SELECT * FROM users WHERE username=?",
                    (username,)
                ).fetchone()
        
        conn.commit()
        conn.close()
        
        session['username'] = user['username']
        session['fullname'] = user['fullname']
        
        # Redirect to React with user info in URL params
        from urllib.parse import urlencode
        params = urlencode({
            'name': user['fullname'],
            'email': email,
            'provider': 'github'
        })
        return redirect(f'http://localhost:3000/oauth/success?{params}')
        
    except Exception as e:
        from urllib.parse import urlencode
        params = urlencode({'error': str(e)})
        return redirect(f'http://localhost:3000/login?{params}')

# API endpoint for React to exchange GitHub OAuth code
@app.route('/api/auth/github/callback')
def api_github_callback():
    try:
        code = request.args.get('code')
        if not code:
            return jsonify({'success': False, 'message': 'No authorization code provided'}), 400
        
        token = github.authorize_access_token()
        
        resp = github.get('user')
        user_info = resp.json()
        
        oauth_id = str(user_info.get('id'))
        username = user_info.get('login')
        name = user_info.get('name') or username
        
        email_resp = github.get('user/emails')
        emails = email_resp.json()
        email = next((e['email'] for e in emails if e.get('primary')), f"{username}@github.local")
        
        conn = get_db_connection()
        user = conn.execute(
            "SELECT * FROM users WHERE oauth_provider=? AND oauth_id=?",
            ('github', oauth_id)
        ).fetchone()
        
        if not user:
            existing = conn.execute("SELECT * FROM users WHERE username=?", (username,)).fetchone()
            
            if existing:
                conn.execute("UPDATE users SET oauth_provider=?, oauth_id=? WHERE username=?",
                           ('github', oauth_id, username))
                user = existing
            else:
                conn.execute("INSERT INTO users (fullname, username, oauth_provider, oauth_id) VALUES (?, ?, ?, ?)",
                           (name, username, 'github', oauth_id))
                user = conn.execute("SELECT * FROM users WHERE username=?", (username,)).fetchone()
        
        conn.commit()
        conn.close()
        
        session['username'] = user['username']
        session['fullname'] = user['fullname']
        
        return jsonify({
            'success': True,
            'user': {
                'name': user['fullname'],
                'email': email
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(host='localhost', debug=True)

