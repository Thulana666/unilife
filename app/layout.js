import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
<<<<<<< HEAD
import Providers from "./providers";
=======
import AuthProvider from "./components/AuthProvider";
>>>>>>> remotes/origin/assignment

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "UniLife",
  description: "Smart Student Productivity Platform",
};

export default function RootLayout({ children }) {

  return (
<<<<<<< HEAD

    <html lang="en">

      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>

        <Providers>

          {children}

        </Providers>

=======
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
>>>>>>> remotes/origin/assignment
      </body>

    </html>

  );

}
