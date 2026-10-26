// This component protects pages that require login and optionally a permission
// If user is not logged in, redirect to login page
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../utils/permissions';

function ProtectedRoute({ children, permission, anyOf, allOf, redirectTo = '/unauthorized' }) {
  // 1. Must be logged in
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // 2. Single permission check
  if (permission && !hasPermission(permission)) {
    return <Navigate to={redirectTo} replace />;
  }

  // 3. Needs at least one of the listed permissions
  if (anyOf && !hasAnyPermission(anyOf)) {
    return <Navigate to={redirectTo} replace />;
  }

  // 4. Needs ALL of the listed permissions
  if (allOf && !hasAllPermissions(allOf)) {
    return <Navigate to={redirectTo} replace />;
  }

  // If logged in and has required permissions, show the protected page
  return children;
}

export default ProtectedRoute;
