"use server"

import { Venta, DetalleVenta, VentaCompletaInsert } from "./types"
import { ventaService } from "@/services/venta-service"
import { productoService } from "@/services/producto-service"

export const fetchVentas = async (): Promise<Venta[]> => {
  return await ventaService.getUltimasVentas()
}

export const searchProductos = async (term: string) => {
  if (!term || term.length < 2) return []
  return await productoService.searchProductos(term)
}

export const createVenta = async (ventaData: VentaCompletaInsert) => {
  return await ventaService.createVenta(ventaData)
}

export const deleteVenta = async (id: number) => {
  return await ventaService.deleteVenta(id)
}