import mongoose from "mongoose";

const RatingSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
});

const CommentSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    userName: { type: String, default: "User" },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const NotesSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: "" },

    fileUrl: { type: String, default: null },
    fileName: { type: String, default: null },
    fileType: { type: String, default: null },

    year: { type: Number, required: true },
    semester: { type: Number, required: true },

    // New subject field to group notes under semesters
    subject: { type: String, required: true },

    uploadedBy: { type: String }, // email
    uploadedByName: { type: String, default: "User" }, // optional human readable name
    uploaderRole: { type: String, enum: ["student", "lecturer", "admin"], default: "student" },

    // Analytics
    views: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },

    // Interactive
    ratings: [RatingSchema],
    comments: [CommentSchema],

    createdAt: { type: Date, default: Date.now }
});

// Virtual for average rating
NotesSchema.virtual('averageRating').get(function () {
    if (this.ratings.length === 0) return 0;
    const sum = this.ratings.reduce((acc, r) => acc + r.stars, 0);
    return parseFloat((sum / this.ratings.length).toFixed(1));
});

// Virtual for rating count
NotesSchema.virtual('ratingCount').get(function () {
    return this.ratings.length;
});

// Ensure virtuals are included in JSON/Object conversions
NotesSchema.set('toJSON', { virtuals: true });
NotesSchema.set('toObject', { virtuals: true });

export default mongoose.models.Notes || mongoose.model("Notes", NotesSchema);
