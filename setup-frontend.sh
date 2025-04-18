#!/bin/bash

# Exit script on any error
set -e

# Define project name
PROJECT_NAME="visitor_system_frontend"

# Create Vite React project
echo "Creating Vite React project..."
npm create vite@latest $PROJECT_NAME -- --template react

# Navigate into the project folder
cd $PROJECT_NAME

# Install required dependencies
echo "Installing dependencies..."
npm install
npm install react-router-dom axios socket.io-client

# Create necessary folders
mkdir -p src/pages src/components

# Create index.css for styling
echo "Adding global styles..."
cat <<EOL > src/index.css
body {
  font-family: Arial, sans-serif;
  background-color: #f4f7fc;
  margin: 0;
  padding: 0;
}
.container {
  width: 80%;
  margin: auto;
  padding: 20px;
}
EOL

# Create main App.jsx
echo "Setting up App.jsx..."
cat <<EOL > src/App.jsx
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import GuardPanel from './pages/GuardPanel';
import FacultyPanel from './pages/FacultyPanel';
import EntryForm from './components/EntryForm';
import QRScanner from './components/QRScanner';
import GuardDashboard from './components/GuardDashboard';
import FacultyDashboard from './components/FacultyDashboard';
import NotificationPopup from './components/NotificationPopup';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import './index.css';

const socket = io('http://localhost:5000');

function App() {
  useEffect(() => {
    socket.on('notification', (message) => {
      alert(message);
    });
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/entry" element={<EntryForm />} />
        <Route path="/guard" element={<GuardPanel />} />
        <Route path="/guard/dashboard" element={<GuardDashboard />} />
        <Route path="/faculty" element={<FacultyPanel />} />
        <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
EOL

# Create Home page
echo "Creating Home page..."
cat <<EOL > src/pages/Home.jsx
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="container">
      <h1>Welcome to Visitor Management System</h1>
      <nav>
        <Link to="/entry">Visitor Entry</Link> | 
        <Link to="/guard">Guard Panel</Link> | 
        <Link to="/faculty">Faculty Panel</Link>
      </nav>
    </div>
  );
}

export default Home;
EOL

# Create EntryForm component
echo "Creating EntryForm component..."
cat <<EOL > src/components/EntryForm.jsx
import { useState } from 'react';

function EntryForm() {
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(\`Entry Request Submitted: \${name}, Purpose: \${purpose}\`);
  };

  return (
    <div className="container">
      <h2>Visitor Entry Form</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="text" placeholder="Purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} required />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default EntryForm;
EOL

# Create GuardPanel page
echo "Creating GuardPanel..."
cat <<EOL > src/pages/GuardPanel.jsx
import { Link } from 'react-router-dom';

function GuardPanel() {
  return (
    <div className="container">
      <h2>Guard Panel</h2>
      <nav>
        <Link to="/guard/dashboard">Guard Dashboard</Link>
      </nav>
    </div>
  );
}

export default GuardPanel;
EOL

# Create FacultyPanel page
echo "Creating FacultyPanel..."
cat <<EOL > src/pages/FacultyPanel.jsx
import { Link } from 'react-router-dom';

function FacultyPanel() {
  return (
    <div className="container">
      <h2>Faculty Panel</h2>
      <nav>
        <Link to="/faculty/dashboard">Faculty Dashboard</Link>
      </nav>
    </div>
  );
}

export default FacultyPanel;
EOL

# Create QRScanner component
echo "Creating QRScanner component..."
cat <<EOL > src/components/QRScanner.jsx
function QRScanner() {
  return (
    <div className="container">
      <h2>Scan QR Code</h2>
      <p>QR Scanner Placeholder</p>
    </div>
  );
}

export default QRScanner;
EOL

# Create GuardDashboard
echo "Creating GuardDashboard..."
cat <<EOL > src/components/GuardDashboard.jsx
function GuardDashboard() {
  return (
    <div className="container">
      <h2>Guard Dashboard</h2>
      <p>Approve or Deny Exit Requests</p>
    </div>
  );
}

export default GuardDashboard;
EOL

# Create FacultyDashboard
echo "Creating FacultyDashboard..."
cat <<EOL > src/components/FacultyDashboard.jsx
function FacultyDashboard() {
  return (
    <div className="container">
      <h2>Faculty Dashboard</h2>
      <p>Approve Entry & Exit Requests</p>
    </div>
  );
}

export default FacultyDashboard;
EOL

# Create NotificationPopup
echo "Creating NotificationPopup..."
cat <<EOL > src/components/NotificationPopup.jsx
function NotificationPopup({ message }) {
  return (
    <div className="popup">
      <p>{message}</p>
    </div>
  );
}

export default NotificationPopup;
EOL

# Final instructions
echo "✅ Frontend setup complete!"
echo "To start the frontend, run the following commands:"
echo "-------------------------------------------------"
echo "cd $PROJECT_NAME"
echo "npm run dev"
