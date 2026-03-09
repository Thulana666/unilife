import mongoose from "mongoose";

const PlannerSchema = new mongoose.Schema({
  semester: { type: String, required: true },
  subject: { type: String, required: true },
  title: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  day: { type: String, required: true },
  priority: { type: String, required: true },
  status: { type: String, default: "Pending" }, // "Completed" or "Pending"
});

export default mongoose.models.Planner || mongoose.model("Planner", PlannerSchema);