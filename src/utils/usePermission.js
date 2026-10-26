/**
 * usePermission.js
 * ─────────────────────────────────────────────────────────────────────────────
 * React hook for permission checks inside components.
 * Use this to conditionally render buttons, form fields, or sections.
 *
 * Usage:
 *   const { can, canAny, canAll, isSuperAdmin } = usePermission();
 *
 *   can('edit_leads')                          → boolean
 *   canAny(['edit_leads', 'edit_own_leads'])   → boolean (at least one)
 *   canAll(['view_users', 'manage_users'])      → boolean (all required)
 *   isSuperAdmin()                              → boolean
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useMemo } from 'react';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isSuperAdmin as checkSuperAdmin,
  getUserPermissions,
} from './permissions';
import { getCurrentUser } from './auth';

export function usePermission() {
  // Re-compute whenever component renders (user stored in localStorage)
  const user = getCurrentUser();

  const permissions = useMemo(
    () => getUserPermissions(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id, user?.role]
  );

  return {
    /** true if user has this single permission */
    can: (perm) => hasPermission(perm),

    /** true if user has at least one of the given permissions */
    canAny: (perms) => hasAnyPermission(perms),

    /** true if user has ALL of the given permissions */
    canAll: (perms) => hasAllPermissions(perms),

    /** true if user is Super Admin / Admin (bypasses all checks) */
    isAdmin: checkSuperAdmin,

    /** raw permissions array for advanced checks */
    permissions,

    /** current user object */
    user,
  };
}

