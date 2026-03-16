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
  metadataBase: config.siteUrl,
  title: {
    default: "Twenty-One Degrees | Free Online Blackjack Game",
    template: "%s | Twenty-One Degrees",
  },
  description: "Play Twenty-One Degrees, a sleek and fast web-based Blackjack game. Test your strategy, beat the dealer, and enjoy playing 21 for free directly in your browser.",
  keywords: ["blackjack", "online blackjack", "play blackjack free", "web-based card game", "21 card game", "browser game", "casino game", "Twenty-One Degrees"],
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: config.siteUrl,
    siteName: "Twenty-One Degrees",
    title: "Twenty-One Degrees - Play Free Blackjack Online",
    description: "Experience the thrill of 21. Play our free web-based Blackjack game directly in your browser. No downloads required.",
    images: [
      {
        url: "/logo.png",
        alt: "Twenty-One Degrees Blackjack Game Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Twenty-One Degrees | Free Online Blackjack",
    description: "Test your skills against the dealer in this sleek web-based Blackjack game.",
    images: ["/logo.png"],
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
