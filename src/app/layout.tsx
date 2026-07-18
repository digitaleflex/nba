import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider, ToastProvider, TopLoader, TooltipProvider } from "@nba/design-system";
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
  appleWebApp: {
    capable: true,
    title: "NeverBrokeAgain",
    statusBarStyle: "black-translucent",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "NeverBrokeAgain",
    description: "Plateforme de signaux de trading premium",
    images: [{ url: "/logo.png", width: 512, height: 512 }],
    type: "website",
    locale: "fr_FR",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#030711" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
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
          <Suspense fallback={null}>
            <TopLoader />
          </Suspense>
          <ImpersonationBanner />
          <TooltipProvider delay={150}>
            {children}
          </TooltipProvider>
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
