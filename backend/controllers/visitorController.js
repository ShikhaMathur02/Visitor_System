const Visitor = require("../models/Visitor");
const User = require("../models/User");
const { notifyDirector, notifyGuard } = require("../utils/notifications");

// Get all visitors
exports.getAllVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find();
    res.status(200).json(visitors);
  } catch (error) {
    res.status(500).json({ message: "Error fetching visitors", error });
  }
};

// Get pending exits
exports.getPendingExits = async (req, res) => {
  try {
    const pendingVisitors = await Visitor.find({ 
      exitRequested: true, 
      exitApproved: false,
      hasExited: false
    }).sort({ entryTime: -1 });  // Sort by most recent first

    console.log(`Found ${pendingVisitors.length} pending visitor exits`);
    res.status(200).json(pendingVisitors);
  } catch (error) {
    console.error("Error in getPendingExits:", error);
    res.status(500).json({ 
      message: 'Error fetching pending visitor exits', 
      error: error.message 
    });
  }
};

// Get approved exits
exports.getApprovedExits = async (req, res) => {
  try {
    const approvedVisitors = await Visitor.find({ 
      exitApproved: true, 
      hasExited: false 
    }).sort({ entryTime: -1 });

    console.log(`Found ${approvedVisitors.length} approved visitor exits`);
    res.status(200).json(approvedVisitors);
  } catch (error) {
    console.error("Error in getApprovedExits:", error);
    res.status(500).json({ 
      message: 'Error fetching approved visitor exits', 
      error: error.message 
    });
  }
};

// Get visitor by phone
exports.getVisitorByPhone = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.params.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });
    res.status(200).json(visitor);
  } catch (error) {
    res.status(500).json({ message: "Error fetching visitor", error });
  }
};

// Register visitor entry
exports.visitorEntry = async (req, res) => {
  try {
    // Create a new visitor object from the request body
    const visitor = new Visitor(req.body); 
    
    // Automatically set exitRequested to true upon entry
    visitor.exitRequested = true; 

    // Save the new visitor document to the database
    await visitor.save(); 

    // Notify the director immediately since exit is requested
    try {
      notifyDirector(`📢 Exit Request (Auto): Visitor ${visitor.name} entered and wants to exit.`);
    } catch (notifyError) {
      console.error("Notification error during entry:", notifyError);
    }

    // Send a success response back to the client
    res.status(201).json({ message: "Visitor entry registered, exit requested automatically", visitor }); 
  } catch (error) {
    // Handle potential errors during the process
    console.error("Error registering visitor entry:", error); 
    res.status(500).json({ message: "Error registering entry", error: error.message });
  }
};

// Request exit approval
exports.requestExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    visitor.exitRequested = true;
    await visitor.save();

    // Add try-catch for notification
    try {
      notifyDirector(`📢 Exit Request: Visitor ${visitor.name} wants to exit.`);
    } catch (notifyError) {
      console.error("Notification error:", notifyError);
    }

    res.status(200).json({ message: "Exit request sent", visitor });
  } catch (error) {
    console.error("Request exit error:", error);
    res.status(500).json({ message: "Error requesting exit", error: error.message });
  }
};

// Approve exit
exports.approveExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    visitor.exitApproved = true;
    await visitor.save();

    try {
      notifyGuard(`✅ Exit Approved: Visitor ${visitor.name} can exit.`);
    } catch (notifyError) {
      console.error("Notification error during approval:", notifyError);
    }

    res.status(200).json({ message: "Exit approved", visitor });
  } catch (error) {
    console.error("Error approving exit:", error);
    res.status(500).json({ message: "Error approving exit", error: error.message });
  }
};

// Confirm exit
exports.confirmExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    if (!visitor.exitApproved) {
      return res.status(400).json({ message: "Exit not approved yet!" });
    }

    visitor.hasExited = true;
    visitor.exitTime = new Date();
    await visitor.save();

    // Get the socket.io instance
    const io = req.app.get('io');
    
    // Send notification to the specific faculty member
    if (io && visitor.faculty) {
      io.to(`user_${visitor.faculty}`).emit('visitorExited', {
        message: `Visitor ${visitor.name} has successfully exited.`,
        visitor: visitor
      });
    }

    try {
      notifyDirector(`🚪 Visitor ${visitor.name} has exited.`);
    } catch (notifyError) {
      console.error("Notification error during exit confirmation:", notifyError);
    }

    res.status(200).json({ message: "Exit confirmed", visitor });
  } catch (error) {
    console.error("Error confirming exit:", error);
    res.status(500).json({ message: "Error confirming exit", error: error.message });
  }
};

// Delete visitor
exports.deleteVisitor = async (req, res) => {
  try {
    await Visitor.findOneAndDelete({ phone: req.params.phone });
    res.status(200).json({ message: "Visitor deleted" });
  } catch (error) {
    console.error("Error deleting visitor:", error);
    res.status(500).json({ message: "Error deleting visitor", error: error.message });
  }
};

/**
 * Get all visitor records for the current day
 * @route GET /visitors/daily-records
 */
exports.getDailyVisitorRecords = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Start of tomorrow

    const dailyRecords = await Visitor.find({
      entryTime: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ entryTime: -1 }); // Sort by most recent entry first

    res.status(200).json(dailyRecords);
  } catch (error) {
    console.error("Error fetching daily visitor records:", error);
    res.status(500).json({ message: "Error fetching daily visitor records", error: error.message });
  }
};

/**
 * Register a new visitor
 * @route POST /visitors/register
 */
