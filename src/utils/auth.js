// This file handles authentication (login/logout)
// It saves and retrieves user info from browser storage
// NOTE: Do NOT import api.js here at the top level to avoid circular dependency
// (api.js imports from auth.js)

// Check if user is logged in
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return token !== null;
};

// Save login information (token + refresh_token + user)
export const login = (token, user, refreshToken = null) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
  }
};

// Remove login information (logout)
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('refresh_token');
};

// API logout - revoke token on server then clear local storage
export const apiLogout = async () => {
  try {
    const { default: api } = await import('./api');
    await api.post('/logout');
  } catch (err) {
    console.warn('Logout API call failed:', err);
  }
  logout();
};

// API logout everywhere - revoke ALL tokens then clear local storage
export const apiLogoutEverywhere = async () => {
  try {
    const { default: api } = await import('./api');
    await api.post('/logout-everywhere');
  } catch (err) {
    console.warn('Logout everywhere API call failed:', err);
  }
  logout();
};

// Get current user information
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Get token for API requests
export const getToken = () => {
  return localStorage.getItem('token');
};

// Get refresh token
export const getRefreshToken = () => {
  return localStorage.getItem('refresh_token');
};

// Refresh the auth token using current token
export const refreshAuthToken = async () => {
  try {
    const { default: api } = await import('./api');
    const response = await api.post('/refresh-token');
    const { token, refreshToken } = response.data;
    if (token) {
      localStorage.setItem('token', token);
    }
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    return token;
  } catch (err) {
    console.error('Token refresh failed:', err);
    return null;
  }
};

// Check if auth token is still valid on server
export const authCheck = async () => {
  try {
    const { default: api } = await import('./api');
    await api.get('/auth-check');
    return true;
  } catch (err) {
    return false;
  }
};

// Fetch current user from API and update local storage
export const fetchCurrentUser = async () => {
  try {
    const { default: api } = await import('./api');
    const response = await api.get('/me');
    // Unwrap: may be { user: {...} } or { data: {...} } or plain {...}
    const raw = response.data;
    const user = raw?.user || raw?.data || (raw?.id ? raw : null);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    return user;
  } catch (err) {
    console.error('Failed to fetch current user:', err);
    return null;
  }
};
