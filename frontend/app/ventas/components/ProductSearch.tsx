"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2 } from "lucide-react"
import { Producto } from "@/services/producto-service"

interface ProductSearchProps {
  onSelect: (producto: Producto) => void
  onSearch: (term: string) => Promise<Producto[]>
}

export function ProductSearch({ onSelect, onSearch }: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [productos, setProductos] = useState<Producto[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        setIsSearching(true)
        const results = await onSearch(searchTerm)
        setProductos(results)
        setIsSearching(false)
      } else {
        setProductos([])
      }
    }, 300)

    return () => clearTimeout(delaySearch)
  }, [searchTerm, onSearch])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, productos.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault()
      handleSelect(productos[selectedIndex])
    } else if (e.key === "Escape") {
      e.preventDefault()
      setIsOpen(false)
    }
  }

  const handleSelect = (producto: Producto) => {
    onSelect(producto)
    setSearchTerm("")
    setProductos([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <div className="flex">
        <Input
          ref={inputRef}
          placeholder="Buscar producto..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            if (e.target.value.length >= 2 && !isOpen) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => productos.length > 0 && setIsOpen(true)}
          className="w-full"
        />
        <Button
          variant="outline"
          size="icon"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="ml-2"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isSearching ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          ) : productos.length === 0 ? (
            <div className="p-3 text-center text-sm text-gray-500">
              No se encontraron productos.
            </div>
          ) : (
            <ul className="py-1">
              {productos.map((producto, index) => (
                <li
                  key={producto.id}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                    index === selectedIndex ? "bg-gray-100" : ""
                  }`}
                  onClick={() => handleSelect(producto)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="font-medium">{producto.nombre}</div>
                  <div className="text-xs text-gray-600 flex gap-2">
                    <span>ID: {producto.id}</span>
                    {producto.codigo_barras && <span>Código: {producto.codigo_barras}</span>}
                    <span>${producto.precio_final || producto.precio_lista}</span>
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