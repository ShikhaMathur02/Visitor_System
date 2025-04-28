const express = require("express");
const router = express.Router();
const statsController = require("../controllers/statsController");

// Route to get daily statistics
router.get("/today", statsController.getDailyStats);

// Route to get faculty-specific daily statistics
router.get("/today/faculty/:facultyId", statsController.getFacultyDailyStats);

module.exports = router;