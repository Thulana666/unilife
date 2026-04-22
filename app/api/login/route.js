import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcrypt";

export async function POST(req) {

  try {

    await connectDB();

    const { email, password } = await req.json();

    // find user

    const user = await User.findOne({ email });

    if (!user) {

      return Response.json({
        error: "User not found"
      }, { status: 404 });

    }

    // compare password

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {

      return Response.json({
        error: "Invalid password"
      }, { status: 401 });

    }

    return Response.json({

      message: "Login successful",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        year: user.year,
        semester: user.semester
      }

    });

  }

  catch (error) {

    return Response.json({

      error: error.message

    }, { status: 500 });

  }

}
