"use client"

import { usePathname } from "next/navigation"
import Sidebar from "./sidebar" 

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  const hiddenSidebarRoutes = ["/login"]
  const showSidebar = !hiddenSidebarRoutes.includes(pathname)

  return (
    // 1. El PADRE define la altura fija de la ventana (h-screen) y evita scroll global
    <div className="flex h-screen overflow-hidden">
      
      {showSidebar && <Sidebar />}
      
      {/* 2. EL MAIN debe tener overflow-y-auto para scrollear SU contenido independientemente */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        
        {/* Quitamos h-full de aquí para que el contenido pueda crecer hacia abajo libremente */}
        <div className="p-8">
           {children}
        </div>
      </main>
    </div>
  )
}