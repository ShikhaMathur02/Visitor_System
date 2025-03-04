import express from "express";
import { registerStudent, approveStudent } from "../controllers/studentController.js";

const router = express.Router();
router.post("/register", registerStudent);
router.put("/approve/:id", approveStudent);

export default router;
