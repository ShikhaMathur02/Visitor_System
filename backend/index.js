require('dotenv').config(); // Load environment variables first
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http'); // Required for Socket.IO
const { Server } = require("socket.io"); // Socket.IO server
// Import notifications module
const { notifyGuards, notifyFaculty } = require('./utils/notifications');

// Fix case sensitivity in route imports
const visitorRoutes = require('./routes/visitorroutes');
const studentRoutes = require('./routes/studentRoutes');
const statsRoutes = require('./routes/statsRoutes');
const authRoutes = require("./authRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const server = http.createServer(app); // Create HTTP server

// Configure CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json()); // Parse JSON bodies

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Setup Socket.IO - only define io once
const io = new Server(server, {
  cors: corsOptions // Apply CORS options to Socket.IO
});

// Make io available to other modules
app.set('io', io);

// Export io for use in other files (like notifications.js)
exports.io = io;

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Handle room joining for targeted notifications
  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Routes
app.use('/visitors', visitorRoutes);
app.use('/students', studentRoutes);
app.use('/stats', statsRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/faculty', require('./routes/facultyRoutes')); // Add this line

// Basic route
app.get('/', (req, res) => {
  res.send('Visitor Management System Backend Running');
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
