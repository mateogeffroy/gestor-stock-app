"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2, Barcode } from "lucide-react"
import { Producto } from "../types"
// Importamos el servicio para poder hacer la búsqueda exacta al dar Enter
import { productoService } from "@/services/producto-service"

interface ProductSearchProps {
  onSelect: (producto: Producto) => void;
  onSearch: (term: string) => Promise<Producto[]>;
  onCommitNotFound: (term: string) => void;
}

export function ProductSearch({ onSelect, onSearch, onCommitNotFound }: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [productos, setProductos] = useState<Producto[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0) 
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus al montar (Ideal para pistolas)
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Búsqueda "en vivo" (mientras escribes o escaneas)
  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (searchTerm.length >= 1) { 
        setIsSearching(true)
        try {
          const results = await onSearch(searchTerm)
          setProductos(results)
          setSelectedIndex(0) // Siempre pre-seleccionar el primero
        } finally {
          setIsSearching(false)
        }
      } else {
        setProductos([])
        setIsOpen(false)
      }
    }, 300)

    return () => clearTimeout(delaySearch)
  }, [searchTerm, onSearch])

  // MANEJO INTELIGENTE DE TECLAS (ESCÁNER)
  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, productos.length - 1))
      setIsOpen(true)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      
      // CASO 1: Si el usuario navegó con flechas y eligió uno de la lista visual
      if (isOpen && productos.length > 0 && selectedIndex >= 0) {
        handleSelect(productos[selectedIndex])
        return;
      }

      // CASO 2: LOGICA DE ESCÁNER (Enter directo sin elegir de lista)
      // Buscamos coincidencia EXACTA de código en la base de datos
      if (searchTerm.trim().length > 0) {
        setIsSearching(true) // Mostramos feedback visual
        try {
          const productoExacto = await productoService.getProductoByCodigo(searchTerm.trim())
          
          if (productoExacto) {
            // ¡ENCONTRADO POR CÓDIGO! Lo agregamos directo
            handleSelect(productoExacto)
          } else {
            // CASO 3: No existe el código -> Item Manual
            // Cerramos el buscador y mandamos el texto como producto manual
            onCommitNotFound(searchTerm.trim())
            limpiarBuscador()
          }
        } catch (error) {
          console.error("Error buscando código exacto:", error)
        } finally {
          setIsSearching(false)
        }
      }
    } else if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  const handleSelect = (producto: Producto) => {
    onSelect(producto)
    limpiarBuscador()
  }

  const limpiarBuscador = () => {
    setSearchTerm("")
    setProductos([])
    setIsOpen(false)
    setSelectedIndex(0)
    // Mantener el foco siempre listo para el siguiente escaneo
    setTimeout(() => inputRef.current?.focus(), 10) 
  }

  return (
    <div className="relative w-full">
      <div className="flex gap-2">
        <div className="relative w-full">
            <Input
            ref={inputRef}
            autoFocus
            placeholder="Escanear código o buscar..."
            value={searchTerm}
            onChange={(e) => {
                setSearchTerm(e.target.value)
                if (e.target.value.length > 0) setIsOpen(true)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
                if (searchTerm.length > 0) setIsOpen(true)
            }}
            className="w-full text-lg h-12 pl-10 border-blue-200 focus-visible:ring-blue-500 shadow-sm"
            />
            <Barcode className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground opacity-50" />
        </div>
        
        <Button
          variant="secondary"
          className="h-12 w-12 shrink-0"
          onClick={() => setIsOpen(!isOpen)}
          tabIndex={-1} // Evitamos que el tab se detenga aquí para no molestar al flujo de venta
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>
      
      {isOpen && (searchTerm.length > 0 || productos.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-xl max-h-[300px] overflow-y-auto">
          {isSearching ? (
            <div className="flex justify-center items-center py-4 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm">Buscando...</span>
            </div>
          ) : productos.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              <p>No encontrado en inventario.</p>
              <p className="text-xs mt-1 text-muted-foreground">Presiona <b>Enter</b> para agregarlo como item manual.</p>
            </div>
          ) : (
            <ul className="py-1">
              {productos.map((producto, index) => (
                <li
                  key={producto.id}
                  className={`px-4 py-3 cursor-pointer border-b last:border-0 transition-colors ${
                    index === selectedIndex ? "bg-blue-100 text-blue-900" : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleSelect(producto)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-base">{producto.nombre}</div>
                      <div className="text-xs text-muted-foreground flex gap-3">
                        {producto.codigo && (
                            <span className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded border">
                                <Barcode className="h-3 w-3" /> {producto.codigo}
                            </span>
                        )}
                        <span className={producto.stock <= 0 ? "text-red-500 font-bold" : ""}>
                            Stock: {producto.stock}
                        </span>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-700 bg-green-50 px-2 py-1 rounded">
                      ${(producto.precio_final || producto.precio_lista).toLocaleString('es-AR')}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}