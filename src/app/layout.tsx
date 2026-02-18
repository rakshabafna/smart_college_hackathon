import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./Navbar";
import { AuthProvider } from "./AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HackSphere | Smart Hackathon Platform",
  description:
    "Modern hackathon management platform with student verification, QR-based entry & meals, live evaluation dashboards, and admin controls.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900 overflow-x-hidden`}
      >
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-1 bg-slate-50">{children}</main>

            <footer className="border-t border-slate-200 bg-white">
              <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-4 text-xs text-slate-500 md:flex-row md:px-8">
                <span>
                  © {new Date().getFullYear()} HackSphere. All rights reserved.
                </span>
                <div className="flex gap-4">
                  <span>Privacy</span>
                  <span>Terms</span>
                  <span>Support</span>
                </div>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
