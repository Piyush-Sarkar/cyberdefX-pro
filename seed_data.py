import sqlite3
import json
from database import get_db_connection, init_db

# Extracted from Overview.js
stats = [
    {'title': 'Active Threats', 'value': '30', 'change': '+12%', 'trend': 'up', 'icon': 'Shield', 'color': 'red'},
    {'title': 'Alerts Today', 'value': '156', 'change': '-8%', 'trend': 'down', 'icon': 'AlertTriangle', 'color': 'yellow'},
    {'title': 'Vulnerabilities', 'value': '89', 'change': '+5%', 'trend': 'up', 'icon': 'Bug', 'color': 'orange'},
    {'title': 'Protected Assets', 'value': '1,247', 'change': '+2%', 'trend': 'up', 'icon': 'Server', 'color': 'cyan'}
]

threatData = [
    {'name': 'Mon', 'threats': 50, 'blocked': 42},
    {'name': 'Tue', 'threats': 52, 'blocked': 48},
    {'name': 'Wed', 'threats': 56, 'blocked': 50},
    {'name': 'Thu', 'threats': 65, 'blocked': 61},
    {'name': 'Fri', 'threats': 49, 'blocked': 45},
    {'name': 'Sat', 'threats': 35, 'blocked': 30},
    {'name': 'Sun', 'threats': 44, 'blocked': 42}
]

severityData = [
    {'name': 'Critical', 'value': 15, 'color': '#ef4444'},
    {'name': 'High', 'value': 28, 'color': '#f97316'},
    {'name': 'Medium', 'value': 42, 'color': '#f59e0b'},
    {'name': 'Low', 'value': 71, 'color': '#10b981'}
]

attackTypesData = [
    {'type': 'Malware', 'count': 245},
    {'type': 'Phishing', 'count': 189},
    {'type': 'DDoS', 'count': 156},
    {'type': 'SQL Injection', 'count': 98},
    {'type': 'XSS', 'count': 76},
    {'type': 'Brute Force', 'count': 134}
]

networkData = [
    {'time': '00:00', 'inbound': 120, 'outbound': 80},
    {'time': '04:00', 'inbound': 90, 'outbound': 60},
    {'time': '08:00', 'inbound': 180, 'outbound': 140},
    {'time': '12:00', 'inbound': 250, 'outbound': 200},
    {'time': '16:00', 'inbound': 220, 'outbound': 180},
    {'time': '20:00', 'inbound': 160, 'outbound': 120}
]

recentAlerts = [
    {'id': 1, 'type': 'critical', 'message': 'Ransomware detected on endpoint WS-042', 'time': '2 min ago', 'source': '192.168.1.105'},
    {'id': 2, 'type': 'high', 'message': 'Suspicious login attempt from unknown location', 'time': '5 min ago', 'source': '45.33.32.156'},
    {'id': 3, 'type': 'medium', 'message': 'Unusual outbound traffic detected', 'time': '12 min ago', 'source': '10.0.0.45'},
    {'id': 4, 'type': 'low', 'message': 'Certificate expiring in 7 days', 'time': '25 min ago', 'source': 'web-server-01'},
    {'id': 5, 'type': 'high', 'message': 'Port scan detected from external IP', 'time': '32 min ago', 'source': '185.220.101.1'}
]

liveThreats = [
    {'country': 'Russia', 'count': 145, 'flag': '🇷🇺'},
    {'country': 'China', 'count': 98, 'flag': '🇨🇳'},
    {'country': 'North Korea', 'count': 67, 'flag': '🇰🇵'},
    {'country': 'Iran', 'count': 45, 'flag': '🇮🇷'},
    {'country': 'Unknown', 'count': 89, 'flag': '🏴'}
]

