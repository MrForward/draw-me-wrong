import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PRODUCT_STRUCTURED_DATA, SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN, SITE_TITLE } from "./site-config";

const routeBootstrap = `try{if(location.hash.startsWith("#d=")||/^\\/c\\/[A-Za-z0-9_-]{16}$/.test(location.pathname)){document.documentElement.dataset.dmwChallenge="loading"}}catch{}`;
const structuredData = JSON.stringify(PRODUCT_STRUCTURED_DATA).replace(/</g, "\\u003c");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  verification: {
    google: "oBBMg5XRq0kKuT0UumOphYlzoPZcMzZnbEPK1txFIqk",
  },
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.svg" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Draw Me Wrong: Bad drawings. Better together." }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
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
      <head>
        <script dangerouslySetInnerHTML={{ __html: routeBootstrap }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
