const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");

// Route to get all student records for the current day
router.get("/daily-records", studentController.getDailyStudentRecords); 

// Route for student entry
router.post("/entry", studentController.studentEntry);

// Route to request exit (using QR or manual)
// Changed from requestStudentExit to requestExit to match the controller function name
router.post("/request-exit", studentController.requestExit);

// Route for faculty to approve exit
// Should be approveExit instead of approveStudentExit
router.post("/approve-exit", studentController.approveExit);

// Route for guard to confirm exit
// Should be confirmExit instead of confirmStudentExit
router.post("/confirm-exit", studentController.confirmExit);

// Route to get pending exit requests for faculty
// Should be getPendingExits instead of getPendingStudentExits
router.get("/pending-exits", studentController.getPendingExits);

// Route to get approved exit requests for guards
// Should be getApprovedExits instead of getApprovedStudentExits
router.get("/approved-exits", studentController.getApprovedExits);

// Route to get students pending faculty approval
router.get("/pending-faculty-approval", studentController.getStudentsPendingFacultyApproval);

// Route to get students who exited today
router.get("/exited-today", studentController.getStudentsExitedToday);

// Route to get a specific student by ID (if needed)
router.get("/:id", studentController.getStudentById);

module.exports = router;
