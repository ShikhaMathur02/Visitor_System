import Visitor from "../models/Visitor.js";
import { generateQR } from "../middleware/qrGenerator.js";

export const registerVisitor = async (req, res) => {
  const { name, email, phone, purpose } = req.body;
  try {
    const qrCode = await generateQR(`${name}-${email}-${phone}`);
    const visitor = await Visitor.create({ name, email, phone, purpose, qrCode });
    res.status(201).json(visitor);
  } catch (error) {
    res.status(500).json({ error: "Failed to register visitor" });
  }
};

export const approveVisitor = async (req, res) => {
  const { id } = req.params;
  try {
    const visitor = await Visitor.findByIdAndUpdate(id, { status: "Approved" }, { new: true });
    res.json(visitor);
  } catch (error) {
    res.status(500).json({ error: "Approval failed" });
  }
};
