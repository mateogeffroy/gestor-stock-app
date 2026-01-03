"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export const useEsDemo = () => {
  const [esDemo, setEsDemo] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      // Si el email coincide con el del usuario demo, activamos la bandera
      if (user?.email === 'usuario@prueba.com') {
        setEsDemo(true)
      }
    }
    checkUser()
  }, [])

  return esDemo
}