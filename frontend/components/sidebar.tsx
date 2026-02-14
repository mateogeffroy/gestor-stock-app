"use client"

import { cn } from "@/lib/utils"
import { Home, ShoppingCart, Package, DollarSign, Menu, X, User, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { useBusiness } from "@/context/business-context"

// Asegúrate de que los colores aquí sean los que definimos (text-primary si quieres todo naranja)
const routes = [
  { label: "Inicio", icon: Home, href: "/", color: "text-primary" },
  { label: "Ventas", icon: ShoppingCart, href: "/ventas", color: "text-violet-500" },
  { label: "Productos", icon: Package, href: "/productos", color: "text-pink-700" },
  { label: "Cajas", icon: DollarSign, href: "/cajas", color: "text-orange-500" },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { businessName, logoUrl } = useBusiness()

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast({ title: "Sesión cerrada", description: "Hasta luego 👋" })
      router.refresh()
      setTimeout(() => {
        window.location.href = "/login"
      }, 300)
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      window.location.href = "/login"
    }
  }

  const renderContent = () => (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-20 items-center px-6 gap-3 overflow-hidden border-b">
        <img 
          src={logoUrl || "/icon.svg"} 
          alt="Logo" 
          className="h-8 w-8 rounded-md object-cover" 
        />
        <h1 className="text-xl font-bold truncate transition-all duration-300">
          {businessName || "Mi comercio"}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <Link
          href="/perfil"
          onClick={() => setIsMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent text-gray-500 hover:text-gray-900 mb-4",
            pathname === "/perfil" && "bg-accent text-accent-foreground font-semibold"
          )}
        >
          <User className="h-5 w-5" />
          Mi cuenta
        </Link>
        
        <div className="flex flex-col gap-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                pathname === route.href ? "bg-accent text-accent-foreground font-semibold" : "text-muted-foreground",
              )}
            >
              <route.icon className={cn("h-5 w-5", route.color)} />
              {route.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-auto p-3 mb-4 border-t pt-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-red-600 transition-all hover:bg-red-50 hover:font-bold"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* --- MENU MOBILE --- */}
      <div className="md:hidden">
        <Button 
          size="icon" 
          /* CAMBIO: Posición derecha (right-4), fondo primario, texto blanco, sin borde */
          className="fixed right-4 top-4 z-50 bg-primary text-white hover:bg-primary/90 border-none shadow-md" 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        
        {isMobileOpen && (
          <div 
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-all" 
            onClick={() => setIsMobileOpen(false)}
          >
            <div 
              /* CAMBIO: fixed right-0, border-l, y animación slide-in-from-right */
              className="fixed right-0 top-0 h-full w-72 bg-background shadow-2xl border-l animate-in slide-in-from-right duration-300" 
              onClick={(e) => e.stopPropagation()}
            >
              {renderContent()}
            </div>
          </div>
        )}
      </div>

      {/* --- MENU DESKTOP (Sin cambios, se mantiene a la izquierda) --- */}
      <div className="hidden md:flex h-full w-72 flex-col border-r bg-background fixed left-0 top-0 bottom-0 z-30">
        {renderContent()}
      </div>
      
      {/* Ajuste de margen para desktop para que el contenido no quede tapado */}
      <div className="hidden md:block w-72 shrink-0" />
    </>
  )
}