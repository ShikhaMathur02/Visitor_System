const Visitor = require("../models/Visitor");
const { notifyDirector, notifyGuard } = require("../utils/notifications");

// ✅ Get all visitors
exports.getAllVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find();
    res.status(200).json(visitors);
  } catch (error) {
    res.status(500).json({ message: "Error fetching visitors", error });
  }
};

// Get visitors by faculty ID
exports.getVisitorsByFaculty = async (req, res) => {
  try {
    const facultyId = req.params.facultyId;
    const visitors = await Visitor.find({ faculty: facultyId }).sort({ entryTime: -1 });
    res.status(200).json(visitors);
  } catch (error) {
    console.error("Error fetching faculty visitors:", error);
    res.status(500).json({ message: "Error fetching faculty visitors", error: error.message });
  }
};

// Get visitors by department
exports.getVisitorsByDepartment = async (req, res) => {
  try {
    const department = req.params.department;
    const visitors = await Visitor.find({ department }).sort({ entryTime: -1 });
    res.status(200).json(visitors);
  } catch (error) {
    console.error("Error fetching department visitors:", error);
    res.status(500).json({ message: "Error fetching department visitors", error: error.message });
  }
};

// ✅ Get pending exits
exports.getPendingExits = async (req, res) => {
  try {
    const pendingVisitors = await Visitor.find({ 
      exitRequested: true, 
      exitApproved: false,
      hasExited: false  // Add this condition
    }).sort({ entryTime: -1 });  // Sort by most recent first

    console.log(`Found ${pendingVisitors.length} pending visitor exits`); // Add logging
    res.status(200).json(pendingVisitors);
  } catch (error) {
    console.error("Error in getPendingExits:", error);
    res.status(500).json({ 
      message: 'Error fetching pending visitor exits', 
      error: error.message 
    });
  }
};

exports.getApprovedExits = async (req, res) => {
  try {
    const approvedVisitors = await Visitor.find({ 
      exitApproved: true, 
      hasExited: false 
    }).sort({ entryTime: -1 });

    console.log(`Found ${approvedVisitors.length} approved visitor exits`); // Add logging
    res.status(200).json(approvedVisitors);
  } catch (error) {
    console.error("Error in getApprovedExits:", error);
    res.status(500).json({ 
      message: 'Error fetching approved visitor exits', 
      error: error.message 
    });
  }
};
// Get pending exits by faculty ID
exports.getPendingExitsByFaculty = async (req, res) => {
  try {
    const facultyId = req.params.facultyId;
    const pendingVisitors = await Visitor.find({ 
      faculty: facultyId,
      exitRequested: true, 
      exitApproved: false,
      hasExited: false
    }).sort({ entryTime: -1 });

    res.status(200).json(pendingVisitors);
  } catch (error) {
    console.error("Error fetching faculty pending exits:", error);
    res.status(500).json({ 
      message: 'Error fetching faculty pending exits', 
      error: error.message 
    });
  }
};

// Get daily records by faculty ID
exports.getDailyVisitorRecordsByFaculty = async (req, res) => {
  try {
    const facultyId = req.params.facultyId;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Start of tomorrow

    const dailyRecords = await Visitor.find({
      faculty: facultyId,
      entryTime: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ entryTime: -1 });

    res.status(200).json(dailyRecords);
  } catch (error) {
    console.error("Error fetching faculty daily records:", error);
    res.status(500).json({ 
      message: "Error fetching faculty daily records", 
      error: error.message 
    });
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
    // Use findOneAndUpdate instead of findOne and save to avoid validation issues
    const visitor = await Visitor.findOneAndUpdate(
      { phone: req.body.phone },
      { exitApproved: true },
      { new: true, runValidators: false } // Return updated document and skip validation
    );
    
    if (!visitor) {
      return res.status(404).json({ success: false, message: "Visitor not found" });
    }

    // Notify guard about the approved exit
    try {
      notifyGuard(`✅ Exit Approved: Visitor ${visitor.name} can exit.`);
    } catch (notifyError) {
      console.error("Notification error during exit approval:", notifyError);
      // Continue with the approval process even if notification fails
    }

    res.status(200).json({ success: true, message: "Exit approved", visitor });
  } catch (error) {
    console.error("Error approving exit:", error);
    res.status(500).json({ success: false, message: "Error approving exit", error: error.message });
  }
};

// ✅ Confirm exit
exports.confirmExit = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ phone: req.body.phone });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    if (!visitor.exitApproved) {
      return res.status(400).json({ message: "Exit not approved yet" });
    }

    visitor.hasExited = true;
    visitor.exitTime = new Date();
    await visitor.save();

    // Get the Socket.io instance
    const io = require('../index').io;
    
    // Notify the specific faculty member who approved the exit
    if (io && visitor.faculty) {
      io.to(`user_${visitor.faculty}`).emit('visitorExited', {
        message: `Visitor ${visitor.name} has exited the premises`,
        visitor: {
          name: visitor.name,
          phone: visitor.phone,
          exitTime: visitor.exitTime
        }
      });
      
      console.log(`Exit notification sent to faculty ${visitor.faculty} for visitor ${visitor.name}`);
    }

    res.status(200).json({ message: "Exit confirmed", visitor });
  } catch (error) {
    console.error("Error confirming exit:", error);
    res.status(500).json({ message: "Error confirming exit", error: error.message });
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

// Get visitors pending faculty approval
// @route GET /visitors/pending-faculty-approval
exports.getVisitorsPendingFacultyApproval = async (req, res) => {
  try {
    // Find visitors who have requested exit but not yet approved
    const pendingVisitors = await Visitor.find({
      exitRequested: true,
      exitApproved: false,
      hasExited: false
    }).sort({ entryTime: -1 });

    console.log(`Found ${pendingVisitors.length} visitors pending faculty approval`);
    res.status(200).json(pendingVisitors);
  } catch (error) {
    console.error("Error fetching visitors pending faculty approval:", error);
    res.status(500).json({
      message: "Error fetching visitors pending faculty approval",
      error: error.message
    });
  }
};

// Get visitors who exited today
// @route GET /visitors/exited-today
exports.getVisitorsExitedToday = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const visitors = await Visitor.find({
      exitTime: { $gte: today, $lt: tomorrow },
      hasExited: true
    }).sort({ exitTime: -1 });

    console.log(`Found ${visitors.length} visitors who exited today`);
    res.status(200).json(visitors);
  } catch (error) {
    console.error("Error fetching visitors who exited today:", error);
    res.status(500).json({
      message: "Error fetching visitors who exited today",
      error: error.message
    });
  }
};