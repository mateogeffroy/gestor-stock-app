"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShoppingCart } from "lucide-react"

export default function Home() {
  // --- Estados para la calculadora ---
  // Guardamos los valores de los inputs del usuario
  const [total, setTotal] = useState("")
  const [discount, setDiscount] = useState("")
  // Guardamos el resultado del cálculo
  const [discountedTotal, setDiscountedTotal] = useState(0)

  // --- Efecto para calcular dinámicamente ---
  // Este hook se ejecuta cada vez que 'total' o 'discount' cambian
  useEffect(() => {
    // Convertimos el texto de los inputs a números
    const numericTotal = parseFloat(total)
    const numericDiscount = parseFloat(discount)

    // Validamos que sean números válidos antes de calcular
    if (!isNaN(numericTotal) && !isNaN(numericDiscount)) {
      const result = numericTotal - (numericTotal * (numericDiscount / 100))
      setDiscountedTotal(result)
    } else {
      // Si un input no es un número válido, mostramos el total o 0
      setDiscountedTotal(numericTotal || 0)
    }
  }, [total, discount]) // Dependencias: el efecto se re-ejecuta si cambian

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Inicio</h1>
        <p className="text-muted-foreground">Bienvenido al sistema de gestión de La Cuerda Bebidas</p>
      </div>

      {/* --- Contenedor principal de las tarjetas --- */}
      <div className="grid gap-4 md:grid-cols-2">

        {/* --- Tarjeta de Ventas Recientes (sin cambios) --- */}
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

        {/* --- NUEVA: Tarjeta de Calculadora de Descuento --- */}
        <Card>
          <CardHeader>
            <CardTitle>Calculadora de Descuento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="total">Total ($)</Label>
                <Input
                  id="total"
                  type="number"
                  placeholder="Ej: 1000"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Descuento (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  placeholder="Ej: 20"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
              <div className="pt-2">
                <p className="text-sm font-medium text-muted-foreground">Total con descuento:</p>
                <p className="text-3xl font-bold">
                  ${discountedTotal.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}