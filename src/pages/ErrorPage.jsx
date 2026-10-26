import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/ErrorPage.css';

const ErrorPage = ({ errorType, errorMessage } = {}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getErrorInfo = () => {
    const stateError = location.state?.error;
    
    if (errorType === '404' || stateError?.status === 404) {
      return {
        code: '404',
        title: 'Page Not Found',
        message: 'The page you are looking for does not exist or has been moved.'
      };
    }
    
    if (errorType === '403' || stateError?.status === 403) {
      return {
        code: '403',
        title: 'Access Denied',
        message: 'You do not have permission to access this resource.'
      };
    }

    if (errorType === '500' || stateError?.status === 500) {
      return {
        code: '500',
        title: 'Internal Server Error',
        message: 'Something went wrong on our end. Please try again later.'
      };
    }

    return {
      code: '404',
      title: 'Page Not Found',
      message: errorMessage || stateError?.message || 'The page you are looking for does not exist or has been moved.'
    };
  };

  const errorInfo = getErrorInfo();

  return (
    <div className="error-page">
      <div className="error-container">
        <h1 className="error-code">{errorInfo.code}</h1>
        <div className="error-divider"></div>
        <h2 className="error-title">{errorInfo.title}</h2>
        <p className="error-message">{errorInfo.message}</p>
        <button className="error-button" onClick={() => navigate('/')}>
          Return Home
        </button>
      </div>
    </div>
  );
};

export default ErrorPage;