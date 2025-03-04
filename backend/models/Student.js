import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: String,
  studentId: String,
  department: String,
  purpose: String,
  qrCode: String,
  status: { type: String, default: "Pending" },
  entryTime: { type: Date, default: Date.now },
  exitTime: Date,
});

export default mongoose.model("Student", studentSchema);
