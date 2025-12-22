import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Sidebar from "@/components/sidebar"
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
        {/* CAMBIO CRÍTICO: 
           forcedTheme="light" -> OBLIGA al sistema a ser blanco siempre.
           Ignora el sistema operativo y el localStorage.
        */}
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light" 
          enableSystem={false}
          forcedTheme="light" 
          disableTransitionOnChange
        >
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">{children}</main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}