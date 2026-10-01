// Cálculo de KPIs de venta minorista. Funciones puras: reciben filas y devuelven números,
// así se pueden probar sin base de datos (ver lib/kpis.check.ts).

export interface VentaKpi {
  fecha: string // YYYY-MM-DD
  hora: string // HH:MM:SS
  total: number
  id_tipo_venta: number
  cae?: string | null
  venta_detalle: { id_producto: number | null; descripcion?: string | null; cantidad: number; subtotal: number }[]
}

export interface ProductoKpi {
  id: number
  nombre: string
  precio_costo: number
  stock: number
}

export interface Rango {
  desde: string // YYYY-MM-DD inclusive
  hasta: string // YYYY-MM-DD inclusive
}

export type Preset = "hoy" | "7d" | "30d" | "mes"

const iso = (d: Date) => d.toLocaleDateString("en-CA")
const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
export const diasEntre = (r: Rango) =>
  Math.round((Date.parse(r.hasta) - Date.parse(r.desde)) / 86_400_000) + 1

// Período actual y el período anterior de igual duración (para comparar)
export function rangos(preset: Preset, hoy = new Date()): { actual: Rango; anterior: Rango } {
  let desde: Date
  if (preset === "hoy") desde = hoy
  else if (preset === "7d") desde = addDays(hoy, -6)
  else if (preset === "30d") desde = addDays(hoy, -29)
  else desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const dias = Math.round((hoy.getTime() - desde.getTime()) / 86_400_000) + 1
  return {
    actual: { desde: iso(desde), hasta: iso(hoy) },
    anterior: { desde: iso(addDays(desde, -dias)), hasta: iso(addDays(desde, -1)) },
  }
}

const enRango = (v: VentaKpi, r: Rango) => v.fecha >= r.desde && v.fecha <= r.hasta

export interface Resumen {
  ventas: number // facturación bruta $
  transacciones: number
  ticketPromedio: number
  unidades: number
  unidadesPorVenta: number
  margenBruto: number // $ sobre ítems con costo conocido
  margenPct: number | null // margen / facturación de esos ítems
  ventasFiscales: number // $ con CAE
}

export function resumen(ventas: VentaKpi[], costos: Map<number, number>): Resumen {
  let total = 0, unidades = 0, margen = 0, baseMargen = 0, fiscales = 0
  for (const v of ventas) {
    total += Number(v.total)
    if (v.cae) fiscales += Number(v.total)
    for (const d of v.venta_detalle ?? []) {
      unidades += Number(d.cantidad)
      const costo = d.id_producto != null ? costos.get(d.id_producto) : undefined
      // ponytail: usa el costo ACTUAL del producto; si el costo cambió, el margen histórico se distorsiona.
      // Guardar costo_unitario en venta_detalle al vender cuando haga falta precisión contable.
      if (costo && costo > 0) {
        margen += Number(d.subtotal) - costo * Number(d.cantidad)
        baseMargen += Number(d.subtotal)
      }
    }
  }
  const n = ventas.length
  return {
    ventas: total,
    transacciones: n,
    ticketPromedio: n ? total / n : 0,
    unidades,
    unidadesPorVenta: n ? unidades / n : 0,
    margenBruto: margen,
    margenPct: baseMargen ? margen / baseMargen : null,
    ventasFiscales: fiscales,
  }
}

// Variación relativa; null si no hay base para comparar
export const delta = (actual: number, anterior: number) => (anterior ? (actual - anterior) / anterior : null)

// Serie diaria alineada por posición: día i del período actual vs día i del anterior
export function seriePorDia(ventas: VentaKpi[], r: { actual: Rango; anterior: Rango }) {
  const dias = diasEntre(r.actual)
  const actual = new Array(dias).fill(0)
  const anterior = new Array(dias).fill(0)
  for (const v of ventas) {
    if (enRango(v, r.actual)) actual[diasEntre({ desde: r.actual.desde, hasta: v.fecha }) - 1] += Number(v.total)
    else if (enRango(v, r.anterior)) anterior[diasEntre({ desde: r.anterior.desde, hasta: v.fecha }) - 1] += Number(v.total)
  }
  return actual.map((val, i) => {
    const d = new Date(r.actual.desde + "T00:00:00")
    d.setDate(d.getDate() + i)
    return { fecha: iso(d), actual: val, anterior: anterior[i] }
  })
}

