import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "belajarkorea.id - Belajar Bahasa Korea Jadi Super Seru",
  description: "Platform belajar bahasa Korea paling interaktif dan asik. Mulai dari nol sampai jago ngobrol tanpa subtitle!",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "belajarkorea.id",
  },
  formatDetection: {
    telephone: false,
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
        {/* PWA Icons */}
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        
        {/* PWA Splash Screen Color */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col font-sans pb-20 md:pb-0">
        <I18nProvider>
          {children}
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
