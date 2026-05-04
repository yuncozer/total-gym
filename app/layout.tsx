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
  title: "TOTAL GYM - Entrena como un campeón",
  description: "Tu centro de entrenamiento diario. Crea rutinas, registra series y sigue tu progreso.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TotalGym",
  },
  openGraph: {
    title: "TOTAL GYM - Entrena como un campeón",
    description: "Tu centro de entrenamiento diario. Crea rutinas, registra series y sigue tu progreso.",
    url: "https://totalgym.life",
    siteName: "TOTAL GYM",
    images: [
      {
        url: "https://totalgym.life/og-image.png",
        width: 1200,
        height: 630,
        alt: "TOTAL GYM - Tu app de entrenamiento",
      },
    ],
    type: "website",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "TOTAL GYM",
    description: "Tu centro de entrenamiento diario. Crea rutinas, registra series y sigue tu progreso.",
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