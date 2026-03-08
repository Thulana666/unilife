import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";

const DUMMY_HASH = "$2a$06$DCq7YPn5Rq63x1Lad4cll.TV4S6ytwfsfvkgY8jIucDrjc8deX1s.";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req) {

  try {

    const { email, password } = await req.json();

    // Validate inputs before hitting the DB
    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }
    if (!EMAIL_REGEX.test(email)) {
      return Response.json({ error: "Invalid email format" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email });

    // Constant-time comparison to prevent user enumeration via timing
    const isMatch = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);

    if (!user || !isMatch) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Generate signed JWT
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    const token = await new SignJWT({ id: user._id.toString(), role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(secret);

    return new Response(
      JSON.stringify({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          year: user.year,
          semester: user.semester,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": `auth-token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`,
        },
      }
    );

  } catch (error) {

    console.error("Login error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });

  }

}