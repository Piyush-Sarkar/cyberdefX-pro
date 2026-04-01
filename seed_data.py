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
    {'type': 'Phishing', 'count': 190},
    {'type': 'DDoS', 'count': 175},
    {'type': 'SQL Injection', 'count': 95},
    {'type': 'XSS', 'count': 77},
    {'type': 'Brute Force', 'count': 135}
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

vulnsData = [
  {'id': 'CVE-2024-1234', 'title': 'Remote Code Execution in Apache Log4j', 'severity': 'critical', 'cvss': 10.0, 'status': 'open', 'affectedAssets': 45, 'discoveredDate': '2024-01-10', 'dueDate': '2024-01-17'},
  {'id': 'CVE-2024-5678', 'title': 'SQL Injection in Web Application', 'severity': 'critical', 'cvss': 9.8, 'status': 'in-progress', 'affectedAssets': 12, 'discoveredDate': '2024-01-12', 'dueDate': '2024-01-19'},
  {'id': 'CVE-2024-9012', 'title': 'Cross-Site Scripting (XSS) Vulnerability', 'severity': 'high', 'cvss': 7.5, 'status': 'open', 'affectedAssets': 28, 'discoveredDate': '2024-01-08', 'dueDate': '2024-01-22'},
  {'id': 'CVE-2024-3456', 'title': 'Privilege Escalation in Windows Server', 'severity': 'high', 'cvss': 8.1, 'status': 'in-progress', 'affectedAssets': 15, 'discoveredDate': '2024-01-05', 'dueDate': '2024-01-20'},
  {'id': 'CVE-2024-7890', 'title': 'Denial of Service in Nginx', 'severity': 'medium', 'cvss': 5.9, 'status': 'remediated', 'affectedAssets': 8, 'discoveredDate': '2024-01-01', 'dueDate': '2024-01-25'},
  {'id': 'CVE-2024-2345', 'title': 'Information Disclosure in API', 'severity': 'medium', 'cvss': 6.5, 'status': 'open', 'affectedAssets': 5, 'discoveredDate': '2024-01-11', 'dueDate': '2024-01-28'},
  {'id': 'CVE-2024-6789', 'title': 'Weak Cryptography Implementation', 'severity': 'low', 'cvss': 4.3, 'status': 'remediated', 'affectedAssets': 22, 'discoveredDate': '2023-12-15', 'dueDate': '2024-01-30'},
  {'id': 'CVE-2024-0123', 'title': 'Missing Security Headers', 'severity': 'low', 'cvss': 3.1, 'status': 'open', 'affectedAssets': 67, 'discoveredDate': '2024-01-13', 'dueDate': '2024-02-01'}
]

severityDistribution = [
  {'name': 'Critical', 'value': 2, 'color': '#ef4444'},
  {'name': 'High', 'value': 2, 'color': '#f97316'},
  {'name': 'Medium', 'value': 2, 'color': '#f59e0b'},
  {'name': 'Low', 'value': 2, 'color': '#10b981'}
]

trendData = [
  {'month': 'Aug', 'discovered': 45, 'remediated': 38},
  {'month': 'Sep', 'discovered': 52, 'remediated': 45},
  {'month': 'Oct', 'discovered': 38, 'remediated': 42},
  {'month': 'Nov', 'discovered': 65, 'remediated': 55},
  {'month': 'Dec', 'discovered': 48, 'remediated': 52},
  {'month': 'Jan', 'discovered': 42, 'remediated': 35}
]

assetsData = [
  {'id': 'AST-001', 'name': 'Web Server 01', 'type': 'server', 'ip': '192.168.1.10', 'os': 'Ubuntu 22.04', 'status': 'healthy', 'lastScan': '2 hours ago', 'vulnerabilities': 3, 'criticality': 'high'},
  {'id': 'AST-002', 'name': 'Database Server', 'type': 'database', 'ip': '192.168.1.20', 'os': 'CentOS 8', 'status': 'healthy', 'lastScan': '1 hour ago', 'vulnerabilities': 1, 'criticality': 'critical'},
  {'id': 'AST-003', 'name': 'Workstation WS-042', 'type': 'workstation', 'ip': '192.168.1.105', 'os': 'Windows 11', 'status': 'at-risk', 'lastScan': '30 min ago', 'vulnerabilities': 8, 'criticality': 'medium'},
  {'id': 'AST-004', 'name': 'Cloud Instance - AWS', 'type': 'cloud', 'ip': '54.23.45.67', 'os': 'Amazon Linux 2', 'status': 'healthy', 'lastScan': '4 hours ago', 'vulnerabilities': 2, 'criticality': 'high'},
  {'id': 'AST-005', 'name': 'Mobile Device - CEO', 'type': 'mobile', 'ip': 'N/A', 'os': 'iOS 17.2', 'status': 'healthy', 'lastScan': '1 day ago', 'vulnerabilities': 0, 'criticality': 'critical'},
  {'id': 'AST-006', 'name': 'Network Router', 'type': 'network', 'ip': '192.168.1.1', 'os': 'Cisco IOS', 'status': 'warning', 'lastScan': '6 hours ago', 'vulnerabilities': 5, 'criticality': 'high'},
  {'id': 'AST-007', 'name': 'Dev Server', 'type': 'server', 'ip': '192.168.1.30', 'os': 'Debian 12', 'status': 'offline', 'lastScan': '3 days ago', 'vulnerabilities': 12, 'criticality': 'low'},
  {'id': 'AST-008', 'name': 'Backup Server', 'type': 'server', 'ip': '192.168.1.50', 'os': 'Windows Server 2022', 'status': 'healthy', 'lastScan': '5 hours ago', 'vulnerabilities': 4, 'criticality': 'high'}
]

