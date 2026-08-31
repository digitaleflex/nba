import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { ThemeProvider, ToastProvider, TopLoader, TooltipProvider } from "@nba/design-system";
import { OfflineBanner } from "./components/offline-banner";
import { DeviceFingerprintInit } from "@nba/lib/hooks/use-device-fingerprint";
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
  maximumScale: 5,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // CSP avec nonce exige un rendu dynamique : attendre la requête courante
  // pour que Next.js puisse injecter le nonce dans les <script>/<style> inline.
  await connection();

  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <DeviceFingerprintInit />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
        >
          Aller au contenu principal
        </a>
        <Script
          src="/scripts/chunk-reload.js"
          strategy="afterInteractive"
        />
        <ThemeProvider>
          <OfflineBanner />
          <Suspense fallback={null}>
            <TopLoader />
          </Suspense>
          <TooltipProvider delay={150}>
            {children}
          </TooltipProvider>
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
