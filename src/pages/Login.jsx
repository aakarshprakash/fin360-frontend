// Login Page — Fin360 sign-in
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../utils/auth';
import api from '../utils/api';
import { useCompanySettings } from '../utils/useCompanySettings';
import useSnackbar from '../utils/useSnackbar';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import '../styles/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { settings } = useCompanySettings();
  const { showSnackbar } = useSnackbar();

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/login', { email, password });
      const { token, refreshToken } = response.data;
      // Unwrap user: may be at response.data.user or response.data.data or inline
      const raw = response.data;
      const userData = raw?.user || raw?.data || (raw?.id ? raw : null);
      if (!token || !userData) {
        setError('Invalid response from server. Please try again.');
        return;
      }
      // Merge all_permissions → permissions for unified access in the app
      const user = {
        ...userData,
        permissions: userData.permissions || userData.allPermissions || userData.all_permissions || [],
      };
      login(token, user, refreshToken);
      showSnackbar('Welcome back! Login successful.', 'success');
      navigate('/dashboard');
    } catch (err) {
      if (err.response) {
        if (err.response.status === 422) {
          const errors = err.response.data.errors;
          const firstError = errors ? Object.values(errors)[0][0] : 'Invalid credentials';
          setError(firstError);
          showSnackbar(firstError, 'error');
        } else if (err.response.status === 403) {
          const errorMsg = err.response.data.message || 'Your account is not active.';
          setError(errorMsg);
          showSnackbar(errorMsg, 'error');
        } else {
          const errorMsg = err.response.data.message || 'Login failed. Please try again.';
          setError(errorMsg);
          showSnackbar(errorMsg, 'error');
        }
      } else {
        const errorMsg = 'Network error. Please check your connection.';
        setError(errorMsg);
        showSnackbar(errorMsg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="login-page">
        <div className="login-card">
          <h1 className="login-title">Welcome back</h1>
          <p className="login-subtitle">
            Sign in to {settings.companyName && settings.companyName !== 'Fin360' ? settings.companyName : 'your Fin360 workspace'}
          </p>

          {error && <div className="error-message" role="alert">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <div className="auth-input">
                <Mail size={17} />
                <input
                  type="email"
                  id="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="password-label-row">
                <label htmlFor="password">Password</label>
                <Link to="/forgot-password" className="forgot-password-link">Forgot password?</Link>
              </div>
              <div className="auth-input">
                <Lock size={17} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="auth-input-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <div className="login-footer">
          {(settings.phone || settings.email) && (
            <p>
              {settings.phone}
              {settings.phone && settings.email && <span> · </span>}
              {settings.email}
            </p>
          )}
          <p>© {new Date().getFullYear()} Fin360 by SYSNAC</p>
        </div>
      </div>
    </AuthLayout>
  );
}

export default Login;
