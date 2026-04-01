// API route for handling interactions (views, downloads, ratings, comments)
import connectDB from "@/lib/db";
import Notes from "@/models/Notes";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const body = await req.json();
        const { action, noteId, stars, text } = body;

        if (!noteId || !action) {
            return NextResponse.json({ error: "Note ID and explicit action required" }, { status: 400 });
        }

        const note = await Notes.findById(noteId);
        if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });

        if (action === "download") {
            note.downloads += 1;
        } else if (action === "view") {
            note.views += 1;
        } else if (action === "rate") {
            if (!stars || stars < 1 || stars > 5) return NextResponse.json({ error: "Invalid stars (1-5)" }, { status: 400 });

            // Check if user already rated, update if so
            const existingRatingIndex = note.ratings.findIndex(r => r.userEmail === session.user.email);
            if (existingRatingIndex >= 0) {
                note.ratings[existingRatingIndex].stars = stars;
            } else {
                note.ratings.push({ userEmail: session.user.email, stars: stars });
            }
        } else if (action === "comment") {
            if (!text || text.trim() === '') return NextResponse.json({ error: "Comment text required" }, { status: 400 });
            note.comments.push({
                userEmail: session.user.email,
                userName: session.user.name,
                text: text.trim()
            });
        } else {
            return NextResponse.json({ error: "Unknown interaction action" }, { status: 400 });
        }

        await note.save();

        return NextResponse.json({
            success: true,
            message: `Action ${action} recorded`,
            note: note
        });

    } catch (error) {
        console.error("Error logging interaction:", error);
        return NextResponse.json({ error: "Failed to record interaction" }, { status: 500 });
    }
}