reportsData = [
  {'id': 'RPT-001', 'name': 'Weekly Security Summary', 'type': 'summary', 'generatedAt': '2024-01-15 08:00', 'period': 'Jan 8 - Jan 14, 2024', 'status': 'ready', 'size': '2.4 MB', 'format': 'PDF'},
  {'id': 'RPT-002', 'name': 'Threat Intelligence Report', 'type': 'threat', 'generatedAt': '2024-01-14 14:30', 'period': 'January 2024', 'status': 'ready', 'size': '5.1 MB', 'format': 'PDF'},
  {'id': 'RPT-003', 'name': 'Vulnerability Assessment', 'type': 'vulnerability', 'generatedAt': '2024-01-13 10:00', 'period': 'Q4 2023', 'status': 'ready', 'size': '8.7 MB', 'format': 'PDF'},
  {'id': 'RPT-004', 'name': 'Compliance Audit Report', 'type': 'compliance', 'generatedAt': '2024-01-12 16:45', 'period': '2023 Annual', 'status': 'ready', 'size': '12.3 MB', 'format': 'PDF'},
  {'id': 'RPT-005', 'name': 'Incident Response Summary', 'type': 'incident', 'generatedAt': '2024-01-11 09:15', 'period': 'December 2023', 'status': 'ready', 'size': '3.2 MB', 'format': 'PDF'},
  {'id': 'RPT-006', 'name': 'Network Traffic Analysis', 'type': 'network', 'generatedAt': 'Processing...', 'period': 'Jan 1 - Jan 15, 2024', 'status': 'generating', 'size': '-', 'format': 'PDF'}
]

scheduledReports = [
  {'name': 'Weekly Security Summary', 'schedule': 'Every Monday, 8:00 AM', 'nextRun': 'Jan 22, 2024'},
  {'name': 'Monthly Threat Report', 'schedule': '1st of month, 9:00 AM', 'nextRun': 'Feb 1, 2024'},
  {'name': 'Daily Alert Digest', 'schedule': 'Daily, 6:00 AM', 'nextRun': 'Jan 16, 2024'}
]

def map_db():
    init_db()
    conn = get_db_connection()
    c = conn.cursor()

    # Clear old data
    c.execute('DELETE FROM alerts')
    c.execute('DELETE FROM threats')
    c.execute('DELETE FROM vulnerabilities')
    c.execute('DELETE FROM assets')
    c.execute('DELETE FROM reports')
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

    # Seed Vulnerabilities
    for v in vulnsData:
        c.execute('''INSERT INTO vulnerabilities (id, title, severity, cvss, status, affectedAssets, discoveredDate, dueDate) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)''', 
                  (v['id'], v['title'], v['severity'], v['cvss'], v['status'], v['affectedAssets'], v['discoveredDate'], v['dueDate']))

    # Seed Assets
    for a in assetsData:
        c.execute('''INSERT INTO assets (id, name, type, ip, os, status, lastScan, vulnerabilities, criticality) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''', 
                  (a['id'], a['name'], a['type'], a['ip'], a['os'], a['status'], a['lastScan'], a['vulnerabilities'], a['criticality']))

    # Seed Reports
    for r in reportsData:
        c.execute('''INSERT INTO reports (id, name, type, generatedAt, period, status, size, format) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)''', 
                  (r['id'], r['name'], r['type'], r['generatedAt'], r['period'], r['status'], r['size'], r['format']))

    # Seed Part 2 Dashboard Data
    c.execute("INSERT INTO dashboard_data (key, component, data) VALUES (?, ?, ?)", 
              ('vuln_severityDistribution', 'vulnerabilities', json.dumps(severityDistribution)))
    c.execute("INSERT INTO dashboard_data (key, component, data) VALUES (?, ?, ?)", 
              ('vuln_trendData', 'vulnerabilities', json.dumps(trendData)))
    c.execute("INSERT INTO dashboard_data (key, component, data) VALUES (?, ?, ?)", 
              ('rep_scheduledReports', 'reports', json.dumps(scheduledReports)))

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
