import mongoose from "mongoose";

const SubjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    year: { type: Number, required: true },
    semester: { type: Number, required: true },
    createdBy: { type: String, required: true }, // admin email
    createdAt: { type: Date, default: Date.now }
});

// Ensure a subject name is unique per year+semester combination
SubjectSchema.index({ name: 1, year: 1, semester: 1 }, { unique: true });

export default mongoose.models.Subject || mongoose.model("Subject", SubjectSchema);
