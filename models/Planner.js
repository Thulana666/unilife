import mongoose from "mongoose";

const PlannerSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subject: { type: String, default: "" },
    description: { type: String, default: "" },
    date: { type: String },          // "YYYY-MM-DD" string as stored
    time: { type: String, default: "" },  // "HH:MM" string
    day: { type: String, default: "" },  // "MON", "TUE" etc.
    priority: { type: String, default: "Medium" }, // Low / Medium / High
    status: { type: String, default: "Pending" }, // Pending / Done
    semester: { type: String },          // "semester1", "semester2" etc.
    year: { type: Number },
    createdBy: { type: String },          // email
    createdAt: { type: Date, default: Date.now },
}, { strict: false }); // strict:false keeps any extra fields already in DB

export default mongoose.models.Planner || mongoose.model("Planner", PlannerSchema);
