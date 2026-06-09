import type { Metadata } from "next";
import { Oswald, Rajdhani, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { OfflineBanner } from "@/app/components/OfflineBanner";
import { Analytics } from "@vercel/analytics/next";
import { ToastProvider } from "@/app/components/ToastProvider";
import { Providers } from "@/app/components/Providers";
import { SplashScreen } from "@/app/components/SplashScreen";
import { InstallPrompt } from "@/app/components/InstallPrompt";
import { SWRegister } from "@/app/components/SWRegister";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["800"],
  style: ["italic"],
});

export const metadata: Metadata = {
  title: {
    default: "TOTAL GYM - Entrena como un campeón",
    template: "%s | TOTAL GYM",
  },
  description: "Tu centro de entrenamiento diario. Crea rutinas de gym, registra series y pesos, sigue tu progreso y supera tus récords.",
  keywords: ["gimnasio", "entrenamiento", "fitness", "rutina gym", "ejercicios", "series", "pesas", "entrenar", "fuerza", "músculos", "health", "workout"],
  authors: [{ name: "TOTAL GYM", url: "https://totalgym.life" }],
  creator: "TOTAL GYM",
  publisher: "TOTAL GYM",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TotalGym",
    startupImage: [
      { url: "/splash-2048x2732.png", media: "(device-width: 1024px) and (device-height: 1366px) and (orientation: portrait)" },
      { url: "/splash-1668x2224.png", media: "(device-width: 834px) and (device-height: 1112px) and (orientation: portrait)" },
      { url: "/splash-1536x2048.png", media: "(device-width: 768px) and (device-height: 1024px) and (orientation: portrait)" },
      { url: "/splash-1242x2208.png", media: "(device-width: 414px) and (device-height: 736px) and (orientation: portrait)" },
      { url: "/splash-750x1334.png", media: "(device-width: 375px) and (device-height: 667px) and (orientation: portrait)" },
      { url: "/splash-1125x2436.png", media: "(device-width: 375px) and (device-height: 812px) and (orientation: portrait)" },
      { url: "/splash-1242x2688.png", media: "(device-width: 414px) and (device-height: 896px) and (orientation: portrait)" },
      "/splash-2048x2732.png",
    ],
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://totalgym.life",
    siteName: "TOTAL GYM",
    title: "TOTAL GYM - Entrena como un campeón",
    description: "Tu centro de entrenamiento diario. Crea rutinas de gym, registra series y pesos, sigue tu progreso y supera tus récords.",
    images: [
      {
        url: "https://totalgym.life/og-image.png",
        width: 1200,
        height: 630,
        alt: "TOTAL GYM - Tu app de entrenamiento",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TOTAL GYM",
    description: "Tu centro de entrenamiento diario. Crea rutinas de gym, registra series y pesos, sigue tu progreso.",
    images: ["https://totalgym.life/og-image.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#eab308",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TOTAL GYM",
    url: "https://totalgym.life",
    logo: "https://totalgym.life/icon-512.png",
    description: "Tu centro de entrenamiento diario. Crea rutinas de gym, registra series y pesos, sigue tu progreso y supera tus récords.",
  };

  return (
    <html lang="es" className="dark">
      <body className={`${oswald.variable} ${rajdhani.variable} ${barlowCondensed.variable} min-h-screen antialiased`}>
        <style>{`
          #splash-screen {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #050505;
            transition: opacity 0.5s ease-out;
          }
          #splash-screen.splash-hidden {
            opacity: 0;
            pointer-events: none;
          }
          #splash-screen .splash-logo {
            width: 100px;
            height: 100px;
            margin-bottom: 20px;
            animation: splash-fade-in 0.6s ease-out forwards;
          }
          #splash-screen .splash-title {
            font-family: var(--font-oswald), Impact, sans-serif;
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 6px;
            color: #eab308;
            animation: splash-fade-in 0.6s ease-out 0.2s both;
          }
          #splash-screen .splash-subtitle {
            font-family: var(--font-rajdhani), sans-serif;
            font-size: 14px;
            letter-spacing: 3px;
            color: #a1a1aa;
            margin-top: 8px;
            animation: splash-fade-in 0.6s ease-out 0.3s both;
          }
          #splash-screen .splash-loader {
            margin-top: 48px;
            width: 120px;
            height: 3px;
            background: #27272a;
            border-radius: 2px;
            overflow: hidden;
            animation: splash-fade-in 0.6s ease-out 0.4s both;
          }
          #splash-screen .splash-loader-bar {
            height: 100%;
            width: 35%;
            background: #eab308;
            border-radius: 2px;
            animation: splash-loading 1.2s ease-in-out infinite;
          }
          @keyframes splash-loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(385%); }
          }
          @keyframes splash-fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div id="splash-screen">
          <img
            className="splash-logo"
            src="/logo.png"
            alt="TOTAL GYM"
            width="100"
            height="100"
          />
          <h1 className="splash-title">TOTAL GYM</h1>
          <p className="splash-subtitle">ENTRENA COMO UN CAMPEÓN</p>
          <div className="splash-loader">
            <div className="splash-loader-bar" />
          </div>
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>
          {children}
          <InstallPrompt />
        </Providers>
        <SplashScreen />
        <SWRegister />
        <OfflineBanner />
        <ToastProvider />
        <Analytics />
        <footer className="border-t py-3 px-4 text-center text-[10px] text-zinc-600">
          Exercise images by <a href="https://wger.de" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-400">wger.de</a> contributors under{" "}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-400">CC-BY-SA 4.0</a>
        </footer>
      </body>
    </html>
  );
}