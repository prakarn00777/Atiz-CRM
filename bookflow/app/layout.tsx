import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "BookFlow",
  description: "Seamless Appointment Booking",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0", // Mobile optimization
  themeColor: "#F5F5F5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
