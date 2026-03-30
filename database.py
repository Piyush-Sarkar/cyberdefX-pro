import sqlite3
import json

DB_NAME = 'cyberdefX.db'

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()

    # Users Table (migrated from app.py)
    c.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullname TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL DEFAULT '',
        oauth_provider TEXT,
        oauth_id TEXT
    )''')

    # Alerts Table
    c.execute('''
    CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        severity TEXT,
        status TEXT,
        source TEXT,
        timestamp TEXT,
        assignee TEXT,
        affectedAssets TEXT 
    )''')

    # Threats Table
    c.execute('''
    CREATE TABLE IF NOT EXISTS threats (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT,
        severity TEXT,
        status TEXT,
        source TEXT,
        target TEXT,
        detectedAt TEXT,
        description TEXT,
        indicators TEXT 
    )''')

    # Vulnerabilities Table
    c.execute('''
    CREATE TABLE IF NOT EXISTS vulnerabilities (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        severity TEXT,
        cvss REAL,
        status TEXT,
        affectedAssets INTEGER,
        discoveredDate TEXT,
        dueDate TEXT
    )''')

    # Assets Table
    c.execute('''
    CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT,
        ip TEXT,
        os TEXT,
        status TEXT,
        lastScan TEXT,
        vulnerabilities INTEGER,
        criticality TEXT
    )''')

    # Reports Table
    c.execute('''
    CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT,
        generatedAt TEXT,
        period TEXT,
        status TEXT,
        size TEXT,
        format TEXT
    )''')

    # Generic Table for page-specific JSON data (e.g., charts that don't need relational complexity)
    c.execute('''
    CREATE TABLE IF NOT EXISTS dashboard_data (
        key TEXT PRIMARY KEY,
        component TEXT,
        data TEXT 
    )''')

    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print("Database initialized successfully.")
