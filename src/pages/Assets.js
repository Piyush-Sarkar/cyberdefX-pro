import React, { useState } from 'react';
import {
  Server,
  Monitor,
  Database,
  Cloud,
  Smartphone,
  Router,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Grid,
  List
} from 'lucide-react';
import './Assets.css';

const Assets = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [assetsData, setAssetsData] = useState([]);

  React.useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/assets');
        const data = await response.json();
        setAssetsData(data);
      } catch (err) {
        console.error("Error fetching assets:", err);
      }
    };
    fetchAssets();
    const interval = setInterval(fetchAssets, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2000);
  };

  const handleScanAsset = (assetId) => {
    setAssetsData(prev => prev.map(asset => 
      asset.id === assetId ? { ...asset, lastScan: 'Just now', status: 'healthy' } : asset
    ));
  };

  const categories = [
    { id: 'all', label: 'All Assets', count: assetsData.length },
    { id: 'server', label: 'Servers', count: assetsData.filter(a => a.type === 'server').length },
    { id: 'workstation', label: 'Workstations', count: assetsData.filter(a => a.type === 'workstation').length },
    { id: 'database', label: 'Databases', count: assetsData.filter(a => a.type === 'database').length },
    { id: 'cloud', label: 'Cloud', count: assetsData.filter(a => a.type === 'cloud').length },
    { id: 'network', label: 'Network', count: assetsData.filter(a => a.type === 'network').length }
  ];

  const getAssetIcon = (type) => {
    switch (type) {
      case 'server': return Server;
      case 'workstation': return Monitor;
      case 'database': return Database;
      case 'cloud': return Cloud;
      case 'mobile': return Smartphone;
      case 'network': return Router;
      default: return Server;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle size={14} />;
      case 'at-risk': return <AlertTriangle size={14} />;
      case 'warning': return <AlertTriangle size={14} />;
      case 'offline': return <XCircle size={14} />;
      default: return <Shield size={14} />;
    }
  };

  const filteredAssets = assetsData.filter(asset => {
    const matchesCategory = selectedCategory === 'all' || asset.type === selectedCategory;
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.ip.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const assetStats = {
    total: assetsData.length,
    healthy: assetsData.filter(a => a.status === 'healthy').length,
    atRisk: assetsData.filter(a => a.status === 'at-risk' || a.status === 'warning').length,
    offline: assetsData.filter(a => a.status === 'offline').length
  };

  return (
    <div className="assets-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">Asset Inventory</h1>
          <p className="page-subtitle">Manage and monitor all protected assets</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleSync} disabled={isSyncing}>
            <RefreshCw size={16} className={isSyncing ? 'spinning' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync Assets'}
          </button>
          <button className="btn btn-primary">
            <Plus size={16} />
            Add Asset
          </button>
        </div>
      </div>

      <div className="asset-stats">
        <div className="asset-stat total">
          <Server size={20} />
          <span className="stat-value">{assetStats.total}</span>
          <span className="stat-label">Total Assets</span>
        </div>
        <div className="asset-stat healthy">
          <CheckCircle size={20} />
          <span className="stat-value">{assetStats.healthy}</span>
          <span className="stat-label">Healthy</span>
        </div>
        <div className="asset-stat at-risk">
          <AlertTriangle size={20} />
          <span className="stat-value">{assetStats.atRisk}</span>
          <span className="stat-label">At Risk</span>
        </div>
        <div className="asset-stat offline">
          <XCircle size={20} />
          <span className="stat-value">{assetStats.offline}</span>
          <span className="stat-label">Offline</span>
        </div>
      </div>

      <div className="assets-controls">
        <div className="category-tabs">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
              <span className="tab-count">{cat.count}</span>
            </button>
          ))}
        </div>
        <div className="controls-right">
          <div className="search-box">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search assets..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={16} />
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="assets-grid">
          {filteredAssets.map(asset => {
            const AssetIcon = getAssetIcon(asset.type);
            return (
              <div key={asset.id} className={`asset-card ${asset.status}`}>
                <div className="asset-header">
                  <div className="asset-icon-wrapper">
                    <AssetIcon size={24} />
                  </div>
                  <button className="more-btn">
                    <MoreVertical size={16} />
                  </button>
                </div>
                <div className="asset-info">
                  <h3 className="asset-name">{asset.name}</h3>
                  <span className="asset-id">{asset.id}</span>
                </div>
                <div className="asset-details">
                  <div className="detail-row">
                    <span className="detail-label">IP Address</span>
                    <span className="detail-value">{asset.ip}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">OS</span>
                    <span className="detail-value">{asset.os}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Last Scan</span>
                    <span className="detail-value">{asset.lastScan}</span>
                  </div>
                </div>
                <div className="asset-footer">
                  <span className={`status-badge ${asset.status}`}>
                    {getStatusIcon(asset.status)}
                    {asset.status.replace('-', ' ')}
                  </span>
                  <span className={`vuln-count ${asset.vulnerabilities > 5 ? 'high' : asset.vulnerabilities > 0 ? 'medium' : 'low'}`}>
                    {asset.vulnerabilities} vulnerabilities
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="assets-list card">
          <table className="assets-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Type</th>
                <th>IP Address</th>
                <th>OS</th>
                <th>Status</th>
                <th>Vulnerabilities</th>
                <th>Last Scan</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map(asset => {
                const AssetIcon = getAssetIcon(asset.type);
                return (
                  <tr key={asset.id}>
                    <td>
                      <div className="asset-cell">
                        <AssetIcon size={18} />
                        <div>
                          <span className="asset-name">{asset.name}</span>
                          <span className="asset-id">{asset.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="type-cell">{asset.type}</td>
                    <td className="ip-cell">{asset.ip}</td>
                    <td>{asset.os}</td>
                    <td>
                      <span className={`status-badge ${asset.status}`}>
                        {getStatusIcon(asset.status)}
                        {asset.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`vuln-badge ${asset.vulnerabilities > 5 ? 'high' : asset.vulnerabilities > 0 ? 'medium' : 'low'}`}>
                        {asset.vulnerabilities}
                      </span>
                    </td>
                    <td className="scan-cell">{asset.lastScan}</td>
                    <td>
                      <button className="action-btn">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Assets;
