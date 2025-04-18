const Student = require("../models/Student");
const { notifyDirector, notifyGuard } = require("../utils/notifications");
const { generateQR } = require("../middleware/qrGenerator");

/**
 * Get all students
 * @route GET /students
 */
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Error fetching students", error: error.message });
  }
};

/**
 * Get student by ID
 * @route GET /students/:id
 */
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.status(200).json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ message: "Error fetching student", error: error.message });
  }
};

/**
 * Register student entry
 * @route POST /students/entry
 */
exports.studentEntry = async (req, res) => {
  try {
    // Validate required fields
    const { name, studentId, purpose } = req.body;
    if (!name || !studentId || !purpose) {
      return res.status(400).json({ message: "Name, student ID, and purpose are required" });
    }

    // Check if student already has an active entry
    const existingEntry = await Student.findOne({
      studentId,
      hasExited: false
    });

    if (existingEntry) {
      return res.status(400).json({ 
        message: "Student already has an active entry",
        student: existingEntry
      });
    }

    // Create new student entry
    const student = new Student({
      name,
      studentId,
      purpose,
      entryTime: new Date()
    });

    await student.save();

    // Generate QR code for exit
    try {
      const qrData = await generateQR(student._id.toString());
      
      // Notify guard about new entry
      notifyGuard(`New student entry: ${student.name} (${student.studentId})`, 'info');
      
      res.status(201).json({ 
        message: "Student entry registered successfully", 
        student,
        qrCode: qrData
      });
    } catch (qrError) {
      // Still save the entry even if QR generation fails
      console.error("QR generation error:", qrError);
      res.status(201).json({ 
        message: "Student entry registered, but QR code generation failed", 
        student,
        error: qrError.message
      });
    }
  } catch (error) {
    console.error("Error registering student entry:", error);
    res.status(500).json({ message: "Error registering student entry", error: error.message });
  }
};

/**
 * Request student exit
 * @route POST /students/request-exit
 */
exports.requestExit = async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    const student = await Student.findOne({ 
      studentId, 
      hasExited: false 
    });

    if (!student) {
      return res.status(404).json({ message: "No active entry found for this student" });
    }

    if (student.exitRequested) {
      return res.status(400).json({ message: "Exit already requested" });
    }

    student.exitRequested = true;
    await student.save();

    // Notify director about exit request
    notifyDirector(`Student ${student.name} (${student.studentId}) has requested to exit`, 'info');

    res.status(200).json({ 
      message: "Exit request submitted successfully", 
      student 
    });
  } catch (error) {
    console.error("Error requesting student exit:", error);
    res.status(500).json({ message: "Error requesting exit", error: error.message });
  }
};

/**
 * Approve student exit
 * @route POST /students/approve-exit
 */
exports.approveExit = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!student.exitRequested) {
      return res.status(400).json({ message: "Exit has not been requested" });
    }

    if (student.exitApproved) {
      return res.status(400).json({ message: "Exit already approved" });
    }

    if (student.hasExited) {
      return res.status(400).json({ message: "Student has already exited" });
    }

    student.exitApproved = true;
    await student.save();

    // Notify guard about approved exit
    notifyGuard(`Exit approved for student ${student.name} (${student.studentId})`, 'success');

    res.status(200).json({ 
      message: "Exit approved successfully", 
      student 
    });
  } catch (error) {
    console.error("Error approving student exit:", error);
    res.status(500).json({ message: "Error approving exit", error: error.message });
  }
};

/**
 * Confirm student exit
 * @route POST /students/confirm-exit
 */
exports.confirmExit = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!student.exitApproved) {
      return res.status(400).json({ message: "Exit has not been approved yet" });
    }

    if (student.hasExited) {
      return res.status(400).json({ message: "Student has already exited" });
    }

    student.hasExited = true;
    student.exitTime = new Date();
    await student.save();

    // Notify director about confirmed exit
    notifyDirector(`Student ${student.name} (${student.studentId}) has exited`, 'info');

    res.status(200).json({ 
      message: "Exit confirmed successfully", 
      student 
    });
  } catch (error) {
    console.error("Error confirming student exit:", error);
    res.status(500).json({ message: "Error confirming exit", error: error.message });
  }
};

/**
 * Delete student record
 * @route DELETE /students/:id
 */
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.status(200).json({ message: "Student record deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Error deleting student", error: error.message });
  }
};

/**
 * Get students with approved exits
 * @route GET /students/approved-exits
 */
exports.getApprovedExits = async (req, res) => {
  try {
    const Student = require("../models/Student");
    const approvedStudents = await Student.find({ 
      exitApproved: true, 
      hasExited: false 
    });
    res.status(200).json(approvedStudents);
  } catch (error) {
    console.error("Error fetching approved student exits:", error);
    res.status(500).json({ 
      message: 'Error fetching approved student exits', 
      error: error.message 
    });
  }
};

/**
 * Get pending exit requests
 * @route GET /students/pending-exits
 */
exports.getPendingExits = async (req, res) => {
  try {
    const pendingStudents = await Student.find({ 
      exitRequested: true, 
      exitApproved: false 
    });
    res.status(200).json(pendingStudents);
  } catch (error) {
    console.error("Error fetching pending student exits:", error);
    res.status(500).json({ 
      message: 'Error fetching pending student exits', 
      error: error.message 
    });
  }
};
