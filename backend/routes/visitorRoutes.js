import express from "express";
import { registerVisitor, approveVisitor } from "../controllers/visitorController.js";

const router = express.Router();
router.post("/register", registerVisitor);
router.put("/approve/:id", approveVisitor);

export default router;
