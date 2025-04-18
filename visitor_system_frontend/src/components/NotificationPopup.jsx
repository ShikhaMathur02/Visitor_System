import { useEffect, useState } from 'react';
import '../index.css';

function NotificationPopup({ message, type = 'info', duration = 5000, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div className={`notification notification-${type}`}>
      <div className="notification-content">
        {type === 'info' && <span className="notification-icon">ℹ️</span>}
        {type === 'success' && <span className="notification-icon">✅</span>}
        {type === 'warning' && <span className="notification-icon">⚠️</span>}
        {type === 'error' && <span className="notification-icon">❌</span>}
        <p>{message}</p>
      </div>
      <button 
        className="notification-close" 
        onClick={() => {
          setVisible(false);
          if (onClose) onClose();
        }}
      >
        &times;
      </button>
    </div>
  );
}

export default NotificationPopup;
