// UserModal Component - Add/Edit User Modal
// Professional form for creating and editing user accounts
import { useState, useEffect } from 'react';
import api from '../utils/api';
import '../styles/UserModal.css';
import '../styles/Modal.css';

// Role icon map — keyed by lowercase role name fragments
const ROLE_ICONS = {
  admin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  super: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  manager: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  sales: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  default: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
};

// Role color themes — keyed by lowercase role name fragments
const ROLE_COLORS = {
  admin:   { bg: '#fef3c7', icon: '#d97706', border: '#fbbf24', badge: '#92400e' },
  super:   { bg: '#ede9fe', icon: '#7c3aed', border: '#a78bfa', badge: '#4c1d95' },
  manager: { bg: '#dbeafe', icon: '#2563eb', border: '#93c5fd', badge: '#1e3a8a' },
  sales:   { bg: '#dcfce7', icon: '#16a34a', border: '#86efac', badge: '#14532d' },
  default: { bg: '#f1f5f9', icon: '#64748b', border: '#cbd5e1', badge: '#334155' },
};

function getRoleTheme(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('super')) return ROLE_COLORS.super;
  if (lower.includes('admin'))   return ROLE_COLORS.admin;
  if (lower.includes('manager')) return ROLE_COLORS.manager;
  if (lower.includes('sales'))   return ROLE_COLORS.sales;
  return ROLE_COLORS.default;
}

function getRoleIcon(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('super')) return ROLE_ICONS.super;
  if (lower.includes('admin'))   return ROLE_ICONS.admin;
  if (lower.includes('manager')) return ROLE_ICONS.manager;
  if (lower.includes('sales'))   return ROLE_ICONS.sales;
  return ROLE_ICONS.default;
}




