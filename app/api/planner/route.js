import connectDB from "@/lib/db";
import Planner from "@/models/Planner";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { pushNotification } from "@/lib/pushNotification";

// GET: fetch planner entries (role-filtered)
export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return Response.json({ error: "Unauthorised" }, { status: 401 });

        await connectDB();

        const { searchParams } = new URL(req.url);
        const isAdmin = session.user.role === "admin";

        // Admin with admin=true flag → return every entry unfiltered
        if (isAdmin && searchParams.get("admin") === "true") {
            const entries = await Planner.find({}).sort({ date: 1, day: 1, createdAt: -1 });
            return Response.json(entries);
        }

        let year = session.user.year || 1;
        let semester = session.user.semester || 1;
        
        const semesterParam = searchParams.get("semester");
        if (semesterParam && typeof semesterParam === "string" && semesterParam.includes("year") && semesterParam.includes("semester")) {
            const match = semesterParam.match(/year(\d+)semester(\d+)/i);
            if (match) {
                year = Number(match[1]);
                semester = Number(match[2]);
            }
        } else if (searchParams.get("year") || semesterParam) {
            year = searchParams.get("year") ? Number(searchParams.get("year")) : year;
            semester = semesterParam ? Number(semesterParam) : semester;
        }

        let query = {};
        if (session.user.role === "student") {
            query = { year, semester };
        } else if (session.user.role === "lecturer") {
            if (year) query.year = year;
            if (semester) query.semester = semester;
        }

        const entries = await Planner.find(query).sort({ date: 1, time: 1, createdAt: -1 });
        return Response.json(entries);
    } catch (err) {
        console.error("GET /api/planner:", err);
        return Response.json({ error: "Failed to fetch planner entries" }, { status: 500 });
    }
}

// POST: add a planner entry (lecturer / admin)
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return Response.json({ error: "Access denied" }, { status: 403 });
        }

        await connectDB();

        const data = await req.json();
        let { title, year, semester } = data;

        // If the frontend sends something like "year1semester2" in 'semester' but no 'year', extract them
        if (typeof semester === "string" && semester.includes("year") && semester.includes("semester")) {
            const match = semester.match(/year(\d+)semester(\d+)/i);
            if (match) {
                year = Number(match[1]);
                semester = Number(match[2]);
            }
        } else {
            year = Number(year);
            semester = Number(semester);
        }

        if (!title || !year || !semester) {
            return Response.json({ error: "title, year and semester are required" }, { status: 400 });
        }

        const entry = await Planner.create({
            ...data,
            year,
            semester,
            status: data.status || "Pending",
            createdBy: session.user.email,
        });

        // Notifications
        await pushNotification({
            recipientRole: "student",
            recipientYear: Number(year),
            recipientSemester: Number(semester),
            title: "📅 Study Plan Updated",
            message: `"${title}" has been added to the study plan for Year ${year} Semester ${semester}.`,
            link: "/dashboard/planner",
            type: "planner",
            createdBy: session.user.email,
        });
        await pushNotification({
            recipientRole: "lecturer",
            title: "📅 Planner Updated",
            message: `"${title}" was added for Y${year}S${semester}.`,
            link: "/dashboard/lecturer",
            type: "planner",
            createdBy: session.user.email,
        });
        await pushNotification({
            recipientRole: "admin",
            title: "📅 Planner Updated",
            message: `"${title}" added to Y${year}S${semester} plan.`,
            link: "/dashboard/admin/planner",
            type: "planner",
            createdBy: session.user.email,
        });

        return Response.json(entry, { status: 201 });
    } catch (err) {
        console.error("POST /api/planner:", err);
        return Response.json({ error: "Failed to create plan entry" }, { status: 500 });
    }
}

// PATCH: edit a task or change its status (Complete/Pending)
export async function PATCH(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return Response.json({ error: "Unauthorised" }, { status: 401 });

        await connectDB();

        const { id, ...updates } = await req.json();

        const updatedTask = await Planner.findByIdAndUpdate(id, updates, { new: true });

        if (!updatedTask) {
            return Response.json({ error: "Task not found" }, { status: 404 });
        }

        return Response.json(updatedTask);
    } catch (err) {
        console.error("PATCH /api/planner:", err);
        return Response.json({ error: "Failed to update task" }, { status: 500 });
    }
}

// DELETE: remove planner entry (lecturer / admin)
export async function DELETE(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return Response.json({ error: "Access denied" }, { status: 403 });
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return Response.json({ error: "ID required" }, { status: 400 });

        await Planner.findByIdAndDelete(id);
        return Response.json({ message: "Planner entry deleted" });
    } catch (err) {
        console.error("DELETE /api/planner:", err);
        return Response.json({ error: "Failed to delete planner entry" }, { status: 500 });
    }
}
