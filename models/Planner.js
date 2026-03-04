import mongoose from "mongoose";

const PlannerSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: "" },
    date: { type: Date },
    year: { type: Number, required: true },
    semester: { type: Number, required: true },
    createdBy: { type: String }, // email
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Planner || mongoose.model("Planner", PlannerSchema);
