const express = require("express");
const router = express.Router();
const authController = require("./controllers/authController");

// Login route
router.post("/login", authController.login);

// Register route (admin only)
router.post("/register", authController.register);

// Get current user
router.get("/me", authController.getCurrentUser);

module.exports = router;