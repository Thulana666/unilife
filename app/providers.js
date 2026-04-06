"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "../context/ThemeContext";

export default function Providers({ children }) {

  return (
    <ThemeProvider>
      <SessionProvider>
        <Toaster position="top-center" />
        {children}
      </SessionProvider>
    </ThemeProvider>
  );

}
