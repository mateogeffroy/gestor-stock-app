"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2 } from "lucide-react"
import { Producto } from "../types"

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
  const [selectedIndex, setSelectedIndex] = useState(0) // Iniciamos en 0 para seleccionar rápido con Enter
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus al montar el componente (Ideal para pistolas de código de barras)
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (searchTerm.length >= 1) { // Buscamos desde 1 caracter
        setIsSearching(true)
        try {
          const results = await onSearch(searchTerm)
          setProductos(results)
          // Si hay coincidencia EXACTA de código, la ponemos primero visualmente (aunque el backend ya filtra)
          setSelectedIndex(0) 
        } finally {
          setIsSearching(false)
        }
      } else {
        setProductos([])
      }
    }, 200) // Delay corto para escáneres rápidos

    return () => clearTimeout(delaySearch)
  }, [searchTerm, onSearch])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, productos.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      
      // LÓGICA DE ESCÁNER / SELECCIÓN RÁPIDA
      if (productos.length > 0 && selectedIndex >= 0) {
        // Opción A: Seleccionar lo que está marcado en la lista
        handleSelect(productos[selectedIndex])
      } else if (searchTerm.trim() !== "") {
        // Opción B: Si no hay resultados de búsqueda, agregar como item manual
        onCommitNotFound(searchTerm.trim())
        setSearchTerm("")
        setIsOpen(false)
      }
    } else if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  const handleSelect = (producto: Producto) => {
    onSelect(producto)
    setSearchTerm("")
    setProductos([])
    setIsOpen(false)
    setSelectedIndex(0)
    // Mantener el foco en el input para seguir escaneando
    inputRef.current?.focus()
  }

  return (
    <div className="relative w-full">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          autoFocus
          placeholder="Escanear código o buscar nombre..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            if (e.target.value.length > 0) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchTerm.length > 0) setIsOpen(true)
          }}
          className="w-full text-lg h-12 border-blue-200 focus-visible:ring-blue-500"
        />
        <Button
          variant="secondary"
          className="h-12 w-12 shrink-0"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>
      
      {isOpen && (searchTerm.length > 0 || productos.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-xl max-h-[300px] overflow-y-auto">
          {isSearching ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : productos.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              <p>No encontrado en la base de datos.</p>
              <p className="text-xs mt-1 text-muted-foreground">Presiona <b>Enter</b> para agregarlo como item manual.</p>
            </div>
          ) : (
            <ul className="py-1">
              {productos.map((producto, index) => (
                <li
                  key={producto.id}
                  className={`px-4 py-3 cursor-pointer border-b last:border-0 ${
                    index === selectedIndex ? "bg-blue-50 text-blue-900" : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleSelect(producto)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-base">{producto.nombre}</div>
                      <div className="text-xs text-muted-foreground flex gap-3">
                        {producto.codigo && <span className="bg-gray-100 px-1 rounded">Cod: {producto.codigo}</span>}
                        <span>Stock: {producto.stock}</span>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-700">
                      ${(producto.precio_final || producto.precio_lista).toLocaleString()}
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