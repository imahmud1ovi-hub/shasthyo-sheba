import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shasthyo Sheba (স্বাস্থ্য সেবা) — Doctor Serial & Appointment Booking",
  description:
    "Book verified doctor chamber appointments (serials) across Bangladesh. বাংলাদেশের যাচাইকৃত ডাক্তারদের চেম্বার সিরিয়াল বুকিং প্ল্যাটফর্ম।",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
