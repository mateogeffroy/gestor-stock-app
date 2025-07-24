"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Package, DollarSign, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"

export default function Home() {
  const stats = [
    {
      title: "Ventas Totales",
      value: "$125,430",
      icon: ShoppingCart,
      color: "bg-violet-100 text-violet-500 dark:bg-violet-900/20",
      change: "+12.5%",
    },
    {
      title: "Productos",
      value: "124",
      icon: Package,
      color: "bg-pink-100 text-pink-700 dark:bg-pink-900/20",
      change: "+3.2%",
    },
    {
      title: "Caja Actual",
      value: "$4,320",
      icon: DollarSign,
      color: "bg-orange-100 text-orange-500 dark:bg-orange-900/20",
      change: "+18.7%",
    },
    {
      title: "Crecimiento",
      value: "24.5%",
      icon: TrendingUp,
      color: "bg-green-100 text-green-500 dark:bg-green-900/20",
      change: "+4.1%",
    },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Bienvenido al sistema de gestión de La Cuerda Bebidas</p>
      </div>

      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {stats.map((stat) => (
          <motion.div key={stat.title} variants={item}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`rounded-full p-2 ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span>{stat.change} desde el mes pasado</span>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ventas Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="rounded-full bg-violet-100 p-2 text-violet-500 dark:bg-violet-900/20">
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Venta #{1000 + i}</p>
                    <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="text-sm font-medium">${Math.floor(Math.random() * 1000)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productos Populares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {["Cerveza Quilmes", "Fernet Branca", "Vino Malbec", "Vodka Absolut", "Whisky Johnnie Walker"].map(
                (product, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="rounded-full bg-pink-100 p-2 text-pink-700 dark:bg-pink-900/20">
                      <Package className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{product}</p>
                      <p className="text-xs text-muted-foreground">Stock: {Math.floor(Math.random() * 100)} unidades</p>
                    </div>
                    <div className="text-sm font-medium">${Math.floor(Math.random() * 5000)}</div>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

