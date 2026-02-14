"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { supabase } from "@/lib/supabase"

interface BusinessContextType {
  businessName: string
  setBusinessName: (name: string) => void
  logoUrl: string | null
  setLogoUrl: (url: string | null) => void
  isLoading: boolean
  refreshProfile: () => Promise<void>
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined)

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [businessName, setBusinessName] = useState("")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Función para cargar los datos
  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      // 1. Verificar sesión actual
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        // Si no hay usuario, limpiamos los datos
        setBusinessName("")
        setLogoUrl(null)
        setIsLoading(false)
        return
      }

      // 2. Buscar perfil en la BD
      const { data, error } = await supabase
        .from('profiles')
        .select('business_name, logo_url')
        .eq('id', session.user.id)
        .single()

      if (data) {
        setBusinessName(data.business_name || "") 
        setLogoUrl(data.logo_url)
      } else {
        // CAMBIO: Fallback si no existe perfil aún
        setBusinessName("")
      }
      
    } catch (error) {
      console.error("Error cargando perfil:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // 1. Carga inicial
    fetchProfile()

    // 2. ESCUCHADOR DE CAMBIOS DE SESIÓN (La solución al problema)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        // Si alguien entra, recargamos sus datos específicos
        fetchProfile()
      } else if (event === 'SIGNED_OUT') {
        // Si alguien sale, limpiamos la memoria
        setBusinessName("")
        setLogoUrl(null)
      }
    })

    // Limpieza al desmontar
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <BusinessContext.Provider 
      value={{ 
        businessName, 
        setBusinessName, 
        logoUrl, 
        setLogoUrl, 
        isLoading,
        refreshProfile: fetchProfile 
      }}
    >
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusiness() {
  const context = useContext(BusinessContext)
  if (context === undefined) {
    throw new Error("useBusiness debe ser usado dentro de un BusinessProvider")
  }
  return context
}