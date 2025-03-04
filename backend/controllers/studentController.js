import Student from "../models/Student.js";
import { generateQR } from "../middleware/qrGenerator.js";

export const registerStudent = async (req, res) => {
  const { name, studentId, department, purpose } = req.body;
  try {
    const qrCode = await generateQR(`${name}-${studentId}-${department}`);
    const student = await Student.create({ name, studentId, department, purpose, qrCode });
    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ error: "Failed to register student" });
  }
};

export const approveStudent = async (req, res) => {
  const { id } = req.params;
  try {
    const student = await Student.findByIdAndUpdate(id, { status: "Approved" }, { new: true });
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: "Approval failed" });
  }
};
