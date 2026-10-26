// User List Page - Professional Staff Management Module
// Provides comprehensive user management with role-based access control
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import UserModal from '../components/UserModal';
import api from '../utils/api';
import useSnackbar from '../utils/useSnackbar';
import '../styles/UserList.css';
import '../styles/Modal.css';

// Demo staff data with comprehensive fields
const demoUsers = [
  {
    id: 1,
    name: 'Sarah Miller',
    email: 'sarah.miller@company.com',
    phone: '+1 (555) 123-4567',
    avatar: null,
    role: 'Admin',
    status: 'Active',
    department: 'Sales',
    assignedLeads: 45,
    openLeads: 12,
    convertedLeads: 28,
    lostLeads: 5,
    conversionRate: 62.2,
    avgResponseTime: '2.5 hrs',
    lastActive: '2026-02-07T14:30:00',
    joinedAt: '2024-06-15',
    permissions: ['view_leads', 'create_leads', 'edit_leads', 'delete_leads', 'assign_leads', 'view_reports', 'manage_users']
  },
  {
    id: 2,
    name: 'John Davis',
    email: 'john.davis@company.com',
    phone: '+1 (555) 234-5678',
    avatar: null,
    role: 'Manager',
    status: 'Active',
    department: 'Sales',
    assignedLeads: 38,
    openLeads: 8,
    convertedLeads: 24,
    lostLeads: 6,
    conversionRate: 63.2,
    avgResponseTime: '1.8 hrs',
    lastActive: '2026-02-07T12:45:00',
    joinedAt: '2024-08-20',
    permissions: ['view_leads', 'create_leads', 'edit_leads', 'assign_leads', 'view_reports']
  },
  {
    id: 3,
    name: 'Mike Brown',
    email: 'mike.brown@company.com',
    phone: '+1 (555) 345-6789',
    avatar: null,
    role: 'Sales Agent',
    status: 'Active',
    department: 'Sales',
    assignedLeads: 52,
    openLeads: 18,
    convertedLeads: 30,
    lostLeads: 4,
    conversionRate: 57.7,
    avgResponseTime: '3.2 hrs',
    lastActive: '2026-02-07T15:20:00',
    joinedAt: '2025-01-10',
    permissions: ['view_leads', 'create_leads', 'edit_leads']
  },
  {
    id: 4,
    name: 'Emily Chen',
    email: 'emily.chen@company.com',
    phone: '+1 (555) 456-7890',
    avatar: null,
    role: 'Sales Agent',
    status: 'Active',
    department: 'Sales',
    assignedLeads: 41,
    openLeads: 15,
    convertedLeads: 22,
    lostLeads: 4,
    conversionRate: 53.7,
    avgResponseTime: '2.1 hrs',
    lastActive: '2026-02-07T11:30:00',
    joinedAt: '2025-03-05',
    permissions: ['view_leads', 'create_leads', 'edit_leads']
  },
  {
    id: 5,
    name: 'Robert Wilson',
    email: 'robert.wilson@company.com',
    phone: '+1 (555) 567-8901',
    avatar: null,
    role: 'Sales Agent',
    status: 'Inactive',
    department: 'Sales',
    assignedLeads: 28,
    openLeads: 0,
    convertedLeads: 20,
    lostLeads: 8,
    conversionRate: 71.4,
    avgResponseTime: '4.5 hrs',
    lastActive: '2026-01-15T09:00:00',
    joinedAt: '2024-11-20',
    permissions: ['view_leads', 'create_leads', 'edit_leads']
  },
  {
    id: 6,
    name: 'Jessica Taylor',
    email: 'jessica.taylor@company.com',
    phone: '+1 (555) 678-9012',
    avatar: null,
    role: 'Manager',
    status: 'Active',
    department: 'Marketing',
    assignedLeads: 35,
    openLeads: 10,
    convertedLeads: 21,
    lostLeads: 4,
    conversionRate: 60.0,
    avgResponseTime: '2.8 hrs',
    lastActive: '2026-02-07T10:15:00',
    joinedAt: '2024-09-01',
    permissions: ['view_leads', 'create_leads', 'edit_leads', 'assign_leads', 'view_reports']
  },
  {
    id: 7,
    name: 'David Lee',
    email: 'david.lee@company.com',
    phone: '+1 (555) 789-0123',
    avatar: null,
    role: 'Sales Agent',
    status: 'Suspended',
    department: 'Sales',
    assignedLeads: 15,
    openLeads: 0,
    convertedLeads: 8,
    lostLeads: 7,
    conversionRate: 53.3,
    avgResponseTime: '6.2 hrs',
    lastActive: '2026-01-20T16:45:00',
    joinedAt: '2025-02-15',
    permissions: []
  },
  {
    id: 8,
    name: 'Amanda White',
    email: 'amanda.white@company.com',
    phone: '+1 (555) 890-1234',
    avatar: null,
    role: 'Sales Agent',
    status: 'Active',
    department: 'Sales',
    assignedLeads: 48,
    openLeads: 14,
    convertedLeads: 29,
    lostLeads: 5,
    conversionRate: 60.4,
    avgResponseTime: '1.9 hrs',
    lastActive: '2026-02-07T13:00:00',
    joinedAt: '2024-12-01',
    permissions: ['view_leads', 'create_leads', 'edit_leads']
  }
];

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="loading-skeleton">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="skeleton-row">
        <div className="skeleton-cell skeleton-user"></div>
        <div className="skeleton-cell skeleton-role"></div>
        <div className="skeleton-cell skeleton-status"></div>
        <div className="skeleton-cell skeleton-number"></div>
        <div className="skeleton-cell skeleton-number"></div>
        <div className="skeleton-cell skeleton-number"></div>
        <div className="skeleton-cell skeleton-rate"></div>
        <div className="skeleton-cell skeleton-date"></div>
        <div className="skeleton-cell skeleton-actions"></div>
      </div>
    ))}
  </div>
);

