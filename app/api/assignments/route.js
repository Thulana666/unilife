import connectDB from "@/lib/db";
import Assignment from "@/models/Assignment";

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

  const { id, status } = await req.json();

  const updated = await Assignment.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );

  return Response.json(updated);
}

export async function DELETE(req) {
  await connectDB();

  const { id } = await req.json();

  await Assignment.findByIdAndDelete(id);

  return Response.json({ message: "Deleted" });
}

