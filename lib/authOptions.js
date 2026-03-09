import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions = {

    providers: [

        CredentialsProvider({

            name: "Credentials",

            credentials: {

                email: {},
                password: {},
                role: {}

            },

            async authorize(credentials) {

                await connectDB();

                const user = await User.findOne({
                    email: credentials.email
                });

                if (!user) throw new Error("Invalid");

                if (user.role !== credentials.role)
                    throw new Error("Invalid");

                const isMatch = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isMatch)
                    throw new Error("Invalid");

                return {

                    id: user._id.toString(),
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

    callbacks: {

        async jwt({ token, user }) {

            if (user) {

                token.role = user.role;
                token.year = user.year;
                token.semester = user.semester;

            }

            return token;

        },

        async session({ session, token }) {

            session.user.role = token.role;
            session.user.year = token.year;
            session.user.semester = token.semester;

            return session;

        }

    },

    secret: process.env.NEXTAUTH_SECRET

};