exports.registerVisitor = async (req, res) => {
  try {
    const { name, phone, purpose, department, faculty } = req.body;
    
    // Validate input
    if (!name || !phone || !purpose || !department || !faculty) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if visitor already exists with active entry
    const existingVisitor = await Visitor.findOne({ 
      phone, 
      hasExited: false 
    });
    
    if (existingVisitor) {
      return res.status(400).json({ 
        message: 'Visitor already has an active entry', 
        visitor: existingVisitor 
      });
    }
    
    // Create new visitor
    const visitor = new Visitor({
      name,
      phone,
      purpose,
      department,
      faculty
    });
    
    await visitor.save();
    
    // Get the faculty member to notify
    const facultyMember = await User.findById(faculty);
    
    // Send notification to the selected faculty
    if (facultyMember) {
      try {
        const io = req.app.get('io');
        if (io) {
          io.to(`user_${facultyMember._id}`).emit('newVisitor', {
            message: `New visitor ${name} has arrived to see you.`,
            visitor: visitor
          });
        }
      } catch (notifyError) {
        console.error("Error sending faculty notification:", notifyError);
      }
    }
    
    res.status(201).json({ message: 'Visitor registered successfully', visitor });
  } catch (error) {
    console.error('Error registering visitor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Get visitor by phone
exports.getVisitorByPhone = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.params.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });
    res.status(200).json(visitor);
  } catch (error) {
    res.status(500).json({ message: "Error fetching visitor", error });
  }
};

// ✅ Register visitor entry
exports.visitorEntry = async (req, res) => {
  try {
    // Create a new visitor object from the request body
    const visitor = new Visitor(req.body); 
    
    // *** Automatically set exitRequested to true upon entry ***
    visitor.exitRequested = true; 

    // Save the new visitor document to the database
    await visitor.save(); 

    // *** Notify the director immediately since exit is requested ***
    try {
      notifyDirector(`📢 Exit Request (Auto): Visitor ${visitor.name} entered and wants to exit.`);
    } catch (notifyError) {
      console.error("Notification error during entry:", notifyError);
    }

    // Send a success response back to the client
    res.status(201).json({ message: "Visitor entry registered, exit requested automatically", visitor }); 
  } catch (error) {
    // Handle potential errors during the process
    console.error("Error registering visitor entry:", error); 
    res.status(500).json({ message: "Error registering entry", error: error.message });
  }
};

// ✅ Request exit approval
exports.requestExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    visitor.exitRequested = true;
    await visitor.save();

    // Add try-catch for notification
    try {
      notifyDirector(`📢 Exit Request: Visitor ${visitor.name} wants to exit.`);
    } catch (notifyError) {
      console.error("Notification error:", notifyError);
    }

    res.status(200).json({ message: "Exit request sent", visitor });
  } catch (error) {
    console.error("Request exit error:", error);
    res.status(500).json({ message: "Error requesting exit", error: error.message });
  }
};

// ✅ Approve exit
exports.approveExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    visitor.exitApproved = true;
    await visitor.save();

    notifyGuard(`✅ Exit Approved: Visitor ${visitor.name} can exit.`);
    res.status(200).json({ message: "Exit approved", visitor });
  } catch (error) {
    res.status(500).json({ message: "Error approving exit", error });
  }
};

// ✅ Confirm exit
exports.confirmExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    if (!visitor.exitApproved) {
      return res.status(400).json({ message: "Exit not approved yet!" });
    }

    visitor.hasExited = true;
    visitor.exitTime = new Date();
    await visitor.save();

    notifyDirector(`🚪 Visitor ${visitor.name} has exited.`);
    res.status(200).json({ message: "Exit confirmed", visitor });
  } catch (error) {
    res.status(500).json({ message: "Error confirming exit", error });
  }
};

// ✅ Delete visitor
exports.deleteVisitor = async (req, res) => {
  try {
    await Visitor.findOneAndDelete({ phone: req.params.phone });
    res.status(200).json({ message: "Visitor deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting visitor", error });
  }
};

/**
 * Get all visitor records for the current day
 * @route GET /visitors/daily-records
 */
exports.getDailyVisitorRecords = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Start of tomorrow

    const dailyRecords = await Visitor.find({
      entryTime: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ entryTime: -1 }); // Sort by most recent entry first

    res.status(200).json(dailyRecords);
  } catch (error) {
    console.error("Error fetching daily visitor records:", error);
    res.status(500).json({ message: "Error fetching daily visitor records", error: error.message });
  }
};

exports.registerVisitor = async (req, res) => {
  try {
    const { name, phone, purpose, department, faculty } = req.body;
    
    // Validate input
    if (!name || !phone || !purpose || !department || !faculty) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Create new visitor
    const visitor = new Visitor({
      name,
      phone,
      purpose,
      department,
      faculty
    });
    
    await visitor.save();
    
    // Get the faculty member to notify
    const facultyMember = await User.findById(faculty);
    
    // Send notification only to the selected faculty
    if (facultyMember) {
      const io = req.app.get('io');
      io.to(`user_${facultyMember._id}`).emit('newVisitor', {
        message: `New visitor ${name} has arrived to see you.`,
        visitor: visitor
      });
      
      // You could also implement email notifications here
    }
    
    res.status(201).json({ message: 'Visitor registered successfully', visitor });
  } catch (error) {
    console.error('Error registering visitor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Get visitor by phone
exports.getVisitorByPhone = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.params.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });
    res.status(200).json(visitor);
  } catch (error) {
    res.status(500).json({ message: "Error fetching visitor", error });
  }
};

// ✅ Register visitor entry
exports.visitorEntry = async (req, res) => {
  try {
    // Create a new visitor object from the request body
    const visitor = new Visitor(req.body); 
    
    // *** Automatically set exitRequested to true upon entry ***
    visitor.exitRequested = true; 

    // Save the new visitor document to the database
    await visitor.save(); 

    // *** Notify the director immediately since exit is requested ***
    try {
      notifyDirector(`📢 Exit Request (Auto): Visitor ${visitor.name} entered and wants to exit.`);
    } catch (notifyError) {
      console.error("Notification error during entry:", notifyError);
    }

    // Send a success response back to the client
    res.status(201).json({ message: "Visitor entry registered, exit requested automatically", visitor }); 
  } catch (error) {
    // Handle potential errors during the process
    console.error("Error registering visitor entry:", error); 
    res.status(500).json({ message: "Error registering entry", error: error.message });
  }
};

