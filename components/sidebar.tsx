"use client"

import { cn } from "@/lib/utils"
import { LayoutDashboard, ShoppingCart, Package, DollarSign, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

const routes = [
  /*{
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
    color: "text-sky-500",
  },*/
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
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed left-4 top-4 z-50 md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileOpen(false)}
          >
            <div
              className="fixed left-0 top-0 h-full w-72 bg-background shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-20 items-center px-6">
                <h1 className="text-xl font-bold">La Cuerda Bebidas</h1>
              </div>
              <div className="flex flex-col gap-2 px-3">
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                      pathname === route.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                    )}
                  >
                    <route.icon className={cn("h-5 w-5", route.color)} />
                    {route.label}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="hidden h-full w-72 flex-col border-r bg-background md:flex">
        <div className="flex h-20 items-center px-6">
          <h1 className="text-xl font-bold">La Cuerda Bebidas</h1>
        </div>
        <div className="flex flex-col gap-2 px-3">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                pathname === route.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
            >
              <route.icon className={cn("h-5 w-5", route.color)} />
              {route.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}

