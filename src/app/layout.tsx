import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider, ToastProvider, TopLoader, TooltipProvider } from "@nba/design-system";
import { ImpersonationBanner } from "./components/impersonation-banner";
import { OfflineBanner } from "./components/offline-banner";
import { ServiceWorkerRegister } from "./components/service-worker-register";
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
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
        >
          Aller au contenu principal
        </a>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              var KEY = "__nba_chunk_reload_at";
              var COOLDOWN = 10000;
              function safeReload() {
                try {
                  var last = parseInt(sessionStorage.getItem(KEY) || "0", 10);
                  var now = Date.now();
                  if (now - last < COOLDOWN) {
                    console.error("[chunk] Rechargement déjà tenté récemment — arrêt pour éviter une boucle. Videz le cache (Ctrl+Maj+R).");
                    return;
                  }
                  sessionStorage.setItem(KEY, String(now));
                } catch (_) {}
                window.location.reload();
              }
              window.addEventListener("error", function(e) {
                if (e.target && e.target.tagName === "SCRIPT" && e.target.src && e.target.src.indexOf("/_next/static/chunks/") !== -1) {
                  console.warn("[chunk] Échec de chargement, rechargement automatique...");
                  e.preventDefault();
                  safeReload();
                }
              }, true);
              window.addEventListener("unhandledrejection", function(e) {
                if (e.reason && e.reason.message && e.reason.message.indexOf("dynamically imported module") !== -1) {
                  console.warn("[chunk] Échec d'import dynamique, rechargement automatique...");
                  safeReload();
                }
              });
            })();
          `,
          }}
        />
        <ThemeProvider>
          <ServiceWorkerRegister />
          <OfflineBanner />
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
