import mongoose from "mongoose";

const AssignmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: "" },
    dueDate: { type: Date },
    year: { type: Number, required: true },
    semester: { type: Number, required: true },
    uploadedBy: { type: String }, // email of lecturer/admin
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Assignment || mongoose.model("Assignment", AssignmentSchema);
