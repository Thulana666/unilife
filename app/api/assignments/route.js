import connectDB from "@/lib/db";
import Assignment from "@/models/Assignment";
<<<<<<< HEAD
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
        const isAdmin = session.user.role === "admin";

        // Admin with admin=true flag → return all assignments unfiltered
        if (isAdmin && searchParams.get("admin") === "true") {
            const assignments = await Assignment.find({}).sort({ createdAt: -1 });
            return Response.json(assignments);
        }

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
=======
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const semester = searchParams.get("semester");
  const userYear = searchParams.get("year"); // Student's year profile
  const viewAll = searchParams.get("viewAll"); // For lecturers to view all assignments

  let query = {};

  // Helper to extract semester number from "y1s1" format
  const getSemesterNumber = (semStr) => {
    if (!semStr) return null;
    const match = semStr.match(/s(\d+)$/);
    return match ? parseInt(match[1]) : parseInt(semStr);
  };

  // If viewAll is true (for lecturers), fetch all assignments
  if (viewAll === "true" && semester) {
    // Handle both old format (Number: 1, 2) and new format (String: "y1s1", "y1s2")
    const semesterNumber = getSemesterNumber(semester);
    query = {
      $or: [
        { semester: semester },  // New format: "y1s1"
        { semester: semesterNumber }  // Old format: 1
      ]
    };
    console.log("Lecturer query:", JSON.stringify(query), "for semester:", semester, "semesterNumber:", semesterNumber);
  } else if (viewAll === "true") {
    // No semester filter — return ALL assignments across ALL semesters (lecturer all-view)
    query = {};
    console.log("Lecturer all-semesters query: fetching all assignments");
  } else if (userId && semester) {
    // Fetch the student's own assignments + lecturer assignments for the same semester and year
    const semesterNumber = getSemesterNumber(semester);
    
    // Lecturer assignments conditions (must match both year and semester if userYear is provided)
    const lecturerConditions = [];
    const semNumStr = semesterNumber !== null ? String(semesterNumber) : null;

    if (userYear) {
      // 1. Check strict boolean (works if server restarted and schema updated)
      lecturerConditions.push({ isLecturerAssignment: true, year: String(userYear), semester: semester });
      if (semNumStr) lecturerConditions.push({ isLecturerAssignment: true, year: String(userYear), semester: semNumStr });
      
      // 2. Fallback: Any assignment matching year+sem that the student didn't create (catches unsaved booleans from cached schemas)
      lecturerConditions.push({ userId: { $ne: userId }, year: String(userYear), semester: semester });
      if (semNumStr) lecturerConditions.push({ userId: { $ne: userId }, year: String(userYear), semester: semNumStr });

    } else {
      // Fallback if year isn't passed for some reason
      lecturerConditions.push({ isLecturerAssignment: true, semester: semester });
      if (semNumStr) lecturerConditions.push({ isLecturerAssignment: true, semester: semNumStr });
      
      lecturerConditions.push({ userId: { $ne: userId }, semester: semester });
      if (semNumStr) lecturerConditions.push({ userId: { $ne: userId }, semester: semNumStr });
    }

    query = {
      $or: [
        // Student's own assignments for this semester
        { userId, semester: semester },
        { userId, semester: semesterNumber },
        ...lecturerConditions
      ]
    };
    console.log("Student query (incl. lecturer assignments):", JSON.stringify(query));
  } else if (userId) {
    query = { userId };
  }

  const assignments = await Assignment.find(query).sort({ dueDate: 1 });
  console.log("Found assignments:", assignments.length, "assignments:", assignments.map(a => ({ id: a._id, title: a.title, semester: a.semester, year: a.year })));

  return Response.json(assignments);
}

export async function POST(req) {
  await connectDB();

  const body = await req.json();

  const assignment = await Assignment.create(body);

  return Response.json(assignment);
}

export async function PUT(req) {
  await connectDB();

  // Get session to check authorization
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, status, title, description, dueDate, course, submissionText, submissionUrl, submittedAt } = await req.json();

  // Find the assignment first to check ownership
  const assignment = await Assignment.findById(id);
  if (!assignment) {
    return Response.json({ error: "Assignment not found" }, { status: 404 });
  }

  // Check authorization: only creator, admin, or lecturer can edit full details
  const isCreator = String(assignment.userId) === String(session.user.id);
  const isAdmin = session.user.role === "admin";
  const isLecturer = session.user.role === "lecturer";

  // Allow status-only updates (for studentCompletions) for any matching user
  const isOnlyStatusUpdate = status !== undefined && 
    title === undefined && description === undefined && 
    dueDate === undefined && course === undefined && 
    submissionText === undefined && submissionUrl === undefined && 
    submittedAt === undefined;

  if (!isCreator && !isAdmin && !isLecturer && !isOnlyStatusUpdate) {
    return Response.json({ error: "Forbidden: You don't have permission to edit this assignment" }, { status: 403 });
  }

  const updateFields = {};

  // Handle status updates - ALWAYS use per-user completion tracking
  if (status !== undefined) {
    const userId = String(session.user.id);
    const completions = assignment.studentCompletions || [];

    // Find or create completion entry for this user
    const existingIndex = completions.findIndex(c => String(c.userId) === userId);

    if (existingIndex >= 0) {
      completions[existingIndex].status = status;
      completions[existingIndex].submittedAt = new Date();
    } else {
      completions.push({
        userId,
        status,
        submittedAt: new Date()
      });
    }

    updateFields.studentCompletions = completions;
  }

  if (title !== undefined) updateFields.title = title;
  if (description !== undefined) updateFields.description = description;
  if (dueDate !== undefined) updateFields.dueDate = dueDate;
  if (course !== undefined) updateFields.course = course;
  if (submissionText !== undefined) updateFields.submissionText = submissionText;
  if (submissionUrl !== undefined) updateFields.submissionUrl = submissionUrl;
  if (submittedAt !== undefined) updateFields.submittedAt = submittedAt;

  const updated = await Assignment.findByIdAndUpdate(
    id,
    updateFields,
    { new: true }
  );

  return Response.json(updated);
}

export async function DELETE(req) {
  await connectDB();

  // Get session to check authorization
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();

  // Find the assignment first to check ownership
  const assignment = await Assignment.findById(id);
  if (!assignment) {
    return Response.json({ error: "Assignment not found" }, { status: 404 });
  }

  // Check authorization: only creator, admin, or lecturer can delete
  const isCreator = String(assignment.userId) === String(session.user.id);
  const isAdmin = session.user.role === "admin";
  const isLecturer = session.user.role === "lecturer";

  if (!isCreator && !isAdmin && !isLecturer) {
    return Response.json({ error: "Forbidden: You don't have permission to delete this assignment" }, { status: 403 });
  }

  await Assignment.findByIdAndDelete(id);

  return Response.json({ message: "Deleted" });
}

>>>>>>> remotes/origin/assignment
