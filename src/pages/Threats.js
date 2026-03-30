import React, { useState } from 'react';
import {
  Shield,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  ExternalLink,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  AlertOctagon,
  X,
  AlertTriangle,
  Activity,
  FileText
} from 'lucide-react';
import './Threats.css';

const Threats = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [threats, setThreats] = useState([]);

  // Fetch threats from backend
  React.useEffect(() => {
    const fetchThreats = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/threats');
        const data = await response.json();
        setThreats(data);
      } catch (error) {
        console.error("Error fetching threats:", error);
      }
    };
    
    fetchThreats();
    const interval = setInterval(fetchThreats, 5000);
    return () => clearInterval(interval);
  }, []);

  const filterOptions = [
    { value: 'all', label: 'All Threats' },
    { value: 'active', label: 'Active' },
    { value: 'investigating', label: 'Investigating' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'resolved', label: 'Resolved' }
  ];

  const filteredThreats = threats.filter(threat => {
    const matchesFilter = selectedFilter === 'all' || threat.status === selectedFilter;
    const matchesSearch = threat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      threat.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      threat.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <AlertOctagon size={14} />;
      case 'investigating': return <Eye size={14} />;
      case 'blocked': return <Ban size={14} />;
      case 'resolved': return <CheckCircle size={14} />;
      case 'mitigated': return <Shield size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const threatStats = {
    total: threats.length,
    critical: threats.filter(t => t.severity === 'critical').length,
    active: threats.filter(t => t.status === 'active').length,
    blocked: threats.filter(t => t.status === 'blocked' || t.status === 'mitigated').length
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(filteredThreats, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', 'threats-export.json');
    link.click();
  };

  return (
    <div className="threats-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">Threat Intelligence</h1>
          <p className="page-subtitle">Monitor and manage detected security threats</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={16} />
            Export
          </button>
          <button className="btn btn-primary" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw size={16} className={isRefreshing ? 'spinning' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="threat-stats">
        <div className="threat-stat-card">
          <span className="threat-stat-value">{threatStats.total}</span>
          <span className="threat-stat-label">Total Threats</span>
        </div>
        <div className="threat-stat-card critical">
          <span className="threat-stat-value">{threatStats.critical}</span>
          <span className="threat-stat-label">Critical</span>
        </div>
        <div className="threat-stat-card active">
          <span className="threat-stat-value">{threatStats.active}</span>
          <span className="threat-stat-label">Active</span>
        </div>
        <div className="threat-stat-card blocked">
          <span className="threat-stat-value">{threatStats.blocked}</span>
          <span className="threat-stat-label">Blocked/Mitigated</span>
        </div>
      </div>

      <div className="threats-controls">
        <div className="search-filter-row">
          <div className="search-box-large">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search threats by name, type, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-large"
            />
          </div>
          <div className="filter-dropdown">
            <Filter size={16} />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="filter-select"
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="dropdown-icon" />
          </div>
        </div>
      </div>

      <div className="threats-table-container card">
        <table className="threats-table">
          <thead>
            <tr>
              <th>Threat ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Source</th>
              <th>Target</th>
              <th>Detected</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredThreats.map((threat) => (
              <tr key={threat.id} className="threat-row">
                <td className="threat-id">{threat.id}</td>
                <td className="threat-name">
                  <span>{threat.name}</span>
                </td>
                <td>
                  <span className="threat-type">{threat.type}</span>
                </td>
                <td>
                  <span className={`badge badge-${threat.severity}`}>
                    {threat.severity}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-${threat.status}`}>
                    {getStatusIcon(threat.status)}
                    {threat.status}
                  </span>
                </td>
                <td className="threat-source">
                  <div className="source-info">
                    <MapPin size={12} />
                    {threat.source}
                  </div>
                </td>
                <td className="threat-target">{threat.target}</td>
                <td className="threat-time">
                  <div className="time-info">
                    <Clock size={12} />
                    {threat.detectedAt}
                  </div>
                </td>
                <td className="threat-actions">
                  <div className="actions-wrapper">
                    <button className="action-btn" title="View Details" onClick={() => setSelectedThreat(threat)}>
                      <Eye size={16} />
                    </button>
                    <button className="action-btn" title="Block">
                      <Ban size={16} />
                    </button>
                    <button className="action-btn" title="External Link">
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`threat-details-panel card ${selectedThreat ? 'active' : ''}`}>
        <div className="panel-header">
          <h3>Threat Analysis Panel</h3>
          {selectedThreat ? (
            <button className="close-panel-btn" onClick={() => setSelectedThreat(null)}>
              <X size={18} />
            </button>
          ) : (
            <span className="panel-hint">Select a threat to view detailed analysis</span>
          )}
        </div>
        <div className="panel-content">
          {selectedThreat ? (
            <div className="threat-detail-content">
              <div className="detail-header">
                <div className={`severity-indicator ${selectedThreat.severity}`}></div>
                <div className="detail-title">
                  <h4>{selectedThreat.name}</h4>
                  <span className="detail-id">{selectedThreat.id}</span>
                </div>
                <span className={`badge badge-${selectedThreat.severity}`}>
                  {selectedThreat.severity}
                </span>
              </div>

              <p className="threat-description">{selectedThreat.description}</p>

              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Type</span>
                  <span className="detail-value">{selectedThreat.type}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className={`status-badge status-${selectedThreat.status}`}>
                    {getStatusIcon(selectedThreat.status)} {selectedThreat.status}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Source IP</span>
                  <span className="detail-value mono">{selectedThreat.source}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Target</span>
                  <span className="detail-value">{selectedThreat.target}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Detected At</span>
                  <span className="detail-value mono">{selectedThreat.detectedAt}</span>
                </div>
              </div>

              <div className="ioc-section">
                <h5><FileText size={16} /> Indicators of Compromise</h5>
                <div className="ioc-list">
                  {selectedThreat.indicators.map((ioc, idx) => (
                    <div key={idx} className="ioc-item">
                      <code>{ioc}</code>
                    </div>
                  ))}
                </div>
              </div>

              <div className="action-buttons-panel">
                <button className="btn btn-primary">
                  <Shield size={16} /> Quarantine
                </button>
                <button className="btn btn-secondary">
                  <Activity size={16} /> Investigate
                </button>
                <button className="btn btn-secondary">
                  <AlertTriangle size={16} /> Create Alert
                </button>
              </div>
            </div>
          ) : (
            <div className="analysis-placeholder">
              <Shield size={48} className="placeholder-icon" />
              <p>Click on a threat to view detailed indicators of compromise (IOCs), attack timeline, and recommended actions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Threats;
