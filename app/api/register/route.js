import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcrypt";

export async function POST(req) {

  try {

    await connectDB();

    const { name, email, password, year, semester } = await req.json();

    // Validate required fields

    if (!name || !email || !password || !year || !semester) {

      return Response.json(
        { error: "All fields are required" },
        { status: 400 }
      );

    }

    // Validate SLIIT email

    const emailRegex = /^[A-Za-z0-9._%+-]+@my\.sliit\.lk$/;

    if (!emailRegex.test(email)) {

      return Response.json(
        { error: "Use your campus email (example: IT12345678@my.sliit.lk)" },
        { status: 400 }
      );

    }

    // Validate password length

    if (password.length < 6) {

      return Response.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );

    }

    // Check existing user

    const existingUser = await User.findOne({ email });

    if (existingUser) {

      return Response.json(
        { error: "User already exists" },
        { status: 400 }
      );

    }

    // Hash password

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({

      name,
      email,
      password: hashedPassword,
      role: "student",
      year,
      semester

    });

    return Response.json({

      message: "Account created successfully"

    });

  }

  catch {

    return Response.json(
      { error: "Registration failed" },
      { status: 500 }
    );

  }

}
