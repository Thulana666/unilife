import mongoose from "mongoose";

const PlannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  description: { type: String, default: "" },
  date: { type: String, required: true },     // "YYYY-MM-DD" string as stored
  time: { type: String, required: true },     // "HH:MM" string
  day: { type: String, required: true },      // "MON", "TUE" etc.
  priority: { type: String, required: true }, // Low / Medium / High
  status: { type: String, default: "Pending" }, // Pending / Completed
  semester: { type: String, required: true }, // "semester1", "semester2" etc.
  year: { type: Number },
  venue: { type: String, default: "" },       // link or physical venue
  createdBy: { type: String },                // email
  createdAt: { type: Date, default: Date.now },
}, { strict: false }); // strict:false keeps any extra fields already in DB

export default mongoose.models.Planner || mongoose.model("Planner", PlannerSchema);
