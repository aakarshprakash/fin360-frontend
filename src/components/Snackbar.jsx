import { useState, useEffect } from 'react';
import '../styles/Snackbar.css';

const Snackbar = ({ message, type = 'info', position = 'bottom-center', duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show the snackbar immediately
    setVisible(true);
    
    // Auto-hide after duration
    const timer = setTimeout(() => {
      setVisible(false);
      // Wait for animation to complete before calling onClose
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div className={`snackbar snackbar-${type} snackbar-${position} ${visible ? 'show' : ''}`}>
      <span>{message}</span>
      <button className="snackbar-close" onClick={handleClose}>
        ×
      </button>
    </div>
  );
};

export default Snackbar;