import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider, ToastProvider } from "@nba/design-system";
import { ImpersonationBanner } from "./components/impersonation-banner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function getMetadataBase() {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: "NeverBrokeAgain",
    template: "%s | NeverBrokeAgain",
  },
  description: "Plateforme de signaux de trading premium",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#030711" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.png", sizes: "32x32", type: "image/png" }],
    apple: "/logo.png",
    other: [
      { rel: "apple-touch-icon-precomposed", url: "/icons/icon-192x192.png" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "NeverBrokeAgain",
    statusBarStyle: "black-translucent",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileImage": "/icons/icon-192x192.png",
    "msapplication-TileColor": "#030711",
  },
  openGraph: {
    title: "NeverBrokeAgain",
    description: "Plateforme de signaux de trading premium",
    images: [{ url: "/logo.png", width: 512, height: 512 }],
    type: "website",
    locale: "fr_FR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col noise">
        <ThemeProvider>
          <ImpersonationBanner />
          {children}
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
