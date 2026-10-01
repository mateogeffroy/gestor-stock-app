// Chequeo rápido de lib/kpis.ts: `node --experimental-strip-types lib/kpis.check.ts`
import assert from "node:assert/strict"
import { resumen, rangos, seriePorDia, topProductos, coberturaStock, delta, type VentaKpi } from "./kpis.ts"

const v = (fecha: string, hora: string, items: [number | null, number, number][], cae: string | null = null): VentaKpi => ({
  fecha, hora, cae, id_tipo_venta: 1,
  total: items.reduce((s, [, , sub]) => s + sub, 0),
  venta_detalle: items.map(([id_producto, cantidad, subtotal]) => ({ id_producto, cantidad, subtotal, descripcion: "manual" })),
})

const ventas = [
  v("2026-10-01", "10:15:00", [[1, 2, 200], [2, 1, 50]], "123"),
  v("2026-10-01", "18:40:00", [[1, 1, 100]]),
  v("2026-09-30", "11:00:00", [[null, 1, 30]]),
]
const costos = new Map([[1, 60], [2, 0]])

const r = resumen(ventas.slice(0, 2), costos)
assert.equal(r.ventas, 350)
assert.equal(r.transacciones, 2)
assert.equal(r.ticketPromedio, 175)
assert.equal(r.unidades, 4)
assert.equal(r.margenBruto, 300 - 180) // producto 2 sin costo no cuenta
assert.equal(r.margenPct, 120 / 300)
assert.equal(r.ventasFiscales, 250)

const rg = rangos("7d", new Date(2026, 9, 1))
assert.deepEqual(rg, { actual: { desde: "2026-09-25", hasta: "2026-10-01" }, anterior: { desde: "2026-09-18", hasta: "2026-09-24" } })
const mes = rangos("mes", new Date(2026, 9, 1))
assert.deepEqual(mes.anterior, { desde: "2026-09-30", hasta: "2026-09-30" })

const serie = seriePorDia(ventas, rangos("hoy", new Date(2026, 9, 1)))
assert.deepEqual(serie, [{ fecha: "2026-10-01", actual: 350, anterior: 30 }])

const top = topProductos(ventas, new Map([[1, "Fernet"], [2, "Hielo"]]))
assert.equal(top[0].nombre, "Fernet")
assert.deepEqual(top.map((t) => t.clase), ["A", "A", "B"]) // 300/380 = 79 % → Hielo todavía entra en A

const cob = coberturaStock([{ id: 1, nombre: "Fernet", precio_costo: 60, stock: 9 }], ventas, 3)
assert.equal(cob[0].ventaDiaria, 1)
assert.equal(cob[0].diasCobertura, 9)
assert.equal(cob[0].valorCosto, 540)

assert.equal(delta(110, 100), 0.1)
assert.equal(delta(5, 0), null)
console.log("kpis ok")
