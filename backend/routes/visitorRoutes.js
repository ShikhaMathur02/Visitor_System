const express = require("express");
const {
  getAllVisitors,
  getVisitorByPhone,
  visitorEntry,
  requestExit,
  approveExit,
  confirmExit,
  deleteVisitor,
  getPendingExits,    // Add this import
  getApprovedExits    // Add this import
} = require("../controllers/visitorController");

const router = express.Router();

// Place specific routes before parameterized routes
router.get("/pending-exits", getPendingExits);     // Use imported controller function
router.get("/approved-exits", getApprovedExits);   // Use imported controller function
router.get("/", getAllVisitors);

// Then add other routes
router.get("/:phone", getVisitorByPhone);
router.post("/entry", visitorEntry);
router.post("/request-exit", requestExit);
router.post("/approve-exit", approveExit);
router.post("/confirm-exit", confirmExit);
router.delete("/:phone", deleteVisitor);

module.exports = router;
