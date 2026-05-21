import type { Metadata } from "next";
import { Oswald, Rajdhani } from "next/font/google";
import "./globals.css";

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
      { url: "/favicon.svg", type: "image/svg+xml" },
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${oswald.variable} ${rajdhani.variable} min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}