// ✅ Request exit approval
exports.requestExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    visitor.exitRequested = true;
    await visitor.save();

    // Add try-catch for notification
    try {
      notifyDirector(`📢 Exit Request: Visitor ${visitor.name} wants to exit.`);
    } catch (notifyError) {
      console.error("Notification error:", notifyError);
    }

    res.status(200).json({ message: "Exit request sent", visitor });
  } catch (error) {
    console.error("Request exit error:", error);
    res.status(500).json({ message: "Error requesting exit", error: error.message });
  }
};

// ✅ Approve exit
exports.approveExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    visitor.exitApproved = true;
    await visitor.save();

    notifyGuard(`✅ Exit Approved: Visitor ${visitor.name} can exit.`);
    res.status(200).json({ message: "Exit approved", visitor });
  } catch (error) {
    res.status(500).json({ message: "Error approving exit", error });
  }
};

// ✅ Confirm exit
exports.confirmExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    if (!visitor.exitApproved) {
      return res.status(400).json({ message: "Exit not approved yet!" });
    }

    visitor.hasExited = true;
    visitor.exitTime = new Date();
    await visitor.save();

    notifyDirector(`🚪 Visitor ${visitor.name} has exited.`);
    res.status(200).json({ message: "Exit confirmed", visitor });
  } catch (error) {
    res.status(500).json({ message: "Error confirming exit", error });
  }
};

// ✅ Delete visitor
exports.deleteVisitor = async (req, res) => {
  try {
    await Visitor.findOneAndDelete({ phone: req.params.phone });
    res.status(200).json({ message: "Visitor deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting visitor", error });
  }
};

/**
 * Get all visitor records for the current day
 * @route GET /visitors/daily-records
 */
exports.getDailyVisitorRecords = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Start of tomorrow

    const dailyRecords = await Visitor.find({
      entryTime: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ entryTime: -1 }); // Sort by most recent entry first

    res.status(200).json(dailyRecords);
  } catch (error) {
    console.error("Error fetching daily visitor records:", error);
    res.status(500).json({ message: "Error fetching daily visitor records", error: error.message });
  }
};

exports.registerVisitor = async (req, res) => {
  try {
    const { name, phone, purpose, department, faculty } = req.body;
    
    // Validate input
    if (!name || !phone || !purpose || !department || !faculty) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Create new visitor
    const visitor = new Visitor({
      name,
      phone,
      purpose,
      department,
      faculty
    });
    
    await visitor.save();
    
    // Get the faculty member to notify
    const facultyMember = await User.findById(faculty);
    
    // Send notification only to the selected faculty
    if (facultyMember) {
      const io = req.app.get('io');
      io.to(`user_${facultyMember._id}`).emit('newVisitor', {
        message: `New visitor ${name} has arrived to see you.`,
        visitor: visitor
      });
      
      // You could also implement email notifications here
    }
    
    res.status(201).json({ message: 'Visitor registered successfully', visitor });
  } catch (error) {
    console.error('Error registering visitor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Get visitor by phone
exports.getVisitorByPhone = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.params.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });
    res.status(200).json(visitor);
  } catch (error) {
    res.status(500).json({ message: "Error fetching visitor", error });
  }
};

// ✅ Register visitor entry
exports.visitorEntry = async (req, res) => {
  try {
    // Create a new visitor object from the request body
    const visitor = new Visitor(req.body); 
    
    // *** Automatically set exitRequested to true upon entry ***
    visitor.exitRequested = true; 

    // Save the new visitor document to the database
    await visitor.save(); 

    // *** Notify the director immediately since exit is requested ***
    try {
      notifyDirector(`📢 Exit Request (Auto): Visitor ${visitor.name} entered and wants to exit.`);
    } catch (notifyError) {
      console.error("Notification error during entry:", notifyError);
    }

    // Send a success response back to the client
    res.status(201).json({ message: "Visitor entry registered, exit requested automatically", visitor }); 
  } catch (error) {
    // Handle potential errors during the process
    console.error("Error registering visitor entry:", error); 
    res.status(500).json({ message: "Error registering entry", error: error.message });
  }
};

// ✅ Request exit approval
exports.requestExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    visitor.exitRequested = true;
    await visitor.save();

    // Add try-catch for notification
    try {
      notifyDirector(`📢 Exit Request: Visitor ${visitor.name} wants to exit.`);
    } catch (notifyError) {
      console.error("Notification error:", notifyError);
    }

    res.status(200).json({ message: "Exit request sent", visitor });
  } catch (error) {
    console.error("Request exit error:", error);
    res.status(500).json({ message: "Error requesting exit", error: error.message });
  }
};

// ✅ Approve exit
exports.approveExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    visitor.exitApproved = true;
    await visitor.save();

    notifyGuard(`✅ Exit Approved: Visitor ${visitor.name} can exit.`);
    res.status(200).json({ message: "Exit approved", visitor });
  } catch (error) {
    res.status(500).json({ message: "Error approving exit", error });
  }
};

// ✅ Confirm exit
exports.confirmExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    if (!visitor.exitApproved) {
      return res.status(400).json({ message: "Exit not approved yet!" });
    }

    visitor.hasExited = true;
    visitor.exitTime = new Date();
    await visitor.save();

    notifyDirector(`🚪 Visitor ${visitor.name} has exited.`);
    res.status(200).json({ message: "Exit confirmed", visitor });
  } catch (error) {
    res.status(500).json({ message: "Error confirming exit", error });
  }
};

