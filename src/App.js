import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import OAuthCallback from './pages/OAuthCallback';
import OAuthSuccess from './pages/OAuthSuccess';
import Overview from './pages/Overview';
import Threats from './pages/Threats';
import Alerts from './pages/Alerts';
import Vulnerabilities from './pages/Vulnerabilities';
import Assets from './pages/Assets';
import ThreatMap from './pages/ThreatMap';
import Reports from './pages/Reports';
import AIAssistant from './pages/AIAssistant';
import Settings from './pages/Settings';

// Function to get the effective theme based on user preference
const getEffectiveTheme = (theme) => {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
};

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('accentColor') || '#00d4ff';
  });
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : {
      fullName: '',
      email: '',
      jobTitle: '',
      department: '',
      timezone: '',
      avatar: null
    };
  });

  // Save user profile to localStorage
  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
  }, [userProfile]);

  // Apply theme to document
  useEffect(() => {
    const effectiveTheme = getEffectiveTheme(theme);
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Apply accent color to document
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent-primary', accentColor);
    root.style.setProperty('--accent-cyan', accentColor);
    root.style.setProperty('--gradient-cyber', `linear-gradient(135deg, ${accentColor} 0%, #8b5cf6 100%)`);
    root.style.setProperty('--shadow-glow', `0 0 20px ${accentColor}`);
    localStorage.setItem('accentColor', accentColor);
  }, [accentColor]);

  // Listen for system theme changes when 'system' is selected
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Function to apply the current system theme
      const applySystemTheme = () => {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      };
      
      // Apply immediately
      applySystemTheme();
      
      // Listen for changes via media query
      const handleChange = () => applySystemTheme();
      mediaQuery.addEventListener('change', handleChange);
      
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return (
    <Router>
      <Routes>
        {/* Login route - no sidebar */}
        <Route path="/" element={<Login setUserProfile={setUserProfile} />} />
        <Route path="/login" element={<Login setUserProfile={setUserProfile} />} />
        
        {/* OAuth callback routes */}
        <Route path="/auth/google/callback" element={<OAuthCallback provider="google" setUserProfile={setUserProfile} />} />
        <Route path="/auth/github/callback" element={<OAuthCallback provider="github" setUserProfile={setUserProfile} />} />
        <Route path="/oauth/success" element={<OAuthSuccess setUserProfile={setUserProfile} />} />
        
        {/* Dashboard routes - with sidebar */}
        <Route path="/*" element={
          <div className="app">
            <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} userProfile={userProfile} setUserProfile={setUserProfile} />
            <main className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
              <Routes>
                <Route path="/overview" element={<Overview />} />
                <Route path="/threats" element={<Threats />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/vulnerabilities" element={<Vulnerabilities />} />
                <Route path="/assets" element={<Assets />} />
                <Route path="/threat-map" element={<ThreatMap />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/ai-assistant" element={<AIAssistant />} />
                <Route path="/settings" element={<Settings theme={theme} setTheme={setTheme} accentColor={accentColor} setAccentColor={setAccentColor} userProfile={userProfile} setUserProfile={setUserProfile} />} />
              </Routes>
            </main>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
