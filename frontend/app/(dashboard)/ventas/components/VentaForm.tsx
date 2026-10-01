"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Venta, NuevaVentaState, DetalleVentaForm, Producto } from "../types"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProductSearch } from "./ProductSearch"
import { DetalleVentaTable } from "./DetalleVentaTable"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { CONDICION_RECEPTOR, CONDICIONES_RECEPTOR_UI, UMBRAL_IDENTIFICACION_CF, cuitValido } from "@/lib/arca/fiscal"
import type { MedioPago } from "@/services/venta-service"

const MEDIOS: { id: MedioPago; label: string }[] = [
  { id: "efectivo", label: "Efectivo" },
  { id: "debito", label: "Débito" },
  { id: "credito", label: "Crédito" },
  { id: "transferencia", label: "Transferencia" },
  { id: "qr", label: "QR" },
]

interface VentaFormProps {
  venta?: any
  onSubmit: (ventaData: any) => Promise<void> | void // Ajustado para soportar promesas
  onSearchProductos: (term: string) => Promise<Producto[]>
  onCancel: () => void
}

const initialFormState: NuevaVentaState = {
  id_tipo_venta: 1,
  detalles: [],
  total: 0
};

export function VentaForm({ venta, onSubmit, onSearchProductos, onCancel }: VentaFormProps) {
  const { toast } = useToast();
  const detailIdCounter = useRef(1);
  const [nuevaVenta, setNuevaVenta] = useState<NuevaVentaState>(initialFormState);
  
  // --- ESTADO PARA CONTROLAR EL DOBLE SUBMIT ---
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- ESTADOS DE CLIENTE ---
  const [tipoCliente, setTipoCliente] = useState<"final" | "responsable">("final")
  const [clienteNombre, setClienteNombre] = useState("")
  const [clienteCuit, setClienteCuit] = useState("")
  const [clienteDireccion, setClienteDireccion] = useState("")
  const [condicionCliente, setCondicionCliente] = useState<number>(CONDICION_RECEPTOR.RESPONSABLE_INSCRIPTO)
  const [dni, setDni] = useState("")

  // --- FACTURACIÓN Y PAGO ---
  const [puedeFacturar, setPuedeFacturar] = useState<boolean | null>(null) // null = cargando
  const [facturar, setFacturar] = useState(false)
  const [medioPago, setMedioPago] = useState<MedioPago>("efectivo")
  const [pagaCon, setPagaCon] = useState("")

  // Si el comercio tiene datos fiscales cargados, se factura por defecto
  useEffect(() => {
    supabase.from("comercio_fiscal").select("user_id").maybeSingle().then(({ data }) => {
      setPuedeFacturar(!!data)
      setFacturar(!!data)
    })
  }, [])

  useEffect(() => {
    if (venta) {
      setNuevaVenta({
        id_tipo_venta: venta.id_tipo_venta || 1,
        total: venta.total,
        detalles: [] 
      });
    }
  }, [venta]);

  const handleSelectProducto = (producto: Producto) => {
    setNuevaVenta(prev => {
      const precioVenta = Number(producto.precio_final || producto.precio_lista);
      
      const nuevoDetalle: DetalleVentaForm = {
        lineItemId: detailIdCounter.current++,
        id_producto: producto.id,
        nombre_producto: producto.nombre,
        codigo: producto.codigo,
        precio_unitario: precioVenta,
        cantidad: 1,
        descuento_individual: 0,
        subtotal: precioVenta, 
      };

      return { ...prev, detalles: [nuevoDetalle, ...prev.detalles] }; 
    });
  };

  const handleCreateNonExistentProduct = (productName: string) => {
      setNuevaVenta(prev => {
          const nuevoDetalle: DetalleVentaForm = {
              lineItemId: detailIdCounter.current++,
              id_producto: null,
              nombre_producto: productName,
              precio_unitario: 0,
              cantidad: 1,
              descuento_individual: 0,
              subtotal: 0,
          };
          return { ...prev, detalles: [nuevoDetalle, ...prev.detalles] };
      });
  };

  const handleDetalleChange = (lineItemId: number, field: keyof DetalleVentaForm, value: number) => {
    if (isNaN(value)) value = 0;

    setNuevaVenta(prev => {
      const detallesActualizados = prev.detalles.map(d => {
        if (d.lineItemId !== lineItemId) return d;

        const updated = { ...d, [field]: value };

        if (field === 'cantidad' || field === 'precio_unitario') {
           const base = updated.precio_unitario * updated.cantidad;
           updated.subtotal = base * (1 - (updated.descuento_individual / 100));
        }

        if (field === 'descuento_individual') {
           const base = updated.precio_unitario * updated.cantidad;
           updated.subtotal = base * (1 - (value / 100));
        }

        if (field === 'subtotal') {
           const base = updated.precio_unitario * updated.cantidad;
           if (base > 0) {
             const nuevoDescuento = (1 - (value / base)) * 100;
             updated.descuento_individual = Number(nuevoDescuento.toFixed(2));
           } else {
             updated.descuento_individual = 0;
           }
        }

        return updated;
      });

      return { ...prev, detalles: detallesActualizados };
    });
  };

  const handleRemoveDetalle = (lineItemId: number) => {
    setNuevaVenta(prev => ({
      ...prev,
      detalles: prev.detalles.filter(d => d.lineItemId !== lineItemId)
    }));
  };

  const totalVenta = useMemo(() => {
    return nuevaVenta.detalles.reduce((sum, detalle) => sum + detalle.subtotal, 0);
  }, [nuevaVenta.detalles]);

  const handleFinalSubmit = async () => {
    if (nuevaVenta.detalles.length === 0) {
        toast({ title: "La venta está vacía", description: "Escaneá o buscá al menos un producto.", variant: "destructive" });
        return;
    }

    if (tipoCliente === 'responsable' && !cuitValido(clienteCuit)) {
        toast({ title: "CUIT inválido", description: "Revisá los 11 dígitos, sin guiones.", variant: "destructive" });
        return;
    }

    if (facturar && tipoCliente === 'final' && totalVenta >= UMBRAL_IDENTIFICACION_CF && !dni) {
        toast({ title: "Falta el DNI", description: "Desde $10.000.000 hay que identificar al consumidor final.", variant: "destructive" });
        return;
    }

    // Bloqueo de seguridad
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      await onSubmit({
        ...nuevaVenta,
        total: totalVenta,
        detalles: nuevaVenta.detalles,
        cliente_nombre: tipoCliente === 'final' ? "Consumidor Final" : clienteNombre,
        cliente_cuit: tipoCliente === 'final' ? null : clienteCuit,
        cliente_direccion: tipoCliente === 'final' ? null : clienteDireccion,
        facturar,
        condicion_iva_receptor: tipoCliente === 'final' ? CONDICION_RECEPTOR.CONSUMIDOR_FINAL : condicionCliente,
        dni_receptor: tipoCliente === 'final' && dni ? dni : null,
        medio_pago: medioPago,
      });
    } catch (error) {
      console.error("Error al confirmar venta:", error);
      toast({ title: "La venta no se registró", description: "Revisá la conexión y volvé a cobrar.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  // F12 cobra desde cualquier lugar del formulario (atajo habitual de punto de venta)
  const submitRef = useRef(handleFinalSubmit)
  submitRef.current = handleFinalSubmit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F12") {
        e.preventDefault()
        submitRef.current()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const vuelto = (parseFloat(pagaCon) || 0) - totalVenta

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" /> Ventas
        </button>
        <h1 className="page-title">{venta ? "Ver venta" : "Nueva venta"}</h1>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4 min-w-0">
          <ProductSearch
            onSelect={handleSelectProducto}
            onSearch={onSearchProductos}
            onCommitNotFound={handleCreateNonExistentProduct}
          />
          <DetalleVentaTable
            detalles={nuevaVenta.detalles}
            onDetalleChange={handleDetalleChange}
            onRemoveDetalle={handleRemoveDetalle}
          />
        </div>

        <aside className="ticket rounded-t-md border border-b-0 px-5 pt-5 lg:sticky lg:top-6 space-y-5">
          <div className="space-y-2">
            <Label id="lbl-cbte">Comprobante</Label>
            <div role="group" aria-labelledby="lbl-cbte" className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
              {[{ v: true, l: "Factura" }, { v: false, l: "Sin factura" }].map((o) => (
                <button
                  key={o.l}
                  type="button"
                  aria-pressed={facturar === o.v}
                  disabled={isSubmitting || (o.v && !puedeFacturar)}
                  onClick={() => setFacturar(o.v)}
                  className={cn(
                    "rounded px-3 py-1.5 text-sm font-medium disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    facturar === o.v ? "bg-card shadow-sm" : "text-muted-foreground"
                  )}
                >
                  {o.l}
                </button>
              ))}
            </div>
            {puedeFacturar === false && (
              <p className="text-xs text-muted-foreground">
                Para emitir facturas, cargá tus datos en <Link href="/perfil" className="underline">Mi cuenta</Link>.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Cliente</Label>
            <Tabs value={tipoCliente} onValueChange={(v) => setTipoCliente(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="final" disabled={isSubmitting}>Consumidor final</TabsTrigger>
                <TabsTrigger value="responsable" disabled={isSubmitting}>Con CUIT</TabsTrigger>
              </TabsList>
              <TabsContent value="final" className="pt-1">
                {facturar && (
                  <Input
                    disabled={isSubmitting}
                    aria-label="DNI del cliente"
                    placeholder={totalVenta >= UMBRAL_IDENTIFICACION_CF ? "DNI (obligatorio)" : "DNI (opcional)"}
                    inputMode="numeric"
                    value={dni}
                    onChange={e => setDni(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  />
                )}
              </TabsContent>
              <TabsContent value="responsable" className="space-y-3 pt-1">
                <Input
                  disabled={isSubmitting}
                  aria-label="CUIT"
                  placeholder="CUIT, 11 dígitos sin guiones"
                  inputMode="numeric"
                  value={clienteCuit}
                  onChange={e => setClienteCuit(e.target.value.replace(/\D/g, ""))}
                  maxLength={11}
                />
                <Select value={String(condicionCliente)} onValueChange={(v) => setCondicionCliente(Number(v))} disabled={isSubmitting}>
                  <SelectTrigger aria-label="Condición frente al IVA"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDICIONES_RECEPTOR_UI.filter((c) => c.id !== CONDICION_RECEPTOR.CONSUMIDOR_FINAL).map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  disabled={isSubmitting}
                  aria-label="Nombre o razón social"
                  placeholder="Nombre o razón social"
                  value={clienteNombre}
                  onChange={e => setClienteNombre(e.target.value)}
                />
                <Input
                  disabled={isSubmitting}
                  aria-label="Dirección"
                  placeholder="Dirección (opcional)"
                  value={clienteDireccion}
                  onChange={e => setClienteDireccion(e.target.value)}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label id="lbl-pago">Pago</Label>
            <div role="group" aria-labelledby="lbl-pago" className="flex flex-wrap gap-1">
              {MEDIOS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={medioPago === m.id}
                  disabled={isSubmitting}
                  onClick={() => setMedioPago(m.id)}
                  className={cn(
                    "rounded border px-2.5 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    medioPago === m.id ? "border-foreground bg-foreground text-white" : "hover:bg-muted"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {medioPago === "efectivo" && (
              <div className="flex items-center gap-3">
                <Input
                  aria-label="Paga con"
                  placeholder="Paga con"
                  inputMode="decimal"
                  type="number"
                  value={pagaCon}
                  onChange={(e) => setPagaCon(e.target.value)}
                  className="w-32"
                />
                {pagaCon && (
                  <p className={cn("text-sm", vuelto < 0 && "text-destructive font-semibold")}>
                    {vuelto < 0 ? "Falta " : "Vuelto "}
                    <strong>${Math.abs(vuelto).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="ticket-rule pt-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Total</span>
              <span>{nuevaVenta.detalles.length} {nuevaVenta.detalles.length === 1 ? "ítem" : "ítems"}</span>
            </div>
            <p className="font-display text-6xl font-bold leading-tight break-all" aria-live="polite">
              ${totalVenta.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <Button onClick={handleFinalSubmit} size="lg" disabled={isSubmitting} className="w-full h-14 text-base font-semibold">
            {isSubmitting && <Loader2 className="animate-spin" />}
            {isSubmitting ? "Cobrando…" : "Cobrar venta"}
          </Button>
          <p className="-mt-3 text-center text-xs text-muted-foreground">o apretá <kbd className="rounded border px-1">F12</kbd></p>
        </aside>
      </div>
    </div>
  )
}