# Extracted from Alerts.js
alertsData = [
    {
      'id': 'ALT-2024-001', 'title': 'Ransomware Detected on Endpoint', 'description': 'WannaCry variant detected on workstation WS-042. Immediate isolation recommended.',
      'severity': 'critical', 'status': 'new', 'source': 'Endpoint Detection', 'timestamp': '2 minutes ago', 'assignee': 'Unassigned', 'affectedAssets': ['WS-042', 'File Server 01']
    },
    {
      'id': 'ALT-2024-002', 'title': 'Suspicious Login Activity', 'description': 'Multiple failed login attempts followed by successful authentication from new location.',
      'severity': 'high', 'status': 'investigating', 'source': 'SIEM', 'timestamp': '5 minutes ago', 'assignee': 'John Smith', 'affectedAssets': ['user@company.com']
    },
    {
      'id': 'ALT-2024-003', 'title': 'Unusual Outbound Traffic', 'description': 'Large data transfer detected to unknown external IP address.',
      'severity': 'high', 'status': 'new', 'source': 'Network Monitor', 'timestamp': '12 minutes ago', 'assignee': 'Unassigned', 'affectedAssets': ['DEV-PC-15', 'Gateway-01']
    },
    {
      'id': 'ALT-2024-004', 'title': 'SSL Certificate Expiring', 'description': 'SSL certificate for api.company.com expires in 7 days.',
      'severity': 'medium', 'status': 'acknowledged', 'source': 'Certificate Monitor', 'timestamp': '1 hour ago', 'assignee': 'IT Team', 'affectedAssets': ['api.company.com']
    },
    {
      'id': 'ALT-2024-005', 'title': 'Firewall Rule Violation', 'description': 'Blocked connection attempt to restricted port from internal host.',
      'severity': 'medium', 'status': 'resolved', 'source': 'Firewall', 'timestamp': '2 hours ago', 'assignee': 'Sarah Johnson', 'affectedAssets': ['10.0.0.45']
    },
    {
      'id': 'ALT-2024-006', 'title': 'Malicious Email Blocked', 'description': 'Phishing email with malicious attachment quarantined.',
      'severity': 'low', 'status': 'resolved', 'source': 'Email Security', 'timestamp': '3 hours ago', 'assignee': 'Auto-resolved', 'affectedAssets': ['marketing@company.com']
    },
    {
      'id': 'ALT-2024-007', 'title': 'Port Scan Detected', 'description': 'External IP performing port scan on public-facing servers.',
      'severity': 'high', 'status': 'investigating', 'source': 'IDS', 'timestamp': '4 hours ago', 'assignee': 'Mike Chen', 'affectedAssets': ['Web Server Cluster']
    },
    {
      'id': 'ALT-2024-008', 'title': 'Privilege Escalation Attempt', 'description': 'User attempted to access admin resources without proper authorization.',
      'severity': 'critical', 'status': 'investigating', 'source': 'Access Control', 'timestamp': '5 hours ago', 'assignee': 'Security Team', 'affectedAssets': ['user123', 'Admin Portal']
    },
    {
      'id': 'ALT-2024-009', 'title': 'Backup Job Failed', 'description': 'Nightly backup of production database failed due to storage issue.',
      'severity': 'medium', 'status': 'new', 'source': 'Backup System', 'timestamp': '6 hours ago', 'assignee': 'Unassigned', 'affectedAssets': ['PROD-DB-01']
    },
    {
      'id': 'ALT-2024-010', 'title': 'Antivirus Definitions Outdated', 'description': '15 endpoints have antivirus definitions older than 7 days.',
      'severity': 'low', 'status': 'acknowledged', 'source': 'Endpoint Protection', 'timestamp': '8 hours ago', 'assignee': 'IT Support', 'affectedAssets': ['Multiple endpoints']
    }
]

