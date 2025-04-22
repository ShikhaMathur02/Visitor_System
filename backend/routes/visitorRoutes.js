const express = require("express");
const router = express.Router();
const visitorController = require("../controllers/visitorController");

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
