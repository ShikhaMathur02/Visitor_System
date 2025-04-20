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
import Layout from './components/Layout'; // Import the new Layout
import { ThemeProvider, createTheme } from '@mui/material/styles'; // Import ThemeProvider
import CssBaseline from '@mui/material/CssBaseline'; // Normalize CSS

// Create socket instance with reconnection options
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const socket = io(baseUrl, {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000
});

// Define a basic theme (optional, but good for customization)
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Example primary color
    },
    secondary: {
      main: '#dc004e', // Example secondary color
    },
  },
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
      addNotification('Failed to connect to notification server.', 'error');
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
      const notificationData = typeof data === 'object' ? data : { message: String(data) };
      addNotification(notificationData.message || 'New notification', notificationData.type || 'info');
    });

    // Listen for guard notifications
    socket.on('guardNotification', (data) => {
      const notificationData = typeof data === 'object' ? data : { message: String(data) };
      addNotification(notificationData.message || 'New notification', notificationData.type || 'info');
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
    // Router is now outside, wrapping ThemeProvider
    <> 
      {!socketConnected && (
        <div className="socket-status-banner"> {/* Keep or replace with MUI Snackbar */}
          Notification service disconnected.
        </div>
      )}
      {/* Routes are now nested within the Layout */}
      <Routes>
        <Route element={<Layout />}> {/* Wrap routes with Layout */}
          <Route path="/" element={<Home />} />
          <Route path="/entry" element={<EntryForm />} />
          <Route path="/guard" element={<GuardPanel />} />
          <Route path="/guard/dashboard" element={<GuardDashboard />} />
          <Route path="/guard/scanner" element={<QRScanner />} />
          <Route path="/faculty" element={<FacultyPanel />} />
          <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
          {/* Add other routes as needed */}
        </Route>
      </Routes>
    </>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}> {/* Apply the theme */}
      <CssBaseline /> {/* Apply baseline styles */}
      <NotificationProvider> {/* Keep Notification context */}
         <Router> {/* Router should wrap everything */}
           <AppContent />
         </Router>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;