import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import { Navbar } from "@/components/Navbar";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Shasthyo Sheba (স্বাস্থ্য সেবা) — Doctor Serial & Appointment Booking",
  description:
    "Book verified doctor chamber appointments (serials) across Bangladesh. বাংলাদেশের যাচাইকৃত ডাক্তারদের চেম্বার সিরিয়াল বুকিং প্ল্যাটফর্ম।",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang={session?.preferredLang ?? "en"}>
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <LanguageProvider initialLang={session?.preferredLang ?? "en"}>
          <Navbar user={session} />
          <div className="flex-1">{children}</div>
        </LanguageProvider>
      </body>
    </html>
  );
}
