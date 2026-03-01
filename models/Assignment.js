import mongoose from "mongoose";

const AssignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  description: {
    type: String,
  },

  dueDate: {
    type: Date,
    required: true,
  },

  status: {
    type: String,
    enum: ["pending", "submitted", "late"],
    default: "pending",
  },

  userId: {
    type: String,
    required: true,
  },

  year: Number,
  semester: Number,

}, { timestamps: true });

export default mongoose.models.Assignment || 
mongoose.model("Assignment", AssignmentSchema);