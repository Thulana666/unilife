import mongoose from "mongoose";

// Force Mongoose to recompile the model so it doesn't use the old cached schema omitting isNotice
if (mongoose.models.Message) {
    delete mongoose.models.Message;
}

const MessageSchema = new mongoose.Schema({
    text: {
        type: String,
        default: ""
    },
    sender: {
        type: String,
        required: true
    },
    email: {
        type: String
    },
    year: Number,
    semester: Number,
    fileUrl: {
        type: String,
        default: null
    },
    fileName: {
        type: String,
        default: null
    },
    fileType: {
        type: String,
        default: null
    },
    isNotice: {
        type: Boolean,
        default: false
    },
    edited: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);
