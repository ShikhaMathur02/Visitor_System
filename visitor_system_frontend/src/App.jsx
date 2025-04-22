import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { NotificationProvider } from './context/NotificationContext'; // Import provider

// Layout
import Layout from './components/Layout'; // Import the Layout component

// Pages & Components
import Home from './pages/Home';
import GuardPanel from './pages/GuardPanel'; // Assuming this exists or is simple
import FacultyPanel from './pages/FacultyPanel'; // Assuming this exists or is simple
import EntryForm from './components/EntryForm'; // Visitor Entry
import StudentEntryForm from './components/StudentEntryForm'; // Student Entry
import GuardDashboard from './components/GuardDashboard';
import FacultyDashboard from './components/FacultyDashboard';
// import QRScanner from './components/QRScanner'; // If needed

// Define your theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Example primary color (blue)
    },
    secondary: {
      main: '#dc004e', // Example secondary color (pink)
    },
  },
  // You can customize typography, spacing, etc. here
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Ensures baseline styles and background color */}
      <NotificationProvider> {/* Wrap everything with NotificationProvider */}
        <Router>
          <Routes>
            {/* Use Layout for main application structure */}
            <Route path="/" element={<Layout />}> 
              {/* Index route for the Layout (Home Page) */}
              <Route index element={<Home />} /> 
              
              {/* Visitor Entry Form */}
              <Route path="entry" element={<EntryForm />} /> 
              
              {/* Student Entry Form */}
              <Route path="student-entry" element={<StudentEntryForm />} /> 

              {/* Guard Section */}
              <Route path="guard" element={<GuardPanel />} /> 
              <Route path="guard/dashboard" element={<GuardDashboard />} />
              {/* Add other guard routes like QR scanner if needed */}
              {/* <Route path="guard/scan" element={<QRScanner />} /> */}

              {/* Faculty Section */}
              <Route path="faculty" element={<FacultyPanel />} /> 
              <Route path="faculty/dashboard" element={<FacultyDashboard />} />

              {/* Add other nested routes here */}
            </Route>

            {/* Add routes that should NOT use the Layout here (e.g., login page if separate) */}
            {/* <Route path="/login" element={<LoginPage />} /> */}
          </Routes>
        </Router>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;