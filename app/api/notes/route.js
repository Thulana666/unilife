import connectDB from "@/lib/db";
import Notes from "@/models/Notes";
import cloudinary from "@/lib/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { pushNotification } from "@/lib/pushNotification";

// GET: fetch notes (role-filtered)
export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return Response.json({ error: "Unauthorised" }, { status: 401 });

        await connectDB();

        const { searchParams } = new URL(req.url);
        const isAdmin = session.user.role === "admin";

        // Admin with admin=true flag → return all notes unfiltered
        if (isAdmin && searchParams.get("admin") === "true") {
            const notes = await Notes.find({}).sort({ createdAt: -1 });
            return Response.json(notes);
        }

        const year = parseInt(searchParams.get("year") || session.user.year || 1);
        const semester = parseInt(searchParams.get("semester") || session.user.semester || 1);

        let query = {};
        if (session.user.role === "student") {
            query = { year, semester };
        } else if (session.user.role === "lecturer") {
            if (searchParams.get("year")) query.year = year;
            if (searchParams.get("semester")) query.semester = semester;
        }

        const notes = await Notes.find(query).sort({ createdAt: -1 });
        return Response.json(notes);
    } catch (err) {
        console.error("GET /api/notes:", err);
        return Response.json({ error: "Failed to fetch notes" }, { status: 500 });
    }
}

// POST: upload a note (lecturer / admin; supports multipart for file upload)
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role === "student") {
            return Response.json({ error: "Access denied" }, { status: 403 });
        }

        await connectDB();

        const contentType = req.headers.get("content-type") || "";
        let title, description, year, semester, fileUrl = null, fileName = null, fileType = null;

        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            title = formData.get("title");
            description = formData.get("description") || "";
            year = parseInt(formData.get("year"));
            semester = parseInt(formData.get("semester"));

            const file = formData.get("file");
            if (file && typeof file.arrayBuffer === "function") {
                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);
                fileName = file.name;
                fileType = file.type;

                const result = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        { resource_type: "auto", folder: "unilife_notes" },
                        (err, res) => (err ? reject(err) : resolve(res))
                    ).end(buffer);
                });
                fileUrl = result.secure_url;
            }
        } else {
            const body = await req.json();
            title = body.title;
            description = body.description || "";
            year = parseInt(body.year);
            semester = parseInt(body.semester);
        }

        if (!title || !year || !semester) {
            return Response.json({ error: "title, year and semester are required" }, { status: 400 });
        }

        const note = await Notes.create({
            title,
            description,
            fileUrl,
            fileName,
            fileType,
            year,
            semester,
            uploadedBy: session.user.email,
        });

        // Notifications
        await pushNotification({
            recipientRole: "student",
            recipientYear: year,
            recipientSemester: semester,
            title: "📝 New Notes Shared",
            message: `"${title}" has been uploaded for Year ${year} Semester ${semester}.`,
            link: "/dashboard/notes",
            type: "notes",
            createdBy: session.user.email,
        });
        await pushNotification({
            recipientRole: "lecturer",
            title: "📝 Notes Uploaded",
            message: `"${title}" was shared for Y${year}S${semester}.`,
            link: "/dashboard/lecturer/notes",
            type: "notes",
            createdBy: session.user.email,
        });
        await pushNotification({
            recipientRole: "admin",
            title: "📝 Notes Uploaded",
            message: `"${title}" uploaded for Y${year}S${semester}.`,
            link: "/dashboard/admin/notes",
            type: "notes",
            createdBy: session.user.email,
        });

        return Response.json(note, { status: 201 });
    } catch (err) {
        console.error("POST /api/notes:", err);
        return Response.json({ error: "Failed to upload note" }, { status: 500 });
    }
}

// DELETE: remove note (lecturer / admin)
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

        await Notes.findByIdAndDelete(id);
        return Response.json({ message: "Note deleted" });
    } catch (err) {
        console.error("DELETE /api/notes:", err);
        return Response.json({ error: "Failed to delete note" }, { status: 500 });
    }
}
