import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { I18nProvider } from "@/lib/i18n";
import InstallPrompt from "@/components/InstallPrompt";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tsuha.id'

export const metadata: Metadata = {
  // ── Basic ──────────────────────────────────────────────────
  title: {
    default: "Tsuha.id - Belajar Bahasa Korea Jadi Super Seru",
    template: "%s | Tsuha.id",
  },
  description: "Platform belajar bahasa Korea paling interaktif dan asik. Mulai dari nol sampai jago ngobrol tanpa subtitle! Kuasai Hangul, kosakata, grammar, dan percakapan sehari-hari.",
  keywords: ["belajar bahasa korea", "kursus bahasa korea", "belajar hangul", "korean learning", "tsuha", "tsuha.id"],
  authors: [{ name: "Tsuha.id" }],
  creator: "Tsuha.id",
  metadataBase: new URL(APP_URL),

  // ── Google Search Console Verification ────────────────────
  // Dapatkan kode ini dari: Google Search Console → Add Property → HTML tag
  // Salin nilai content="XXXX..." dan paste di bawah:
  verification: {
    google: "iV-7M1rCfNshiYV1NUeT81s7jCJXdI52KtRbBA7fFI8",
  },

  // ── Open Graph (Facebook, WhatsApp, Discord, dll) ─────────
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: APP_URL,
    siteName: "Tsuha.id",
    title: "Tsuha.id - Belajar Bahasa Korea Jadi Super Seru",
    description: "Platform belajar bahasa Korea paling interaktif dan asik. Mulai dari nol sampai jago ngobrol tanpa subtitle!",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Tsuha.id - Platform Belajar Bahasa Korea",
      },
    ],
  },

  // ── Twitter / X Card ──────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "Tsuha.id - Belajar Bahasa Korea Jadi Super Seru",
    description: "Platform belajar bahasa Korea paling interaktif dan asik. Mulai dari nol sampai jago ngobrol tanpa subtitle!",
    images: ["/og-image.png"],
  },

  // ── PWA ───────────────────────────────────────────────────
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tsuha.id",
  },
  formatDetection: {
    telephone: false,
  },

  // ── Robots ────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#8B5CF6",
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
      lang="id"
      className={`${plusJakarta.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* PWA / Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        
        {/* PWA Splash Screen Color */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <I18nProvider>
          {children}
          <InstallPrompt />
        </I18nProvider>
        {/* Midtrans Snap Script */}
        <Script
          src={process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || "https://app.sandbox.midtrans.com/snap/snap.js"}
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
          strategy="lazyOnload"
        />
        {/* Service Worker Registration */}
        <Script id="sw-register" strategy="lazyOnload">
          {`
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js')
                .then(function(registration) {
                  console.log('SW registered:', registration.scope);
                })
                .catch(function(error) {
                  console.log('SW registration failed:', error);
                });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
