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
  description: "Tu centro de entrenamiento diario. Mensajes motivacionales para cada día.",
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