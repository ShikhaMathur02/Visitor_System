const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all faculty members
router.get('/', async (req, res) => {
  try {
    const faculty = await User.find({ role: 'faculty' }).select('-password');
    res.status(200).json(faculty);
  } catch (error) {
    console.error('Error fetching faculty:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get faculty members by department
router.get('/department/:department', async (req, res) => {
  try {
    const { department } = req.params;
    
    const faculty = await User.find({ 
      role: 'faculty',
      department: department 
    }).select('-password');
    
    res.status(200).json(faculty);
  } catch (error) {
    console.error('Error fetching faculty:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;