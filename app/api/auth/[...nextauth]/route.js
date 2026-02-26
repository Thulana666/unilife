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

email: {},
password: {}

},

async authorize(credentials) {

await connectDB();

const user = await User.findOne({

email: credentials.email

});

if (!user) throw new Error("User not found");

const isMatch = await bcrypt.compare(

credentials.password,
user.password

);

if (!isMatch) throw new Error("Wrong password");

return {

id: user._id,
name: user.name,
email: user.email,
role: user.role,
year: user.year,
semester: user.semester

};

}

})

],

session: {

strategy: "jwt"

},

secret: process.env.NEXTAUTH_SECRET

});

export { handler as GET, handler as POST };