// ✅ Delete visitor
exports.deleteVisitor = async (req, res) => {
  try {
    await Visitor.findOneAndDelete({ phone: req.params.phone });
    res.status(200).json({ message: "Visitor deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting visitor", error });
  }
};

/**
 * Get all visitor records for the current day
 * @route GET /visitors/daily-records
 */
exports.getDailyVisitorRecords = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Start of tomorrow

    const dailyRecords = await Visitor.find({
      entryTime: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ entryTime: -1 }); // Sort by most recent entry first

    res.status(200).json(dailyRecords);
  } catch (error) {
    console.error("Error fetching daily visitor records:", error);
    res.status(500).json({ message: "Error fetching daily visitor records", error: error.message });
  }
};

exports.registerVisitor = async (req, res) => {
  try {
    const { name, phone, purpose, department, faculty } = req.body;
    
    // Validate input
    if (!name || !phone || !purpose || !department || !faculty) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Create new visitor
    const visitor = new Visitor({
      name,
      phone,
      purpose,
      department,
      faculty
    });
    
    await visitor.save();
    
    // Get the faculty member to notify
    const facultyMember = await User.findById(faculty);
    
    // Send notification only to the selected faculty
    if (facultyMember) {
      const io = req.app.get('io');
      io.to(`user_${facultyMember._id}`).emit('newVisitor', {
        message: `New visitor ${name} has arrived to see you.`,
        visitor: visitor
      });
      
      // You could also implement email notifications here
    }
    
    res.status(201).json({ message: 'Visitor registered successfully', visitor });
  } catch (error) {
    console.error('Error registering visitor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Get visitor by phone
exports.getVisitorByPhone = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.params.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });
    res.status(200).json(visitor);
  } catch (error) {
    res.status(500).json({ message: "Error fetching visitor", error });
  }
};

// ✅ Register visitor entry
exports.visitorEntry = async (req, res) => {
  try {
    // Create a new visitor object from the request body
    const visitor = new Visitor(req.body); 
    
    // *** Automatically set exitRequested to true upon entry ***
    visitor.exitRequested = true; 

    // Save the new visitor document to the database
    await visitor.save(); 

    // *** Notify the director immediately since exit is requested ***
    try {
      notifyDirector(`📢 Exit Request (Auto): Visitor ${visitor.name} entered and wants to exit.`);
    } catch (notifyError) {
      console.error("Notification error during entry:", notifyError);
    }

    // Send a success response back to the client
    res.status(201).json({ message: "Visitor entry registered, exit requested automatically", visitor }); 
  } catch (error) {
    // Handle potential errors during the process
    console.error("Error registering visitor entry:", error); 
    res.status(500).json({ message: "Error registering entry", error: error.message });
  }
};

// ✅ Request exit approval
exports.requestExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    visitor.exitRequested = true;
    await visitor.save();

    // Add try-catch for notification
    try {
      notifyDirector(`📢 Exit Request: Visitor ${visitor.name} wants to exit.`);
    } catch (notifyError) {
      console.error("Notification error:", notifyError);
    }

    res.status(200).json({ message: "Exit request sent", visitor });
  } catch (error) {
    console.error("Request exit error:", error);
    res.status(500).json({ message: "Error requesting exit", error: error.message });
  }
};

// ✅ Approve exit
exports.approveExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    visitor.exitApproved = true;
    await visitor.save();

    notifyGuard(`✅ Exit Approved: Visitor ${visitor.name} can exit.`);
    res.status(200).json({ message: "Exit approved", visitor });
  } catch (error) {
    res.status(500).json({ message: "Error approving exit", error });
  }
};

// ✅ Confirm exit
exports.confirmExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    if (!visitor.exitApproved) {
      return res.status(400).json({ message: "Exit not approved yet!" });
    }

    visitor.hasExited = true;
    visitor.exitTime = new Date();
    await visitor.save();

    notifyDirector(`🚪 Visitor ${visitor.name} has exited.`);
    res.status(200).json({ message: "Exit confirmed", visitor });
  } catch (error) {
    res.status(500).json({ message: "Error confirming exit", error });
  }
};

// ✅ Delete visitor
exports.deleteVisitor = async (req, res) => {
  try {
    await Visitor.findOneAndDelete({ phone: req.params.phone });
    res.status(200).json({ message: "Visitor deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting visitor", error });
  }
};

/**
 * Get all visitor records for the current day
 * @route GET /visitors/daily-records
 */
exports.getDailyVisitorRecords = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Start of tomorrow

    const dailyRecords = await Visitor.find({
      entryTime: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ entryTime: -1 }); // Sort by most recent entry first

    res.status(200).json(dailyRecords);
  } catch (error) {
    console.error("Error fetching daily visitor records:", error);
    res.status(500).json({ message: "Error fetching daily visitor records", error: error.message });
  }
};

exports.registerVisitor = async (req, res) => {
  try {
    const { name, phone, purpose, department, faculty } = req.body;
    
    // Validate input
    if (!name || !phone || !purpose || !department || !faculty) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Create new visitor
    const visitor = new Visitor({
      name,
      phone,
      purpose,
      department,
      faculty
    });
    
    await visitor.save();
    
    // Get the faculty member to notify
    const facultyMember = await User.findById(faculty);
    
    // Send notification only to the selected faculty
    if (facultyMember) {
      const io = req.app.get('io');
      io.to(`user_${facultyMember._id}`).emit('newVisitor', {
        message: `New visitor ${name} has arrived to see you.`,
        visitor: visitor
      });
      
      // You could also implement email notifications here
    }
    
    res.status(201).json({ message: 'Visitor registered successfully', visitor });
  } catch (error) {
    console.error('Error registering visitor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Get visitor by phone
exports.getVisitorByPhone = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.params.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });
    res.status(200).json(visitor);
  } catch (error) {
    res.status(500).json({ message: "Error fetching visitor", error });
  }
};

