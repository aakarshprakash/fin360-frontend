// Reset Password Page - Complete password reset with token
import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import useSnackbar from '../utils/useSnackbar';
import AuthLayout from '../components/AuthLayout';
import '../styles/Login.css';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  const [formData, setFormData] = useState({
    email: searchParams.get('email') || '',
    token: searchParams.get('token') || '',
    password: '',
    passwordConfirmation: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.passwordConfirmation) {
      const errorMsg = 'Passwords do not match.';
      setError(errorMsg);
      showSnackbar(errorMsg, 'error');
      return;
    }

    if (formData.password.length < 8) {
      const errorMsg = 'Password must be at least 8 characters.';
      setError(errorMsg);
      showSnackbar(errorMsg, 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/password/reset', {
        token: formData.token,
        email: formData.email,
        password: formData.password,
        passwordConfirmation: formData.passwordConfirmation
      });
      setSuccess(response.data.message || 'Your password has been reset.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        const firstError = errors ? Object.values(errors)[0][0] : 'Invalid or expired reset token.';
        setError(firstError);
        showSnackbar(firstError, 'error');
      } else {
        const errorMsg = err.response?.data?.message || 'Something went wrong. Please try again.';
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
      <div className="login-container">

        <div className="login-card">
          <h2 className="login-title">Set new password</h2>
          <p className="login-subtitle">Enter your new password below.</p>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 8 characters"
                required
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label htmlFor="passwordConfirmation">Confirm Password</label>
              <input
                type="password"
                id="passwordConfirmation"
                name="passwordConfirmation"
                value={formData.passwordConfirmation}
                onChange={handleChange}
                placeholder="Confirm your new password"
                required
                minLength={8}
              />
            </div>

            <button type="submit" className="btn-login" disabled={loading || !formData.token}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="back-to-login">
            <Link to="/login">← Back to sign in</Link>
          </div>
        </div>
      </div>
    </div>
    </AuthLayout>
  );
}

export default ResetPassword;

