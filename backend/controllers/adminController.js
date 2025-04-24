const User = require("../models/User");
const Visitor = require("../models/Visitor");
const Student = require("../models/Student");

/**
 * Get all users
 * @route GET /admin/users
 * @access Admin only
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};

/**
 * Create a new user
 * @route POST /admin/users
 * @access Admin only
 */
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    
    // Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    // Validate department for faculty
    if (role === 'faculty' && !department) {
      return res.status(400).json({ message: "Department is required for faculty members" });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
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
      ...(role === 'faculty' && { department })
    });
    
    await newUser.save();
    
    res.status(201).json({ 
      message: "User created successfully",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        ...(role === 'faculty' && { department: newUser.department })
      }
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Error creating user", error: error.message });
  }
};

/**
 * Get user by ID
 * @route GET /admin/users/:id
 * @access Admin only
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Error fetching user", error: error.message });
  }
};

/**
 * Update user
 * @route PUT /admin/users/:id
 * @access Admin only
 */
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    // Find and update user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role },
      { new: true }
    ).select("-password");
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({ 
      message: "User updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Error updating user", error: error.message });
  }
};

/**
 * Delete user
 * @route DELETE /admin/users/:id
 * @access Admin only
 */
exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
};

/**
 * Get dashboard statistics
 * @route GET /admin/dashboard
 * @access Admin only
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // Get counts for various entities
    const userCount = await User.countDocuments();
    const visitorCount = await Visitor.countDocuments();
    const studentCount = await Student.countDocuments();
    
    // Get active visitors and students (not exited)
    const activeVisitors = await Visitor.countDocuments({ hasExited: false });
    const activeStudents = await Student.countDocuments({ hasExited: false });
    
    // Get counts by role
    const adminCount = await User.countDocuments({ role: 'admin' });
    const facultyCount = await User.countDocuments({ role: 'faculty' });
    const guardCount = await User.countDocuments({ role: 'guard' });
    
    res.status(200).json({
      users: {
        total: userCount,
        byRole: {
          admin: adminCount,
          faculty: facultyCount,
          guard: guardCount
        }
      },
      visitors: {
        total: visitorCount,
        active: activeVisitors
      },
      students: {
        total: studentCount,
        active: activeStudents
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Error fetching dashboard statistics", error: error.message });
  }
};

/**
 * Get system logs
 * @route GET /admin/logs
 * @access Admin only
 */
exports.getSystemLogs = async (req, res) => {
  try {
    // This would typically connect to a logging system
    // For now, we'll return a placeholder response
    res.status(200).json({
      message: "Log functionality to be implemented",
      logs: []
    });
  } catch (error) {
    console.error("Error fetching system logs:", error);
    res.status(500).json({ message: "Error fetching system logs", error: error.message });
  }
};

/**
 * Get available roles
 * @route GET /admin/roles
 * @access Admin only
 */
exports.getRoles = async (req, res) => {
  try {
    // Return the available roles in the system
    res.status(200).json({
      roles: ['admin', 'faculty', 'guard']
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ message: "Error fetching roles", error: error.message });
  }
};

/**
 * Assign role to user
 * @route POST /admin/roles/assign
 * @access Admin only
 */
exports.assignRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    
    if (!userId || !role) {
      return res.status(400).json({ message: "User ID and role are required" });
    }
    
    // Validate role
    const validRoles = ['admin', 'faculty', 'guard'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    
    // Find and update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("-password");
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({ 
      message: "Role assigned successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error assigning role:", error);
    res.status(500).json({ message: "Error assigning role", error: error.message });
  }
};