import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcrypt";

export async function POST(req) {

  try {

    await connectDB();

    const { name, email, password, role, year, semester } = await req.json();

    // check if user already exists

    const existingUser = await User.findOne({ email });

    if (existingUser) {

      return Response.json({
        error: "User already exists"
      }, { status: 400 });

    }

    // hash password

    const hashedPassword = await bcrypt.hash(password, 10);

    // create user

    const user = await User.create({

      name,
      email,
      password: hashedPassword,
      role,
      year,
      semester

    });

    return Response.json({

      message: "User created successfully",
      user

    });

  }

  catch (error) {

    return Response.json({

      error: error.message

    }, { status: 500 });

  }

}
