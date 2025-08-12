import type React from "react";
import type { Metadata } from "next";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/error-boundary";

export const metadata: Metadata = {
  title: "GYM RAT - Smart Fitness Tracker",
  description:
    "AI-powered fitness and nutrition tracking app with voice input capabilities",
  keywords: [
    "fitness",
    "nutrition",
    "AI",
    "voice",
    "tracking",
    "workout",
    "food",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