// ✅ Register visitor entry
exports.visitorEntry = async (req, res) => {
  try {
    // Create a new visitor object from the request body
    const visitor = new Visitor(req.body); 
    
    // *** Automatically set exitRequested to true upon entry ***
    visitor.exitRequested = true; 

    // Save the new visitor document to the database
    await visitor.save(); 

    // *** Notify the director immediately since exit is requested ***
    try {
      notifyDirector(`📢 Exit Request (Auto): Visitor ${visitor.name} entered and wants to exit.`);
    } catch (notifyError) {
      console.error("Notification error during entry:", notifyError);
    }

    // Send a success response back to the client
    res.status(201).json({ message: "Visitor entry registered, exit requested automatically", visitor }); 
  } catch (error) {
    // Handle potential errors during the process
    console.error("Error registering visitor entry:", error); 
    res.status(500).json({ message: "Error registering entry", error: error.message });
  }
};

// ✅ Request exit approval
exports.requestExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    visitor.exitRequested = true;
    await visitor.save();

    // Add try-catch for notification
    try {
      notifyDirector(`📢 Exit Request: Visitor ${visitor.name} wants to exit.`);
    } catch (notifyError) {
      console.error("Notification error:", notifyError);
    }

    res.status(200).json({ message: "Exit request sent", visitor });
  } catch (error) {
    console.error("Request exit error:", error);
    res.status(500).json({ message: "Error requesting exit", error: error.message });
  }
};

// ✅ Approve exit
exports.approveExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    visitor.exitApproved = true;
    await visitor.save();

    notifyGuard(`✅ Exit Approved: Visitor ${visitor.name} can exit.`);
    res.status(200).json({ message: "Exit approved", visitor });
  } catch (error) {
    res.status(500).json({ message: "Error approving exit", error });
  }
};

// ✅ Confirm exit
exports.confirmExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    if (!visitor.exitApproved) {
      return res.status(400).json({ message: "Exit not approved yet!" });
    }

    visitor.hasExited = true;
    visitor.exitTime = new Date();
    await visitor.save();

    notifyDirector(`🚪 Visitor ${visitor.name} has exited.`);
    res.status(200).json({ message: "Exit confirmed", visitor });
  } catch (error) {
    res.status(500).json({ message: "Error confirming exit", error });
  }
};

// ✅ Delete visitor
exports.deleteVisitor = async (req, res) => {
  try {
    await Visitor.findOneAndDelete({ phone: req.params.phone });
    res.status(200).json({ message: "Visitor deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting visitor", error });
  }
};

/**
 * Get all visitor records for the current day
 * @route GET /visitors/daily-records
 */
exports.getDailyVisitorRecords = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Start of tomorrow

    const dailyRecords = await Visitor.find({
      entryTime: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ entryTime: -1 }); // Sort by most recent entry first

    res.status(200).json(dailyRecords);
  } catch (error) {
    console.error("Error fetching daily visitor records:", error);
    res.status(500).json({ message: "Error fetching daily visitor records", error: error.message });
  }
};

exports.registerVisitor = async (req, res) => {
  try {
    const { name, phone, purpose, department, faculty } = req.body;
    
    // Validate input
    if (!name || !phone || !purpose || !department || !faculty) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Create new visitor
    const visitor = new Visitor({
      name,
      phone,
      purpose,
      department,
      faculty
    });
    
    await visitor.save();
    
    // Get the faculty member to notify
    const facultyMember = await User.findById(faculty);
    
    // Send notification only to the selected faculty
    if (facultyMember) {
      const io = req.app.get('io');
      io.to(`user_${facultyMember._id}`).emit('newVisitor', {
        message: `New visitor ${name} has arrived to see you.`,
        visitor: visitor
      });
      
      // You could also implement email notifications here
    }
    
    res.status(201).json({ message: 'Visitor registered successfully', visitor });
  } catch (error) {
    console.error('Error registering visitor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Get visitor by phone
exports.getVisitorByPhone = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.params.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });
    res.status(200).json(visitor);
  } catch (error) {
    res.status(500).json({ message: "Error fetching visitor", error });
  }
};

// ✅ Register visitor entry
exports.visitorEntry = async (req, res) => {
  try {
    // Create a new visitor object from the request body
    const visitor = new Visitor(req.body); 
    
    // *** Automatically set exitRequested to true upon entry ***
    visitor.exitRequested = true; 

    // Save the new visitor document to the database
    await visitor.save(); 

    // *** Notify the director immediately since exit is requested ***
    try {
      notifyDirector(`📢 Exit Request (Auto): Visitor ${visitor.name} entered and wants to exit.`);
    } catch (notifyError) {
      console.error("Notification error during entry:", notifyError);
    }

    // Send a success response back to the client
    res.status(201).json({ message: "Visitor entry registered, exit requested automatically", visitor }); 
  } catch (error) {
    // Handle potential errors during the process
    console.error("Error registering visitor entry:", error); 
    res.status(500).json({ message: "Error registering entry", error: error.message });
  }
};

// ✅ Request exit approval
exports.requestExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    visitor.exitRequested = true;
    await visitor.save();

    // Add try-catch for notification
    try {
      notifyDirector(`📢 Exit Request: Visitor ${visitor.name} wants to exit.`);
    } catch (notifyError) {
      console.error("Notification error:", notifyError);
    }

    res.status(200).json({ message: "Exit request sent", visitor });
  } catch (error) {
    console.error("Request exit error:", error);
    res.status(500).json({ message: "Error requesting exit", error: error.message });
  }
};

// ✅ Approve exit
exports.approveExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    visitor.exitApproved = true;
    await visitor.save();

    notifyGuard(`✅ Exit Approved: Visitor ${visitor.name} can exit.`);
    res.status(200).json({ message: "Exit approved", visitor });
  } catch (error) {
    res.status(500).json({ message: "Error approving exit", error });
  }
};

