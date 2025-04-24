const express = require('express');
// Router is already declared later in the file, so removing this duplicate declaration
const visitorController = require("../controllers/visitorController");
const User = require('../models/User');
const router = express.Router();
// --- Specific Routes First ---

// Route to get all visitor records for the current day
router.get("/daily-records", visitorController.getDailyVisitorRecords); 

// Route to get pending exit requests for faculty
router.get("/pending-exits", visitorController.getPendingExits);

// Route to get approved exit requests for guards
router.get("/approved-exits", visitorController.getApprovedExits);

// Route for visitor entry (automatically requests exit)
// Note: Ensure visitorEntry in the controller handles the exit request logic
router.post("/entry", visitorController.visitorEntry); 

// Route for faculty to approve exit - Fixed function name
router.post("/approve-exit", visitorController.approveExit);

// Route for guard to confirm exit - Fixed function name
router.post("/confirm-exit", visitorController.confirmExit);

// --- Parameterized Routes Last ---

// Route to get a specific visitor by phone (if needed)
router.get("/phone/:phone", visitorController.getVisitorByPhone); 

// --- Optional Routes (Commented Out) ---
// router.get("/", visitorController.getAllVisitors); 
// router.delete("/:phone", visitorController.deleteVisitor);


module.exports = router;




const Visitor = require('../models/Visitor');


// Register a new visitor
router.post('/register', async (req, res) => {
  try {
    const { name, phone, purpose, department, faculty } = req.body;
    
    // Validate input
    if (!name || !phone || !purpose || !department || !faculty) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if faculty exists
    const facultyMember = await User.findById(faculty);
    if (!facultyMember) {
      return res.status(404).json({ message: 'Faculty member not found' });
    }
    
    // Create new visitor
    const visitor = new Visitor({
      name,
      phone,
      purpose,
      department,
      faculty: faculty,
      entryTime: new Date()
    });
    
    await visitor.save();
    
    // Notify faculty member (using Socket.IO)
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${faculty}`).emit('newVisitor', {
        message: `New visitor ${name} has arrived to see you`,
        visitor: visitor
      });
    }
    
    res.status(201).json(visitor);
  } catch (error) {
    console.error('Error registering visitor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all visitors
router.get('/', async (req, res) => {
  try {
    const visitors = await Visitor.find().sort({ entryTime: -1 });
    res.status(200).json(visitors);
  } catch (error) {
    console.error('Error fetching visitors:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Request exit for a visitor
router.post('/request-exit', async (req, res) => {
  try {
    const { id } = req.body;
    
    const visitor = await Visitor.findById(id);
    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }
    
    visitor.exitRequested = true;
    await visitor.save();
    
    // Notify faculty member
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${visitor.faculty}`).emit('exitRequest', {
        message: `Visitor ${visitor.name} has requested to exit`,
        visitor: visitor
      });
    }
    
    res.status(200).json(visitor);
  } catch (error) {
    console.error('Error requesting exit:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve visitor exit
router.post('/approve-exit', async (req, res) => {
  try {
    const { id } = req.body;
    
    const visitor = await Visitor.findById(id);
    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }
    
    visitor.exitApproved = true;
    await visitor.save();
    
    res.status(200).json(visitor);
  } catch (error) {
    console.error('Error approving exit:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Record visitor exit
router.post('/record-exit', async (req, res) => {
  try {
    const { id } = req.body;
    
    const visitor = await Visitor.findById(id);
    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }
    
    if (!visitor.exitApproved) {
      return res.status(400).json({ message: 'Exit not approved by faculty' });
    }
    
    visitor.hasExited = true;
    visitor.exitTime = new Date();
    await visitor.save();
    
    res.status(200).json(visitor);
  } catch (error) {
    console.error('Error recording exit:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
