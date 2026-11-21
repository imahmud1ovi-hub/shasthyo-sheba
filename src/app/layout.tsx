import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import { Navbar } from "@/components/Navbar";
import { PwaRegistrar } from "@/components/PwaRegistrar";
import { getSession } from "@/lib/auth/session";

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Shasthyo Sheba (স্বাস্থ্য সেবা) — Doctor Serial & Appointment Booking",
  description:
    "Book verified doctor chamber appointments (serials) across Bangladesh. বাংলাদেশের যাচাইকৃত ডাক্তারদের চেম্বার সিরিয়াল বুকিং প্ল্যাটফর্ম।",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Shasthyo Sheba",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
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
        <PwaRegistrar />
        <LanguageProvider initialLang={session?.preferredLang ?? "en"}>
          <Navbar user={session} />
          <div className="flex-1">{children}</div>
        </LanguageProvider>
      </body>
    </html>
  );
}
