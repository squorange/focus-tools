import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Task Co-Pilot",
  description: "AI-powered task breakdown assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
