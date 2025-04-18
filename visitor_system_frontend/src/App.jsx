import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Home from './pages/Home';
import GuardPanel from './pages/GuardPanel';
import FacultyPanel from './pages/FacultyPanel';
import EntryForm from './components/EntryForm';
import GuardDashboard from './components/GuardDashboard';
import FacultyDashboard from './components/FacultyDashboard';
import QRScanner from './components/QRScanner';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import './index.css';

// Create socket instance with reconnection options
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const socket = io(baseUrl, {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000
});

function AppContent() {
  const { addNotification } = useNotification();
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    // Handle connection
    socket.on('connect', () => {
      setSocketConnected(true);
      console.log('Socket connected successfully');
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setSocketConnected(false);
      addNotification('Failed to connect to notification server. Some features may be limited.', 'error');
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setSocketConnected(false);
      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, reconnect manually
        socket.connect();
      }
    });

    // Listen for director notifications
    socket.on('directorNotification', (data) => {
      // Fixed: Safely handle data structure with default values
      const notificationData = typeof data === 'object' ? data : { message: String(data) };
      const message = notificationData.message || 'New notification';
      const type = notificationData.type || 'info';
      
      // Don't rely on timestamp from the server
      addNotification(message, type);
    });

    // Listen for guard notifications
    socket.on('guardNotification', (data) => {
      // Fixed: Safely handle data structure with default values
      const notificationData = typeof data === 'object' ? data : { message: String(data) };
      const message = notificationData.message || 'New notification';
      const type = notificationData.type || 'info';
      
      // Don't rely on timestamp from the server
      addNotification(message, type);
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('directorNotification');
      socket.off('guardNotification');
    };
  }, [addNotification]);

  return (
    <Router>
      {!socketConnected && (
        <div className="socket-status-banner">
          Notification service disconnected. Some features may be limited.
        </div>
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/entry" element={<EntryForm />} />
        <Route path="/guard" element={<GuardPanel />} />
        <Route path="/guard/dashboard" element={<GuardDashboard />} />
        <Route path="/guard/scanner" element={<QRScanner />} />
        <Route path="/faculty" element={<FacultyPanel />} />
        <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

export default App;