// ✅ Confirm exit
exports.confirmExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    if (!visitor.exitApproved) {
      return res.status(400).json({ message: "Exit not approved yet!" });
    }

    visitor.hasExited = true;
    visitor.exitTime = new Date();
    await visitor.save();

    notifyDirector(`🚪 Visitor ${visitor.name} has exited.`);
    res.status(200).json({ message: "Exit confirmed", visitor });
  } catch (error) {
    res.status(500).json({ message: "Error confirming exit", error });
  }
};

// ✅ Delete visitor
exports.deleteVisitor = async (req, res) => {
  try {
    await Visitor.findOneAndDelete({ phone: req.params.phone });
    res.status(200).json({ message: "Visitor deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting visitor", error });
  }
};

/**
 * Get all visitor records for the current day
 * @route GET /visitors/daily-records
 */
exports.getDailyVisitorRecords = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Start of tomorrow

    const dailyRecords = await Visitor.find({
      entryTime: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ entryTime: -1 }); // Sort by most recent entry first

    res.status(200).json(dailyRecords);
  } catch (error) {
    console.error("Error fetching daily visitor records:", error);
    res.status(500).json({ message: "Error fetching daily visitor records", error: error.message });
  }
};

exports.registerVisitor = async (req, res) => {
  try {
    const { name, phone, purpose, department, faculty } = req.body;
    
    // Validate input
    if (!name || !phone || !purpose || !department || !faculty) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Create new visitor
    const visitor = new Visitor({
      name,
      phone,
      purpose,
      department,
      faculty
    });
    
    await visitor.save();
    
    // Get the faculty member to notify
    const facultyMember = await User.findById(faculty);
    
    // Send notification only to the selected faculty
    if (facultyMember) {
      const io = req.app.get('io');
      io.to(`user_${facultyMember._id}`).emit('newVisitor', {
        message: `New visitor ${name} has arrived to see you.`,
        visitor: visitor
      });
      
      // You could also implement email notifications here
    }
    
    res.status(201).json({ message: 'Visitor registered successfully', visitor });
  } catch (error) {
    console.error('Error registering visitor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Get visitor by phone
exports.getVisitorByPhone = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.params.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });
    res.status(200).json(visitor);
  } catch (error) {
    res.status(500).json({ message: "Error fetching visitor", error });
  }
};

// ✅ Register visitor entry
exports.visitorEntry = async (req, res) => {
  try {
    // Create a new visitor object from the request body
    const visitor = new Visitor(req.body); 
    
    // *** Automatically set exitRequested to true upon entry ***
    visitor.exitRequested = true; 

    // Save the new visitor document to the database
    await visitor.save(); 

    // *** Notify the director immediately since exit is requested ***
    try {
      notifyDirector(`📢 Exit Request (Auto): Visitor ${visitor.name} entered and wants to exit.`);
    } catch (notifyError) {
      console.error("Notification error during entry:", notifyError);
    }

    // Send a success response back to the client
    res.status(201).json({ message: "Visitor entry registered, exit requested automatically", visitor }); 
  } catch (error) {
    // Handle potential errors during the process
    console.error("Error registering visitor entry:", error); 
    res.status(500).json({ message: "Error registering entry", error: error.message });
  }
};

// ✅ Request exit approval
exports.requestExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    visitor.exitRequested = true;
    await visitor.save();

    // Add try-catch for notification
    try {
      notifyDirector(`📢 Exit Request: Visitor ${visitor.name} wants to exit.`);
    } catch (notifyError) {
      console.error("Notification error:", notifyError);
    }

    res.status(200).json({ message: "Exit request sent", visitor });
  } catch (error) {
    console.error("Request exit error:", error);
    res.status(500).json({ message: "Error requesting exit", error: error.message });
  }
};

// ✅ Approve exit
exports.approveExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    visitor.exitApproved = true;
    await visitor.save();

    notifyGuard(`✅ Exit Approved: Visitor ${visitor.name} can exit.`);
    res.status(200).json({ message: "Exit approved", visitor });
  } catch (error) {
    res.status(500).json({ message: "Error approving exit", error });
  }
};

// ✅ Confirm exit
exports.confirmExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    if (!visitor.exitApproved) {
      return res.status(400).json({ message: "Exit not approved yet!" });
    }

    visitor.hasExited = true;
    visitor.exitTime = new Date();
    await visitor.save();

    notifyDirector(`🚪 Visitor ${visitor.name} has exited.`);
    res.status(200).json({ message: "Exit confirmed", visitor });
  } catch (error) {
    res.status(500).json({ message: "Error confirming exit", error });
  }
};

// ✅ Delete visitor
exports.deleteVisitor = async (req, res) => {
  try {
    await Visitor.findOneAndDelete({ phone: req.params.phone });
    res.status(200).json({ message: "Visitor deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting visitor", error });
  }
};

/**
 * Get all visitor records for the current day
 * @route GET /visitors/daily-records
 */
exports.getDailyVisitorRecords = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Start of tomorrow

    const dailyRecords = await Visitor.find({
      entryTime: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ entryTime: -1 }); // Sort by most recent entry first

    res.status(200).json(dailyRecords);
  } catch (error) {
    console.error("Error fetching daily visitor records:", error);
    res.status(500).json({ message: "Error fetching daily visitor records", error: error.message });
  }
};

exports.registerVisitor = async (req, res) => {
  try {
    const { name, phone, purpose, department, faculty } = req.body;
    
    // Validate input
    if (!name || !phone || !purpose || !department || !faculty) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Create new visitor
    const visitor = new Visitor({
      name,
      phone,
      purpose,
      department,
      faculty
    });
    
    await visitor.save();
    
    // Get the faculty member to notify
    const facultyMember = await User.findById(faculty);
    
    // Send notification only to the selected faculty
    if (facultyMember) {
      const io = req.app.get('io');
      io.to(`user_${facultyMember._id}`).emit('newVisitor', {
        message: `New visitor ${name} has arrived to see you.`,
        visitor: visitor
      });
      
      // You could also implement email notifications here
    }
    
    res.status(201).json({ message: 'Visitor registered successfully', visitor });
  } catch (error) {
    console.error('Error registering visitor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Get visitor by phone
exports.getVisitorByPhone = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.params.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });
    res.status(200).json(visitor);
  } catch (error) {
    res.status(500).json({ message: "Error fetching visitor", error });
  }
};

