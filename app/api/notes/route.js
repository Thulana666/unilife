import connectDB from "@/lib/db";
import Notes from "@/models/Notes";
import cloudinary from "@/lib/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { pushNotification } from "@/lib/pushNotification";

// GET: fetch notes (role-filtered, and subject-filtered)
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "Unauthorised" }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || session.user.year || 1);
    const semester = parseInt(searchParams.get("semester") || session.user.semester || 1);
    const subject = searchParams.get("subject");

    let query = {};

    // Students view their own cohort's notes
    if (session.user.role === "student") {
      query = { year, semester };
    }
    // Lecturers/Admins can query specifically if they pass params
    else if (session.user.role === "lecturer" || session.user.role === "admin") {
      if (searchParams.get("year")) query.year = year;
      if (searchParams.get("semester")) query.semester = semester;
    }

    if (subject) query.subject = subject;

    const notes = await Notes.find(query).sort({ createdAt: -1 });
    return Response.json(notes);
  } catch (err) {
    console.error("GET /api/notes:", err);
    return Response.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

// POST: upload a note (all roles; requires subject)
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    await connectDB();

    const contentType = req.headers.get("content-type") || "";
    let title, description, year, semester, subject, fileUrl = null, fileName = null, fileType = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      title = formData.get("title");
      description = formData.get("description") || "";
      subject = formData.get("subject");
      year = parseInt(formData.get("year") || session.user.year);
      semester = parseInt(formData.get("semester") || session.user.semester);

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
      } else {
        return Response.json({ error: "Valid File required" }, { status: 400 });
      }
    } else {
      return Response.json({ error: "Multipart form required" }, { status: 400 });
    }

    if (!title || !year || !semester || !subject || !fileUrl) {
      return Response.json({ error: "title, subject, and file are required" }, { status: 400 });
    }

    const note = await Notes.create({
      title,
      description,
      subject,
      fileUrl,
      fileName,
      fileType,
      year,
      semester,
      uploadedBy: session.user.email,
      uploadedByName: session.user.name,
      uploaderRole: session.user.role,
    });

    // Notifications targeting specifically the Subject now
    await pushNotification({
      recipientRole: "student",
      recipientYear: year,
      recipientSemester: semester,
      title: "📝 New Material in " + subject,
      message: `"${title}" has been uploaded to the module ${subject}.`,
      link: `/dashboard/${semester}/notes/${encodeURIComponent(subject)}`,
      type: "notes",
      createdBy: session.user.email,
    });
    await pushNotification({
      recipientRole: "admin",
      title: "📝 Notes Uploaded",
      message: `"${title}" uploaded for Y${year}S${semester} (${subject}).`,
      link: "/dashboard/admin/notes",
      type: "notes",
      createdBy: session.user.email,
    });

    return Response.json(note, { status: 201 });
  } catch (err) {
    console.error("POST /api/notes:", err);
    return Response.json({ error: "Failed to upload note - " + err.message }, { status: 500 });
  }
}

// PUT: Update note metadata (admin or owner)
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "Access denied" }, { status: 403 });

    await connectDB();
    const body = await req.json();
    const { id, title, description } = body;

    if (!id || !title) return Response.json({ error: "ID and Title are required" }, { status: 400 });

    const note = await Notes.findById(id);
    if (!note) return Response.json({ error: "Note not found" }, { status: 404 });

    if (session.user.role !== "admin" && note.uploadedBy !== session.user.email) {
      return Response.json({ error: "Access denied: You can only edit your own notes." }, { status: 403 });
    }

    note.title = title;
    note.description = description || "";
    await note.save();

    return Response.json(note, { status: 200 });

  } catch (err) {
    console.error("PUT /api/notes:", err);
    return Response.json({ error: "Failed to update note" }, { status: 500 });
  }
}

// DELETE: remove note (admin or owner)
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

    const note = await Notes.findById(id);
    if (!note) return Response.json({ error: "Note not found" }, { status: 404 });

    if (session.user.role !== "admin" && note.uploadedBy !== session.user.email) {
      return Response.json({ error: "Access denied: You can only delete your own notes." }, { status: 403 });
    }

    await Notes.findByIdAndDelete(id);

    return Response.json({ success: true, message: "Note deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/notes:", err);
    return Response.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
