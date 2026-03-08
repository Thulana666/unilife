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
    enum: ["pending", "submitted", "overdue"],
    default: "pending",
  },

  course: {
    type: String,
    required: true,
  },

  userId: {
    type: String,
    required: true,
  },

  year: String,
  semester: String,

}, { timestamps: true });

export default mongoose.models.Assignment || 
mongoose.model("Assignment", AssignmentSchema);
