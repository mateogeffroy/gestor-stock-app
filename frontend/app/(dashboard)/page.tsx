"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Loader2, ArrowUp, ArrowDown, AlertTriangle, PackageX } from "lucide-react"
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { kpiService } from "@/services/kpi-service"
import {
  coberturaStock, delta, diasEntre, mapaCalor, rangos, resumen, seriePorDia, seriePorHora, topProductos,
  type Preset, type ProductoKpi, type VentaKpi,
} from "@/lib/kpis"

const PRESETS: { id: Preset; label: string; comparado: string }[] = [
  { id: "hoy", label: "Hoy", comparado: "ayer" },
  { id: "7d", label: "7 días", comparado: "los 7 días anteriores" },
  { id: "30d", label: "30 días", comparado: "los 30 días anteriores" },
  { id: "mes", label: "Este mes", comparado: "la misma cantidad de días antes del 1.º" },
]

const SERIE = "hsl(var(--chart-1))"
const PREVIA = "hsl(var(--chart-prev))"
// Rampa secuencial (un solo tono, claro → oscuro) para el mapa de calor
const RAMPA = ["#E3F1EA", "#B5DCC8", "#7CC0A0", "#3E9D76", "#0A7D55", "#075B3E"]
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

const pesos = (n: number) => `$${n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const pesosCompacto = (n: number) => `$${Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 1 }).format(n)}`
const pct = (n: number) => `${(n * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })} %`
const diaCorto = (f: string) => f.slice(8, 10) + "/" + f.slice(5, 7)

export default function Inicio() {
  const [preset, setPreset] = useState<Preset>("7d")
  const [ventas, setVentas] = useState<VentaKpi[] | null>(null)
  const [productos, setProductos] = useState<ProductoKpi[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const r = useMemo(() => rangos(preset), [preset])

  useEffect(() => {
    let vigente = true
    setCargando(true)
    setError(null)
    Promise.all([kpiService.ventas({ desde: r.anterior.desde, hasta: r.actual.hasta }), kpiService.productos()])
      .then(([v, p]) => {
        if (!vigente) return
        setVentas(v)
        setProductos(p)
      })
      .catch(() => vigente && setError("No se pudieron cargar los datos. Revisá la conexión y recargá la página."))
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
  }, [r])

  const datos = useMemo(() => {
    if (!ventas) return null
    const actuales = ventas.filter((v) => v.fecha >= r.actual.desde)
    const anteriores = ventas.filter((v) => v.fecha < r.actual.desde)
    const costos = new Map(productos.map((p) => [p.id, Number(p.precio_costo)]))
    const nombres = new Map(productos.map((p) => [p.id, p.nombre]))
    const dias = diasEntre(r.actual)
    const stock = coberturaStock(productos, actuales, dias)
    return {
      act: resumen(actuales, costos),
      ant: resumen(anteriores, costos),
      serie: preset === "hoy" ? null : seriePorDia(ventas, r),
      porHora: preset === "hoy" ? seriePorHora(actuales, anteriores) : null,
      calor: dias >= 7 ? mapaCalor(actuales) : null,
      top: topProductos(actuales, nombres),
      sinStock: stock.filter((s) => s.stock <= 0),
      reponer: stock
        .filter((s) => s.stock > 0 && s.diasCobertura !== null && s.diasCobertura < 7)
        .sort((a, b) => a.diasCobertura! - b.diasCobertura!),
      valorInventario: stock.reduce((s, x) => s + x.valorCosto, 0),
    }
  }, [ventas, productos, r, preset])

  const comparado = PRESETS.find((p) => p.id === preset)!.comparado

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Inicio</h1>
          <p className="mt-2 text-sm text-muted-foreground">Variaciones comparadas con {comparado}.</p>
        </div>
        <div role="group" aria-label="Período" className="inline-flex rounded-md border bg-card p-1">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              aria-pressed={preset === p.id}
              onClick={() => setPreset(p.id)}
              className={cn(
                "rounded px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                preset === p.id ? "bg-foreground text-white" : "hover:bg-muted"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="rounded-md border border-destructive/40 bg-card p-4 text-destructive">{error}</p>}

      {!datos ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className={cn("space-y-10 transition-opacity", cargando && "opacity-60")} aria-busy={cargando}>
          {/* KPIs principales */}
          <section aria-label="Indicadores" className="grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-border lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
            <Kpi grande titulo="Ventas" valor={pesos(datos.act.ventas)} d={delta(datos.act.ventas, datos.ant.ventas)} />
            <Kpi titulo="Cantidad de ventas" valor={datos.act.transacciones.toLocaleString("es-AR")} d={delta(datos.act.transacciones, datos.ant.transacciones)} />
            <Kpi titulo="Ticket promedio" valor={pesos(datos.act.ticketPromedio)} d={delta(datos.act.ticketPromedio, datos.ant.ticketPromedio)} />
            <Kpi
              titulo="Margen bruto"
              valor={datos.act.margenPct === null ? "—" : pct(datos.act.margenPct)}
              detalle={datos.act.margenPct === null ? "Cargá el costo de tus productos" : pesos(datos.act.margenBruto)}
              d={datos.act.margenPct !== null && datos.ant.margenPct !== null ? datos.act.margenPct - datos.ant.margenPct : null}
              puntos
            />
            <Kpi
              titulo="Unidades por venta"
              valor={datos.act.unidadesPorVenta.toLocaleString("es-AR", { maximumFractionDigits: 1 })}
              d={delta(datos.act.unidadesPorVenta, datos.ant.unidadesPorVenta)}
            />
          </section>

          {/* Evolución */}
          <section>
            <h2 className="text-lg font-semibold">{preset === "hoy" ? "Ventas por hora" : "Ventas por día"}</h2>
            <Leyenda />
            <div className="mt-3 rounded-md border bg-card p-4">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={(datos.porHora ?? datos.serie) as any[]}
                    margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
                    accessibilityLayer
                  >
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey={datos.porHora ? "hora" : "fecha"}
                      tickFormatter={(x) => (datos.porHora ? `${x} h` : diaCorto(x))}
                      tickLine={false}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      minTickGap={16}
                    />
                    <YAxis
                      tickFormatter={pesosCompacto}
                      tickLine={false}
                      axisLine={false}
                      width={64}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <Tooltip cursor={{ fill: "hsl(var(--muted))" }} content={<TooltipVentas porHora={!!datos.porHora} />} />
                    <Bar dataKey="actual" name="Este período" fill={SERIE} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
                    <Line dataKey="anterior" name="Período anterior" stroke={PREVIA} strokeWidth={2} dot={false} isAnimationActive={false} activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Ver como tabla</summary>
                <table className="mt-2 w-full max-w-md">
                  <thead><tr className="border-b text-left"><th className="py-1 font-semibold">{datos.porHora ? "Hora" : "Día"}</th><th className="py-1 text-right font-semibold">Este período</th><th className="py-1 text-right font-semibold">Anterior</th></tr></thead>
                  <tbody>
                    {((datos.porHora ?? datos.serie) as any[]).filter((f) => f.actual || f.anterior).map((f) => (
                      <tr key={f.hora ?? f.fecha} className="border-b last:border-0">
                        <td className="py-1">{datos.porHora ? `${f.hora} h` : diaCorto(f.fecha)}</td>
                        <td className="py-1 text-right">{pesos(f.actual)}</td>
                        <td className="py-1 text-right">{pesos(f.anterior)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </div>
          </section>

          <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
            {/* Productos que más venden (Pareto / ABC) */}
            <section className="min-w-0">
              <h2 className="text-lg font-semibold">Productos que más facturan</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {datos.top.length === 0
                  ? "Sin ventas en el período."
                  : `${datos.top.filter((t) => t.clase === "A").length} de ${datos.top.length} productos generan el 80 % de la facturación (clase A).`}
              </p>
              {datos.top.length > 0 && (
                <div className="mt-3 overflow-x-auto rounded-md border bg-card">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="px-4 py-2.5 font-semibold">Producto</th>
                        <th className="px-4 py-2.5 text-right font-semibold">Unidades</th>
                        <th className="px-4 py-2.5 font-semibold">Facturación</th>
                        <th className="px-4 py-2.5 text-right font-semibold" title="Porcentaje acumulado de la facturación">% acum.</th>
                        <th className="px-4 py-2.5 text-center font-semibold" title="Clasificación ABC (Pareto)">Clase</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datos.top.slice(0, 10).map((t) => (
                        <tr key={t.clave} className="border-b last:border-0">
                          <td className="px-4 py-2.5 font-medium">{t.nombre}</td>
                          <td className="px-4 py-2.5 text-right">{t.unidades.toLocaleString("es-AR")}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-3">
                              <span className="w-24 shrink-0 text-right">{pesos(t.facturacion)}</span>
                              <span
                                aria-hidden
                                className="h-2.5 rounded-r"
                                style={{ width: `${(t.facturacion / datos.top[0].facturacion) * 100}px`, background: SERIE }}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right">{pct(t.pctAcumulado)}</td>
                          <td className="px-4 py-2.5 text-center font-semibold">{t.clase}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Stock */}
            <section>
              <h2 className="text-lg font-semibold">Stock</h2>
              <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-border">
                <div className="bg-card p-4">
                  <dt className="text-sm text-muted-foreground">Inventario a costo</dt>
                  <dd className="mt-1 text-2xl font-semibold normal-nums">{pesos(datos.valorInventario)}</dd>
                </div>
                <div className="bg-card p-4">
                  <dt className="text-sm text-muted-foreground">Productos sin stock</dt>
                  <dd className="mt-1 text-2xl font-semibold normal-nums">{datos.sinStock.length}</dd>
                </div>
              </dl>
              <h3 className="mt-6 font-semibold">Para reponer</h3>
              <p className="text-sm text-muted-foreground">Sin stock, o que se acaban en menos de 7 días al ritmo de venta actual.</p>
              <ul className="mt-3 divide-y rounded-md border bg-card text-sm">
                {[...datos.sinStock.map((s) => ({ ...s, critico: true })), ...datos.reponer.map((s) => ({ ...s, critico: false }))]
                  .slice(0, 8)
                  .map((s) => (
                    <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                      {s.critico ? (
                        <PackageX className="h-4 w-4 shrink-0 text-destructive" aria-hidden />
                      ) : (
                        <AlertTriangle className="h-4 w-4 shrink-0 text-[#9A5B00]" aria-hidden />
                      )}
                      <span className="flex-1 font-medium">{s.nombre}</span>
                      <span className={s.critico ? "font-semibold text-destructive" : "text-[#7A4800]"}>
                        {s.critico ? "Sin stock" : `${s.stock} u · ${Math.max(1, Math.round(s.diasCobertura!))} ${Math.round(s.diasCobertura!) <= 1 ? "día" : "días"}`}
                      </span>
                    </li>
                  ))}
                {datos.sinStock.length + datos.reponer.length === 0 && (
                  <li className="px-4 py-6 text-center text-muted-foreground">Nada urgente para reponer.</li>
                )}
              </ul>
              <Link href="/productos" className="mt-3 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                Ir a productos
              </Link>
            </section>
          </div>

          {datos.calor && <MapaCalor celdas={datos.calor} />}
        </div>
      )}

      <Calculadora />
    </div>
  )
}

function Kpi({
  titulo, valor, detalle, d, grande, puntos,
}: {
  titulo: string
  valor: string
  detalle?: string
  d: number | null
  grande?: boolean
  puntos?: boolean // d es diferencia en puntos porcentuales, no variación relativa
}) {
  const sube = d !== null && d > 0
  const igual = d !== null && Math.abs(d) < 0.0005
  return (
    <div className={cn("bg-card p-4 sm:p-5", grande && "col-span-2 lg:col-span-1")}>
      <p className="text-sm text-muted-foreground">{titulo}</p>
      <p className={cn("mt-1 font-semibold normal-nums leading-tight", grande ? "text-4xl" : "text-2xl")}>{valor}</p>
      {detalle && <p className="text-sm text-muted-foreground">{detalle}</p>}
      <p className="mt-2 flex items-center gap-1 text-sm">
        {d === null ? (
          <span className="text-muted-foreground">Sin datos para comparar</span>
        ) : igual ? (
          <span className="text-muted-foreground">Sin cambios</span>
        ) : (
          <>
            {sube ? <ArrowUp className="h-4 w-4 text-ok" aria-hidden /> : <ArrowDown className="h-4 w-4 text-destructive" aria-hidden />}
            <span className={cn("whitespace-nowrap font-semibold", sube ? "text-ok" : "text-destructive")}>
              {sube ? "+" : "−"}
              {puntos
                ? `${Math.abs(d * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })} pts`
                : pct(Math.abs(d))}
            </span>
          </>
        )}
      </p>
    </div>
  )
}

function Leyenda() {
  return (
    <div className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
      <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ background: SERIE }} />Este período</span>
      <span className="flex items-center gap-2"><span className="h-0.5 w-4" style={{ background: PREVIA }} />Período anterior</span>
    </div>
  )
}

function TooltipVentas({ active, payload, label, porHora, comparado }: any) {
  if (!active || !payload?.length) return null
  const f = payload[0].payload
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="text-muted-foreground">{porHora ? `${label} a ${label + 1} h` : diaCorto(label)}</p>
      <p className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ background: SERIE }} /><strong>{pesos(f.actual)}</strong></p>
      <p className="flex items-center gap-2 text-muted-foreground"><span className="h-0.5 w-3" style={{ background: PREVIA }} />{pesos(f.anterior)} {comparado}</p>
    </div>
  )
}

function MapaCalor({ celdas }: { celdas: number[][] }) {
  const max = Math.max(...celdas.flat())
  const horas = celdas[0].map((_, h) => h).filter((h) => celdas.some((fila) => fila[h] > 0))
  if (max === 0 || horas.length === 0) return null
  const desde = horas[0], hasta = horas[horas.length - 1]
  const cols = Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i)
  const tono = (v: number) => (v === 0 ? "hsl(var(--muted))" : RAMPA[Math.min(RAMPA.length - 1, Math.floor((v / max) * RAMPA.length))])
  return (
    <section>
      <h2 className="text-lg font-semibold">Cuándo vendés más</h2>
      <p className="mt-1 text-sm text-muted-foreground">Facturación por día de la semana y hora. Más oscuro, más ventas.</p>
      <div className="mt-3 overflow-x-auto rounded-md border bg-card p-4">
        <div className="inline-grid gap-[2px] text-xs" style={{ gridTemplateColumns: `2.5rem repeat(${cols.length}, minmax(1.75rem, 1fr))` }}>
          <span />
          {cols.map((h) => <span key={h} className="text-center text-muted-foreground">{h}</span>)}
          {celdas.map((fila, d) => (
            <div key={d} className="contents">
              <span className="pr-2 leading-7 text-muted-foreground">{DIAS[d]}</span>
              {cols.map((h) => (
                <span key={h} className="h-7 rounded-sm" style={{ background: tono(fila[h]) }} title={`${DIAS[d]} ${h} h: ${pesos(fila[h])}`} />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Menos</span>
          {RAMPA.map((c) => <span key={c} className="h-3 w-5 rounded-sm" style={{ background: c }} />)}
          <span>Más</span>
        </div>
      </div>
    </section>
  )
}

function Calculadora() {
  const [total, setTotal] = useState("")
  const [discount, setDiscount] = useState("")
  const t = parseFloat(total) || 0
  const d = parseFloat(discount) || 0
  const final = t * (100 - d) / 100
  return (
    <section className="max-w-sm">
      <h2 className="mb-3 text-lg font-semibold">Calcular descuento</h2>
      <div className="ticket rounded-t-md border border-b-0 px-5 pt-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="total">Precio</Label>
            <Input id="total" type="number" inputMode="decimal" placeholder="1000" value={total} onChange={(e) => setTotal(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discount">Descuento %</Label>
            <Input id="discount" type="number" inputMode="decimal" placeholder="20" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </div>
        </div>
        <div className="ticket-rule pt-4">
          <p className="text-sm text-muted-foreground">A cobrar</p>
          <p className="font-display text-5xl font-bold leading-tight" aria-live="polite">
            ${final.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </section>
  )
}
