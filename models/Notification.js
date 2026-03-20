import mongoose from "mongoose";

if (mongoose.models.Notification) {
    delete mongoose.models.Notification;
}

/**
 * Broadcast-style notification.
 * Instead of storing per-userId, notifications target a role+year+semester combo.
 * The API filters them at query time based on the logged-in user's profile.
 *
 * Special rules:
 *  - recipientYear / recipientSemester = null → visible to ALL (lecturer, admin, or any student)
 *  - recipientRole = "all"                    → visible to every role
 */
const NotificationSchema = new mongoose.Schema({
    recipientRole: {
        type: String,
        enum: ["student", "lecturer", "admin", "all"],
        required: true,
        index: true
    },
    // null means "all years"
    recipientYear: {
        type: Number,
        default: null
    },
    // null means "all semesters"
    recipientSemester: {
        type: Number,
        default: null
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["assignment", "planner", "notes", "chat", "notice", "user", "system"],
        default: "system"
    },
    link: {
        type: String,
        default: "/dashboard"
    },
    // Track which userIds (email strings) have dismissed / read this notification
    readBy: {
        type: [String],
        default: []
    },
    // Email of the user who triggered this notification (so we can hide it from them)
    createdBy: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Notification", NotificationSchema);
