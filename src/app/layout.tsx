import type { Metadata } from "next";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMD Chess — Percasi Sumedang",
  description:
    "Sistem manajemen turnamen catur — registrasi online, verifikasi pembayaran, dan Swiss pairing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