function UserList() {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);

  // Confirmation modal state
  const [confirmAction, setConfirmAction] = useState(null);

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (showUserModal || confirmAction) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [showUserModal, confirmAction]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await api.get('/users', { signal });
        const raw = response.data?.users || response.data?.data || response.data || [];
        if (!signal.aborted) {
          const normalized = (Array.isArray(raw) ? raw : []).map((u, idx) => {
            const perf = u.performance || {};
            return {
              ...u,
              // Ensure id always exists — fall back to index so keys are always unique
              id: u.id ?? u.userId ?? idx,
              name: (u.name || u.fullName || '').trim() || 'Unknown User',
              email: u.email || '',
              phone: u.phone || '',
              role: typeof u.role === 'string' && u.role
                ? u.role
                : u.roleData?.name || 'Sales Agent',
              status: u.status || 'Active',
              department: u.department || '',
              avatar: u.avatar || null,
              // Performance fields — may be nested under performance{} or flat
              assignedLeads: u.assignedLeads ?? perf.assignedLeads ?? perf.totalLeads ?? 0,
              openLeads: u.openLeads ?? perf.openLeads ?? 0,
              convertedLeads: u.convertedLeads ?? perf.convertedLeads ?? 0,
              lostLeads: u.lostLeads ?? perf.lostLeads ?? 0,
              conversionRate: u.conversionRate ?? perf.conversionRate ?? 0,
              avgResponseTime: u.avgResponseTime ?? perf.avgResponseTime ?? '-',
              lastActive: u.lastActive || u.lastLogin || null,
              joinedAt: u.joinedAt || u.createdAt || null,
            };
          });
          setUsers(normalized);
        }
      } catch (err) {
        if (signal.aborted) return;
        console.warn('Failed to fetch users:', err);
        if (err.response?.status === 401) {
          showSnackbar('Session expired. Please login again.', 'warning');
        } else {
          showSnackbar('Failed to load users. Using demo data.', 'warning');
        }
        setUsers(demoUsers);
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      abortController.abort();
    };
  }, []);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowActionMenu(null);
    if (showActionMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showActionMenu]);

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.includes(query)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(user => user.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      result = result.filter(user => {
        const joinDate = new Date(user.joinedAt);
        const diffDays = Math.ceil((now - joinDate) / (1000 * 60 * 60 * 24));

        switch (dateFilter) {
          case 'week': return diffDays <= 7;
          case 'month': return diffDays <= 30;
          case 'quarter': return diffDays <= 90;
          case 'year': return diffDays <= 365;
          default: return true;
        }
      });
    }

    return result;
  }, [users, searchQuery, roleFilter, statusFilter, dateFilter]);

  // Pagination
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  // Calculate stats
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === 'Active').length,
    inactive: users.filter(u => u.status === 'Inactive').length,
    suspended: users.filter(u => u.status === 'Suspended').length
  }), [users]);

  // Action handlers
  const handleAddUser = () => {
    setEditingUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowUserModal(true);
    setShowActionMenu(null);
  };

  const handleViewProfile = (userId) => {
    navigate(`/settings/users/${userId}`);
    setShowActionMenu(null);
  };

  const handleStatusChange = (user, newStatus) => {
    setConfirmAction({
      type: newStatus === 'Active' ? 'activate' : newStatus === 'Inactive' ? 'deactivate' : 'suspend',
      user,
      newStatus
    });
    setShowActionMenu(null);
  };

  const handleResetPassword = (user) => {
    setConfirmAction({
      type: 'reset-password',
      user
    });
    setShowActionMenu(null);
  };

  const handleDeleteUser = (user) => {
    setConfirmAction({
      type: 'delete',
      user
    });
    setShowActionMenu(null);
  };

  const confirmActionHandler = async () => {
    try {
      if (confirmAction.type === 'reset-password') {
        // Send password reset email via API
        await api.post('/password/forgot', { email: confirmAction.user.email });
        showSnackbar(`Password reset email sent to ${confirmAction.user.email}`, 'success');
      } else if (confirmAction.type === 'delete') {
        // Delete user via API
        await api.delete(`/users/${confirmAction.user.id}`);
        setUsers(prev => prev.filter(u => u.id !== confirmAction.user.id));
        showSnackbar('User deleted successfully', 'success');
      } else {
        // Update user status
        await api.put(`/users/${confirmAction.user.id}`, {
          status: confirmAction.newStatus
        });
        setUsers(prev => prev.map(u =>
          u.id === confirmAction.user.id
            ? { ...u, status: confirmAction.newStatus }
            : u
        ));
        const statusAction = confirmAction.newStatus === 'Active' ? 'activated' :
                           confirmAction.newStatus === 'Inactive' ? 'deactivated' : 'suspended';
        showSnackbar(`User ${statusAction} successfully`, 'success');
      }
      setConfirmAction(null);
    } catch (err) {
      console.error('Failed to perform action:', err);
      showSnackbar(err.response?.data?.message || 'Failed to perform action', 'error');
      setConfirmAction(null);
    }
  };

  const handleSaveUser = async (userData) => {
    try {
      // UserModal already makes the API call, we just need to refresh the list or update state
      if (editingUser) {
        // Update existing user in list
        setUsers(prev => prev.map(u =>
          u.id === editingUser.id ? { ...userData, id: editingUser.id } : u
        ));
        showSnackbar('User updated successfully', 'success');
      } else {
        // Add new user to list
        setUsers(prev => [userData, ...prev]);
        showSnackbar('User created successfully', 'success');
      }
      setShowUserModal(false);
      setEditingUser(null);
    } catch (err) {
      console.error('Error updating user list:', err);
      showSnackbar('Failed to save user', 'error');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setStatusFilter('all');
    setDateFilter('all');
  };

  const hasActiveFilters = searchQuery || roleFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all';

  // Format date helpers
  const formatLastActive = (dateStr) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 5) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '?';
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get role badge class
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Admin': return 'role-admin';
      case 'Manager': return 'role-manager';
      case 'Sales Agent': return 'role-agent';
      default: return '';
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active': return 'status-active';
      case 'Inactive': return 'status-inactive';
      case 'Suspended': return 'status-suspended';
      default: return '';
    }
  };

  return (
    <Layout>
      <div className="user-list-page">
        {/* Page Header */}
        <header className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">Users & Staff</h1>
            <p className="page-subtitle">Manage your team members, roles, and permissions</p>
          </div>
          <div className="page-header-actions">
            <button className="btn-secondary" onClick={() => showSnackbar('Export feature coming soon!', 'info')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Export
            </button>
            <button className="btn-secondary" onClick={() => showSnackbar('Invite feature coming soon!', 'info')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Invite User
            </button>
            <button className="btn-primary" onClick={handleAddUser}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 4v16m8-8H4" />
              </svg>
              Add User
            </button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="user-stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total Users</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon active">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.active}</span>
              <span className="stat-label">Active</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon inactive">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.inactive}</span>
              <span className="stat-label">Inactive</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon suspended">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.suspended}</span>
              <span className="stat-label">Suspended</span>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="filters-section">
          <div className="search-filter">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label>Role</label>
              <select className="filter-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="all">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Sales Agent">Sales Agent</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Status</label>
              <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Date Joined</label>
              <select className="filter-select" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                <option value="all">All Time</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="quarter">Last 90 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="results-info">
          <span className="results-count">Showing {paginatedUsers.length} of {filteredUsers.length} users</span>
        </div>

        {/* Users Table */}
        <div className="users-table-container">
          {loading ? (
            <LoadingSkeleton />
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
              <h3>No users found</h3>
              <p>Try adjusting your search or filter criteria</p>
              {hasActiveFilters && (
                <button className="btn-secondary" onClick={clearFilters}>Clear Filters</button>
              )}
            </div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th className="col-user">User</th>
                  <th className="col-role">Role</th>
                  <th className="col-status">Status</th>
                  <th className="col-number">Assigned</th>
                  <th className="col-number">Open</th>
                  <th className="col-number">Converted</th>
                  <th className="col-rate">Conv. Rate</th>
                  <th className="col-date">Last Active</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user, idx) => (
                  <tr
                    key={user.id ?? user.email ?? idx}
                    className={user.status !== 'Active' ? 'row-muted' : ''}
                    onClick={() => handleViewProfile(user.id)}
                  >
                    <td className="col-user">
                      <div className="user-cell">
                        <div className="user-avatar" style={{ backgroundColor: user.status === 'Active' ? 'var(--primary-500)' : 'var(--neutral-400)' }}>
                          {user.avatar ? <img src={user.avatar} alt={user.name} /> : <span>{getInitials(user.name)}</span>}
                        </div>
                        <div className="user-info">
                          <span className="user-name">{user.name}</span>
                          <span className="user-email">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="col-role">
                      <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>{user.role}</span>
                    </td>
                    <td className="col-status">
                      <span className={`status-badge ${getStatusBadgeClass(user.status)}`}>
                        <span className="status-dot"></span>
                        {user.status || '-'}
                      </span>
                    </td>
                    <td className="col-number">{user.assignedLeads}</td>
                    <td className="col-number">{user.openLeads}</td>
                    <td className="col-number">{user.convertedLeads}</td>
                    <td className="col-rate">
                      <span className={`rate-value ${(user.conversionRate ?? 0) >= 60 ? 'rate-good' : (user.conversionRate ?? 0) >= 40 ? 'rate-medium' : 'rate-low'}`}>
                        {user.conversionRate != null ? `${user.conversionRate}%` : '-'}
                      </span>
                    </td>
                    <td className="col-date">{formatLastActive(user.lastActive)}</td>
                    <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                      <div className="action-menu-container">
                        <button
                          className="action-menu-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowActionMenu(showActionMenu === user.id ? null : user.id);
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="6" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="18" r="2" />
                          </svg>
                        </button>

                        {showActionMenu === user.id && (
                          <div className="action-menu">
                            <button onClick={() => handleViewProfile(user.id)}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              View Profile
                            </button>
                            <button onClick={() => handleEditUser(user)}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              Edit User
                            </button>
                            <button onClick={() => handleResetPassword(user)}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0110 0v4" />
                              </svg>
                              Reset Password
                            </button>
                            <div className="action-divider"></div>
                            {user.status === 'Active' ? (
                              <button className="action-warning" onClick={() => handleStatusChange(user, 'Inactive')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                </svg>
                                Deactivate
                              </button>
                            ) : (
                              <button className="action-success" onClick={() => handleStatusChange(user, 'Active')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                                  <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                                Activate
                              </button>
                            )}
                            <button className="action-danger" onClick={() => handleDeleteUser(user)}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                              </svg>
                              Delete User
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Previous
            </button>
            <div className="pagination-pages">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  className={`pagination-page ${currentPage === i + 1 ? 'active' : ''}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button className="pagination-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>
              Next
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}

        {/* User Modal */}
        {showUserModal && (
          <UserModal
            user={editingUser}
            onSave={handleSaveUser}
            onClose={() => { setShowUserModal(false); setEditingUser(null); }}
          />
        )}

        {/* Confirmation Modal */}
        {confirmAction && (
          <div className="modal-overlay">
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className={`confirm-icon ${confirmAction.type}`}>
                {confirmAction.type === 'reset-password' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                ) : confirmAction.type === 'activate' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                ) : confirmAction.type === 'delete' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                )}
              </div>
              <h3>
                {confirmAction.type === 'reset-password' ? 'Reset Password?'
                  : confirmAction.type === 'activate' ? 'Activate User?'
                  : confirmAction.type === 'delete' ? 'Delete User?'
                  : 'Deactivate User?'}
              </h3>
              <p>
                {confirmAction.type === 'reset-password'
                  ? `A password reset email will be sent to ${confirmAction.user.email}`
                  : confirmAction.type === 'activate'
                  ? `${confirmAction.user.name} will be able to access the system again.`
                  : confirmAction.type === 'delete'
                  ? `Are you sure you want to delete ${confirmAction.user.name}? This action cannot be undone.`
                  : `${confirmAction.user.name} will no longer be able to access the system.`}
              </p>
              <div className="confirm-actions">
                <button className="btn-secondary" onClick={() => setConfirmAction(null)}>Cancel</button>
                <button className={`btn-primary ${confirmAction.type === 'deactivate' || confirmAction.type === 'delete' ? 'btn-danger' : ''}`} onClick={confirmActionHandler}>
                  {confirmAction.type === 'reset-password' ? 'Send Reset Email'
                    : confirmAction.type === 'activate' ? 'Activate'
                    : confirmAction.type === 'delete' ? 'Delete'
                    : 'Deactivate'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}

export default UserList;

