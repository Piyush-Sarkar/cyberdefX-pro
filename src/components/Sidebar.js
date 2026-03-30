import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Shield,
  AlertTriangle,
  Bug,
  Server,
  FileText,
  Settings,
  Bell,
  Search,
  ChevronDown,
  Zap,
  Bot,
  Globe,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isCollapsed, setIsCollapsed, userProfile, setUserProfile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Get initials from full name
  const getInitials = (name) => {
    if (!name || !name.trim()) return '';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleProfile = () => {
    if (!isCollapsed) {
      setIsProfileOpen(!isProfileOpen);
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    if (!isCollapsed) {
      setIsProfileOpen(false);
    }
  };

  const navItems = [
    { path: '/overview', icon: LayoutDashboard, label: 'Overview' },
    { path: '/threats', icon: Shield, label: 'Threats' },
    { path: '/alerts', icon: AlertTriangle, label: 'Alerts', badge: 12 },
    { path: '/vulnerabilities', icon: Bug, label: 'Vulnerabilities' },
    { path: '/assets', icon: Server, label: 'Assets' },
    { path: '/threat-map', icon: Globe, label: 'Threat Map', isNew: true },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/ai-assistant', icon: Bot, label: 'AI Assistant' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button className="collapse-btn" onClick={toggleSidebar} title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
      
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <Zap size={24} />
          </div>
          {!isCollapsed && (
            <div className="logo-text">
              <span className="logo-title">CyberDefense</span>
              <span className="logo-subtitle">X</span>
            </div>
          )}
        </div>
      </div>

      <nav className="nav-menu">
        <div className="nav-section">
          {!isCollapsed && <span className="nav-section-title">Main Menu</span>}
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
              title={isCollapsed ? item.label : ''}
            >
              <item.icon size={20} className="nav-icon" />
              {!isCollapsed && (
                <>
                  <span className="nav-label">{item.label}</span>
                  {item.badge && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                  {item.isNew && (
                    <span className="nav-new">NEW</span>
                  )}
                </>
              )}
              {isCollapsed && item.badge && (
                <span className="nav-badge-collapsed">{item.badge}</span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="sidebar-footer">
        {!isCollapsed && (
          <div className="status-indicator">
            <div className="status-dot online"></div>
            <span className="status-text">System Online</span>
          </div>
        )}
        <div className="user-profile-container" ref={profileRef}>
          {isProfileOpen && !isCollapsed && (
            <div className="profile-dropdown">
              <NavLink
                to="/settings"
                className="dropdown-item"
                onClick={() => setIsProfileOpen(false)}
              >
                <div className="dropdown-icon">
                  <User size={16} />
                </div>
                <span>Profile</span>
              </NavLink>
              <div className="dropdown-divider"></div>
              <button
                className="dropdown-item logout"
                onClick={() => {
                  // Clear user profile
                  if (setUserProfile) {
                    setUserProfile({
                      fullName: '',
                      email: '',
                      jobTitle: '',
                      department: '',
                      timezone: '',
                      avatar: null
                    });
                  }
                  // Clear localStorage
                  localStorage.removeItem('userProfile');
                  setIsProfileOpen(false);
                  // Redirect to login
                  navigate('/login');
                }}
              >
                <div className="dropdown-icon">
                  <LogOut size={16} />
                </div>
                <span>Log out</span>
              </button>
            </div>
          )}
          <div className="user-profile" onClick={toggleProfile} title={isCollapsed ? (userProfile?.fullName || '') : ''}>
            <div className="user-avatar">
              {userProfile?.avatar ? (
                <img src={userProfile.avatar} alt="Avatar" className="avatar-image" />
              ) : getInitials(userProfile?.fullName) ? (
                <span>{getInitials(userProfile?.fullName)}</span>
              ) : (
                <Zap size={18} />
              )}
            </div>
            {!isCollapsed && (
              <>
                <div className="user-info">
                  {userProfile?.fullName && <span className="user-name">{userProfile.fullName}</span>}
                  {userProfile?.email && <span className="user-role">{userProfile.email}</span>}
                  {!userProfile?.fullName && !userProfile?.email && (
                    <span className="user-name">No profile set</span>
                  )}
                </div>
                <ChevronDown size={16} className="user-chevron" />
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
