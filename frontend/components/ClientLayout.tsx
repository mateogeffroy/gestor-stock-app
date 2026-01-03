"use client"

import { usePathname } from "next/navigation"
import Sidebar from "./sidebar" // Asegúrate que la ruta sea correcta a tu componente Sidebar

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Lista de rutas donde NO queremos sidebar
  const hiddenSidebarRoutes = ["/login"]
  const showSidebar = !hiddenSidebarRoutes.includes(pathname)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Renderizamos Sidebar solo si no estamos en login */}
      {showSidebar && <Sidebar />}
      
      {/* El contenido principal ocupa el resto del espacio */}
      <main className="flex-1 bg-slate-50">
        <div className="h-full p-8">
           {children}
        </div>
      </main>
    </div>
  )
}