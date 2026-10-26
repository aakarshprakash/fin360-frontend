// Settings sections rendered inside the Settings frame: company profile, roles,
// departments, job titles, notifications, profile and security. The section
// comes from the URL (/settings/<section>).
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Building2, Eye, Lock, LogOut, Mail, Phone, UserRound } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { getCurrentUser, apiLogoutEverywhere } from '../utils/auth';
import { PERMISSION_GROUPS } from '../utils/permissions';
import { usePermission } from '../utils/usePermission';
import { useCompanySettings, invalidateCompanySettingsCache } from '../utils/useCompanySettings';
import useSnackbar from '../utils/useSnackbar';
import '../styles/Settings.css';
import '../styles/Modal.css';

// ── TitleRow ─────────────────────────────────────────────────────────────────
function TitleRow({ t, onEdit, onDelete, onToggle, canManage }) {
  const active = t.isActive !== false && t.is_active !== false;
  return (
    <div className={`title-row ${!active ? 'inactive' : ''}`}>
      <div className="title-row-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
        </svg>
      </div>
      <span className="title-row-name">{t.name}</span>
      {canManage && (
        <div className="title-row-actions">
          <button
            className={`status-toggle ${active ? 'active' : 'inactive'}`}
            onClick={() => onToggle(t)}
          >
            {active ? 'Active' : 'Inactive'}
          </button>
          <button className="action-btn edit" onClick={() => onEdit(t)} title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button className="action-btn delete" onClick={() => onDelete(t)} title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

const SECTION_HEADINGS = {
  company: ['Company Profile', 'Name, logo and contact details shown across Fin360 and on the sign-in page'],
  notifications: ['Notifications', 'Choose which finance alerts you receive'],
  profile: ['My Profile', 'Your personal details'],
  security: ['Security', 'Password and signed-in sessions'],
};

function Settings() {
  const navigate = useNavigate();
  const section = useLocation().pathname.split('/')[2]; // /settings/<section>
  const { can, isAdmin } = usePermission();
  const { showSnackbar } = useSnackbar();

  // Permission flags
  const canManageDepts  = isAdmin() || can('manage_departments');
  const canManageTitles = isAdmin() || can('manage_job_titles');

  // ── Company Settings state ─────────────────────────────────────────────────
  const { settings: companyDefaults, refetch: refetchCompanySettings } = useCompanySettings();
  const [companyForm, setCompanyForm] = useState({
    companyName: '', companyShortName: '', tagline: '',
    email: '', phone: '', address: '', website: '', logoUrl: '',
  });
  const [companySaving, setCompanySaving] = useState(false);
  const [companyLoaded, setCompanyLoaded] = useState(false);
  const [companyMsg, setCompanyMsg] = useState({ type: '', text: '' });

  // URL section ↔ internal tab key (job titles keep their historic 'titles' key)
  const activeTab = section === 'job-titles' ? 'titles' : (section || 'company');
  const setActiveTab = (tab) => navigate(`/settings/${tab === 'titles' ? 'job-titles' : tab}`);

  // ── Job Titles state ─────────────────────────────────────────────────────────
  const [jobTitles, setJobTitles] = useState([]);
  const [titlesLoading, setTitlesLoading] = useState(false);
  const [titleForm, setTitleForm] = useState({ name: '', departmentId: '', departmentName: '' });
  const [titleFormErrors, setTitleFormErrors] = useState({});
  const [editingTitle, setEditingTitle] = useState(null);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [titleSaving, setTitleSaving] = useState(false);
  const [titleDeleteConfirm, setTitleDeleteConfirm] = useState(null);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all'); // 'all' | dept.id
  const [titlesMsg, setTitlesMsg] = useState({ type: '', text: '' });


  // ── Roles state ──────────────────────────────────────────────────────────────
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null); // null = create, object = edit
  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissions: [] });
  const [roleFormErrors, setRoleFormErrors] = useState({});
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleDeleteConfirm, setRoleDeleteConfirm] = useState(null);
  const [rolesMsg, setRolesMsg] = useState({ type: '', text: '' });


  // ── Departments state ────────────────────────────────────────────────────────
  const [departments, setDepartments] = useState([]);
  const [deptsLoading, setDeptsLoading] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', description: '' });
  const [deptFormErrors, setDeptFormErrors] = useState({});
  const [editingDept, setEditingDept] = useState(null);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptSaving, setDeptSaving] = useState(false);
  const [deptDeleteConfirm, setDeptDeleteConfirm] = useState(null);
    const [deptsMsg, setDeptsMsg] = useState({ type: '', text: '' });



  // Fetch on tab change
  useEffect(() => {
    if (activeTab === 'roles') fetchRoles();
    if (activeTab === 'titles') { fetchTitles(); fetchDepartments(); }
    if (activeTab === 'departments') { fetchDepartments(); fetchTitles(); }
    if (activeTab === 'company') loadCompanyForm();
  }, [activeTab]);

  // ── Company Settings ─────────────────────────────────────────────────────────
  const loadCompanyForm = async () => {
    if (companyLoaded) return;
    try {
      const res = await api.get('/settings/company');
      const raw = res.data?.data || res.data || {};
      setCompanyForm({
        companyName: raw.companyName || raw.company_name || companyDefaults.companyName || '',
        companyShortName: raw.companyShortName || raw.company_short_name || companyDefaults.companyShortName || '',
        tagline: raw.tagline || companyDefaults.tagline || '',
        email: raw.email || raw.companyEmail || raw.company_email || companyDefaults.email || '',
        phone: raw.phone || raw.companyPhone || raw.company_phone || companyDefaults.phone || '',
        address: raw.address || raw.companyAddress || raw.company_address || companyDefaults.address || '',
        website: raw.website || raw.companyWebsite || raw.company_website || companyDefaults.website || '',
        logoUrl: raw.logoUrl || raw.logo_url || companyDefaults.logoUrl || '',
      });
      setCompanyLoaded(true);
    } catch {
      // Pre-fill with cached defaults
      setCompanyForm({
        companyName: companyDefaults.companyName || '',
        companyShortName: companyDefaults.companyShortName || '',
        tagline: companyDefaults.tagline || '',
        email: companyDefaults.email || '',
        phone: companyDefaults.phone || '',
        address: companyDefaults.address || '',
        website: companyDefaults.website || '',
        logoUrl: companyDefaults.logoUrl || '',
      });
      setCompanyLoaded(true);
    }
  };

  const handleSaveCompany = async () => {
    if (!companyForm.companyName.trim()) {
      setCompanyMsg({ type: 'error', text: 'Company name is required.' });
      return;
    }
    setCompanySaving(true);
    try {
      await api.put('/settings/company', companyForm);
      invalidateCompanySettingsCache();
      refetchCompanySettings();
      showSnackbar('Company settings saved successfully!', 'success');
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to save company settings.', 'error');
    } finally {
      setCompanySaving(false);
    }
  };

  const fetchRoles = async () => {
    setRolesLoading(true);
    try {
      const res = await api.get('/roles');
      const data = res.data?.roles || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      setRolesMsg({ type: 'error', text: 'Failed to load roles. Please try again.' });
    } finally {
      setRolesLoading(false);
    }
  };

  // ── Job Titles CRUD ───────────────────────────────────────────────────────────
  const fetchTitles = async () => {
    setTitlesLoading(true);
    try {
      const res = await api.get('/job-titles');
      const data = res.data?.data || res.data?.jobTitles || (Array.isArray(res.data) ? res.data : []);
      setJobTitles(Array.isArray(data) ? data : []);
    } catch {
      setTitlesMsg({ type: 'error', text: 'Failed to load job titles.' });
    } finally {
      setTitlesLoading(false);
    }
  };

  const openCreateTitle = (prefilledDeptId = '') => {
    setEditingTitle(null);
    const dept = departments.find(d => d.id === prefilledDeptId);
    setTitleForm({ name: '', departmentId: prefilledDeptId || '', departmentName: dept?.name || '' });
    setTitleFormErrors({});
    setShowTitleModal(true);
  };

  const openEditTitle = (t) => {
    setEditingTitle(t);
    setTitleForm({
      name: t.name || '',
      departmentId: t.departmentId || t.department_id || '',
      departmentName: t.departmentName || t.department?.name || t.department || '',
    });
    setTitleFormErrors({});
    setShowTitleModal(true);
  };

  const handleSaveTitle = async () => {
    const errs = {};
    if (!titleForm.name.trim()) errs.name = 'Title name is required';
    if (Object.keys(errs).length) { setTitleFormErrors(errs); return; }
    setTitleSaving(true);
    const payload = {
      name: titleForm.name,
      department_id: titleForm.departmentId || null,
    };
    try {
      if (editingTitle) {
        await api.put(`/job-titles/${editingTitle.id}`, payload);
      } else {
        await api.post('/job-titles', payload);
      }
      setShowTitleModal(false);
      setTitlesMsg({ type: 'success', text: editingTitle ? 'Job title updated.' : 'Job title created.' });
      fetchTitles();
      setTimeout(() => setTitlesMsg({ type: '', text: '' }), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save job title.';
      setTitlesMsg({ type: 'error', text: msg });
    } finally {
      setTitleSaving(false);
    }
  };

  const handleDeleteTitle = async () => {
    if (!titleDeleteConfirm) return;
    try {
      await api.delete(`/job-titles/${titleDeleteConfirm.id}`);
      setTitleDeleteConfirm(null);
      setTitlesMsg({ type: 'success', text: 'Job title deleted.' });
      fetchTitles();
      setTimeout(() => setTitlesMsg({ type: '', text: '' }), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete job title.';
      setTitleDeleteConfirm(null);
      setTitlesMsg({ type: 'error', text: msg });
    }
  };

  const toggleTitleStatus = async (t) => {
    try {
      await api.patch(`/job-titles/${t.id}/toggle`);
      fetchTitles();
    } catch {
      setTitlesMsg({ type: 'error', text: 'Failed to update status.' });
    }
  };

  // ── Departments CRUD ─────────────────────────────────────────────────────────
  const fetchDepartments = async () => {
    setDeptsLoading(true);
    try {
      const res = await api.get('/departments');
      const data = res.data?.data || res.data?.departments || (Array.isArray(res.data) ? res.data : []);
      setDepartments(Array.isArray(data) ? data : []);
    } catch {
      setDeptsMsg({ type: 'error', text: 'Failed to load departments.' });
    } finally {
      setDeptsLoading(false);
    }
  };

  const openCreateDept = () => {
    setEditingDept(null);
    setDeptForm({ name: '', description: '' });
    setDeptFormErrors({});
    setShowDeptModal(true);
  };

  const openEditDept = (d) => {
    setEditingDept(d);
    setDeptForm({ name: d.name || '', description: d.description || '' });
    setDeptFormErrors({});
    setShowDeptModal(true);
  };

  const handleSaveDept = async () => {
    const errs = {};
    if (!deptForm.name.trim()) errs.name = 'Department name is required';
    if (Object.keys(errs).length) { setDeptFormErrors(errs); return; }
    setDeptSaving(true);
    try {
      if (editingDept) {
        await api.put(`/departments/${editingDept.id}`, deptForm);
      } else {
        await api.post('/departments', deptForm);
      }
      setShowDeptModal(false);
      setDeptsMsg({ type: 'success', text: editingDept ? 'Department updated.' : 'Department created.' });
      fetchDepartments();
      setTimeout(() => setDeptsMsg({ type: '', text: '' }), 3000);
    } catch (err) {
      setDeptsMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save department.' });
    } finally {
      setDeptSaving(false);
    }
  };

  const handleDeleteDept = async () => {
    if (!deptDeleteConfirm) return;
    try {
      await api.delete(`/departments/${deptDeleteConfirm.id}`);
      setDeptDeleteConfirm(null);
      setDeptsMsg({ type: 'success', text: 'Department deleted.' });
      fetchDepartments();
      setTimeout(() => setDeptsMsg({ type: '', text: '' }), 3000);
    } catch (err) {
      setDeptDeleteConfirm(null);
      setDeptsMsg({ type: 'error', text: err.response?.data?.message || 'Failed to delete department.' });
    }
  };

  const toggleDeptStatus = async (d) => {
    try {
      await api.patch(`/departments/${d.id}/toggle`);
      fetchDepartments();
    } catch {
      setDeptsMsg({ type: 'error', text: 'Failed to update status.' });
    }
  };

  const openCreateRole = () => {
    setEditingRole(null);
    setRoleForm({ name: '', description: '', permissions: [] });
    setRoleFormErrors({});
    setShowRoleModal(true);
  };

  const openEditRole = (role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name || '',
      description: role.description || '',
      permissions: Array.isArray(role.permissions)
        ? role.permissions.map(p => (typeof p === 'string' ? p : p.slug || p.key || p.name || ''))
        : [],
    });
    setRoleFormErrors({});
    setShowRoleModal(true);
  };

  const toggleRolePermission = (key) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key],
    }));
  };

  const toggleAllInGroup = (group) => {
    const keys = group.permissions.map(p => p.key);
    const allSelected = keys.every(k => roleForm.permissions.includes(k));
    setRoleForm(prev => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter(k => !keys.includes(k))
        : [...new Set([...prev.permissions, ...keys])],
    }));
  };

  const selectAllPermissions = () => {
    const all = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.key));
    setRoleForm(prev => ({ ...prev, permissions: all }));
  };

  const clearAllPermissions = () => {
    setRoleForm(prev => ({ ...prev, permissions: [] }));
  };

  const validateRoleForm = () => {
    const errs = {};
    if (!roleForm.name.trim()) errs.name = 'Role name is required';
    else if (roleForm.name.trim().length > 50) errs.name = 'Role name must be 50 characters or less';
    if (roleForm.permissions.length === 0) errs.permissions = 'Select at least one permission';
    setRoleFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveRole = async () => {
    if (!validateRoleForm()) return;
    setRoleSaving(true);
    try {
      const payload = {
        name: roleForm.name.trim(),
        description: roleForm.description.trim(),
        permissions: roleForm.permissions,
      };
      if (editingRole) {
        const res = await api.put(`/roles/${editingRole.id}`, payload);
        const updated = res.data?.role || res.data?.data || res.data;
        setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, ...updated } : r));
        setRolesMsg({ type: 'success', text: `Role "${payload.name}" updated successfully.` });
      } else {
        const res = await api.post('/roles', payload);
        const created = res.data?.role || res.data?.data || res.data;
        setRoles(prev => [...prev, created]);
        setRolesMsg({ type: 'success', text: `Role "${payload.name}" created successfully.` });
      }
      setShowRoleModal(false);
      setTimeout(() => setRolesMsg({ type: '', text: '' }), 4000);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const mapped = {};
        Object.entries(data.errors).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? v[0] : v;
        });
        if (data.message) mapped.general = data.message;
        setRoleFormErrors(mapped);
      } else {
        setRoleFormErrors({ general: data?.message || 'Failed to save role. Please try again.' });
      }
    } finally {
      setRoleSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!roleDeleteConfirm) return;
    try {
      await api.delete(`/roles/${roleDeleteConfirm.id}`);
      setRoles(prev => prev.filter(r => r.id !== roleDeleteConfirm.id));
      setRolesMsg({ type: 'success', text: `Role "${roleDeleteConfirm.name}" deleted.` });
      setTimeout(() => setRolesMsg({ type: '', text: '' }), 4000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete role.';
      setRolesMsg({ type: 'error', text: msg });
    } finally {
      setRoleDeleteConfirm(null);
    }
  };
  // ────────────────────────────────────────────────────────────────────────────

  // Profile state
  const currentUser = getCurrentUser();
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg({ type: '', text: '' });
    try {
      await api.put('/users/profile', {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
      });
      showSnackbar('Profile updated successfully!', 'success');
    } catch (err) {
      showSnackbar('Failed to update profile.', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showSnackbar('New passwords do not match.', 'error');
      return;
    }
    setPasswordSaving(true);
    setPasswordMsg({ type: '', text: '' });
    try {
      await api.put('/users/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });
      showSnackbar('Password changed successfully!', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const errors = err.response?.data?.errors;
      const msg = errors
        ? Object.values(errors)[0][0]
        : err.response?.data?.message || 'Failed to change password.';
      showSnackbar(msg, 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogoutEverywhere = async () => {
    if (!window.confirm('Sign out from all devices? You will be redirected to login.')) return;
    await apiLogoutEverywhere();
    window.location.href = '/login';
  };
  useEffect(() => {
    if (showRoleModal || roleDeleteConfirm) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [showRoleModal, roleDeleteConfirm]);


  return (
    <Layout>
      <div className="settings-page">
        {SECTION_HEADINGS[activeTab] && (
        <div className="settings-header">
          <div className="header-content">
            <div>
              <h1 className="page-title">{SECTION_HEADINGS[activeTab]?.[0]}</h1>
              <p className="page-subtitle">{SECTION_HEADINGS[activeTab]?.[1]}</p>
            </div>
          </div>
        </div>
        )}
        {/* Roles & Permissions Tab Content */}
        {activeTab === 'roles' && (
          <div className="settings-content">
            {rolesMsg.text && (
              <div className={`settings-msg ${rolesMsg.type}`}>{rolesMsg.text}</div>
            )}
            <div className="roles-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Roles & Permissions</h2>
                  <p className="section-subtitle">Create and manage roles that control what users can access</p>
                </div>
                <button className="btn-add" onClick={openCreateRole}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  New Role
                </button>
              </div>

              {rolesLoading ? (
                <div className="roles-loading">
                  {[1,2,3].map(i => <div key={i} className="role-card-skeleton" />)}
                </div>
              ) : roles.length === 0 ? (
                <div className="roles-empty">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  <p>No roles found. Create your first role.</p>
                  <button className="btn-add" onClick={openCreateRole}>Create Role</button>
                </div>
              ) : (
                <div className="roles-grid">
                  {roles.map(role => {
                    const permCount = Array.isArray(role.permissions) ? role.permissions.length : 0;
                    const isSystem = role.isSystem || role.is_system;
                    const isSA = role.isSuperAdmin || role.is_super_admin;
                    return (
                      <div key={role.id} className={`role-card ${isSA ? 'role-card-superadmin' : ''}`}>
                        <div className="role-card-header">
                          <div className="role-card-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            </svg>
                          </div>
                          <div className="role-card-title">
                            <h3>{role.name}</h3>
                            <div className="role-card-badges">
                              {isSystem && <span className="badge badge-system">System</span>}
                              {isSA && <span className="badge badge-superadmin">Super Admin</span>}
                              {role.usersCount != null && (
                                <span className="badge badge-users">{role.usersCount} user{role.usersCount !== 1 ? 's' : ''}</span>
                              )}
                            </div>
                          </div>
                          <div className="role-card-actions">
                            <button className="icon-btn" onClick={() => openEditRole(role)} title="Edit role">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            {!isSystem && (
                              <button className="icon-btn icon-btn-danger" onClick={() => setRoleDeleteConfirm(role)} title="Delete role">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6"/>
                                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                        {role.description && (
                          <p className="role-card-description">{role.description}</p>
                        )}
                        <div className="role-card-footer">
                          <span className="perm-count">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                            </svg>
                            {isSA ? 'All permissions' : `${permCount} permission${permCount !== 1 ? 's' : ''}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Job Titles Tab Content — 2-panel: dept sidebar + titles list */}
        {activeTab === 'titles' && (
          <div className="settings-content">
            {titlesMsg.text && (
              <div className={`settings-msg ${titlesMsg.type}`}>{titlesMsg.text}</div>
            )}
            <div className="titles-layout">

              {/* LEFT — Department filter sidebar */}
              <div className="titles-sidebar">
                <div className="titles-sidebar-header">
                  <span>Departments</span>
                  <button className="ts-add-dept-btn" onClick={() => setActiveTab('departments')} title="Manage departments">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </div>
                <button
                  className={`ts-dept-item ${selectedDeptFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedDeptFilter('all')}
                >
                  <span className="ts-dept-dot all" />
                  <span className="ts-dept-name">All Titles</span>
                  <span className="ts-dept-count">{jobTitles.length}</span>
                </button>
                {departments.map((d, idx) => {
                  const count = jobTitles.filter(t => (t.departmentId || t.department_id) === d.id).length;
                  const colors = ['#5B21B6','#F97316','#0D9488','#A78BFA','#CA8A04','#DB2777','#0EA5E9','#7C3AED'];
                  const color = colors[idx % colors.length];
                  return (
                    <button
                      key={d.id}
                      className={`ts-dept-item ${selectedDeptFilter === d.id ? 'active' : ''}`}
                      onClick={() => setSelectedDeptFilter(d.id)}
                    >
                      <span className="ts-dept-dot" style={{ background: color }} />
                      <span className="ts-dept-name">{d.name}</span>
                      <span className="ts-dept-count">{count}</span>
                    </button>
                  );
                })}
                <button
                  className={`ts-dept-item ${selectedDeptFilter === 'unassigned' ? 'active' : ''}`}
                  onClick={() => setSelectedDeptFilter('unassigned')}
                >
                  <span className="ts-dept-dot unassigned" />
                  <span className="ts-dept-name">Unassigned</span>
                  <span className="ts-dept-count">{jobTitles.filter(t => !t.departmentId && !t.department_id).length}</span>
                </button>
              </div>

              {/* RIGHT — Titles list */}
              <div className="titles-main">
                <div className="titles-main-header">
                  <div>
                    <h2 className="section-title">
                      {selectedDeptFilter === 'all' ? 'All Job Titles'
                        : selectedDeptFilter === 'unassigned' ? 'Unassigned Titles'
                        : departments.find(d => d.id === selectedDeptFilter)?.name + ' Titles'}
                    </h2>
                    <p className="section-subtitle">
                      {selectedDeptFilter === 'all'
                        ? 'All job titles across every department'
                        : selectedDeptFilter === 'unassigned'
                        ? 'Titles not linked to any department'
                        : `Job titles under ${departments.find(d => d.id === selectedDeptFilter)?.name}`}
                    </p>
                  </div>
                  {canManageTitles && (
                    <button className="btn-add" onClick={() => openCreateTitle(selectedDeptFilter !== 'all' && selectedDeptFilter !== 'unassigned' ? selectedDeptFilter : '')}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Add Title
                    </button>
                  )}
                </div>

                {titlesLoading ? (
                  <div className="roles-loading">{[1,2,3].map(i => <div key={i} className="role-card-skeleton" style={{height:60}} />)}</div>
                ) : (() => {
                  const filtered = jobTitles.filter(t => {
                    if (selectedDeptFilter === 'all') return true;
                    if (selectedDeptFilter === 'unassigned') return !t.departmentId && !t.department_id;
                    return (t.departmentId || t.department_id) === selectedDeptFilter;
                  });

                  if (filtered.length === 0) return (
                    <div className="roles-empty">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
                      </svg>
                      <p>No titles here yet.{canManageTitles ? ' Add your first title.' : ''}</p>
                      {canManageTitles && <button className="btn-add" onClick={() => openCreateTitle(selectedDeptFilter !== 'all' && selectedDeptFilter !== 'unassigned' ? selectedDeptFilter : '')}>Add Title</button>}
                    </div>
                  );

                  // Group by department when showing "all"
                  if (selectedDeptFilter === 'all') {
                    const groups = [];
                    departments.forEach(d => {
                      const dTitles = filtered.filter(t => (t.departmentId || t.department_id) === d.id);
                      if (dTitles.length) groups.push({ dept: d, titles: dTitles });
                    });
                    const unassigned = filtered.filter(t => !t.departmentId && !t.department_id);
                    if (unassigned.length) groups.push({ dept: null, titles: unassigned });

                    return (
                      <div className="titles-groups">
                        {groups.map((g, gi) => (
                          <div key={g.dept?.id ?? 'unassigned'} className="titles-group">
                            <div className="titles-group-header">
                              <div className="titles-group-badge" style={{ background: g.dept ? ['#ede9fe','#e0f2fe','#dcfce7','#fef3c7','#fce7f3','#f3e8ff','#ccfbf1','#ffedd5'][gi % 8] : '#f3f4f6' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: g.dept ? ['#7c3aed','#0284c7','#16a34a','#d97706','#db2777','#7c3aed','#0d9488','#ea580c'][gi % 8] : '#9ca3af' }}>
                                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                                </svg>
                              </div>
                              <span className="titles-group-name">{g.dept?.name ?? 'Unassigned'}</span>
                              <span className="titles-group-count">{g.titles.length} title{g.titles.length !== 1 ? 's' : ''}</span>
                              {canManageTitles && (
                                <button className="titles-group-add" onClick={() => openCreateTitle(g.dept?.id || '')} title="Add title to this department">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                </button>
                              )}
                            </div>
                            <div className="titles-group-list">
                              {g.titles.map(t => <TitleRow key={t.id} t={t} onEdit={openEditTitle} onDelete={setTitleDeleteConfirm} onToggle={toggleTitleStatus} canManage={canManageTitles} />)}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  return (
                    <div className="titles-group-list standalone">
                      {filtered.map(t => <TitleRow key={t.id} t={t} onEdit={openEditTitle} onDelete={setTitleDeleteConfirm} onToggle={toggleTitleStatus} canManage={canManageTitles} />)}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Departments Tab Content */}
        {activeTab === 'departments' && (
          <div className="settings-content">
            {deptsMsg.text && (
              <div className={`settings-msg ${deptsMsg.type}`}>{deptsMsg.text}</div>
            )}
            <div className="roles-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Departments</h2>
                  <p className="section-subtitle">Each department can have many job titles linked to it</p>
                </div>
                {canManageDepts && (
                  <button className="btn-add" onClick={openCreateDept}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add Department
                  </button>
                )}
              </div>

              {deptsLoading ? (
                <div className="roles-loading">{[1,2,3,4].map(i => <div key={i} className="role-card-skeleton" />)}</div>
              ) : departments.length === 0 ? (
                <div className="roles-empty">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  <p>No departments yet.{canManageDepts ? ' Add your first department.' : ''}</p>
                  {canManageDepts && <button className="btn-add" onClick={openCreateDept}>Add Department</button>}
                </div>
              ) : (
                <div className="dept-cards">
                  {departments.map((d, idx) => {
                    const active = d.isActive !== false && d.is_active !== false;
                    const titleCount = jobTitles.filter(t => (t.departmentId || t.department_id) === d.id).length;
                    const colors = ['#5B21B6','#F97316','#0D9488','#A78BFA','#CA8A04','#DB2777','#0EA5E9','#7C3AED'];
                    const bgColors = ['#ede9fe','#e0f2fe','#dcfce7','#fef3c7','#fce7f3','#f3e8ff','#ccfbf1','#ffedd5'];
                    const color = colors[idx % colors.length];
                    const bg = bgColors[idx % bgColors.length];
                    return (
                      <div key={d.id} className={`dept-card ${!active ? 'inactive' : ''}`}>
                        <div className="dept-card-icon" style={{ background: bg, borderColor: color + '40' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color }}>
                            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                            <polyline points="9 22 9 12 15 12 15 22"/>
                          </svg>
                        </div>
                        <div className="dept-card-body">
                          <span className="dept-card-name">{d.name}</span>
                          {d.description && <span className="dept-card-desc">{d.description}</span>}
                        </div>
                        <div className="dept-card-titles-row">
                          <span className="dept-titles-badge" style={{ background: bg, color }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
                            {titleCount} title{titleCount !== 1 ? 's' : ''}
                          </span>
                          <button
                            className="dept-view-titles-btn"
                            onClick={() => { setSelectedDeptFilter(d.id); fetchTitles(); setActiveTab('titles'); }}
                          >
                            View Titles →
                          </button>
                        </div>
                        <div className="dept-card-footer">
                          {canManageDepts && (
                            <button
                              className={`status-toggle ${active ? 'active' : 'inactive'}`}
                              onClick={() => toggleDeptStatus(d)}
                            >
                              {active ? 'Active' : 'Inactive'}
                            </button>
                          )}
                          {canManageDepts && (
                            <div className="dept-card-actions">
                              <button className="action-btn edit" onClick={() => openEditDept(d)} title="Edit">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                              </button>
                              <button className="action-btn delete" onClick={() => setDeptDeleteConfirm(d)} title="Delete">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6"/>
                                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Company Settings Tab Content */}
        {activeTab === 'company' && (
          <div className="settings-content">
            <div className="general-section">
              <div className="setting-card">
                <div className="setting-header">
                  <div className="setting-icon"><Building2 size={18} /></div>
                  <div>
                    <h3>Company Branding</h3>
                    <p>Name, logo, and tagline shown on login screen and throughout the app</p>
                  </div>
                </div>
                <div className="setting-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label>Company Name <span style={{ color: 'var(--error-500)' }}>*</span></label>
                      <input
                        type="text"
                        value={companyForm.companyName}
                        onChange={e => setCompanyForm(f => ({ ...f, companyName: e.target.value }))}
                        placeholder="e.g. Acme Corp"
                      />
                    </div>
                    <div className="form-group">
                      <label>Short Name / Initials</label>
                      <input
                        type="text"
                        value={companyForm.companyShortName}
                        onChange={e => setCompanyForm(f => ({ ...f, companyShortName: e.target.value }))}
                        placeholder="e.g. AC"
                        maxLength={4}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Tagline</label>
                    <input
                      type="text"
                      value={companyForm.tagline}
                      onChange={e => setCompanyForm(f => ({ ...f, tagline: e.target.value }))}
                      placeholder="e.g. Complete financial control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Logo URL</label>
                    <input
                      type="url"
                      value={companyForm.logoUrl}
                      onChange={e => setCompanyForm(f => ({ ...f, logoUrl: e.target.value }))}
                      placeholder="https://example.com/logo.png"
                    />
                    {companyForm.logoUrl && (
                      <div style={{ marginTop: 8 }}>
                        <img
                          src={companyForm.logoUrl}
                          alt="Logo preview"
                          style={{ maxHeight: 48, maxWidth: 180, objectFit: 'contain', borderRadius: 6, border: '1px solid var(--neutral-200)', padding: 4 }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="setting-card">
                <div className="setting-header">
                  <div className="setting-icon"><Phone size={18} /></div>
                  <div>
                    <h3>Contact Details</h3>
                    <p>Displayed on the footer and login screen</p>
                  </div>
                </div>
                <div className="setting-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="tel"
                        value={companyForm.phone}
                        onChange={e => setCompanyForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="e.g. +91 98765 43210"
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={companyForm.email}
                        onChange={e => setCompanyForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="e.g. info@company.com"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Website</label>
                    <input
                      type="url"
                      value={companyForm.website}
                      onChange={e => setCompanyForm(f => ({ ...f, website: e.target.value }))}
                      placeholder="e.g. https://www.company.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <textarea
                      value={companyForm.address}
                      onChange={e => setCompanyForm(f => ({ ...f, address: e.target.value }))}
                      placeholder="e.g. 123 Main Street, City, State, PIN"
                      rows={3}
                      style={{ resize: 'vertical', minHeight: 60 }}
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="setting-card">
                <div className="setting-header">
                  <div className="setting-icon"><Eye size={18} /></div>
                  <div>
                    <h3>Preview</h3>
                    <p>How your company info will appear in the app</p>
                  </div>
                </div>
                <div className="setting-body" style={{ background: 'var(--neutral-50)', borderRadius: 8, padding: 20, textAlign: 'center' }}>
                  {companyForm.logoUrl ? (
                    <img src={companyForm.logoUrl} alt="" style={{ maxHeight: 40, maxWidth: 120, objectFit: 'contain', marginBottom: 8 }} onError={e => { e.target.style.display = 'none'; }} />
                  ) : (
                    <div style={{ width: 48, height: 48, background: 'var(--primary-600)', borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
                      {companyForm.companyShortName || 'LC'}
                    </div>
                  )}
                  <div style={{ fontWeight: 600, fontSize: 18, color: 'var(--neutral-900)', marginBottom: 2 }}>
                    {companyForm.companyName || 'Company Name'}
                  </div>
                  {companyForm.tagline && <div style={{ fontSize: 13, color: 'var(--neutral-500)', marginBottom: 6 }}>{companyForm.tagline}</div>}
                  <div style={{ fontSize: 12, color: 'var(--neutral-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {companyForm.phone && <span>{companyForm.phone}</span>}
                    {companyForm.email && <span>{companyForm.email}</span>}
                  </div>
                  {companyForm.address && <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>{companyForm.address}</div>}
                </div>
              </div>

              {/* Save Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn-primary" onClick={handleSaveCompany} disabled={companySaving} style={{ minWidth: 160 }}>
                  {companySaving ? <><span className="spinner" /> Saving...</> : 'Save Company Settings'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab Content */}
        {activeTab === 'notifications' && (
          <div className="settings-content">
            <div className="general-section">
              <div className="setting-card">
                <div className="setting-header">
                  <div className="setting-icon"><Mail size={18} /></div>
                  <div>
                    <h3>Email Notifications</h3>
                    <p>Configure email alerts</p>
                  </div>
                </div>
                <div className="setting-body">
                  <div className="toggle-setting">
                    <span>Invoice due reminders</span>
                    <input type="checkbox" defaultChecked className="checkbox-toggle" />
                  </div>
                  <div className="toggle-setting">
                    <span>Overdue bill alerts</span>
                    <input type="checkbox" defaultChecked className="checkbox-toggle" />
                  </div>
                  <div className="toggle-setting">
                    <span>Weekly summary</span>
                    <input type="checkbox" className="checkbox-toggle" />
                  </div>
                </div>
              </div>

              <div className="setting-card">
                <div className="setting-header">
                  <div className="setting-icon"><Bell size={18} /></div>
                  <div>
                    <h3>Push Notifications</h3>
                    <p>Browser and mobile alerts</p>
                  </div>
                </div>
                <div className="setting-body">
                  <div className="toggle-setting">
                    <span>Enable push notifications</span>
                    <input type="checkbox" defaultChecked className="checkbox-toggle" />
                  </div>
                  <div className="toggle-setting">
                    <span>Sound alerts</span>
                    <input type="checkbox" className="checkbox-toggle" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab Content */}
        {activeTab === 'profile' && (
          <div className="settings-content">
            <div className="general-section">
              <div className="setting-card">
                <div className="setting-header">
                  <div className="setting-icon"><UserRound size={18} /></div>
                  <div>
                    <h3>Personal Information</h3>
                    <p>Update your name, email, and phone number</p>
                  </div>
                </div>
                <form className="setting-body" onSubmit={handleProfileSave}>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className="setting-actions">
                    <button type="submit" className="btn-save" disabled={profileSaving}>
                      {profileSaving ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab Content */}
        {activeTab === 'security' && (
          <div className="settings-content">
            <div className="general-section">
              <div className="setting-card">
                <div className="setting-header">
                  <div className="setting-icon"><Lock size={18} /></div>
                  <div>
                    <h3>Change Password</h3>
                    <p>Update your login password</p>
                  </div>
                </div>
                <form className="setting-body" onSubmit={handlePasswordChange}>
                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Minimum 8 characters"
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="setting-actions">
                    <button type="submit" className="btn-save" disabled={passwordSaving}>
                      {passwordSaving ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="setting-card">
                <div className="setting-header">
                  <div className="setting-icon"><LogOut size={18} /></div>
                  <div>
                    <h3>Sign Out Everywhere</h3>
                    <p>Revoke all active sessions across all devices</p>
                  </div>
                </div>
                <div className="setting-body">
                  <p className="setting-description">This will log you out from all browsers and devices where you are currently signed in.</p>
                  <div className="setting-actions">
                    <button type="button" className="btn-danger-outline" onClick={handleLogoutEverywhere}>
                      Sign Out All Devices
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Role Create / Edit Modal */}
      {showRoleModal && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="role-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-content">
                <div className="header-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <div>
                  <h2>{editingRole ? 'Edit Role' : 'Create New Role'}</h2>
                  <p>{editingRole ? `Update permissions for "${editingRole.name}"` : 'Define a new role with specific permissions'}</p>
                </div>
              </div>
              <button className="close-btn" onClick={() => setShowRoleModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="modal-body role-modal-body">
              {roleFormErrors.general && (
                <div className="form-error-banner">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {roleFormErrors.general}
                </div>
              )}

              {/* Basic Info */}
              <div className="form-section">
                <h3 className="section-title">Role Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Role Name <span className="required">*</span></label>
                    <input
                      type="text"
                      value={roleForm.name}
                      onChange={e => { setRoleForm(f => ({ ...f, name: e.target.value })); setRoleFormErrors(errs => ({ ...errs, name: '' })); }}
                      placeholder="e.g. Team Lead, Support Agent"
                      className={roleFormErrors.name ? 'error' : ''}
                      disabled={editingRole?.isSystem || editingRole?.is_system}
                    />
                    {roleFormErrors.name && <span className="error-text">{roleFormErrors.name}</span>}
                    {(editingRole?.isSystem || editingRole?.is_system) && (
                      <span className="field-hint">System role names cannot be changed</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      value={roleForm.description}
                      onChange={e => setRoleForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Briefly describe what this role can do"
                    />
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="form-section">
                <div className="perm-section-header">
                  <div>
                    <h3 className="section-title">Permissions <span className="required">*</span></h3>
                    <p className="section-hint">{roleForm.permissions.length} of {PERMISSION_GROUPS.reduce((s, g) => s + g.permissions.length, 0)} selected</p>
                  </div>
                  <div className="perm-bulk-actions">
                    <button type="button" className="btn-text" onClick={selectAllPermissions}>Select All</button>
                    <button type="button" className="btn-text btn-text-muted" onClick={clearAllPermissions}>Clear All</button>
                  </div>
                </div>
                {roleFormErrors.permissions && (
                  <span className="error-text">{roleFormErrors.permissions}</span>
                )}
                <div className="perm-groups">
                  {PERMISSION_GROUPS.map(group => {
                    const keys = group.permissions.map(p => p.key);
                    const selectedCount = keys.filter(k => roleForm.permissions.includes(k)).length;
                    const allSelected = selectedCount === keys.length;
                    const someSelected = selectedCount > 0 && !allSelected;
                    return (
                      <div key={group.category} className="perm-group">
                        <div className="perm-group-header">
                          <label className="perm-group-toggle">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={el => { if (el) el.indeterminate = someSelected; }}
                              onChange={() => toggleAllInGroup(group)}
                            />
                            <span className="perm-group-name">{group.category}</span>
                          </label>
                          <span className="perm-group-count">{selectedCount}/{keys.length}</span>
                        </div>
                        <div className="perm-list">
                          {group.permissions.map(perm => (
                            <label key={perm.key} className={`perm-item ${roleForm.permissions.includes(perm.key) ? 'checked' : ''}`}>
                              <input
                                type="checkbox"
                                checked={roleForm.permissions.includes(perm.key)}
                                onChange={() => toggleRolePermission(perm.key)}
                              />
                              <div className="perm-item-info">
                                <span className="perm-label">{perm.label}</span>
                                <span className="perm-desc">{perm.description}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowRoleModal(false)}>Cancel</button>
              <button type="button" className="btn-primary" onClick={handleSaveRole} disabled={roleSaving}>
                {roleSaving ? (
                  <><span className="spinner"></span>{editingRole ? 'Saving...' : 'Creating...'}</>
                ) : (
                  <>{editingRole ? 'Save Changes' : 'Create Role'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Delete Confirm Modal */}
      {roleDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setRoleDeleteConfirm(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon delete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </div>
            <h3>Delete Role?</h3>
            <p>Are you sure you want to delete the <strong>{roleDeleteConfirm.name}</strong> role? Users assigned to this role will lose their permissions.</p>
            <div className="confirm-actions">
              <button className="btn-secondary" onClick={() => setRoleDeleteConfirm(null)}>Cancel</button>
              <button className="btn-primary btn-danger" onClick={handleDeleteRole}>Delete Role</button>
            </div>
          </div>
        </div>
      )}

      {/* Job Title Add/Edit Modal */}
      {showTitleModal && (
        <div className="modal-overlay" onClick={() => setShowTitleModal(false)}>
          <div className="role-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div className="header-content">
                <div className="header-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
                  </svg>
                </div>
                <div>
                  <h2>{editingTitle ? 'Edit Job Title' : 'Add Job Title'}</h2>
                  <p>{editingTitle ? 'Update job title details' : 'Create a new job title and link it to a department'}</p>
                </div>
              </div>
              <button className="close-btn" onClick={() => setShowTitleModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="modal-body" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Title Name */}
              <div className="form-group">
                <label style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--neutral-700)', marginBottom:6 }}>
                  Title Name <span style={{ color: 'var(--error-500)' }}>*</span>
                </label>
                <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
                  <svg style={{ position:'absolute', left:11, width:15, height:15, color:'var(--neutral-400)', pointerEvents:'none' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
                  </svg>
                  <input
                    type="text"
                    value={titleForm.name}
                    onChange={e => { setTitleForm(p => ({ ...p, name: e.target.value })); setTitleFormErrors(p => ({ ...p, name: '' })); }}
                    placeholder="e.g., Sales Representative"
                    autoFocus
                    style={{ width:'100%', padding:'10px 12px 10px 34px', border:`1.5px solid ${titleFormErrors.name ? 'var(--error-400)' : 'var(--neutral-300)'}`, borderRadius:8, fontSize:14, outline:'none' }}
                  />
                </div>
                {titleFormErrors.name && <span className="error-text">{titleFormErrors.name}</span>}
              </div>

              {/* Department — FK picker */}
              <div className="form-group">
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <label style={{ fontSize:13, fontWeight:500, color:'var(--neutral-700)', margin:0 }}>
                    Department <span style={{ fontSize:11, color:'var(--neutral-400)', fontWeight:400 }}>(optional)</span>
                  </label>
                  <button
                    type="button"
                    style={{ fontSize:11, color:'var(--primary-600)', background:'none', border:'none', cursor:'pointer', textDecoration:'underline', padding:0 }}
                    onClick={() => { setShowTitleModal(false); setActiveTab('departments'); openCreateDept(); }}
                  >
                    + New Department
                  </button>
                </div>
                {departments.length === 0 ? (
                  <div style={{ padding:'12px 14px', background:'var(--neutral-50)', border:'1.5px dashed var(--neutral-300)', borderRadius:8, fontSize:13, color:'var(--neutral-500)', textAlign:'center' }}>
                    No departments yet.{' '}
                    <button type="button" style={{ color:'var(--primary-600)', background:'none', border:'none', cursor:'pointer', textDecoration:'underline', padding:0 }}
                      onClick={() => { setShowTitleModal(false); setActiveTab('departments'); openCreateDept(); }}>
                      Create one first
                    </button>
                  </div>
                ) : (
                  <div className="dept-picker-grid">
                    {/* None option */}
                    <button
                      type="button"
                      className={`dept-picker-item ${!titleForm.departmentId ? 'selected' : ''}`}
                      onClick={() => setTitleForm(p => ({ ...p, departmentId: '', departmentName: '' }))}
                    >
                      <span className="dept-picker-dot" style={{ background:'var(--neutral-300)' }} />
                      <span className="dept-picker-name">None</span>
                      {!titleForm.departmentId && <svg className="dept-picker-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    </button>
                    {departments.map((d, idx) => {
                      const colors = ['#5B21B6','#F97316','#0D9488','#A78BFA','#CA8A04','#DB2777','#0EA5E9','#7C3AED'];
                      const color = colors[idx % colors.length];
                      const sel = titleForm.departmentId === d.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          className={`dept-picker-item ${sel ? 'selected' : ''}`}
                          style={sel ? { borderColor: color, background: color + '12' } : {}}
                          onClick={() => setTitleForm(p => ({ ...p, departmentId: d.id, departmentName: d.name }))}
                        >
                          <span className="dept-picker-dot" style={{ background: color }} />
                          <span className="dept-picker-name">{d.name}</span>
                          {sel && <svg className="dept-picker-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ color }}><polyline points="20 6 9 17 4 12"/></svg>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowTitleModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveTitle} disabled={titleSaving}>
                {titleSaving ? <><span className="spinner"></span>{editingTitle ? 'Saving...' : 'Creating...'}</> : (editingTitle ? 'Save Changes' : 'Add Title')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Title Delete Confirm Modal */}
      {titleDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setTitleDeleteConfirm(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon delete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </div>
            <h3>Delete Job Title?</h3>
            <p>Are you sure you want to delete <strong>"{titleDeleteConfirm.name}"</strong>? Users currently assigned this title will keep it until manually changed.</p>
            <div className="confirm-actions">
              <button className="btn-secondary" onClick={() => setTitleDeleteConfirm(null)}>Cancel</button>
              <button className="btn-primary btn-danger" onClick={handleDeleteTitle}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Department Add/Edit Modal */}
      {showDeptModal && (
        <div className="modal-overlay" onClick={() => setShowDeptModal(false)}>
          <div className="role-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <div className="header-content">
                <div className="header-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <div>
                  <h2>{editingDept ? 'Edit Department' : 'Add Department'}</h2>
                  <p>{editingDept ? 'Update department details' : 'Create a new department'}</p>
                </div>
              </div>
              <button className="close-btn" onClick={() => setShowDeptModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="modal-body" style={{ padding: '24px 28px' }}>
              <div className="form-group">
                <label>Department Name <span style={{ color: 'var(--error-500)' }}>*</span></label>
                <input
                  type="text"
                  value={deptForm.name}
                  onChange={e => { setDeptForm(p => ({ ...p, name: e.target.value })); setDeptFormErrors(p => ({ ...p, name: '' })); }}
                  placeholder="e.g., Sales, Marketing, Operations"
                  className={deptFormErrors.name ? 'error' : ''}
                  style={{ width: '100%', padding: '10px 12px', border: `1px solid ${deptFormErrors.name ? 'var(--error-400)' : 'var(--neutral-300)'}`, borderRadius: 8, fontSize: 14, outline: 'none' }}
                />
                {deptFormErrors.name && <span className="error-text">{deptFormErrors.name}</span>}
              </div>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label>Description <span style={{ fontSize: 12, color: 'var(--neutral-400)', fontWeight: 400 }}>(optional)</span></label>
                <textarea
                  value={deptForm.description}
                  onChange={e => setDeptForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description of this department's function"
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--neutral-300)', borderRadius: 8, fontSize: 14, resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDeptModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveDept} disabled={deptSaving}>
                {deptSaving
                  ? <><span className="spinner"></span>{editingDept ? 'Saving...' : 'Creating...'}</>
                  : (editingDept ? 'Save Changes' : 'Add Department')
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Delete Confirm Modal */}
      {deptDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeptDeleteConfirm(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon delete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </div>
            <h3>Delete Department?</h3>
            <p>Are you sure you want to delete <strong>"{deptDeleteConfirm.name}"</strong>? Job titles linked to this department will not be deleted but will lose the department reference.</p>
            <div className="confirm-actions">
              <button className="btn-secondary" onClick={() => setDeptDeleteConfirm(null)}>Cancel</button>
              <button className="btn-primary btn-danger" onClick={handleDeleteDept}>Delete</button>
            </div>
          </div>
        </div>
      )}


    </Layout>
  );
}

export default Settings;

