import type { Metadata } from "next";
import type { Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "../components/AuthProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SoulSync — Mental Health Support",
  description:
    "AI-powered mental health support — knowledge-grounded, evidence-based, not a therapy replacement.",
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="antialiased font-sans h-full overflow-hidden">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
