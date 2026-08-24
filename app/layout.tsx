import type { Metadata, Viewport } from "next";
import "./globals.css";

const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://draw-me-wrong.chitu-atukuri2000.chatgpt.site";
const title = "Draw Me Wrong: 10 seconds. One guess.";
const description = "Draw a secret prompt badly in ten seconds. Send one link. Your friend gets one replay and one guess.";

export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title,
  description,
  applicationName: "Draw Me Wrong",
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.svg" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Draw Me Wrong",
    title,
    description,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Draw Me Wrong: 10 seconds. One guess." }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f2eee3",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
