"use client"

import { cn } from "@/lib/utils"
import { Home, ShoppingCart, Package, Wallet, Menu, X, User, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { useBusiness } from "@/context/business-context"

const routes = [
  { label: "Inicio", icon: Home, href: "/" },
  { label: "Ventas", icon: ShoppingCart, href: "/ventas" },
  { label: "Productos", icon: Package, href: "/productos" },
  { label: "Cajas", icon: Wallet, href: "/cajas" },
]

const linkClass = (active: boolean) =>
  cn(
    "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    active
      ? "bg-white/10 font-semibold text-white before:absolute before:-left-3 before:top-1.5 before:bottom-1.5 before:w-1 before:rounded-r before:bg-primary"
      : "text-white/65 hover:bg-white/5 hover:text-white"
  )

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { businessName, logoUrl } = useBusiness()
  const close = () => setIsMobileOpen(false)

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast({ title: "Sesión cerrada" })
      router.refresh()
      setTimeout(() => {
        window.location.href = "/login"
      }, 300)
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      window.location.href = "/login"
    }
  }

  const content = (
    <div className="flex h-full flex-col bg-foreground px-3 text-white">
      <Link href="/" onClick={close} className="flex h-20 items-center gap-3 px-3">
        <img src={logoUrl || "/icon.svg"} alt="" className="h-9 w-9 rounded-md bg-white object-cover" />
        <span className="font-display text-2xl font-bold leading-none truncate">
          {businessName || "Mi comercio"}
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 py-4">
        {routes.map((route) => (
          <Link key={route.href} href={route.href} onClick={close} className={linkClass(pathname === route.href)}>
            <route.icon className="h-5 w-5" />
            {route.label}
          </Link>
        ))}
      </nav>

      <div className="flex flex-col gap-1 border-t border-white/10 py-4">
        <Link href="/perfil" onClick={close} className={linkClass(pathname === "/perfil")}>
          <User className="h-5 w-5" />
          Mi cuenta
        </Link>
        <button onClick={handleLogout} className={linkClass(false)}>
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile: barra superior + panel */}
      <div className="md:hidden fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between bg-foreground px-4 text-white">
        <span className="font-display text-xl font-bold truncate">{businessName || "Mi comercio"}</span>
        <button
          aria-label={isMobileOpen ? "Cerrar menú" : "Abrir menú"}
          className="rounded-md p-2 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 top-14 z-40 bg-foreground/40" onClick={close}>
          <div className="h-full w-72 animate-in slide-in-from-left duration-200" onClick={(e) => e.stopPropagation()}>
            {content}
          </div>
        </div>
      )}

      {/* Desktop */}
      <aside className="hidden md:block w-64 shrink-0">{content}</aside>
    </>
  )
}
