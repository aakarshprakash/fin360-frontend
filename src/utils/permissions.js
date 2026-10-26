// permissions.js — helper functions for checking user permissions
// Reads from localStorage user object (set on login)
import { getCurrentUser } from './auth';

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSION GROUPS — master list grouped by category (matches API + seed data)
// ─────────────────────────────────────────────────────────────────────────────
export const PERMISSION_GROUPS = [
  {
    category: 'Finance & Accounting',
    permissions: [
      { key: 'view_accounting',      label: 'View Accounting',      description: 'Can access dashboards, ledgers and finance records' },
      { key: 'manage_accounting',    label: 'Manage Accounting',    description: 'Can create invoices, bills and transactions' },
      { key: 'accounting_settings',  label: 'Accounting Settings',  description: 'Can manage taxes, currencies, branches and financial years' },
      { key: 'view_invoices',        label: 'View Invoices',        description: 'Can view invoices' },
      { key: 'create_invoices',      label: 'Create Invoices',      description: 'Can create invoices' },
      { key: 'manage_invoices',      label: 'Manage Invoices',      description: 'Full invoice management' },
      { key: 'view_expenses',        label: 'View Expenses',        description: 'Can view expenses' },
      { key: 'manage_expenses',      label: 'Manage Expenses',      description: 'Full expense management' },
      { key: 'view_quotations',      label: 'View Quotations',      description: 'Can view quotations' },
      { key: 'manage_quotations',    label: 'Manage Quotations',    description: 'Full quotation management' },
    ],
  },
  {
    category: 'Reports & Analytics',
    permissions: [
      { key: 'view_reports',      label: 'View Reports',      description: 'Can access financial reports' },
      { key: 'view_dashboard',    label: 'View Dashboard',    description: 'Can view the dashboard with KPIs' },
      { key: 'export_reports',    label: 'Export Reports',    description: 'Can export data and reports' },
    ],
  },
  {
    category: 'User Management',
    permissions: [
      { key: 'view_users',    label: 'View Users',    description: 'Can view user list and profiles' },
      { key: 'manage_users',  label: 'Manage Users',  description: 'Can create, edit, and manage user accounts' },
      { key: 'manage_roles',  label: 'Manage Roles',  description: 'Can create, edit, and delete roles' },
      { key: 'create_users',  label: 'Create Users',  description: 'Can create new user accounts' },
      { key: 'edit_users',    label: 'Edit Users',    description: 'Can edit user accounts' },
      { key: 'delete_users',  label: 'Delete Users',  description: 'Can delete user accounts' },
    ],
  },
  {
    category: 'Settings & Configuration',
    permissions: [
      { key: 'view_settings',            label: 'View Settings',            description: 'Can view system settings' },
      { key: 'manage_settings',          label: 'Manage Settings',          description: 'Can modify system settings' },
      { key: 'manage_company_settings',  label: 'Manage Company Settings',  description: 'Can update company branding and contact info' },
      { key: 'view_notifications',       label: 'View Notifications',       description: 'Can view notifications' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT ROLE PRESETS — maps role name → default permissions array
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_ROLE_PRESETS = {
  'Super Admin': '__all__',
  Admin: '__all__',
  'Finance Manager': [
    'view_accounting', 'manage_accounting', 'accounting_settings',
    'view_invoices', 'create_invoices', 'manage_invoices',
    'view_expenses', 'manage_expenses', 'view_quotations', 'manage_quotations',
    'view_reports', 'view_dashboard', 'export_reports',
    'view_users', 'view_notifications', 'view_settings',
  ],
  Accountant: [
    'view_accounting', 'manage_accounting',
    'view_invoices', 'create_invoices',
    'view_expenses', 'manage_expenses', 'view_quotations',
    'view_reports', 'view_dashboard', 'view_notifications',
  ],
  Viewer: [
    'view_accounting', 'view_invoices', 'view_expenses', 'view_quotations',
    'view_reports', 'view_dashboard', 'view_notifications',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SUPER_ADMIN_ROLES — role names that have unrestricted access
// ─────────────────────────────────────────────────────────────────────────────
export const SUPER_ADMIN_ROLES = ['Super Admin', 'Admin'];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the full permissions array for the currently logged-in user.
 * Prefers allPermissions (merged role + user overrides) over permissions.
 */
export const getUserPermissions = () => {
  const user = getCurrentUser();
  if (!user) return [];
  return (
    (Array.isArray(user.allPermissions) && user.allPermissions.length > 0
      ? user.allPermissions
      : null) ||
    (Array.isArray(user.all_permissions) && user.all_permissions.length > 0
      ? user.all_permissions
      : null) ||
    (Array.isArray(user.permissions) ? user.permissions : [])
  );
};

/**
 * Check if the current user is a super admin (bypasses all permission checks).
 * @returns {boolean}
 */
export const isSuperAdmin = () => {
  const user = getCurrentUser();
  if (!user) return false;
  if (user.isSuperAdmin || user.is_super_admin) return true;
  const role = typeof user.role === 'string' ? user.role : '';
  return SUPER_ADMIN_ROLES.includes(role);
};

/**
 * Check if the current user has a specific permission.
 * Admin / super_admin users bypass all checks.
 * @param {string} permission  e.g. 'view_invoices'
 * @returns {boolean}
 */
export const hasPermission = (permission) => {
  if (isSuperAdmin()) return true;
  if (!permission) return true;
  const perms = getUserPermissions();
  return perms.includes(permission);
};

/**
 * Check if the current user has ANY of the given permissions.
 * @param {string[]} permissions
 * @returns {boolean}
 */
export const hasAnyPermission = (permissions) => {
  if (!Array.isArray(permissions) || permissions.length === 0) return true;
  if (isSuperAdmin()) return true;
  const perms = getUserPermissions();
  return permissions.some((p) => perms.includes(p));
};

/**
 * Check if the current user has ALL of the given permissions.
 * @param {string[]} permissions
 * @returns {boolean}
 */
export const hasAllPermissions = (permissions) => {
  if (!Array.isArray(permissions) || permissions.length === 0) return true;
  if (isSuperAdmin()) return true;
  const perms = getUserPermissions();
  return permissions.every((p) => perms.includes(p));
};

/**
 * Check if the current user is an Admin role.
 */
export const isAdmin = () => {
  const user = getCurrentUser();
  if (!user) return false;
  if (user.isSuperAdmin || user.is_super_admin) return true;
  const role = typeof user.role === 'string' ? user.role.toLowerCase() : '';
  return role === 'admin' || role === 'super admin';
};

/**
 * Check if the current user is a Manager role.
 */
export const isManager = () => {
  const user = getCurrentUser();
  if (!user) return false;
  return typeof user.role === 'string' && user.role.toLowerCase() === 'manager';
};

// All exports are named — import individually:
// import { hasPermission, isSuperAdmin, PERMISSION_GROUPS } from '../utils/permissions';
