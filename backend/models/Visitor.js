import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  purpose: String,
  qrCode: String,
  status: { type: String, default: "Pending" },
  entryTime: { type: Date, default: Date.now },
  exitTime: Date,
});

export default mongoose.model("Visitor", visitorSchema);
