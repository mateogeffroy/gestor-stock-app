"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell, PasswordToggle } from "@/components/auth-shell"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true) 
  const [validSession, setValidSession] = useState(false)
  
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const handleSession = async () => {
        // 1. Obtener el hash de la URL
        const hash = window.location.hash.substring(1) // Quitamos el #
        const params = new URLSearchParams(hash)
        
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const error = params.get('error')

        // CASO A: Error explícito en URLa
        if (error || (hash && hash.includes("error_code=otp_expired"))) {
            setVerifying(false)
            setValidSession(false)
            return
        }

        // CASO B: Tenemos los tokens -> FORZAMOS EL INICIO DE SESIÓN
        if (accessToken && refreshToken) {
            console.log("Tokens detectados manualmente. Forzando sesión...")
            const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
            })

            if (!sessionError) {
                setValidSession(true)
                setVerifying(false)
                console.log("Sesión forzada exitosamente.")
                return 
            } else {
                console.error("Error al forzar sesión:", sessionError)
            }
        }

        // CASO C: Verificar si Supabase ya lo hizo solo
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
            setValidSession(true)
        }
        setVerifying(false)
    }

    handleSession()

    // Escuchar cambios por si acaso
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
         setValidSession(true)
         setVerifying(false)
      }
    })

    return () => {
        authListener.subscription.unsubscribe()
    }
  }, []) 

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
        toast({ title: "Las contraseñas no coinciden", description: "Escribí la misma contraseña en los dos campos.", variant: "destructive" })
        return
    }

    if (password.length < 6) {
        toast({ title: "Contraseña muy corta", description: "Usá al menos 6 caracteres.", variant: "destructive" })
        return
    }

    setLoading(true)
    try {
      // Intento final de actualización
      const { error } = await supabase.auth.updateUser({ password })
      
      if (error) throw error
      
      toast({ title: "Contraseña guardada", description: "Ya podés ingresar con la nueva." })
      
      setTimeout(() => {
          router.push("/login")
      }, 1500)

    } catch (error: any) {
      console.error(error)
      toast({ 
        title: "Error al actualizar", 
        description: error.message.includes("session") 
            ? "La sesión expiró. Por favor solicitá un nuevo enlace." 
            : error.message, 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <AuthShell title="Un momento" subtitle="Estamos validando el enlace.">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </AuthShell>
    )
  }

  if (!validSession) {
    return (
      <AuthShell title="Enlace vencido" subtitle="Este enlace ya se usó o expiró. Pedí uno nuevo para crear tu contraseña.">
        <Button size="lg" className="w-full font-semibold" onClick={() => router.push("/login/forgot-password")}>
          Pedir enlace nuevo
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Contraseña nueva" subtitle="Usá al menos 6 caracteres.">
      <form onSubmit={handleUpdate} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña nueva</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pr-20"
            />
            <PasswordToggle shown={showPassword} onToggle={() => setShowPassword(!showPassword)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Repetila</Label>
          <div className="relative">
            <Input
              id="confirm"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="pr-20"
            />
            <PasswordToggle shown={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full font-semibold" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          Guardar contraseña
        </Button>
      </form>
    </AuthShell>
  )
}