// ✅ Register visitor entry
exports.visitorEntry = async (req, res) => {
  try {
    // Create a new visitor object from the request body
    const visitor = new Visitor(req.body); 
    
    // *** Automatically set exitRequested to true upon entry ***
    visitor.exitRequested = true; 

    // Save the new visitor document to the database
    await visitor.save(); 

    // *** Notify the director immediately since exit is requested ***
    try {
      notifyDirector(`📢 Exit Request (Auto): Visitor ${visitor.name} entered and wants to exit.`);
    } catch (notifyError) {
      console.error("Notification error during entry:", notifyError);
    }

    // Send a success response back to the client
    res.status(201).json({ message: "Visitor entry registered, exit requested automatically", visitor }); 
  } catch (error) {
    // Handle potential errors during the process
    console.error("Error registering visitor entry:", error); 
    res.status(500).json({ message: "Error registering entry", error: error.message });
  }
};

// ✅ Request exit approval
exports.requestExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    visitor.exitRequested = true;
    await visitor.save();

    // Add try-catch for notification
    try {
      notifyDirector(`📢 Exit Request: Visitor ${visitor.name} wants to exit.`);
    } catch (notifyError) {
      console.error("Notification error:", notifyError);
    }

    res.status(200).json({ message: "Exit request sent", visitor });
  } catch (error) {
    console.error("Request exit error:", error);
    res.status(500).json({ message: "Error requesting exit", error: error.message });
  }
};

// ✅ Approve exit
exports.approveExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    visitor.exitApproved = true;
    await visitor.save();

    notifyGuard(`✅ Exit Approved: Visitor ${visitor.name} can exit.`);
    res.status(200).json({ message: "Exit approved", visitor });
  } catch (error) {
    res.status(500).json({ message: "Error approving exit", error });
  }
};

// ✅ Confirm exit
exports.confirmExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    if (!visitor.exitApproved) {
      return res.status(400).json({ message: "Exit not approved yet!" });
    }

    visitor.hasExited = true;
    visitor.exitTime = new Date();
    await visitor.save();

    notifyDirector(`🚪 Visitor ${visitor.name} has exited.`);
    res.status(200).json({ message: "Exit confirmed", visitor });
  } catch (error) {
    res.status(500).json({ message: "Error confirming exit", error });
  }
};

// ✅ Delete visitor
exports.deleteVisitor = async (req, res) => {
  try {
    await Visitor.findOneAndDelete({ phone: req.params.phone });
    res.status(200).json({ message: "Visitor deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting visitor", error });
  }
};

/**
 * Get all visitor records for the current day
 * @route GET /visitors/daily-records
 */
exports.getDailyVisitorRecords = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Start of tomorrow

    const dailyRecords = await Visitor.find({
      entryTime: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ entryTime: -1 }); // Sort by most recent entry first

    res.status(200).json(dailyRecords);
  } catch (error) {
    console.error("Error fetching daily visitor records:", error);
    res.status(500).json({ message: "Error fetching daily visitor records", error: error.message });
  }
};

exports.registerVisitor = async (req, res) => {
  try {
    const { name, phone, purpose, department, faculty } = req.body;
    
    // Validate input
    if (!name || !phone || !purpose || !department || !faculty) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Create new visitor
    const visitor = new Visitor({
      name,
      phone,
      purpose,
      department,
      faculty
    });
    
    await visitor.save();
    
    // Get the faculty member to notify
    const facultyMember = await User.findById(faculty);
    
    // Send notification only to the selected faculty
    if (facultyMember) {
      const io = req.app.get('io');
      io.to(`user_${facultyMember._id}`).emit('newVisitor', {
        message: `New visitor ${name} has arrived to see you.`,
        visitor: visitor
      });
      
      // You could also implement email notifications here
    }
    
    res.status(201).json({ message: 'Visitor registered successfully', visitor });
  } catch (error) {
    console.error('Error registering visitor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Get visitor by phone
exports.getVisitorByPhone = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.params.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });
    res.status(200).json(visitor);
  } catch (error) {
    res.status(500).json({ message: "Error fetching visitor", error });
  }
};

// ✅ Register visitor entry
exports.visitorEntry = async (req, res) => {
  try {
    // Create a new visitor object from the request body
    const visitor = new Visitor(req.body); 
    
    // *** Automatically set exitRequested to true upon entry ***
    visitor.exitRequested = true; 

    // Save the new visitor document to the database
    await visitor.save(); 

    // *** Notify the director immediately since exit is requested ***
    try {
      notifyDirector(`📢 Exit Request (Auto): Visitor ${visitor.name} entered and wants to exit.`);
    } catch (notifyError) {
      console.error("Notification error during entry:", notifyError);
    }

    // Send a success response back to the client
    res.status(201).json({ message: "Visitor entry registered, exit requested automatically", visitor }); 
  } catch (error) {
    // Handle potential errors during the process
    console.error("Error registering visitor entry:", error); 
    res.status(500).json({ message: "Error registering entry", error: error.message });
  }
};

// ✅ Request exit approval
exports.requestExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    visitor.exitRequested = true;
    await visitor.save();

    // Add try-catch for notification
    try {
      notifyDirector(`📢 Exit Request: Visitor ${visitor.name} wants to exit.`);
    } catch (notifyError) {
      console.error("Notification error:", notifyError);
    }

    res.status(200).json({ message: "Exit request sent", visitor });
  } catch (error) {
    console.error("Request exit error:", error);
    res.status(500).json({ message: "Error requesting exit", error: error.message });
  }
};

