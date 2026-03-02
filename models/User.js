import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["student", "lecturer", "admin"],
    required: true,
    default: "student"
  },

  year: {
    type: Number
  },

  semester: {
    type: Number
  }

}, { timestamps: true });

export default mongoose.models.User ||
mongoose.model("User", UserSchema);