// Serie por hora (para "hoy")
export function seriePorHora(actuales: VentaKpi[], anteriores: VentaKpi[]) {
  const filas = Array.from({ length: 24 }, (_, h) => ({ hora: h, actual: 0, anterior: 0 }))
  for (const v of actuales) filas[parseInt(v.hora)].actual += Number(v.total)
  for (const v of anteriores) filas[parseInt(v.hora)].anterior += Number(v.total)
  return filas
}

// Mapa de calor: día de semana (0 = lunes) × hora → facturación
export function mapaCalor(ventas: VentaKpi[]) {
  const celdas = Array.from({ length: 7 }, () => new Array(24).fill(0))
  for (const v of ventas) {
    const dow = (new Date(v.fecha + "T00:00:00").getDay() + 6) % 7
    celdas[dow][parseInt(v.hora)] += Number(v.total)
  }
  return celdas
}

export interface FilaTop {
  clave: string
  nombre: string
  unidades: number
  facturacion: number
  pctAcumulado: number
  clase: "A" | "B" | "C"
}

// Ranking por facturación con clasificación ABC (Pareto: A hasta 80 %, B hasta 95 %, C resto)
export function topProductos(ventas: VentaKpi[], nombres: Map<number, string>): FilaTop[] {
  const acc = new Map<string, { nombre: string; unidades: number; facturacion: number }>()
  for (const v of ventas)
    for (const d of v.venta_detalle ?? []) {
      const clave = d.id_producto != null ? `p${d.id_producto}` : `m:${d.descripcion ?? "Ítem manual"}`
      const nombre = (d.id_producto != null ? nombres.get(d.id_producto) : null) ?? d.descripcion ?? "Ítem manual"
      const fila = acc.get(clave) ?? { nombre, unidades: 0, facturacion: 0 }
      fila.unidades += Number(d.cantidad)
      fila.facturacion += Number(d.subtotal)
      acc.set(clave, fila)
    }
  const filas = [...acc.entries()].sort((a, b) => b[1].facturacion - a[1].facturacion)
  const total = filas.reduce((s, [, f]) => s + f.facturacion, 0) || 1
  let corrido = 0
  return filas.map(([clave, f]) => {
    const previo = corrido / total
    corrido += f.facturacion
    const clase = previo < 0.8 ? "A" : previo < 0.95 ? "B" : "C"
    return { clave, ...f, pctAcumulado: corrido / total, clase }
  })
}

export interface FilaStock {
  id: number
  nombre: string
  stock: number
  ventaDiaria: number
  diasCobertura: number | null // null = no se vendió en el período
  valorCosto: number
}

// Cobertura de stock = stock / unidades vendidas por día en el período
export function coberturaStock(productos: ProductoKpi[], ventas: VentaKpi[], dias: number): FilaStock[] {
  const vendidas = new Map<number, number>()
  for (const v of ventas)
    for (const d of v.venta_detalle ?? [])
      if (d.id_producto != null) vendidas.set(d.id_producto, (vendidas.get(d.id_producto) ?? 0) + Number(d.cantidad))
  return productos.map((p) => {
    const ventaDiaria = (vendidas.get(p.id) ?? 0) / dias
    return {
      id: p.id,
      nombre: p.nombre,
      stock: p.stock,
      ventaDiaria,
      diasCobertura: ventaDiaria > 0 ? Math.max(p.stock, 0) / ventaDiaria : null,
      valorCosto: Math.max(p.stock, 0) * Number(p.precio_costo || 0),
    }
  })
}
