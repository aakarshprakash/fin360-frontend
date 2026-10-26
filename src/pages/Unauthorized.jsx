// Unauthorized.jsx — shown when a logged-in user tries to access a page
// they don't have permission to view.
import { useNavigate } from 'react-router-dom';
import '../styles/Unauthorized.css';

function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="unauthorized-page">
      <div className="unauthorized-card">
        <div className="unauthorized-icon">🔒</div>
        <h1 className="unauthorized-title">Access Denied</h1>
        <p className="unauthorized-message">
          You don't have permission to view this page.
          <br />
          Contact your administrator if you think this is a mistake.
        </p>
        <div className="unauthorized-actions">
          <button
            className="btn-primary"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default Unauthorized;

