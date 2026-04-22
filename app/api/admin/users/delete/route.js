import connectDB from "@/lib/db";
import User from "@/models/User";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function DELETE(req) {

  try {

    const session = await getServerSession(authOptions);

    // ❌ Block non-admin

    if (!session || session.user.role !== "admin") {

      return Response.json(
        { error: "Access denied" },
        { status: 403 }
      );

    }

    await connectDB();

    // Frontend sends the id as a query param: DELETE /api/admin/users/delete?id=...
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    const deleted = await User.findByIdAndDelete(id);

    if (!deleted) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({

      message: "User deleted successfully"

    });

  }

  catch {

    return Response.json(
      { error: "Delete failed" },
      { status: 500 }
    );

  }

}