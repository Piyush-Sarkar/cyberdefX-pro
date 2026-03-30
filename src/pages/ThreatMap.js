import React, { useState, useEffect, useRef, useCallback } from 'react';
import Globe from 'react-globe.gl';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  Globe as GlobeIcon,
  Target,
  AlertTriangle,
  Shield,
  Activity,
  Zap,
  MapPin,
  TrendingUp,
  Eye,
  RefreshCw,
  Maximize2,
  Filter,
  Play,
  Pause,
  ChevronDown,
  Clock,
  Server,
  Wifi,
  Map
} from 'lucide-react';
import './ThreatMap.css';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ThreatMap = () => {
  const globeRef = useRef();
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [threatFilter, setThreatFilter] = useState('all');
  const [isLive, setIsLive] = useState(true);
  const [attackCount, setAttackCount] = useState(15847);

  // Threat data with coordinates
  const [threats] = useState([
    { id: 1, lat: 55.7558, lng: 37.6173, city: 'Moscow', country: 'Russia', type: 'APT', severity: 'critical', attacks: 342, label: 'APT-29 Activity' },
    { id: 2, lat: 39.9042, lng: 116.4074, city: 'Beijing', country: 'China', type: 'Espionage', severity: 'critical', attacks: 289, label: 'State-Sponsored Attack' },
    { id: 3, lat: 35.6762, lng: 139.6503, city: 'Tokyo', country: 'Japan', type: 'Ransomware', severity: 'high', attacks: 156, label: 'Ransomware Campaign' },
    { id: 4, lat: 51.5074, lng: -0.1278, city: 'London', country: 'UK', type: 'Phishing', severity: 'medium', attacks: 423, label: 'Phishing Wave' },
    { id: 5, lat: 40.7128, lng: -74.0060, city: 'New York', country: 'USA', type: 'DDoS', severity: 'high', attacks: 567, label: 'DDoS Attack' },
    { id: 6, lat: 37.7749, lng: -122.4194, city: 'San Francisco', country: 'USA', type: 'Malware', severity: 'medium', attacks: 234, label: 'Malware Distribution' },
    { id: 7, lat: 52.5200, lng: 13.4050, city: 'Berlin', country: 'Germany', type: 'Botnet', severity: 'high', attacks: 178, label: 'Botnet C2' },
    { id: 8, lat: -33.8688, lng: 151.2093, city: 'Sydney', country: 'Australia', type: 'Phishing', severity: 'low', attacks: 89, label: 'Credential Theft' },
    { id: 9, lat: 25.2048, lng: 55.2708, city: 'Dubai', country: 'UAE', type: 'APT', severity: 'critical', attacks: 145, label: 'Zero-Day Exploit' },
    { id: 10, lat: 19.0760, lng: 72.8777, city: 'Mumbai', country: 'India', type: 'Ransomware', severity: 'high', attacks: 312, label: 'Crypto Ransomware' },
    { id: 11, lat: -23.5505, lng: -46.6333, city: 'São Paulo', country: 'Brazil', type: 'Botnet', severity: 'medium', attacks: 201, label: 'IoT Botnet' },
    { id: 12, lat: 1.3521, lng: 103.8198, city: 'Singapore', country: 'Singapore', type: 'Espionage', severity: 'high', attacks: 167, label: 'Data Exfiltration' },
    { id: 13, lat: 59.3293, lng: 18.0686, city: 'Stockholm', country: 'Sweden', type: 'DDoS', severity: 'medium', attacks: 98, label: 'Amplification Attack' },
    { id: 14, lat: 35.6895, lng: 51.3890, city: 'Tehran', country: 'Iran', type: 'APT', severity: 'critical', attacks: 234, label: 'Infrastructure Attack' },
    { id: 15, lat: 39.0392, lng: 125.7625, city: 'Pyongyang', country: 'North Korea', type: 'APT', severity: 'critical', attacks: 456, label: 'Financial Theft' },
  ]);

  // Attack arcs data
  const [arcsData, setArcsData] = useState([]);

  // Generate attack arcs
  useEffect(() => {
    const targetLocations = [
      { lat: 40.7128, lng: -74.0060, name: 'NYC HQ' },
      { lat: 37.7749, lng: -122.4194, name: 'SF Office' },
      { lat: 51.5074, lng: -0.1278, name: 'London DC' },
    ];

    const arcs = threats.flatMap(threat => 
      targetLocations
        .filter(() => Math.random() > 0.5)
        .map(target => ({
          startLat: threat.lat,
          startLng: threat.lng,
          endLat: target.lat,
          endLng: target.lng,
          color: getSeverityColor(threat.severity),
          threat: threat
        }))
    );
    setArcsData(arcs);
  }, [threats]);

  // Auto-increment attack counter
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setAttackCount(prev => prev + Math.floor(Math.random() * 5));
    }, 2000);
    return () => clearInterval(interval);
  }, [isLive]);

  // Globe controls
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = isAutoRotate;
      globeRef.current.controls().autoRotateSpeed = 0.5;
      globeRef.current.pointOfView({ altitude: 2.5 });
    }
  }, [isAutoRotate]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#00d4ff';
    }
  };

  const filteredThreats = threatFilter === 'all' 
    ? threats 
    : threats.filter(t => t.severity === threatFilter);

  const threatStats = {
    critical: threats.filter(t => t.severity === 'critical').length,
    high: threats.filter(t => t.severity === 'high').length,
    medium: threats.filter(t => t.severity === 'medium').length,
    low: threats.filter(t => t.severity === 'low').length,
  };

  const handlePointClick = useCallback((point) => {
    setSelectedThreat(point);
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: point.lat, lng: point.lng, altitude: 1.5 }, 1000);
    }
  }, []);

  const focusOnThreat = (threat) => {
    setSelectedThreat(threat);
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: threat.lat, lng: threat.lng, altitude: 1.5 }, 1000);
    }
  };

  return (
    <div className="threat-map-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <GlobeIcon size={28} className="title-icon" />
            Global Threat Map
          </h1>
          <p className="page-subtitle">Real-time visualization of worldwide cyber threats</p>
        </div>
        <div className="header-actions">
          <div className="live-indicator">
            <span className={`live-dot ${isLive ? 'active' : ''}`}></span>
            <span>LIVE</span>
          </div>
          <button className="btn btn-secondary" onClick={() => setIsLive(!isLive)}>
            {isLive ? <Pause size={16} /> : <Play size={16} />}
            {isLive ? 'Pause' : 'Resume'}
          </button>
          <button className="btn btn-primary" onClick={() => setIsAutoRotate(!isAutoRotate)}>
            <RefreshCw size={16} className={isAutoRotate ? 'spinning' : ''} />
            {isAutoRotate ? 'Stop Rotation' : 'Auto Rotate'}
          </button>
        </div>
      </div>

      <div className="threat-stats-bar">
        <div className="stat-pill total">
          <Activity size={16} />
          <span className="stat-label">Total Attacks</span>
          <span className="stat-number">{attackCount.toLocaleString()}</span>
        </div>
        <div className="stat-pill critical">
          <AlertTriangle size={16} />
          <span className="stat-label">Critical</span>
          <span className="stat-number">{threatStats.critical}</span>
        </div>
        <div className="stat-pill high">
          <Target size={16} />
          <span className="stat-label">High</span>
          <span className="stat-number">{threatStats.high}</span>
        </div>
        <div className="stat-pill medium">
          <Shield size={16} />
          <span className="stat-label">Medium</span>
          <span className="stat-number">{threatStats.medium}</span>
        </div>
        <div className="stat-pill low">
          <Zap size={16} />
          <span className="stat-label">Low</span>
          <span className="stat-number">{threatStats.low}</span>
        </div>
      </div>

      <div className="map-container">
        <div className="globe-wrapper">
          <Globe
            ref={globeRef}
            width={600}
            height={580}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
            
            // Points for threats
            pointsData={filteredThreats}
            pointLat="lat"
            pointLng="lng"
            pointColor={d => getSeverityColor(d.severity)}
            pointAltitude={0.06}
            pointRadius={d => d.severity === 'critical' ? 0.8 : d.severity === 'high' ? 0.6 : 0.4}
            pointLabel={d => `
              <div class="globe-tooltip">
                <div class="tooltip-header">${d.label}</div>
                <div class="tooltip-city">${d.city}, ${d.country}</div>
                <div class="tooltip-type">${d.type}</div>
                <div class="tooltip-attacks">${d.attacks} attacks</div>
              </div>
            `}
            onPointClick={handlePointClick}
            
            // Arcs for attack paths
            arcsData={arcsData}
            arcColor="color"
            arcDashLength={0.4}
            arcDashGap={0.2}
            arcDashAnimateTime={2000}
            arcStroke={0.5}
            
            // Rings for pulse effect
            ringsData={filteredThreats.filter(t => t.severity === 'critical')}
            ringLat="lat"
            ringLng="lng"
            ringColor={() => '#ef4444'}
            ringMaxRadius={3}
            ringPropagationSpeed={2}
            ringRepeatPeriod={1000}
            
            // Atmosphere
            atmosphereColor="#00d4ff"
            atmosphereAltitude={0.15}
          />
          
          {/* Globe Controls Overlay */}
          <div className="globe-controls">
            <button className="control-btn" title="Zoom In" onClick={() => {
              const pov = globeRef.current?.pointOfView();
              if (pov) globeRef.current.pointOfView({ altitude: pov.altitude * 0.7 }, 500);
            }}>
              <span>+</span>
            </button>
            <button className="control-btn" title="Zoom Out" onClick={() => {
              const pov = globeRef.current?.pointOfView();
              if (pov) globeRef.current.pointOfView({ altitude: pov.altitude * 1.3 }, 500);
            }}>
              <span>−</span>
            </button>
            <button className="control-btn" title="Reset View" onClick={() => {
              globeRef.current?.pointOfView({ lat: 0, lng: 0, altitude: 2.5 }, 1000);
            }}>
              <Maximize2 size={16} />
            </button>
          </div>
        </div>

        <div className="map-sidebar">
          {/* Filter Section */}
          <div className="sidebar-card filter-card">
            <h3 className="sidebar-title">
              <Filter size={16} />
              Filter Threats
            </h3>
            <div className="filter-options">
              {['all', 'critical', 'high', 'medium', 'low'].map(filter => (
                <button
                  key={filter}
                  className={`filter-btn ${threatFilter === filter ? 'active' : ''} ${filter}`}
                  onClick={() => setThreatFilter(filter)}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Active Threats List */}
          <div className="sidebar-card threats-card">
            <h3 className="sidebar-title">
              <AlertTriangle size={16} />
              Active Threats
            </h3>
            <div className="threats-list">
              {filteredThreats.slice(0, 8).map(threat => (
                <div 
                  key={threat.id} 
                  className={`threat-item ${selectedThreat?.id === threat.id ? 'selected' : ''}`}
                  onClick={() => focusOnThreat(threat)}
                >
                  <div className={`threat-severity-dot ${threat.severity}`}></div>
                  <div className="threat-info">
                    <span className="threat-label">{threat.label}</span>
                    <span className="threat-location">
                      <MapPin size={12} />
                      {threat.city}, {threat.country}
                    </span>
                  </div>
                  <span className="threat-attacks">{threat.attacks}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Threat Detail */}
          {selectedThreat && (
            <div className="sidebar-card detail-card">
              <h3 className="sidebar-title">
                <Eye size={16} />
                Threat Details
              </h3>
              <div className="threat-detail">
                <div className={`detail-severity ${selectedThreat.severity}`}>
                  {selectedThreat.severity.toUpperCase()}
                </div>
                <h4 className="detail-label">{selectedThreat.label}</h4>
                <div className="detail-row">
                  <MapPin size={14} />
                  <span>{selectedThreat.city}, {selectedThreat.country}</span>
                </div>
                <div className="detail-row">
                  <Target size={14} />
                  <span>Type: {selectedThreat.type}</span>
                </div>
                <div className="detail-row">
                  <Activity size={14} />
                  <span>Attacks: {selectedThreat.attacks}</span>
                </div>
                <div className="detail-row">
                  <Clock size={14} />
                  <span>Last seen: 2 min ago</span>
                </div>
                <button className="btn btn-primary btn-block">
                  <Shield size={14} />
                  Block Source
                </button>
              </div>
            </div>
          )}

          {/* Network Status */}
          <div className="sidebar-card network-card">
            <h3 className="sidebar-title">
              <Wifi size={16} />
              Network Status
            </h3>
            <div className="network-stats">
              <div className="network-item">
                <Server size={16} />
                <div className="network-info">
                  <span className="network-label">Protected Servers</span>
                  <span className="network-value">247 Online</span>
                </div>
                <span className="network-status online"></span>
              </div>
              <div className="network-item">
                <Shield size={16} />
                <div className="network-info">
                  <span className="network-label">Firewall Status</span>
                  <span className="network-value">Active</span>
                </div>
                <span className="network-status online"></span>
              </div>
              <div className="network-item">
                <Activity size={16} />
                <div className="network-info">
                  <span className="network-label">Bandwidth</span>
                  <span className="network-value">2.4 Gbps</span>
                </div>
                <div className="network-bar">
                  <div className="network-bar-fill" style={{ width: '65%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="bottom-stats">
        <div className="bottom-stat-card">
          <div className="bottom-stat-icon">
            <Target size={20} />
          </div>
          <div className="bottom-stat-info">
            <span className="bottom-stat-value">1,247</span>
            <span className="bottom-stat-label">Blocked Today</span>
          </div>
          <TrendingUp size={16} className="trend-up" />
        </div>
        <div className="bottom-stat-card">
          <div className="bottom-stat-icon">
            <Shield size={20} />
          </div>
          <div className="bottom-stat-info">
            <span className="bottom-stat-value">99.9%</span>
            <span className="bottom-stat-label">Threat Detection</span>
          </div>
        </div>
        <div className="bottom-stat-card">
          <div className="bottom-stat-icon">
            <Clock size={20} />
          </div>
          <div className="bottom-stat-info">
            <span className="bottom-stat-value">0.3s</span>
            <span className="bottom-stat-label">Avg Response Time</span>
          </div>
        </div>
        <div className="bottom-stat-card">
          <div className="bottom-stat-icon">
            <Zap size={20} />
          </div>
          <div className="bottom-stat-info">
            <span className="bottom-stat-value">42</span>
            <span className="bottom-stat-label">Active Rules</span>
          </div>
        </div>
      </div>

      {/* Real World Map Container */}
      <div className="world-map-container">
        <div className="world-map-header">
          <h3>
            <Map size={18} />
            World Map View
          </h3>
        </div>
        <div className="world-map-wrapper">
          <MapContainer
            center={[20, 0]}
            zoom={2}
            style={{ height: '400px', width: '100%', borderRadius: '12px' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredThreats.map(threat => (
              <Marker key={threat.id} position={[threat.lat, threat.lng]}>
                <Popup>
                  <div className="map-popup">
                    <strong>{threat.label}</strong><br />
                    {threat.city}, {threat.country}<br />
                    Type: {threat.type}<br />
                    Attacks: {threat.attacks}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default ThreatMap;
