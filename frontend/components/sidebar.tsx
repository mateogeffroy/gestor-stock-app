"use client"

import { cn } from "@/lib/utils"
import { Home, ShoppingCart, Package, DollarSign, Menu, X, User, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation" // Importamos useRouter
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase" // Importamos Supabase
import { useToast } from "@/components/ui/use-toast" // Para avisar que salió

const routes = [
  {
    label: "Inicio",
    icon: Home,
    href: "/",
    color: "text-sky-500",
  },
  {
    label: "Ventas",
    icon: ShoppingCart,
    href: "/ventas",
    color: "text-violet-500",
  },
  {
    label: "Productos",
    icon: Package,
    href: "/productos",
    color: "text-pink-700",
  },
  {
    label: "Cajas",
    icon: DollarSign,
    href: "/cajas",
    color: "text-orange-500",
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // FUNCIÓN DE LOGOUT REAL
  const handleLogout = async () => {
    // 1. Le decimos a Supabase que cierre la sesión
    await supabase.auth.signOut()
    
    // 2. Avisamos visualmente
    toast({
        title: "Sesión cerrada",
        description: "Hasta luego 👋"
    })

    // 3. Redirigimos al login
    router.push("/login")
    router.refresh() // Refrescamos para limpiar cualquier caché de datos
  }

  const renderContent = () => (
    <div className="flex h-full flex-col bg-background">
      {/* HEADER */}
      <div className="flex h-20 items-center px-6">
        <h1 className="text-xl font-bold">Gestor de stock</h1>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        
        {/* PERFIL */}
        <Link
          href="/perfil"
          onClick={() => setIsMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent text-gray-500 hover:text-gray-900 mb-2",
            pathname === "/perfil" && "bg-accent text-accent-foreground"
          )}
        >
          <User className="h-5 w-5" />
          Mi cuenta
        </Link>

        {/* SEPARADOR */}
        <div className="my-2 h-[1px] bg-border/60 mx-3" />

        {/* NAVEGACIÓN */}
        <div className="flex flex-col gap-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                pathname === route.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
            >
              <route.icon className={cn("h-5 w-5", route.color)} />
              {route.label}
            </Link>
          ))}
        </div>
      </div>

      {/* FOOTER - AHORA ES UN BOTÓN REAL */}
      <div className="mt-auto p-3 mb-4 border-t pt-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-red-600 transition-all hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* MÓVIL */}
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
          <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)}>
            <div className="fixed left-0 top-0 h-full w-72 bg-background shadow-lg border-r" onClick={(e) => e.stopPropagation()}>
              {renderContent()}
            </div>
          </div>
        )}
      </div>

      {/* ESCRITORIO*/}
      <div className="hidden md:flex h-full w-72 flex-col border-r bg-background">
        {renderContent()}
      </div>
    </>
  )
}