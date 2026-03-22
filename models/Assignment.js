import mongoose from "mongoose";

const AssignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    default: "",
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

  uploadedBy: { type: String },  // email of lecturer/admin

  submissionText: {
    type: String,
  },

  submissionUrl: {
    type: String,
  },

  submittedAt: {
    type: Date,
  },

  year: { type: mongoose.Schema.Types.Mixed },
  semester: { type: mongoose.Schema.Types.Mixed },

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

}, { strict: false, timestamps: true });

export default mongoose.models.Assignment || 
mongoose.model("Assignment", AssignmentSchema);
