import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcrypt";

const handler = NextAuth({

providers: [

CredentialsProvider({

name: "Credentials",

credentials: {},

async authorize(credentials) {

try {

await connectDB();

// ✅ Validate empty fields

if (!credentials?.email || !credentials?.password) {

throw new Error("Invalid email or password");

}

// ✅ Validate campus email

const emailRegex = /^[A-Za-z0-9._%+-]+@my\.sliit\.lk$/;

if (!emailRegex.test(credentials.email)) {

throw new Error("Invalid email or password");

}

// ✅ Find user

const user = await User.findOne({

email: credentials.email

});

if (!user) {

throw new Error("Invalid email or password");

}

// ✅ Check password

const isMatch = await bcrypt.compare(

credentials.password,
user.password

);

if (!isMatch) {

throw new Error("Invalid email or password");

}

// ✅ Return user session data

return {

id: user._id.toString(),
name: user.name,
email: user.email,
role: user.role,
year: user.year,
semester: user.semester

};

}

catch {

throw new Error("Invalid email or password");

}

}

})

],

session: {

strategy: "jwt"

},

callbacks: {

// ✅ Save extra data in JWT

async jwt({ token, user }) {

if (user) {

token.role = user.role;
token.year = user.year;
token.semester = user.semester;

}

return token;

},

// ✅ Send data to frontend session

async session({ session, token }) {

session.user.role = token.role;
session.user.year = token.year;
session.user.semester = token.semester;

return session;

}

},

pages: {

// optional custom login page

signIn: "/login"

},

secret: process.env.NEXTAUTH_SECRET

});

export { handler as GET, handler as POST };
