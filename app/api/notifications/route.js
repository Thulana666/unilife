import connectDB from "@/lib/db";
import Notification from "@/models/Notification";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

/**
 * Build a MongoDB query that returns notifications visible to the logged-in user.
 *
 * Matching logic:
 *  - Admin   → everything (role: "admin" | "all", any year/semester)
 *  - Lecturer → recipientRole in ["lecturer", "all"], any year/semester (nulls included)
 *  - Student  → recipientRole in ["student", "all"]
 *               AND (recipientYear == user.year OR recipientYear == null)
 *               AND (recipientSemester == user.semester OR recipientSemester == null)
 */
function buildQuery(user) {
    const { role, year, semester, email } = user;

    if (role === "admin") {
        return {}; // sees everything
    }

    if (role === "lecturer") {
        return {
            recipientRole: { $in: ["lecturer", "all"] }
        };
    }

    // Student
    return {
        recipientRole: { $in: ["student", "all"] },
        $or: [
            { recipientYear: Number(year), recipientSemester: Number(semester) },
            { recipientYear: null, recipientSemester: null },
            { recipientYear: Number(year), recipientSemester: null },
            { recipientYear: null, recipientSemester: Number(semester) },
        ]
    };
}

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return Response.json({ error: "Unauthorised" }, { status: 401 });

        await connectDB();

        const userEmail = session.user.email;
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "30");

        const query = buildQuery(session.user);
        // Exclude notifications the current user created themselves
        query.createdBy = { $ne: userEmail };

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(limit);

        // Mark each one as read/unread from the perspective of *this* user
        const decorated = notifications.map((n) => ({
            ...n.toObject(),
            isRead: n.readBy.includes(userEmail),
        }));

        const unreadCount = decorated.filter((n) => !n.isRead).length;

        return Response.json({ notifications: decorated, unreadCount });
    } catch (error) {
        console.error("GET /api/notifications error:", error);
        return Response.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }
}

// ── POST: create a broadcast notification ────────────────────────────────────
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return Response.json({ error: "Unauthorised" }, { status: 401 });
        }

        await connectDB();

        const { recipientRole, recipientYear, recipientSemester, title, message, type, link } = await req.json();

        if (!recipientRole || !title || !message) {
            return Response.json({ error: "recipientRole, title and message are required" }, { status: 400 });
        }

        const notif = await Notification.create({
            recipientRole,
            recipientYear: recipientYear ?? null,
            recipientSemester: recipientSemester ?? null,
            title,
            message,
            type: type || "system",
            link: link || "/dashboard",
        });

        return Response.json(notif, { status: 201 });
    } catch (error) {
        console.error("POST /api/notifications error:", error);
        return Response.json({ error: "Failed to create notification" }, { status: 500 });
    }
}

// ── PATCH: mark as read for the current user ─────────────────────────────────
export async function PATCH(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return Response.json({ error: "Unauthorised" }, { status: 401 });

        await connectDB();

        const userEmail = session.user.email;
        const body = await req.json();
        const { notificationId, markAllRead } = body;

        if (markAllRead) {
            const query = buildQuery(session.user);
            await Notification.updateMany(query, { $addToSet: { readBy: userEmail } });
            return Response.json({ message: "All marked as read" });
        }

        if (notificationId) {
            await Notification.findByIdAndUpdate(notificationId, { $addToSet: { readBy: userEmail } });
            return Response.json({ message: "Marked as read" });
        }

        return Response.json({ error: "Provide notificationId or markAllRead" }, { status: 400 });
    } catch (error) {
        console.error("PATCH /api/notifications error:", error);
        return Response.json({ error: "Failed to update notification" }, { status: 500 });
    }
}

// ── DELETE: remove notification (admin-only hard delete) ─────────────────────
export async function DELETE(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return Response.json({ error: "Unauthorised" }, { status: 401 });

        await connectDB();

        const { searchParams } = new URL(req.url);
        const notificationId = searchParams.get("id");

        if (!notificationId) return Response.json({ error: "ID required" }, { status: 400 });

        // Allow the user to "dismiss" by adding themselves to readBy
        // Hard delete only for admin
        if (session.user.role === "admin") {
            await Notification.findByIdAndDelete(notificationId);
        } else {
            await Notification.findByIdAndUpdate(notificationId, {
                $addToSet: { readBy: session.user.email }
            });
        }

        return Response.json({ message: "Notification dismissed" });
    } catch (error) {
        console.error("DELETE /api/notifications error:", error);
        return Response.json({ error: "Failed to dismiss notification" }, { status: 500 });
    }
}
