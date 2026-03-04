import connectDB from "@/lib/db";
import Assignment from "@/models/Assignment";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { pushNotification } from "@/lib/pushNotification";

// GET: fetch assignments for a year/semester
export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return Response.json({ error: "Unauthorised" }, { status: 401 });

        await connectDB();

        const { searchParams } = new URL(req.url);
        const year = parseInt(searchParams.get("year") || session.user.year || 1);
        const semester = parseInt(searchParams.get("semester") || session.user.semester || 1);

        let query = {};
        if (session.user.role === "student") {
            query = { year, semester };
        } else if (session.user.role === "lecturer") {
            // Lecturer sees all, but can filter by year/semester
            if (searchParams.get("year")) query.year = year;
            if (searchParams.get("semester")) query.semester = semester;
        }
        // Admin sees all — no query filter

        const assignments = await Assignment.find(query).sort({ createdAt: -1 });
        return Response.json(assignments);
    } catch (err) {
        console.error("GET /api/assignments:", err);
        return Response.json({ error: "Failed to fetch assignments" }, { status: 500 });
    }
}

// POST: create assignment (lecturer / admin only)
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role === "student") {
            return Response.json({ error: "Access denied" }, { status: 403 });
        }

        await connectDB();

        const { title, description, dueDate, year, semester } = await req.json();
        if (!title || !year || !semester) {
            return Response.json({ error: "title, year and semester are required" }, { status: 400 });
        }

        const assignment = await Assignment.create({
            title,
            description: description || "",
            dueDate: dueDate ? new Date(dueDate) : null,
            year: Number(year),
            semester: Number(semester),
            uploadedBy: session.user.email,
        });

        // Notify students of this semester
        await pushNotification({
            recipientRole: "student",
            recipientYear: Number(year),
            recipientSemester: Number(semester),
            title: "📚 New Assignment",
            message: `"${title}" has been added for Year ${year} Semester ${semester}.`,
            link: "/dashboard/assignments",
            type: "assignment",
            createdBy: session.user.email,
        });
        // Notify lecturers
        await pushNotification({
            recipientRole: "lecturer",
            title: "📚 Assignment Posted",
            message: `"${title}" was added for Y${year}S${semester} by ${session.user.name || session.user.email}.`,
            link: "/dashboard/lecturer/assignments",
            type: "assignment",
            createdBy: session.user.email,
        });
        // Notify admin
        await pushNotification({
            recipientRole: "admin",
            title: "📚 Assignment Posted",
            message: `"${title}" added for Y${year}S${semester}.`,
            link: "/dashboard/admin/assignments",
            type: "assignment",
            createdBy: session.user.email,
        });

        return Response.json(assignment, { status: 201 });
    } catch (err) {
        console.error("POST /api/assignments:", err);
        return Response.json({ error: "Failed to create assignment" }, { status: 500 });
    }
}

// DELETE: remove assignment (lecturer / admin only)
export async function DELETE(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role === "student") {
            return Response.json({ error: "Access denied" }, { status: 403 });
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return Response.json({ error: "ID required" }, { status: 400 });

        await Assignment.findByIdAndDelete(id);
        return Response.json({ message: "Assignment deleted" });
    } catch (err) {
        console.error("DELETE /api/assignments:", err);
        return Response.json({ error: "Failed to delete assignment" }, { status: 500 });
    }
}
