const express = require("express");
const router = express.Router();
const statsController = require("../controllers/statsController");

// Route to get daily statistics
router.get("/today", statsController.getDailyStats);

module.exports = router;