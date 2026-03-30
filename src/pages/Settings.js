import React, { useState, useRef } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Key,
  Globe,
  Moon,
  Sun,
  Monitor,
  Mail,
  Smartphone,
  Save,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  Zap
} from 'lucide-react';
import './Settings.css';

const Settings = ({ theme, setTheme, accentColor, setAccentColor, userProfile, setUserProfile }) => {
  const [activeSection, setActiveSection] = useState('profile');
  const [profileForm, setProfileForm] = useState(userProfile);
  const avatarInputRef = useRef(null);
  
  // Get initials from full name
  const getInitials = (name) => {
    if (!name || !name.trim()) return '';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleProfileSave = () => {
    setUserProfile(profileForm);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newProfile = { ...profileForm, avatar: reader.result };
        setProfileForm(newProfile);
        setUserProfile(newProfile);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarRemove = () => {
    const newProfile = { ...profileForm, avatar: null };
    setProfileForm(newProfile);
    setUserProfile(newProfile);
  };
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    criticalAlerts: true,
    weeklyDigest: false,
    threatIntel: true
  });

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Monitor },
    { id: 'integrations', label: 'Integrations', icon: Globe },
    { id: 'api', label: 'API Keys', icon: Key }
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="settings-section">
            <h2 className="section-title">Profile Settings</h2>
            <p className="section-description">Manage your account information and preferences</p>
            
            <div className="profile-header">
              <div className="avatar-large">
                {profileForm.avatar ? (
                  <img src={profileForm.avatar} alt="Avatar" className="avatar-image" />
                ) : getInitials(profileForm.fullName) ? (
                  <span>{getInitials(profileForm.fullName)}</span>
                ) : (
                  <Zap size={32} />
                )}
              </div>
              <div className="avatar-actions">
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <button className="btn btn-secondary" onClick={() => avatarInputRef.current.click()}>
                  Change Avatar
                </button>
                <button className="btn btn-secondary" onClick={handleAvatarRemove}>
                  Remove
                </button>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={profileForm.fullName} 
                  onChange={(e) => setProfileForm({...profileForm, fullName: e.target.value})}
                  className="form-input" 
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={profileForm.email} 
                  onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                  className="form-input" 
                />
              </div>
              <div className="form-group">
                <label>Job Title</label>
                <input 
                  type="text" 
                  value={profileForm.jobTitle} 
                  onChange={(e) => setProfileForm({...profileForm, jobTitle: e.target.value})}
                  className="form-input" 
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input 
                  type="text" 
                  value={profileForm.department} 
                  onChange={(e) => setProfileForm({...profileForm, department: e.target.value})}
                  className="form-input" 
                />
              </div>
              <div className="form-group full-width">
                <label>Timezone</label>
                <select 
                  className="form-select"
                  value={profileForm.timezone}
                  onChange={(e) => setProfileForm({...profileForm, timezone: e.target.value})}
                >
                  <option>UTC-05:00 Eastern Time</option>
                  <option>UTC-06:00 Central Time</option>
                  <option>UTC-07:00 Mountain Time</option>
                  <option>UTC-08:00 Pacific Time</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleProfileSave}>
                <Save size={16} />
                Save Changes
              </button>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="settings-section">
            <h2 className="section-title">Security Settings</h2>
            <p className="section-description">Configure your account security options</p>

            <div className="security-card">
              <div className="security-item">
                <div className="security-info">
                  <Lock size={20} />
                  <div>
                    <h4>Password</h4>
                    <p>Last changed 30 days ago</p>
                  </div>
                </div>
                <button className="btn btn-secondary">Change Password</button>
              </div>

              <div className="security-item">
                <div className="security-info">
                  <Smartphone size={20} />
                  <div>
                    <h4>Two-Factor Authentication</h4>
                    <p className="status-enabled">
                      <Check size={14} /> Enabled
                    </p>
                  </div>
                </div>
                <button className="btn btn-secondary">Configure</button>
              </div>

              <div className="security-item">
                <div className="security-info">
                  <Key size={20} />
                  <div>
                    <h4>Security Keys</h4>
                    <p>2 keys registered</p>
                  </div>
                </div>
                <button className="btn btn-secondary">Manage Keys</button>
              </div>
            </div>

            <div className="sessions-section">
              <h3>Active Sessions</h3>
              <div className="session-list">
                <div className="session-item current">
                  <Monitor size={20} />
                  <div className="session-info">
                    <span className="session-device">Windows PC - Chrome</span>
                    <span className="session-location">New York, USA • Current session</span>
                  </div>
                  <span className="session-badge current">Current</span>
                </div>
                <div className="session-item">
                  <Smartphone size={20} />
                  <div className="session-info">
                    <span className="session-device">iPhone 15 Pro - Safari</span>
                    <span className="session-location">New York, USA • 2 hours ago</span>
                  </div>
                  <button className="btn btn-secondary small">Revoke</button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="settings-section">
            <h2 className="section-title">Notification Preferences</h2>
            <p className="section-description">Choose how and when you want to be notified</p>

            <div className="notification-options">
              <div className="notification-group">
                <h3>Delivery Methods</h3>
                <div className="toggle-item">
                  <div className="toggle-info">
                    <Mail size={18} />
                    <div>
                      <span className="toggle-label">Email Notifications</span>
                      <span className="toggle-description">Receive alerts via email</span>
                    </div>
                  </div>
                  <label className="toggle">
                    <input 
                      type="checkbox" 
                      checked={notifications.email}
                      onChange={() => setNotifications({...notifications, email: !notifications.email})}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="toggle-item">
                  <div className="toggle-info">
                    <Bell size={18} />
                    <div>
                      <span className="toggle-label">Push Notifications</span>
                      <span className="toggle-description">Receive push notifications in browser</span>
                    </div>
                  </div>
                  <label className="toggle">
                    <input 
                      type="checkbox" 
                      checked={notifications.push}
                      onChange={() => setNotifications({...notifications, push: !notifications.push})}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="notification-group">
                <h3>Alert Types</h3>
                <div className="toggle-item">
                  <div className="toggle-info">
                    <AlertTriangle size={18} />
                    <div>
                      <span className="toggle-label">Critical Alerts</span>
                      <span className="toggle-description">High-priority security alerts</span>
                    </div>
                  </div>
                  <label className="toggle">
                    <input 
                      type="checkbox" 
                      checked={notifications.criticalAlerts}
                      onChange={() => setNotifications({...notifications, criticalAlerts: !notifications.criticalAlerts})}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="toggle-item">
                  <div className="toggle-info">
                    <Shield size={18} />
                    <div>
                      <span className="toggle-label">Threat Intelligence</span>
                      <span className="toggle-description">New threat intelligence updates</span>
                    </div>
                  </div>
                  <label className="toggle">
                    <input 
                      type="checkbox" 
                      checked={notifications.threatIntel}
                      onChange={() => setNotifications({...notifications, threatIntel: !notifications.threatIntel})}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="toggle-item">
                  <div className="toggle-info">
                    <Mail size={18} />
                    <div>
                      <span className="toggle-label">Weekly Digest</span>
                      <span className="toggle-description">Summary of weekly security events</span>
                    </div>
                  </div>
                  <label className="toggle">
                    <input 
                      type="checkbox" 
                      checked={notifications.weeklyDigest}
                      onChange={() => setNotifications({...notifications, weeklyDigest: !notifications.weeklyDigest})}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn btn-primary">
                <Save size={16} />
                Save Preferences
              </button>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="settings-section">
            <h2 className="section-title">Appearance</h2>
            <p className="section-description">Customize the look and feel of your dashboard</p>

            <div className="theme-selector">
              <h3>Theme</h3>
              <div className="theme-options">
                <button 
                  className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  <Moon size={24} />
                  <span>Dark</span>
                  {theme === 'dark' && <Check size={16} className="check-icon" />}
                </button>
                <button 
                  className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  <Sun size={24} />
                  <span>Light</span>
                  {theme === 'light' && <Check size={16} className="check-icon" />}
                </button>
                <button 
                  className={`theme-option ${theme === 'system' ? 'active' : ''}`}
                  onClick={() => setTheme('system')}
                >
                  <Monitor size={24} />
                  <span>System</span>
                  {theme === 'system' && <Check size={16} className="check-icon" />}
                </button>
              </div>
            </div>

            <div className="accent-selector">
              <h3>Accent Color</h3>
              <div className="color-options">
                <button 
                  className={`color-option ${accentColor === '#00d4ff' ? 'active' : ''}`} 
                  style={{ background: '#00d4ff' }}
                  onClick={() => setAccentColor('#00d4ff')}
                ></button>
                <button 
                  className={`color-option ${accentColor === '#8b5cf6' ? 'active' : ''}`} 
                  style={{ background: '#8b5cf6' }}
                  onClick={() => setAccentColor('#8b5cf6')}
                ></button>
                <button 
                  className={`color-option ${accentColor === '#10b981' ? 'active' : ''}`} 
                  style={{ background: '#10b981' }}
                  onClick={() => setAccentColor('#10b981')}
                ></button>
                <button 
                  className={`color-option ${accentColor === '#f59e0b' ? 'active' : ''}`} 
                  style={{ background: '#f59e0b' }}
                  onClick={() => setAccentColor('#f59e0b')}
                ></button>
                <button 
                  className={`color-option ${accentColor === '#ef4444' ? 'active' : ''}`} 
                  style={{ background: '#ef4444' }}
                  onClick={() => setAccentColor('#ef4444')}
                ></button>
              </div>
            </div>
          </div>
        );

      case 'api':
        return (
          <div className="settings-section">
            <h2 className="section-title">API Keys</h2>
            <p className="section-description">Manage your API keys for external integrations</p>

            <div className="api-keys-list">
              <div className="api-key-item">
                <div className="api-key-info">
                  <span className="api-key-name">Production API Key</span>
                  <span className="api-key-value">
                    <code>hdx_prod_****************************8f4a</code>
                    <button className="copy-btn"><Eye size={14} /></button>
                  </span>
                  <span className="api-key-created">Created Jan 1, 2024</span>
                </div>
                <div className="api-key-actions">
                  <button className="btn btn-secondary small">Regenerate</button>
                  <button className="btn btn-secondary small delete">Delete</button>
                </div>
              </div>
              <div className="api-key-item">
                <div className="api-key-info">
                  <span className="api-key-name">Development API Key</span>
                  <span className="api-key-value">
                    <code>hdx_dev_*****************************2b1c</code>
                    <button className="copy-btn"><Eye size={14} /></button>
                  </span>
                  <span className="api-key-created">Created Dec 15, 2023</span>
                </div>
                <div className="api-key-actions">
                  <button className="btn btn-secondary small">Regenerate</button>
                  <button className="btn btn-secondary small delete">Delete</button>
                </div>
              </div>
            </div>

            <button className="btn btn-primary">
              <Key size={16} />
              Generate New API Key
            </button>
          </div>
        );

      default:
        return (
          <div className="settings-section">
            <h2 className="section-title">Integrations</h2>
            <p className="section-description">Connect with third-party services and tools</p>
            
            <div className="integrations-grid">
              <div className="integration-card connected">
                <div className="integration-logo">SIEM</div>
                <div className="integration-info">
                  <h4>Splunk SIEM</h4>
                  <span className="integration-status connected">Connected</span>
                </div>
                <button className="btn btn-secondary small">Configure</button>
              </div>
              <div className="integration-card connected">
                <div className="integration-logo">SOAR</div>
                <div className="integration-info">
                  <h4>Palo Alto XSOAR</h4>
                  <span className="integration-status connected">Connected</span>
                </div>
                <button className="btn btn-secondary small">Configure</button>
              </div>
              <div className="integration-card">
                <div className="integration-logo">EDR</div>
                <div className="integration-info">
                  <h4>CrowdStrike</h4>
                  <span className="integration-status">Not connected</span>
                </div>
                <button className="btn btn-primary small">Connect</button>
              </div>
              <div className="integration-card">
                <div className="integration-logo">SLACK</div>
                <div className="integration-info">
                  <h4>Slack</h4>
                  <span className="integration-status">Not connected</span>
                </div>
                <button className="btn btn-primary small">Connect</button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure your CyberDefense X preferences</p>
        </div>
      </div>

      <div className="settings-layout">
        <nav className="settings-nav card">
          {sections.map(section => (
            <button
              key={section.id}
              className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <section.icon size={18} />
              {section.label}
            </button>
          ))}
        </nav>

        <div className="settings-content card">
          {renderSection()}
        </div>
      </div>
    </div>
  );
};

export default Settings;
