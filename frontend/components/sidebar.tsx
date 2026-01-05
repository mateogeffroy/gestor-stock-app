"use client"

import { cn } from "@/lib/utils"
import { Home, ShoppingCart, Package, DollarSign, Menu, X, User, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation" // Añadido useRouter
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { useBusiness } from "@/context/business-context"

const routes = [
  { label: "Inicio", icon: Home, href: "/", color: "text-sky-500" },
  { label: "Ventas", icon: ShoppingCart, href: "/ventas", color: "text-violet-500" },
  { label: "Productos", icon: Package, href: "/productos", color: "text-pink-700" },
  { label: "Cajas", icon: DollarSign, href: "/cajas", color: "text-orange-500" },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter() // Inicializado
  const { toast } = useToast()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { businessName, logoUrl } = useBusiness()

  const handleLogout = async () => {
    try {
      // 1. Cerrar sesión en Supabase
      await supabase.auth.signOut()
      
      toast({ title: "Sesión cerrada", description: "Hasta luego 👋" })

      // 2. Limpieza y redirección
      // refresh() limpia la caché de los Server Components
      router.refresh()
      
      // 3. Redirección total para limpiar el estado global de React
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
        {logoUrl && (
          <img 
            src={logoUrl} 
            alt="Logo" 
            className="h-8 w-8 rounded-md object-cover border bg-white" 
          />
        )}
        <h1 className="text-xl font-bold truncate transition-all duration-300">
          {businessName || "Gestor de stock"}
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
      <div className="md:hidden">
        <Button 
          variant="outline" 
          size="icon" 
          className="fixed left-4 top-4 z-50" 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        {isMobileOpen && (
          <div 
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" 
            onClick={() => setIsMobileOpen(false)}
          >
            <div 
              className="fixed left-0 top-0 h-full w-72 bg-background shadow-lg border-r" 
              onClick={(e) => e.stopPropagation()}
            >
              {renderContent()}
            </div>
          </div>
        )}
      </div>

      <div className="hidden md:flex h-full w-72 flex-col border-r bg-background">
        {renderContent()}
      </div>
    </>
  )
}