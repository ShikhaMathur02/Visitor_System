const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Visitor = require('../models/Visitor');
const Student = require('../models/Student');
const bcrypt = require('bcryptjs');

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get system stats
router.get('/stats', async (req, res) => {
  try {
    // Count total visitors
    const totalVisitors = await Visitor.countDocuments();
    
    // Count total students
    const totalStudents = await Student.countDocuments();
    
    // Count users by role
    const totalGuards = await User.countDocuments({ role: 'guard' });
    const totalFaculty = await User.countDocuments({ role: 'faculty' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    
    res.status(200).json({
      totalVisitors,
      totalStudents,
      totalGuards,
      totalFaculty,
      totalAdmins,
      totalUsers: totalGuards + totalFaculty + totalAdmins
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new user
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    
    // Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      department: role === 'faculty' ? department : undefined
    });
    
    await newUser.save();
    
    // Return user without password
    const userResponse = { ...newUser.toObject() };
    delete userResponse.password;
    
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, role, department } = req.body;
    const { id } = req.params;
    
    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    
    // Only update department for faculty
    if (role === 'faculty' && department) {
      user.department = department;
    } else if (role !== 'faculty') {
      user.department = undefined;
    }
    
    await user.save();
    
    // Return user without password
    const userResponse = { ...user.toObject() };
    delete userResponse.password;
    
    res.status(200).json(userResponse);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await User.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;