# Extracted from Threats.js
threats = [
    {
      'id': 'THR-001', 'name': 'Emotet Trojan', 'type': 'Malware', 'severity': 'critical', 'status': 'active', 'source': '185.220.101.45', 'target': 'WS-042',
      'detectedAt': '2024-01-15 14:23:45', 'description': 'Banking trojan attempting to steal credentials and spread through network', 'indicators': ['SHA256: a1b2c3...', 'C2: malicious-domain.com', 'Registry: HKLM\\\\...']
    },
    {
      'id': 'THR-002', 'name': 'Cobalt Strike Beacon', 'type': 'C2', 'severity': 'critical', 'status': 'investigating', 'source': '45.33.32.156', 'target': 'SRV-WEB-01',
      'detectedAt': '2024-01-15 13:45:12', 'description': 'Command and control beacon detected establishing connection', 'indicators': ['Port: 443', 'Process: rundll32.exe', 'Beacon interval: 60s']
    },
    {
      'id': 'THR-003', 'name': 'SQL Injection Attempt', 'type': 'Web Attack', 'severity': 'high', 'status': 'blocked', 'source': '103.45.67.89', 'target': 'API Gateway',
      'detectedAt': '2024-01-15 12:30:00', 'description': 'Multiple SQL injection attempts detected on login endpoint', 'indicators': ['Payload: \\\' OR 1=1--', 'Endpoint: /api/auth', 'Attempts: 45']
    },
    {
      'id': 'THR-004', 'name': 'Brute Force Attack', 'type': 'Authentication', 'severity': 'high', 'status': 'blocked', 'source': '91.134.56.78', 'target': 'SSH Server',
      'detectedAt': '2024-01-15 11:15:33', 'description': 'Automated password guessing attack on SSH service', 'indicators': ['Failed attempts: 1,247', 'Usernames tried: 89', 'Duration: 2h 15m']
    },
    {
      'id': 'THR-005', 'name': 'Cryptominer Detection', 'type': 'Malware', 'severity': 'medium', 'status': 'resolved', 'source': 'Internal', 'target': 'DEV-PC-15',
      'detectedAt': '2024-01-15 10:00:00', 'description': 'XMRig cryptocurrency miner found running in background', 'indicators': ['Process: svchost.exe (fake)', 'CPU usage: 95%', 'Pool: pool.minexmr.com']
    },
    {
      'id': 'THR-006', 'name': 'Phishing Campaign', 'type': 'Social Engineering', 'severity': 'medium', 'status': 'investigating', 'source': 'spoofed-domain.com', 'target': 'Multiple Users',
      'detectedAt': '2024-01-15 09:30:00', 'description': 'Targeted phishing emails mimicking IT department', 'indicators': ['Recipients: 156', 'Clicked: 12', 'Credentials entered: 3']
    },
    {
      'id': 'THR-007', 'name': 'DDoS Attack', 'type': 'Network', 'severity': 'high', 'status': 'mitigated', 'source': 'Multiple', 'target': 'Web Server Cluster',
      'detectedAt': '2024-01-15 08:45:00', 'description': 'Distributed denial of service attack targeting public web services', 'indicators': ['Peak traffic: 45 Gbps', 'Attack type: SYN Flood', 'Duration: 45min']
    },
    {
      'id': 'THR-008', 'name': 'Insider Threat', 'type': 'Data Exfiltration', 'severity': 'critical', 'status': 'active', 'source': 'Internal User', 'target': 'File Server',
      'detectedAt': '2024-01-15 07:00:00', 'description': 'Unusual data transfer patterns detected from privileged user', 'indicators': ['Data transferred: 15 GB', 'Files accessed: 2,456', 'Destination: Cloud storage']
    }
]

def map_db():
    init_db()
    conn = get_db_connection()
    c = conn.cursor()

    # Clear old data
    c.execute('DELETE FROM alerts')
    c.execute('DELETE FROM threats')
    c.execute('DELETE FROM dashboard_data')

    # Seed Alerts
    for alert in alertsData:
        c.execute('''
        INSERT INTO alerts (id, title, description, severity, status, source, timestamp, assignee, affectedAssets)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (alert['id'], alert['title'], alert['description'], alert['severity'], alert['status'], alert['source'], alert['timestamp'], alert['assignee'], json.dumps(alert['affectedAssets'])))

    # Seed Threats
    for threat in threats:
        c.execute('''
        INSERT INTO threats (id, name, type, severity, status, source, target, detectedAt, description, indicators)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (threat['id'], threat['name'], threat['type'], threat['severity'], threat['status'], threat['source'], threat['target'], threat['detectedAt'], threat['description'], json.dumps(threat['indicators'])))

    # Seed JSON stats into dashboard_data (for Overview mostly)
    dash_items = {
        'overview_stats': stats,
        'overview_threatData': threatData,
        'overview_severityData': severityData,
        'overview_attackTypesData': attackTypesData,
        'overview_networkData': networkData,
        'overview_recentAlerts': recentAlerts,
        'overview_liveThreats': liveThreats
    }

    for key, data in dash_items.items():
        c.execute('''
        INSERT INTO dashboard_data (key, component, data)
        VALUES (?, ?, ?)
        ''', (key, 'overview', json.dumps(data)))

    conn.commit()

    # Try to migrate users from old users.db to cyberdefX.db if needed
    try:
        old_conn = sqlite3.connect('users.db')
        old_conn.row_factory = sqlite3.Row
        old_c = old_conn.cursor()
        users = old_c.execute("SELECT * FROM users").fetchall()
        for u in users:
            try:
                c.execute("INSERT OR IGNORE INTO users (id, fullname, username, password, oauth_provider, oauth_id) VALUES (?, ?, ?, ?, ?, ?)",
                          (u['id'], u['fullname'], u['username'], u['password'], u.get('oauth_provider'), u.get('oauth_id')))
            except Exception as e:
                pass
        conn.commit()
        old_conn.close()
        print("Migrated old users successfully from users.db.")
    except Exception as e:
        print("Could not pull from old users.db:", e)

    conn.close()
    print("Database seeding completed.")

if __name__ == '__main__':
    map_db()
