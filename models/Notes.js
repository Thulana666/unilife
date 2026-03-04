import mongoose from "mongoose";

const NotesSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: "" },
    fileUrl: { type: String, default: null },
    fileName: { type: String, default: null },
    fileType: { type: String, default: null },
    year: { type: Number, required: true },
    semester: { type: Number, required: true },
    uploadedBy: { type: String }, // email
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Notes || mongoose.model("Notes", NotesSchema);