// ✅ Approve exit
exports.approveExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    visitor.exitApproved = true;
    await visitor.save();

    notifyGuard(`✅ Exit Approved: Visitor ${visitor.name} can exit.`);
    res.status(200).json({ message: "Exit approved", visitor });
  } catch (error) {
    res.status(500).json({ message: "Error approving exit", error });
  }
};

// ✅ Confirm exit
exports.confirmExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    if (!visitor.exitApproved) {
      return res.status(400).json({ message: "Exit not approved yet!" });
    }

    visitor.hasExited = true;
    visitor.exitTime = new Date();
    await visitor.save();

    notifyDirector(`🚪 Visitor ${visitor.name} has exited.`);
    res.status(200).json({ message: "Exit confirmed", visitor });
  } catch (error) {
    res.status(500).json({ message: "Error confirming exit", error });
  }
};

// ✅ Delete visitor
exports.deleteVisitor = async (req, res) => {
  try {
    await Visitor.findOneAndDelete({ phone: req.params.phone });
    res.status(200).json({ message: "Visitor deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting visitor", error });
  }
};

/**
 * Get all visitor records for the current day
 * @route GET /visitors/daily-records
 */
exports.getDailyVisitorRecords = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Start of tomorrow

    const dailyRecords = await Visitor.find({
      entryTime: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ entryTime: -1 }); // Sort by most recent entry first

    res.status(200).json(dailyRecords);
  } catch (error) {
    console.error("Error fetching daily visitor records:", error);
    res.status(500).json({ message: "Error fetching daily visitor records", error: error.message });
  }
};

exports.registerVisitor = async (req, res) => {
  try {
    const { name, phone, purpose, department, faculty } = req.body;
    
    // Validate input
    if (!name || !phone || !purpose || !department || !faculty) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Create new visitor
    const visitor = new Visitor({
      name,
      phone,
      purpose,
      department,
      faculty
    });
    
    await visitor.save();
    
    // Get the faculty member to notify
    const facultyMember = await User.findById(faculty);
    
    // Send notification only to the selected faculty
    if (facultyMember) {
      const io = req.app.get('io');
      io.to(`user_${facultyMember._id}`).emit('newVisitor', {
        message: `New visitor ${name} has arrived to see you.`,
        visitor: visitor
      });
      
      // You could also implement email notifications here
    }
    
    res.status(201).json({ message: 'Visitor registered successfully', visitor });
  } catch (error) {
    console.error('Error registering visitor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Get visitor by phone
exports.getVisitorByPhone = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.params.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });
    res.status(200).json(visitor);
  } catch (error) {
    res.status(500).json({ message: "Error fetching visitor", error });
  }
};

// ✅ Register visitor entry
exports.visitorEntry = async (req, res) => {
  try {
    // Create a new visitor object from the request body
    const visitor = new Visitor(req.body); 
    
    // *** Automatically set exitRequested to true upon entry ***
    visitor.exitRequested = true; 

    // Save the new visitor document to the database
    await visitor.save(); 

    // *** Notify the director immediately since exit is requested ***
    try {
      notifyDirector(`📢 Exit Request (Auto): Visitor ${visitor.name} entered and wants to exit.`);
    } catch (notifyError) {
      console.error("Notification error during entry:", notifyError);
    }

    // Send a success response back to the client
    res.status(201).json({ message: "Visitor entry registered, exit requested automatically", visitor }); 
  } catch (error) {
    // Handle potential errors during the process
    console.error("Error registering visitor entry:", error); 
    res.status(500).json({ message: "Error registering entry", error: error.message });
  }
};

// ✅ Request exit approval
exports.requestExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    visitor.exitRequested = true;
    await visitor.save();

    // Add try-catch for notification
    try {
      notifyDirector(`📢 Exit Request: Visitor ${visitor.name} wants to exit.`);
    } catch (notifyError) {
      console.error("Notification error:", notifyError);
    }

    res.status(200).json({ message: "Exit request sent", visitor });
  } catch (error) {
    console.error("Request exit error:", error);
    res.status(500).json({ message: "Error requesting exit", error: error.message });
  }
};

// ✅ Approve exit
exports.approveExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    visitor.exitApproved = true;
    await visitor.save();

    notifyGuard(`✅ Exit Approved: Visitor ${visitor.name} can exit.`);
    res.status(200).json({ message: "Exit approved", visitor });
  } catch (error) {
    res.status(500).json({ message: "Error approving exit", error });
  }
};

// ✅ Confirm exit
exports.confirmExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    if (!visitor.exitApproved) {
      return res.status(400).json({ message: "Exit not approved yet!" });
    }

    visitor.hasExited = true;
    visitor.exitTime = new Date();
    await visitor.save();

    notifyDirector(`🚪 Visitor ${visitor.name} has exited.`);
    res.status(200).json({ message: "Exit confirmed", visitor });
  } catch (error) {
    res.status(500).json({ message: "Error confirming exit", error });
  }
};

// ✅ Delete visitor
exports.deleteVisitor = async (req, res) => {
  try {
    await Visitor.findOneAndDelete({ phone: req.params.phone });
    res.status(200).json({ message: "Visitor deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting visitor", error });
  }
};

/**
 * Get all visitor records for the current day
 * @route GET /visitors/daily-records
 */
exports.getDailyVisitorRecords = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Start of tomorrow

    const dailyRecords = await Visitor.find({
      entryTime: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ entryTime: -1 }); // Sort by most recent entry first

    res.status(200).json(dailyRecords);
  } catch (error) {
    console.error("Error fetching daily visitor records:", error);
    res.status(500).json({ message: "Error fetching daily visitor records", error: error.message });
  }
};


