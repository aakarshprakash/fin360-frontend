// RolePermissions Component - Role & Permission Management
// Toggle-based UI for managing user permissions — loads roles from API
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { PERMISSION_GROUPS, DEFAULT_ROLE_PRESETS, SUPER_ADMIN_ROLES } from '../utils/permissions';
import '../styles/RolePermissions.css';
import '../styles/Modal.css';

// SVG icons per category
const CATEGORY_ICONS = {
  Leads: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  Customers: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  'Follow-ups & Communication': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.11 11a19.79 19.79 0 01-3.07-8.67A2 2 0 012.92 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  'Reports & Analytics': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 118 2.83M22 12A10 10 0 0012 2v10z"/></svg>,
  'User Management': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 018 0v2M18 14v6M15 17h6"/></svg>,
  'Settings & Configuration': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33A1.65 1.65 0 0013 21v.09A2 2 0 0111 23a2 2 0 01-2-2v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H2a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  Accounting: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
};

function RolePermissions({ user, onSave, onClose }) {
  const navigate = useNavigate();
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [selectedRoleName, setSelectedRoleName] = useState(user?.role || '');
  const [permissions, setPermissions] = useState(() => {
    // If user is super admin, start with all permissions selected
    if (SUPER_ADMIN_ROLES.includes(user?.role)) {
      const all = PERMISSION_GROUPS.reduce((acc, g) => [...acc, ...g.permissions.map(p => p.key)], []);
      return all;
    }
    return user?.permissions || [];
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [apiRoles, setApiRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [permissionGroups, setPermissionGroups] = useState(PERMISSION_GROUPS);

  // Load roles + permission master list from API
  useEffect(() => {
    let cancelled = false;
    async function loadRoles() {
      try {
        const res = await api.get('/roles');
        const data = res.data?.roles || res.data?.data || res.data;
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setApiRoles(data);
          // Find & select current user's role
          const match = data.find(r =>
            r.name === user?.role || r.id === user?.roleId || r.id === user?.role_id
          );
          if (match) setSelectedRoleId(match.id);
        } else if (!cancelled) {
          // Fallback to preset role names
          const fallback = Object.keys(DEFAULT_ROLE_PRESETS).map((name, i) => ({
            id: i + 1, name,
            permissions: DEFAULT_ROLE_PRESETS[name],
            isSystem: ['Admin', 'Super Admin'].includes(name),
          }));
          setApiRoles(fallback);
        }
      } catch {
        if (!cancelled) {
          const fallback = Object.keys(DEFAULT_ROLE_PRESETS).map((name, i) => ({
            id: i + 1, name,
            permissions: DEFAULT_ROLE_PRESETS[name],
            isSystem: ['Admin', 'Super Admin'].includes(name),
          }));
          setApiRoles(fallback);
        }
      }
      // Fetch permission master list
      try {
        const res = await api.get('/permissions');
        const data = res.data?.permissions || res.data?.data || res.data;
        if (!cancelled && Array.isArray(data) && data.length > 0 && data[0]?.category) {
          setPermissionGroups(data);
        }
      } catch { /* use fallback PERMISSION_GROUPS */ }

      if (!cancelled) setRolesLoading(false);
    }
    loadRoles();
    return () => { cancelled = true; };
  }, [user]);

  // Detect changes
  useEffect(() => {
    const originalPerms = user?.permissions || [];
    const permChanged = permissions.length !== originalPerms.length
      || permissions.some(p => !originalPerms.includes(p))
      || originalPerms.some(p => !permissions.includes(p));
    const roleChanged = selectedRoleName !== user?.role;
    setHasChanges(permChanged || roleChanged);
  }, [permissions, selectedRoleName, user]);

  // All permission keys (flat list) for __all__ presets
  const allPermKeys = permissionGroups.reduce((acc, g) => [...acc, ...g.permissions.map(p => p.key)], []);

  // When a role card is clicked — apply its permission preset
  const handleRoleSelect = (role) => {
    setSelectedRoleId(role.id);
    setSelectedRoleName(role.name);

    // Handle '__all__' preset for super admin roles
    if (role.permissions === '__all__' || isSuperAdminRole(role.name)) {
      setPermissions([...allPermKeys]);
      return;
    }

    const rolePerms = Array.isArray(role.permissions)
      ? role.permissions.map(p => (typeof p === 'string' ? p : p.name || p.key))
      : DEFAULT_ROLE_PRESETS[role.name] === '__all__'
        ? [...allPermKeys]
        : DEFAULT_ROLE_PRESETS[role.name] || [];
    setPermissions(rolePerms);
  };

  const togglePermission = (permKey) => {
    setPermissions(prev =>
      prev.includes(permKey) ? prev.filter(p => p !== permKey) : [...prev, permKey]
    );
  };

  const toggleCategory = (categoryPerms) => {
    const allEnabled = categoryPerms.every(p => permissions.includes(p.key));
    if (allEnabled) {
      setPermissions(prev => prev.filter(p => !categoryPerms.map(cp => cp.key).includes(p)));
    } else {
      setPermissions(prev => [...new Set([...prev, ...categoryPerms.map(cp => cp.key)])]);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    setSaveError('');
    try {
      const payload = {
        role: selectedRoleName,
        role_id: selectedRoleId || undefined,
        permissions,
      };
      await api.put(`/users/${user.id}/permissions`, payload);
      setSaveSuccess(true);
      setSaveError('');
      setTimeout(() => {
        onSave(permissions, selectedRoleName, selectedRoleId);
      }, 800);
    } catch (err) {
      console.error('Failed to save permissions:', err);
      const data = err.response?.data;
      if (data?.errors) {
        const msgs = Object.values(data.errors).flat();
        setSaveError(msgs.join(' '));
      } else {
        setSaveError(data?.message || 'Failed to save permissions. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const isEnabled = (permKey) => permissions.includes(permKey);
  const isSuperAdminRole = (roleName) => SUPER_ADMIN_ROLES.includes(roleName);
  const isCategoryFullyEnabled = (categoryPerms) => categoryPerms.every(p => permissions.includes(p.key));
  const isCategoryPartiallyEnabled = (categoryPerms) => {
    const enabled = categoryPerms.filter(p => permissions.includes(p.key));
    return enabled.length > 0 && enabled.length < categoryPerms.length;
  };
  const totalPermCount = permissionGroups.reduce((acc, g) => acc + g.permissions.length, 0);

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  return (
    <div className="modal-overlay">
      <div className="permissions-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="header-content">
            <div className="header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <h2>Manage Permissions</h2>
              <p>Configure access rights for <strong>{user?.name || 'this user'}</strong></p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Role Selector */}
          <div className="role-section">
            <div className="role-section-header">
              <div>
                <h3>Assign Role</h3>
                <p className="section-description">Select a role to apply its default permissions</p>
              </div>
              <button
                className="manage-roles-link"
                onClick={() => { onClose(); navigate('/settings/roles'); }}
                title="Manage roles in Settings"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
                Manage Roles
              </button>
            </div>

            {rolesLoading ? (
              <div className="roles-skeleton">
                {[1,2,3,4].map(i => <div key={i} className="role-btn-skeleton"/>)}
              </div>
            ) : (
              <div className="role-selector">
                {apiRoles.map(role => {
                  const isSA = isSuperAdminRole(role.name);
                  const isSelected = selectedRoleId === role.id || selectedRoleName === role.name;
                  const permCount = role.permissions === '__all__' || isSA
                    ? allPermKeys.length
                    : Array.isArray(role.permissions) ? role.permissions.length : 0;
                  return (
                    <button
                      key={role.id}
                      className={`role-btn ${isSelected ? 'active' : ''} ${isSA ? 'super-admin' : ''}`}
                      onClick={() => handleRoleSelect(role)}
                      title={isSA ? 'Super Admin has unrestricted access to everything' : role.description || ''}
                    >
                      {isSA && (
                        <span className="sa-crown">
                          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M2 19l3-10 5 6 4-8 5 6 3-4v12H2z"/></svg>
                        </span>
                      )}
                      <span className="role-name">{role.name}</span>
                      <span className="role-count">{permCount} permissions</span>
                      {isSA && <span className="sa-badge">All Access</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Super Admin notice */}
          {isSuperAdminRole(selectedRoleName) && (
            <div className="super-admin-notice">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <div>
                <strong>Super Admin Role</strong>
                <p>This role has unrestricted access to all modules and data regardless of individual permission toggles.</p>
              </div>
            </div>
          )}

          {/* Permissions */}
          <div className="permissions-section">
            <div className="perms-section-header">
              <div>
                <h3>Fine-tune Permissions</h3>
                <p className="section-description">Override individual permissions below</p>
              </div>
              <span className="perm-counter-badge">
                {permissions.length} / {totalPermCount} enabled
              </span>
            </div>

            <div className="permission-groups">
              {permissionGroups.map(group => (
                <div key={group.category} className="permission-group">
                  <div className="group-header">
                    <div className="group-info">
                      <span className="group-icon">
                        {CATEGORY_ICONS[group.category] || group.icon || null}
                      </span>
                      <span className="group-name">{group.category}</span>
                      <span className="group-count-badge">
                        {group.permissions.filter(p => permissions.includes(p.key)).length}/{group.permissions.length}
                      </span>
                    </div>
                    <button
                      className={`toggle-all-btn ${isCategoryFullyEnabled(group.permissions) ? 'active' : ''} ${isCategoryPartiallyEnabled(group.permissions) ? 'partial' : ''}`}
                      onClick={() => toggleCategory(group.permissions)}
                    >
                      {isCategoryFullyEnabled(group.permissions) ? 'Disable All' : 'Enable All'}
                    </button>
                  </div>
                  <div className="group-permissions">
                    {group.permissions.map(perm => {
                      const isDataScope = perm.key.includes('_own_') || perm.key.includes('_all_');
                      return (
                        <div key={perm.key} className={`permission-item ${isDataScope ? 'data-scope' : ''}`}>
                          <div className="permission-info">
                            <span className="permission-label">
                              {perm.label}
                              {isDataScope && (
                                <span className={`scope-tag ${perm.key.includes('_own_') ? 'own' : 'all'}`}>
                                  {perm.key.includes('_own_') ? 'Own Data' : 'All Data'}
                                </span>
                              )}
                            </span>
                            <span className="permission-description">{perm.description}</span>
                          </div>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={isEnabled(perm.key)}
                              onChange={() => togglePermission(perm.key)}
                              disabled={isSuperAdminRole(selectedRoleName)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="permission-summary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            <span>
              <strong>{permissions.length}</strong> of <strong>{totalPermCount}</strong> permissions enabled
              {selectedRoleName && <> · Role: <strong>{selectedRoleName}</strong></>}
            </span>
          </div>
          {saveError && <div className="save-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
            {saveError}
          </div>}
          {saveSuccess && <div className="save-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Permissions saved successfully!
          </div>}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? (
              <><span className="spinner"></span> Saving...</>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8"/></svg>
                Save Permissions
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RolePermissions;

