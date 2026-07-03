import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seat of Wisdom Math Olympiad",
  description: "Interactive math competition platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
