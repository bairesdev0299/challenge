/**
 * Root layout component for the Pictionary game application.
 * 
 * This component sets up the basic HTML structure and font configuration
 * for the entire application. It uses Geist fonts for both sans-serif
 * and monospace text.
 * 
 * @module layout
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

/**
 * Geist Sans font configuration for the application.
 * Used for general text content.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/**
 * Geist Mono font configuration for the application.
 * Used for monospace text (e.g., code blocks).
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Application metadata configuration.
 * Defines the title and description for the application.
 */
export const metadata: Metadata = {
  title: "Pictionary Game",
  description: "A real-time multiplayer Pictionary game built with Next.js",
};

/**
 * Root layout component that wraps all pages.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to be rendered
 * @returns {JSX.Element} The root layout component
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
