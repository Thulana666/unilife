import connectDB from "@/lib/db";
import Assignment from "@/models/Assignment";
import { getServerSession } from "next-auth/next";
import { handler as authOptions } from "../auth/[...nextauth]/route";

export async function GET(req) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const semester = searchParams.get("semester");

  const assignments = await Assignment.find({
    userId,
    semester
  });

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

  // Check authorization: only creator, admin, or lecturer can edit
  const isCreator = String(assignment.userId) === String(session.user.id);
  const isAdmin = session.user.role === "admin";
  const isLecturer = session.user.role === "lecturer";

  if (!isCreator && !isAdmin && !isLecturer) {
    return Response.json({ error: "Forbidden: You don't have permission to edit this assignment" }, { status: 403 });
  }

  const updateFields = {};
  if (status !== undefined) updateFields.status = status;
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

