// Forgot Password Page - Send password reset link
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import useSnackbar from '../utils/useSnackbar';
import AuthLayout from '../components/AuthLayout';
import '../styles/Login.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { showSnackbar } = useSnackbar();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/password/forgot', { email });
      const successMsg = response.data.message || 'We have emailed your password reset link.';
      setSuccess(successMsg);
      showSnackbar(successMsg, 'success');
      setEmail('');
    } catch (err) {
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        const firstError = errors ? Object.values(errors)[0][0] : 'Invalid email address.';
        setError(firstError);
        showSnackbar(firstError, 'error');
      } else if (err.response?.status === 429) {
        const errorMsg = 'Too many requests. Please wait a moment and try again.';
        setError(errorMsg);
        showSnackbar(errorMsg, 'warning');
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
          <h2 className="login-title">Reset your password</h2>
          <p className="login-subtitle">Enter your email address and we'll send you a link to reset your password.</p>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPassword;

