import connectDB from "@/lib/db";
import Assignment from "@/models/Assignment";

export async function POST(req) {
  try {
    await connectDB();

    // Find all assignments with numeric semester values
    const assignments = await Assignment.find({
      semester: { $type: "number" }
    });

    if (assignments.length === 0) {
      return Response.json({
        message: "No assignments need migration",
        updated: 0
      });
    }

    // Update each assignment to use the new string format
    let updated = 0;
    for (const assignment of assignments) {
      // Extract year and semester from the user or use defaults
      const year = assignment.year || 1;
      const semester = assignment.semester || 1;
      const newSemester = `y${year}s${semester}`;

      await Assignment.findByIdAndUpdate(assignment._id, {
        semester: newSemester
      });
      updated++;
    }

    return Response.json({
      message: `Successfully migrated ${updated} assignments`,
      updated
    });

  } catch (error) {
    console.error("Migration error:", error);
    return Response.json(
      { error: "Migration failed", details: error.message },
      { status: 500 }
    );
  }
}
