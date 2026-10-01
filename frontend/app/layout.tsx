import type { Metadata } from "next";
import { Hanken_Grotesk, Big_Shoulders } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { BusinessProvider } from "@/context/business-context"; 

const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans" });
const display = Big_Shoulders({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Mi comercio",
  description: "Sistema de gestión",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${sans.variable} ${display.variable} font-sans`}>
        {/* PROVIDERS GLOBALES (Mantener aquí) */}
        <BusinessProvider>
          
          {/* AQUÍ YA NO ESTÁ ClientLayout. Solo renderiza el hijo directo. */}
          {children}
          
        </BusinessProvider>

        <Toaster />
      </body>
    </html>
  );
}