function UserModal({ user, onSave, onClose }) {
  const isEditing = !!user;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Sales Agent',
    departmentId: '',   // FK → departments.id
    departmentName: '', // display only
    titleId: '',        // FK → job_titles.id
    titleName: '',      // display only
    status: 'Active',
    password: '',
    passwordConfirmation: '',
    sendInvite: true
  });

  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);       // titles for selected dept
  const [titlesLoading, setTitlesLoading] = useState(false);
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const [titleDropdownOpen, setTitleDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Fetch roles on mount ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadRoles() {
      try {
        const res = await api.get('/roles');
        const data = res.data?.roles || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setRoles(data.filter(r => r.isActive !== false && r.is_active !== false));
          setFormData(prev => ({ ...prev, role: prev.role || data[0]?.name || '' }));
        }
      } catch {
        if (!cancelled) {
          setRoles([
            { id: 1, name: 'Admin', description: 'Full system access and user management' },
            { id: 2, name: 'Manager', description: 'Team oversight and reporting access' },
            { id: 3, name: 'Sales Agent', description: 'Own leads and basic operations' },
          ]);
        }
      } finally {
        if (!cancelled) setRolesLoading(false);
      }
    }
    loadRoles();
    return () => { cancelled = true; };
  }, []);

  // ── Fetch departments on mount ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadDepartments() {
      try {
        const res = await api.get('/departments');
        const data = res.data?.data || res.data?.departments || (Array.isArray(res.data) ? res.data : []);
        if (!cancelled && Array.isArray(data)) {
          setDepartments(data.filter(d => d.isActive !== false && d.is_active !== false));
        }
      } catch {
        if (!cancelled) {
          setDepartments([
            { id: 1, name: 'Sales' },
            { id: 2, name: 'Marketing' },
            { id: 3, name: 'Operations' },
            { id: 4, name: 'Customer Success' },
            { id: 5, name: 'Business Development' },
            { id: 6, name: 'Finance' },
            { id: 7, name: 'Human Resources' },
            { id: 8, name: 'Technology' },
          ]);
        }
      }
    }
    loadDepartments();
    return () => { cancelled = true; };
  }, []);

  // ── Fetch job titles whenever department changes ────────────────────────────
  useEffect(() => {
    if (!formData.departmentId) {
      setJobTitles([]);
      return;
    }
    let cancelled = false;
    setTitlesLoading(true);
    async function loadTitles() {
      try {
        const res = await api.get(`/job-titles?department_id=${formData.departmentId}`);
        const data = res.data?.data || res.data?.jobTitles || (Array.isArray(res.data) ? res.data : []);
        if (!cancelled) {
          setJobTitles(Array.isArray(data) ? data.filter(t => t.isActive !== false && t.is_active !== false) : []);
        }
      } catch {
        if (!cancelled) setJobTitles([]);
      } finally {
        if (!cancelled) setTitlesLoading(false);
      }
    }
    loadTitles();
    return () => { cancelled = true; };
  }, [formData.departmentId]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'Sales Agent',
        departmentId: user.departmentId || user.department_id || '',
        departmentName: user.departmentName || user.department || '',
        titleId: user.titleId || user.title_id || '',
        titleName: user.titleName || (user.title && user.title !== '-' ? user.title : ''),
        status: user.status || 'Active',
        password: '',
        passwordConfirmation: '',
        sendInvite: false
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (formData.phone && !/^[+\d\s()-]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (!formData.role) newErrors.role = 'Please select a role';
    if (!isEditing) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (formData.password !== formData.passwordConfirmation) {
        newErrors.passwordConfirmation = 'Passwords do not match';
      }
    } else if (formData.password) {
      // Optional password change during edit
      if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (formData.password !== formData.passwordConfirmation) {
        newErrors.passwordConfirmation = 'Passwords do not match';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      // Prepare payload according to API spec
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        status: formData.status,
        department_id: formData.departmentId || null,
        title_id: formData.titleId || null,
      };

      // Include password only when creating or when explicitly changed during edit
      if (!isEditing) {
        payload.password = formData.password;
        payload.passwordConfirmation = formData.passwordConfirmation;
        payload.sendInvite = formData.sendInvite;
      } else if (formData.password) {
        // Allow optional password change during edit
        payload.password = formData.password;
        payload.passwordConfirmation = formData.passwordConfirmation;
      }

      let response;
      if (isEditing) {
        // Update existing user
        response = await api.put(`/users/${user.id}`, payload);
      } else {
        // Create new user
        response = await api.post('/users', payload);
      }

      // Unwrap response: Laravel may return { user: {...} } or { data: {...} } or plain {...}
      // Note: api interceptor already converts snake_case → camelCase
      const raw = response.data;
      const userData = raw?.user || raw?.data || (raw?.id ? raw : raw);
      onSave(userData);
    } catch (err) {
      console.error('Failed to save user:', err);
      const responseData = err.response?.data;

      if (responseData?.errors) {
        // Map field-level errors from backend onto form fields
        const backendErrors = {};
        Object.keys(responseData.errors).forEach(key => {
          backendErrors[key] = Array.isArray(responseData.errors[key])
            ? responseData.errors[key][0]
            : responseData.errors[key];
        });
        // Also set a general banner with the top-level message if present
        if (responseData.message) {
          backendErrors.general = responseData.message;
        }
        setErrors(backendErrors);
      } else {
        setErrors({ general: responseData?.message || 'Failed to save user. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  return (
    <div className="modal-overlay">
      <div className="user-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-content">
            <div className="header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>
            <div>
              <h2>{isEditing ? 'Edit User' : 'Add New User'}</h2>
              <p>{isEditing ? 'Update user information and settings' : 'Create a new team member account'}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* General error banner — shown for both field errors and general failures */}
          {errors.general && (
            <div className="form-error-banner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {errors.general}
            </div>
          )}

          <div className="form-section">
            <h3 className="section-title">Basic Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name <span className="required">*</span></label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Enter full name" className={errors.name ? 'error' : ''} />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address <span className="required">*</span></label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email address" className={errors.email ? 'error' : ''} />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" className={errors.phone ? 'error' : ''} />
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>
            </div>

            {/* Department → Job Title (sequential, dependent) */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="department">Department</label>
                <div className="title-combobox">
                  <div className="title-input-wrap">
                    <svg className="title-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    <input
                      type="text"
                      id="department"
                      value={formData.departmentName}
                      onChange={e => setFormData(p => ({ ...p, departmentName: e.target.value, departmentId: '', titleId: '', titleName: '' }))}
                      onFocus={() => setDeptDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setDeptDropdownOpen(false), 150)}
                      placeholder="Select a department"
                      autoComplete="off"
                    />
                    {formData.departmentId && (
                      <button type="button" className="title-clear-btn"
                        onMouseDown={e => { e.preventDefault(); setFormData(p => ({ ...p, departmentId: '', departmentName: '', titleId: '', titleName: '' })); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    )}
                  </div>
                  {deptDropdownOpen && (
                    <div className="title-dropdown">
                      {departments
                        .filter(d => !formData.departmentName || d.name.toLowerCase().includes(formData.departmentName.toLowerCase()))
                        .length === 0 ? (
                          <div className="title-dropdown-empty"><span>No departments found</span></div>
                        ) : (
                          departments
                            .filter(d => !formData.departmentName || d.name.toLowerCase().includes(formData.departmentName.toLowerCase()))
                            .map(d => (
                              <button key={d.id} type="button"
                                className={`title-dropdown-item ${formData.departmentId === d.id ? 'active' : ''}`}
                                onMouseDown={() => {
                                  setFormData(p => ({ ...p, departmentId: d.id, departmentName: d.name, titleId: '', titleName: '' }));
                                  setDeptDropdownOpen(false);
                                }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                                </svg>
                                {d.name}
                                {formData.departmentId === d.id && (
                                  <svg className="title-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                )}
                              </button>
                            ))
                        )
                      }
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="title">
                  Job Title
                  {!formData.departmentId && <span className="field-hint-inline"> — select a department first</span>}
                </label>
                <div className={`title-combobox ${!formData.departmentId ? 'combobox-disabled' : ''}`}>
                  <div className="title-input-wrap">
                    <svg className="title-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
                    </svg>
                    <input
                      type="text"
                      id="title"
                      value={formData.titleName}
                      onChange={e => setFormData(p => ({ ...p, titleName: e.target.value, titleId: '' }))}
                      onFocus={() => formData.departmentId && setTitleDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setTitleDropdownOpen(false), 150)}
                      placeholder={formData.departmentId ? 'Select a job title' : 'Select department first'}
                      autoComplete="off"
                      disabled={!formData.departmentId}
                    />
                    {titlesLoading && formData.departmentId && (
                      <span className="title-loading-dot" />
                    )}
                    {formData.titleId && !titlesLoading && (
                      <button type="button" className="title-clear-btn"
                        onMouseDown={e => { e.preventDefault(); setFormData(p => ({ ...p, titleId: '', titleName: '' })); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    )}
                  </div>
                  {titleDropdownOpen && formData.departmentId && (
                    <div className="title-dropdown">
                      {titlesLoading ? (
                        <div className="title-dropdown-loading">
                          <span className="title-loading-dot" />
                          <span>Loading titles...</span>
                        </div>
                      ) : jobTitles.filter(t => !formData.titleName || t.name.toLowerCase().includes(formData.titleName.toLowerCase())).length === 0 ? (
                        <div className="title-dropdown-empty">
                          <span>No titles in this department yet</span>
                        </div>
                      ) : (
                        jobTitles
                          .filter(t => !formData.titleName || t.name.toLowerCase().includes(formData.titleName.toLowerCase()))
                          .map(t => (
                            <button key={t.id} type="button"
                              className={`title-dropdown-item ${formData.titleId === t.id ? 'active' : ''}`}
                              onMouseDown={() => { setFormData(p => ({ ...p, titleId: t.id, titleName: t.name })); setTitleDropdownOpen(false); }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
                              </svg>
                              {t.name}
                              {formData.titleId === t.id && (
                                <svg className="title-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                              )}
                            </button>
                          ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Password section — only shown when creating a new user */}
          {!isEditing && (
            <div className="form-section">
              <h3 className="section-title">Set Password</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Password <span className="required">*</span></label>
                  <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} placeholder="Minimum 8 characters" className={errors.password ? 'error' : ''} />
                  {errors.password && <span className="error-text">{errors.password}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="passwordConfirmation">Confirm Password <span className="required">*</span></label>
                  <input type="password" id="passwordConfirmation" name="passwordConfirmation" value={formData.passwordConfirmation} onChange={handleChange} placeholder="Repeat password" className={errors.passwordConfirmation ? 'error' : ''} />
                  {errors.passwordConfirmation && <span className="error-text">{errors.passwordConfirmation}</span>}
                </div>
              </div>
            </div>
          )}

          <div className="form-section">
            <h3 className="section-title">Role & Status</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select id="status" name="status" value={formData.status} onChange={handleChange}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Role <span className="required">*</span></label>
              {rolesLoading ? (
                <div className="role-cards-loading">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="role-card-skeleton" />
                  ))}
                </div>
              ) : (
                <div className="role-cards">
                  {roles.map(role => {
                    const theme = getRoleTheme(role.name);
                    const icon  = getRoleIcon(role.name);
                    const selected = formData.role === role.name;
                    return (
                      <label
                        key={role.id ?? role.name}
                        className={`role-card ${selected ? 'selected' : ''}`}
                        style={selected ? {
                          borderColor: theme.border,
                          background: theme.bg,
                          '--role-icon-color': theme.icon,
                        } : { '--role-icon-color': theme.icon }}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={role.name}
                          checked={selected}
                          onChange={handleChange}
                        />
                        <div className="role-card-icon" style={{ background: selected ? theme.bg : '#f8fafc', borderColor: selected ? theme.border : '#e2e8f0' }}>
                          {icon}
                        </div>
                        <div className="role-card-body">
                          <span className="role-card-name">{role.name}</span>
                          {role.description && (
                            <span className="role-card-desc">{role.description}</span>
                          )}
                        </div>
                        {selected && (
                          <div className="role-card-check">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
              {errors.role && <span className="error-text">{errors.role}</span>}
            </div>
          </div>

          {!isEditing && (
            <div className="form-section">
              <label className="checkbox-label">
                <input type="checkbox" name="sendInvite" checked={formData.sendInvite} onChange={handleChange} />
                <span className="checkbox-custom"></span>
                <span className="checkbox-text">
                  <strong>Send invitation email</strong>
                  <span>User will receive an email with login instructions</span>
                </span>
              </label>
            </div>
          )}
        </form>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <><span className="spinner"></span>{isEditing ? 'Saving...' : 'Creating...'}</>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {isEditing ? <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8" /> : <path d="M12 4v16m8-8H4" />}
                </svg>
                {isEditing ? 'Save Changes' : 'Create User'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserModal;

