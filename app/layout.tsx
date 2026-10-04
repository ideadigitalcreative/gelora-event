import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"], // Pastikan font Bricolage memuat bobot-bobot ini
  variable: "--font-display",
  display: "swap",
  adjustFontFallback: false, // Penting agar font display tidak di-resize oleh fallback default
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GELORA EVENT — DPD Gelora Makassar",
  description:
    "Registrasi tiket DPD Gelora Makassar berbasis QR Code. Dapatkan tiket digitalmu, tunjukkan saat check-in.",
  openGraph: {
    images: [
      {
        url: "https://nvmiseqiwtdfcldhhfef.supabase.co/storage/v1/object/public/event-assets/hero/03147860-7c9a-4824-ba09-9c26437b2b32.webp",
        width: 800,
        height: 1131,
        alt: "GELORA EVENT — DPD Gelora Makassar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://nvmiseqiwtdfcldhhfef.supabase.co/storage/v1/object/public/event-assets/hero/03147860-7c9a-4824-ba09-9c26437b2b32.webp"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-cream font-body text-ink">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}