import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';

// Layout
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages & Components
import Home from './pages/Home';
import Login from './pages/Login';
import EntryForm from './components/EntryForm';
import StudentEntryForm from './components/StudentEntryForm';
import GuardDashboard from './components/GuardDashboard';
import FacultyDashboard from './components/FacultyDashboard';
import AdminDashboard from './components/AdminDashboard';

// Define your theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#9c27b0',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
        <AuthProvider>
          <Router>
            <Layout>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/entry" element={<EntryForm />} />
                <Route path="/student-entry" element={<StudentEntryForm />} />
                
                {/* Protected routes */}
                <Route 
                  path="/admin/dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/faculty/dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['faculty', 'admin']}>
                      <FacultyDashboard />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/guard/dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['guard', 'admin']}>
                      <GuardDashboard />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </Router>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;