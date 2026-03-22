import connectDB from "@/lib/db";
import Assignment from "@/models/Assignment";

export async function GET(req) {
  try {
    await connectDB();

    // Get all assignments
    const allAssignments = await Assignment.find({});

    return Response.json({
      total: allAssignments.length,
      assignments: allAssignments.map(a => ({
        id: a._id,
        title: a.title,
        course: a.course,
        semester: a.semester,
        semesterType: typeof a.semester,
        userId: a.userId,
        createdBy: a.createdBy,
        dueDate: a.dueDate,
        status: a.status
      }))
    });

  } catch (error) {
    console.error("Debug error:", error);
    return Response.json(
      { error: "Failed to fetch assignments", details: error.message },
      { status: 500 }
    );
  }
}
