"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShoppingCart, Loader2 } from "lucide-react"
import { fetchUltimasVentas } from "@/app/ventas/actions"
import { Venta } from "@/app/ventas/types"


export default function Home() {
  const [total, setTotal] = useState("")
  const [discount, setDiscount] = useState("")
  const [discountedTotal, setDiscountedTotal] = useState(0)

  const [ultimasVentas, setUltimasVentas] = useState<Venta[]>([])
  const [isVentasLoading, setIsVentasLoading] = useState(true)

  useEffect(() => {
    const cargarVentas = async () => {
      try {
        const data = await fetchUltimasVentas();
        setUltimasVentas(data);
      } catch (error) {
        console.error("Error al cargar las últimas ventas:", error);
      } finally {
        setIsVentasLoading(false);
      }
    };

    cargarVentas();
  }, []);

  useEffect(() => {
    const numericTotal = parseFloat(total)
    const numericDiscount = parseFloat(discount)

    if (!isNaN(numericTotal) && !isNaN(numericDiscount)) {
      const result = numericTotal * (100 - numericDiscount) / 100
      setDiscountedTotal(result)
    } else {
      setDiscountedTotal(numericTotal || 0)
    }
  }, [total, discount])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Inicio</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimas Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* --- 4. Modificamos el renderizado para mostrar datos reales --- */}
              {isVentasLoading ? (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : ultimasVentas.length > 0 ? (
                ultimasVentas.map((venta) => (
                  <div key={venta.id} className="flex items-center gap-4">
                    <div className="rounded-full bg-violet-100 p-2 text-violet-500 dark:bg-violet-900/20">
                      <ShoppingCart className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Venta #{venta.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(venta.fecha_y_hora).toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div className="text-sm font-bold">
                      ${Number(venta.importe_total).toLocaleString('es-AR', {minimumFractionDigits: 2})}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay ventas recientes para mostrar.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calculadora de Descuento</CardTitle>
          </CardHeader>
          <CardContent>
            {/* La calculadora no tiene cambios */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="total">Total ($)</Label>
                <Input id="total" type="number" placeholder="Ej: 1000" value={total} onChange={(e) => setTotal(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Descuento (%)</Label>
                <Input id="discount" type="number" placeholder="Ej: 20" value={discount} onChange={(e) => setDiscount(e.target.value)} />
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