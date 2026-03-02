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

    const { id } = await req.json();

    await User.findByIdAndDelete(id);

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