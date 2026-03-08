import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcrypt";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid email or password");
        }

        await connectDB();

        const user = await User.findOne({ email: credentials.email });

        // Use a dummy hash when user not found to prevent timing-based user enumeration
        const DUMMY_HASH = "$2a$06$DCq7YPn5Rq63x1Lad4cll.TV4S6ytwfsfvkgY8jIucDrjc8deX1s.";
        const isMatch = await bcrypt.compare(
          credentials.password,
          user ? user.password : DUMMY_HASH
        );
        if (!user || !isMatch) throw new Error("Invalid email or password");

        // Return object becomes session.user
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          year: user.year,
          semester: user.semester,
        };
      },
    }),
  ],

  callbacks: {
    // Persist extra fields into the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.year = user.year;
        token.semester = user.semester;
      }
      return token;
    },
    // Expose extra fields in the session object
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.year = token.year;
        session.user.semester = token.semester;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
