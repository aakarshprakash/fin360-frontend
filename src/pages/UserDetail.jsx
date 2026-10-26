// User Detail Page - Professional Staff Profile View
// Displays comprehensive user information, performance metrics, and activity log
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import RolePermissions from '../components/RolePermissions';
import UserModal from '../components/UserModal';
import api from '../utils/api';
import { usePermission } from '../utils/usePermission';
import '../styles/UserDetail.css';


function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.pathname.endsWith('/edit');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { can, isAdmin: checkIsAdmin } = usePermission();
  const canManageUsers = checkIsAdmin() || can('manage_users');
  const canManageRoles = checkIsAdmin() || can('manage_roles');

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/users/${id}`, { signal });
        // Unwrap: Laravel may return { user: {...} } or { data: {...} } or plain {...}
        // Note: api interceptor already converts snake_case → camelCase
        const raw = response.data;
        // API may return { user: {...} } or { data: {...} } or the user object directly
        const userData = raw?.user || raw?.data || (raw?.id != null ? raw : null);

        console.log('[UserDetail] raw response.data:', raw);
        console.log('[UserDetail] resolved userData:', userData);

        if (!signal.aborted) {
          if (!userData) {
            setError('User not found.');
            return;
          }

          // Performance: API returns nested performance{} object (snake_case already converted by interceptor)
          const perf = userData.performance || {};

          // Role: may be a string "Manager" or from roleData.name
          const roleName = typeof userData.role === 'string' && userData.role
            ? userData.role
            : userData.roleData?.name || 'Sales Agent';

          // Permissions: prefer allPermissions (full list) over permissions
          const permList = Array.isArray(userData.allPermissions) && userData.allPermissions.length > 0
            ? userData.allPermissions
            : Array.isArray(userData.permissions)
            ? userData.permissions
            : [];

          // Activity log: recentActivity array from API
          const activitySource = Array.isArray(userData.recentActivity)
            ? userData.recentActivity
            : Array.isArray(userData.activityLog)
            ? userData.activityLog
            : [];

          const transformedUser = {
            ...userData,
            // Core fields — guaranteed strings
            id:         userData.id,
            name:       (userData.name || '').trim() || 'Unknown User',
            email:      userData.email      || '',
            phone:      userData.phone      || '',
            role:       roleName,
            status:     userData.status     || 'Active',
            department: userData.department || '-',
            title:      userData.title      || '-',
            location:   userData.location   || '-',
            timezone:   userData.timezone   || '-',
            avatar:     userData.avatar     || null,
            permissions: permList,
            joinedAt:   userData.joinedAt   || userData.createdAt || null,
            lastActive: userData.lastActive || userData.lastLogin || null,
            // Performance — safe nested object with all required defaults
            performance: {
              totalLeads:          perf.totalLeads          ?? (( perf.assignedLeads ?? 0) + (perf.createdLeads ?? 0)),
              assignedLeads:       perf.assignedLeads       ?? 0,
              createdLeads:        perf.createdLeads        ?? 0,
              openLeads:           perf.openLeads           ?? 0,
              convertedLeads:      perf.convertedLeads      ?? 0,
              lostLeads:           perf.lostLeads           ?? 0,
              conversionRate:      perf.conversionRate      ?? 0,
              avgResponseTime:     perf.avgResponseTime     || '-',
              avgDealSize:         perf.avgDealSize         || '-',
              totalRevenue:        perf.totalRevenue        || '-',
              totalActivities:     perf.totalActivities     ?? 0,
              totalFollowups:      perf.totalFollowups      ?? 0,
              followUpCompliance:  perf.followUpCompliance  ?? 0,
              overdueFollowUps:    perf.overdueFollowUps    ?? 0,
            },
            monthlyPerformance: Array.isArray(userData.monthlyPerformance)
              ? userData.monthlyPerformance
              : [],
            activityLog: activitySource.map((act, i) => ({
              id:          act.id ?? i,
              type:        act.type        || act.action || 'unknown',
              description: act.description || `${(act.action || 'Action').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} — ${act.module || ''}`.trim(),
              timestamp:   act.timestamp   || act.createdAt || null,
              ip:          act.ip          || act.ipAddress || null,
            })),
          };
          setUser(transformedUser);
        }
      } catch (err) {
        if (signal.aborted) return;
        console.error('Failed to fetch user:', err);
        if (err.response?.status === 404) {
          setError('User not found.');
        } else {
          setError('Failed to load user details. Please try again.');
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      abortController.abort();
    };
  }, [id]);

  // Auto-open edit modal when URL is /users/:id/edit
  useEffect(() => {
    if (isEditMode && user && !loading) {
      setShowEditModal(true);
    }
  }, [isEditMode, user, loading]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr; // Already formatted string
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr; // Already formatted string
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getTimeSince = (dateStr) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr; // Already formatted string
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 5) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '?';
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  const getActivityIcon = (type) => {
    const icons = {
      login: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg>,
      lead_create: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4" /></svg>,
      lead_update: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
      lead_convert: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
      call: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" /></svg>,
      note: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
    };
    return icons[type] || <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /></svg>;
  };

  if (loading) {
    return (
      <Layout>
        <div className="user-detail-page">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading user profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && !user) {
    return (
      <Layout>
        <div className="user-detail-page">
          <div className="error-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>{error}</p>
            <button onClick={() => navigate('/settings/users')} className="btn-primary">
              Back to Users
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="user-detail-page">
          <div className="error-state">
            <p>User not found</p>
            <button onClick={() => navigate('/settings/users')} className="btn-primary">
              Back to Users
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="user-detail-page">
        <button className="back-btn" onClick={() => navigate('/settings/users')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Back to Users
        </button>

        <div className="profile-header">
          <div className="profile-header-left">
            <div className="profile-avatar" style={{ backgroundColor: user.status === 'Active' ? 'var(--primary-500)' : 'var(--neutral-400)' }}>
              {user.avatar ? <img src={user.avatar} alt={user.name} /> : <span>{getInitials(user.name)}</span>}
              <span className={`avatar-status-dot ${user.status?.toLowerCase() || 'unknown'}`}></span>
            </div>
            <div className="profile-info">
              <h1 className="profile-name">{user.name || 'Unknown User'}</h1>
              {user.title && user.title !== '-' && <p className="profile-title">{user.title}</p>}
              <div className="profile-meta">
                <span className={`role-badge role-${(user.role || '').toLowerCase().replace(/ /g, '-')}`}>{user.role}</span>
                <span className={`status-badge status-${(user.status || '').toLowerCase()}`}>
                  <span className="status-dot"></span>{user.status}
                </span>
                {user.department && user.department !== '-' && (
                  <span className="meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></svg>
                    {user.department}
                  </span>
                )}
                {user.location && user.location !== '-' && (
                  <span className="meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    {user.location}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="profile-header-right">
            <button className="btn-secondary" onClick={() => setShowPermissionsModal(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
              Manage Permissions
            </button>
            <button className="btn-primary" onClick={() => setShowEditModal(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              Edit Profile
            </button>
          </div>
        </div>

        <div className="profile-tabs">
          <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
            Overview
          </button>
          <button className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            Performance
          </button>
          <button className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            Activity Log
          </button>
        </div>

        <div className="profile-content">
          {activeTab === 'overview' && (
            <div className="tab-overview">
              <div className="info-card">
                <h3 className="card-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  Contact Information
                </h3>
                <div className="info-grid">
                  <div className="info-item"><label>Email</label><span><a href={`mailto:${user.email}`}>{user.email || '-'}</a></span></div>
                  <div className="info-item"><label>Phone</label><span>{user.phone ? <a href={`tel:${user.phone}`}>{user.phone}</a> : '-'}</span></div>
                  <div className="info-item"><label>Department</label><span>{user.department !== '-' ? user.department : 'Not set'}</span></div>
                  <div className="info-item"><label>Role</label><span>{user.role}</span></div>
                  <div className="info-item"><label>Joined</label><span>{formatDate(user.joinedAt)}</span></div>
                  <div className="info-item"><label>Last Active</label><span>{user.lastActive ? getTimeSince(user.lastActive) : 'Never'}</span></div>
                </div>
              </div>

              <div className="quick-stats-grid">
                <div className="quick-stat">
                  <div className="stat-icon leads"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg></div>
                  <div className="stat-details"><span className="stat-value">{user.performance.assignedLeads}</span><span className="stat-label">Assigned Leads</span></div>
                </div>
                <div className="quick-stat">
                  <div className="stat-icon converted"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4" /></svg></div>
                  <div className="stat-details"><span className="stat-value">{user.performance.createdLeads}</span><span className="stat-label">Created Leads</span></div>
                </div>
                <div className="quick-stat">
                  <div className="stat-icon rate"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg></div>
                  <div className="stat-details"><span className="stat-value">{user.performance.totalActivities}</span><span className="stat-label">Total Activities</span></div>
                </div>
                <div className="quick-stat">
                  <div className="stat-icon revenue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg></div>
                  <div className="stat-details"><span className="stat-value">{user.performance.totalFollowups}</span><span className="stat-label">Total Follow-ups</span></div>
                </div>
              </div>

              <div className="info-card">
                <h3 className="card-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  Permissions
                </h3>
                <div className="permissions-list">
                  {(user.permissions || []).length === 0 ? (
                    <span className="no-permissions">No permissions assigned</span>
                  ) : (user.permissions || []).map(perm => (
                    <span key={perm} className="permission-tag">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                      {perm.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="tab-performance">
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-header"><h4>Lead Pipeline</h4></div>
                  <div className="metric-body">
                    <div className="pipeline-item"><span className="pipeline-label">Open Leads</span><span className="pipeline-value open">{user.performance.openLeads}</span></div>
                    <div className="pipeline-item"><span className="pipeline-label">Converted</span><span className="pipeline-value converted">{user.performance.convertedLeads}</span></div>
                    <div className="pipeline-item"><span className="pipeline-label">Lost</span><span className="pipeline-value lost">{user.performance.lostLeads}</span></div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-header"><h4>Conversion Rate</h4></div>
                  <div className="metric-body center">
                    <div className="gauge-container">
                      <svg className="gauge" viewBox="0 0 120 120">
                        <circle className="gauge-bg" cx="60" cy="60" r="50" />
                        <circle className="gauge-fill" cx="60" cy="60" r="50" strokeDasharray={`${user.performance.conversionRate * 3.14} 314`} />
                      </svg>
                      <div className="gauge-value"><span className="value">{user.performance.conversionRate}%</span><span className="label">Conversion</span></div>
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-header"><h4>Response Time</h4></div>
                  <div className="metric-body center">
                    <div className="response-time"><span className="time-value">{user.performance.avgResponseTime}</span><span className="time-label">Average Response</span></div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-header"><h4>Follow-up Compliance</h4></div>
                  <div className="metric-body">
                    <div className="compliance-meter">
                      <div className="compliance-bar"><div className="compliance-fill" style={{ width: `${user.performance.followUpCompliance}%` }}></div></div>
                      <span className="compliance-value">{user.performance.followUpCompliance}%</span>
                    </div>
                    <div className="overdue-count">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      <span>{user.performance.overdueFollowUps} overdue follow-ups</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h4>Monthly Performance</h4>
                  <div className="chart-legend">
                    <span className="legend-item leads"><span className="dot"></span> Leads Assigned</span>
                    <span className="legend-item converted"><span className="dot"></span> Converted</span>
                  </div>
                </div>
                <div className="chart-body">
                  {(user.monthlyPerformance || []).length === 0 ? (
                    <div className="empty-chart">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                      <p>No monthly performance data available</p>
                    </div>
                  ) : (
                  <div className="bar-chart">
                    {user.monthlyPerformance.map((month, index) => (
                      <div key={index} className="bar-group">
                        <div className="bars">
                          <div className="bar leads" style={{ height: `${(month.leads / 30) * 100}%` }} title={`${month.leads} leads`}></div>
                          <div className="bar converted" style={{ height: `${(month.converted / 30) * 100}%` }} title={`${month.converted} converted`}></div>
                        </div>
                        <span className="bar-label">{month.month}</span>
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              </div>

              <div className="revenue-card">
                <div className="revenue-item">
                  <div className="revenue-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg></div>
                  <div className="revenue-details"><span className="revenue-value">{user.performance.totalRevenue}</span><span className="revenue-label">Total Revenue Generated</span></div>
                </div>
                <div className="revenue-divider"></div>
                <div className="revenue-item">
                  <div className="revenue-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg></div>
                  <div className="revenue-details"><span className="revenue-value">{user.performance.avgDealSize}</span><span className="revenue-label">Average Deal Size</span></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="tab-activity">
              <div className="activity-card">
                <div className="activity-header">
                  <h3>Recent Activity</h3>
                  <select className="activity-filter">
                    <option value="all">All Activity</option>
                    <option value="login">Logins</option>
                    <option value="leads">Lead Actions</option>
                    <option value="calls">Calls</option>
                  </select>
                </div>
                <div className="activity-timeline">
                  {(user.activityLog || []).length === 0 ? (
                    <div className="empty-activity">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                      <p>No recent activity recorded</p>
                    </div>
                  ) : (user.activityLog || []).map((activity, i) => (
                    <div key={activity.id ?? i} className="activity-item">
                      <div className={`activity-icon ${activity.type}`}>{getActivityIcon(activity.type)}</div>
                      <div className="activity-content">
                        <p className="activity-description">{activity.description}</p>
                        <span className="activity-time">{formatDateTime(activity.timestamp)}</span>
                        {activity.ip && <span className="activity-ip">IP: {activity.ip}</span>}
                      </div>
                    </div>
                  ))}
                </div>
                {(user.activityLog || []).length > 0 && (
                  <button className="load-more-btn">Load More Activity</button>
                )}
              </div>
            </div>
          )}
        </div>

        {showPermissionsModal && (
          <RolePermissions
            user={user}
            onSave={async (permissions, roleName, roleId) => {
              // Optimistic update
              setUser(prev => ({
                ...prev,
                permissions,
                ...(roleName ? { role: roleName } : {}),
                ...(roleId ? { roleId } : {}),
              }));
              setShowPermissionsModal(false);

              // Refetch to get accurate data from backend
              try {
                const response = await api.get(`/users/${id}`);
                const raw = response.data;
                const userData = raw?.user || raw?.data || (raw?.id != null ? raw : null);
                if (userData) {
                  const permList = Array.isArray(userData.allPermissions) && userData.allPermissions.length > 0
                    ? userData.allPermissions
                    : Array.isArray(userData.permissions) ? userData.permissions : permissions;
                  const updatedRole = typeof userData.role === 'string' && userData.role
                    ? userData.role
                    : userData.roleData?.name || roleName;
                  setUser(prev => ({
                    ...prev,
                    permissions: permList,
                    role: updatedRole,
                  }));
                }
              } catch (e) {
                console.warn('Failed to refetch user after permission update:', e);
              }
            }}
            onClose={() => setShowPermissionsModal(false)}
          />
        )}

        {showEditModal && (
          <UserModal
            user={user}
            onSave={async () => {
              setShowEditModal(false);
              if (isEditMode) navigate(`/settings/users/${id}`, { replace: true });
              // Refetch full user profile to get accurate data
              try {
                const response = await api.get(`/users/${id}`);
                const raw = response.data;
                const userData = raw?.user || raw?.data || (raw?.id != null ? raw : null);
                if (!userData) return;
                const perf = userData.performance || {};
                const roleName = typeof userData.role === 'string' && userData.role
                  ? userData.role
                  : userData.roleData?.name || 'Sales Agent';
                const permList = Array.isArray(userData.allPermissions) && userData.allPermissions.length > 0
                  ? userData.allPermissions
                  : Array.isArray(userData.permissions) ? userData.permissions : [];
                setUser(prev => ({
                  ...prev,
                  ...userData,
                  id:         userData.id,
                  name:       (userData.name || '').trim() || prev.name || 'Unknown User',
                  email:      userData.email      || prev.email || '',
                  phone:      userData.phone      || prev.phone || '',
                  role:       roleName,
                  status:     userData.status     || prev.status,
                  department: userData.department || prev.department,
                  title:      userData.title      || '-',
                  permissions: permList.length > 0 ? permList : prev.permissions,
                  joinedAt:   userData.joinedAt   || userData.createdAt || prev.joinedAt,
                  lastActive: userData.lastActive || userData.lastLogin || prev.lastActive,
                  performance: {
                    ...prev.performance,
                    totalLeads:      perf.totalLeads      ?? ((perf.assignedLeads ?? 0) + (perf.createdLeads ?? 0)),
                    assignedLeads:   perf.assignedLeads   ?? prev.performance?.assignedLeads ?? 0,
                    createdLeads:    perf.createdLeads    ?? prev.performance?.createdLeads ?? 0,
                    totalActivities: perf.totalActivities ?? prev.performance?.totalActivities ?? 0,
                    totalFollowups:  perf.totalFollowups  ?? prev.performance?.totalFollowups ?? 0,
                    openLeads:       perf.openLeads       ?? prev.performance?.openLeads ?? 0,
                    convertedLeads:  perf.convertedLeads  ?? prev.performance?.convertedLeads ?? 0,
                    lostLeads:       perf.lostLeads       ?? prev.performance?.lostLeads ?? 0,
                    conversionRate:  perf.conversionRate  ?? prev.performance?.conversionRate ?? 0,
                  },
                }));
              } catch (e) {
                console.error('Failed to refetch user after edit:', e);
              }
            }}
            onClose={() => {
              setShowEditModal(false);
              if (isEditMode) navigate(`/settings/users/${id}`, { replace: true });
            }}
          />
        )}
      </div>
    </Layout>
  );
}

export default UserDetail;

