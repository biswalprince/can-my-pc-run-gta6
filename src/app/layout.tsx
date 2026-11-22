import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Can My PC Run GTA 6? — Performance Projection",
  description:
    "Explore a transparent PC performance projection for GTA 6 based on comparable game benchmarks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
