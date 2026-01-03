import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
// Quitamos Sidebar de aquí, ya lo maneja ClientLayout
import ClientLayout from "@/components/ClientLayout" 
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "La Cuerda Bebidas",
  description: "Sistema de gestión para La Cuerda Bebidas",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light" 
          enableSystem={false}
          forcedTheme="light" 
          disableTransitionOnChange
        >
          {/* Aquí delegamos la estructura visual al ClientLayout */}
          <ClientLayout>
             {children}
          </ClientLayout>
          
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}