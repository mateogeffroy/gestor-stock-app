import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { BusinessProvider } from "@/context/business-context"; 

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
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