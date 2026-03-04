import connectDB from "@/lib/db";
import User from "@/models/User";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(req) {

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

    const users = await User.find().select("-password");

    return Response.json(users);

  }

  catch {

    return Response.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );

  }

}