import sqlite3
import json
from database import get_db_connection, init_db

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

def map_db_part2():
    init_db()
    conn = get_db_connection()
    c = conn.cursor()

    c.execute('DELETE FROM vulnerabilities')
    c.execute('DELETE FROM assets')
    c.execute('DELETE FROM reports')
    c.execute("DELETE FROM dashboard_data WHERE component IN ('vulnerabilities', 'reports')")

    for v in vulnsData:
        c.execute('''INSERT INTO vulnerabilities (id, title, severity, cvss, status, affectedAssets, discoveredDate, dueDate) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)''', 
                  (v['id'], v['title'], v['severity'], v['cvss'], v['status'], v['affectedAssets'], v['discoveredDate'], v['dueDate']))

    for a in assetsData:
        c.execute('''INSERT INTO assets (id, name, type, ip, os, status, lastScan, vulnerabilities, criticality) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''', 
                  (a['id'], a['name'], a['type'], a['ip'], a['os'], a['status'], a['lastScan'], a['vulnerabilities'], a['criticality']))

    for r in reportsData:
        c.execute('''INSERT INTO reports (id, name, type, generatedAt, period, status, size, format) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)''', 
                  (r['id'], r['name'], r['type'], r['generatedAt'], r['period'], r['status'], r['size'], r['format']))

    c.execute("INSERT INTO dashboard_data (key, component, data) VALUES (?, ?, ?)", 
              ('vuln_severityDistribution', 'vulnerabilities', json.dumps(severityDistribution)))
    c.execute("INSERT INTO dashboard_data (key, component, data) VALUES (?, ?, ?)", 
              ('vuln_trendData', 'vulnerabilities', json.dumps(trendData)))
    c.execute("INSERT INTO dashboard_data (key, component, data) VALUES (?, ?, ?)", 
              ('rep_scheduledReports', 'reports', json.dumps(scheduledReports)))

    conn.commit()
    conn.close()
    print("Part 2 seeding completed.")

if __name__ == '__main__':
    map_db_part2()
