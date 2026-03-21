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

  createdBy: {
    type: String,
  },

  submissionText: {
    type: String,
  },

  submissionUrl: {
    type: String,
  },

  submittedAt: {
    type: Date,
  },

  year: String,      // e.g. "1", "2", "3", "4"
  semester: String,  // e.g. "y1s1", "y2s2"

  // True when the assignment was created by a lecturer (visible to all matching students)
  isLecturerAssignment: {
    type: Boolean,
    default: false,
  },

  // Track completion status per user (for lecturer assignments)
  studentCompletions: [{
    userId: String,
    status: {
      type: String,
      enum: ["pending", "submitted", "overdue"],
      default: "pending"
    },
    submittedAt: Date
  }],

}, { timestamps: true });

export default mongoose.models.Assignment || 
mongoose.model("Assignment", AssignmentSchema);
