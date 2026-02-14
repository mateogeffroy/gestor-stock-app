"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// CAMBIO 1: Agregamos CircleHelp a los imports
import { ShoppingCart, Loader2, CircleHelp } from "lucide-react"
import { ventaService } from "@/services/venta-service"

export default function Home() {
  const [total, setTotal] = useState("")
  const [discount, setDiscount] = useState("")
  const [discountedTotal, setDiscountedTotal] = useState(0)

  const [ultimasVentas, setUltimasVentas] = useState<any[]>([])
  const [isVentasLoading, setIsVentasLoading] = useState(true)

  useEffect(() => {
    const cargarVentas = async () => {
      try {
        const data = await ventaService.getUltimasVentas(5);
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
        {/* TARJETA DE ÚLTIMAS VENTAS */}
        <Card>
          <CardHeader>
            <CardTitle>Últimas Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                        {new Date(venta.fecha + "T" + venta.hora).toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div className="text-sm font-bold">
                      ${Number(venta.total).toLocaleString('es-AR', {minimumFractionDigits: 2})}
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

        {/* TARJETA CALCULADORA DE DESCUENTO CON TOOLTIP */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Calculadora de Descuento
              
              {/* --- INICIO TOOLTIP (MODIFICADO PARA QUE SALGA ABAJO) --- */}
              <div className="relative group flex items-center">
                <CircleHelp className="h-4 w-4 text-muted-foreground cursor-help hover:text-primary transition-colors" />
                
                {/* Globo de diálogo: Cambiamos 'bottom-full mb-2' por 'top-full mt-2' */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block w-64 p-3 bg-slate-900 text-white text-xs rounded-md shadow-lg z-50 pointer-events-none">
                  <p className="font-bold mb-1">¿Cómo funciona?</p>
                  <p>Ingresa el monto total sin descuento en "Total ($)" y el porcentaje de descuento en "Descuento (%)". El sistema calculará automáticamente el precio final a cobrar.</p>
                  <br />
                  <p>Fórmula:</p>
                  <p>Descontado=Total-(Total*Descuento/100)</p>
                  
                  {/* Triángulo decorativo: Ahora va arriba (bottom-full) y apunta hacia arriba (border-b) */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900"></div>
                </div>
              </div>
              {/* --- FIN TOOLTIP --- */}

            </CardTitle>
          </CardHeader>
          <CardContent>
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