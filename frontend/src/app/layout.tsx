import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";

import config from "@/config";

import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Blackjack Game",
  description: "Play a simple web-based Blackjack game built with Next.js.",
  keywords: ["blackjack", "game"],
  openGraph: {
    title: "Blackjack Game",
    description: "Play a simple web-based Blackjack game built with Next.js.",
    url: config.siteUrl,
    siteName: "Blackjack Game",
    images: [
      {
        url: `${config.siteUrl}/logo.png`,
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${sora.variable} ${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
