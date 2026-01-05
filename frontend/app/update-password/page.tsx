"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Loader2, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react"

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

        // CASO A: Error explícito en URL
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
        toast({ title: "Error", description: "Las contraseñas no coinciden.", variant: "destructive" })
        return
    }

    if (password.length < 6) {
        toast({ title: "Error", description: "Mínimo 6 caracteres.", variant: "destructive" })
        return
    }

    setLoading(true)
    try {
      // Intento final de actualización
      const { error } = await supabase.auth.updateUser({ password })
      
      if (error) throw error
      
      toast({ title: "¡Éxito!", description: "Contraseña actualizada. Iniciando sesión..." })
      
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

  // RENDERIZADO (Igual que antes)
  if (verifying) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <Card className="w-[400px] shadow-lg border-primary/20">
                <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground font-medium">Validando credenciales...</p>
                </CardContent>
            </Card>
        </div>
    )
  }

  if (!validSession) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <Card className="w-[400px] shadow-lg border-red-100">
                <CardHeader>
                    <CardTitle className="text-red-600 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5"/> Enlace no válido
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        El enlace ha expirado o no contiene las credenciales necesarias.
                    </p>
                    <Button variant="outline" className="w-full" onClick={() => router.push("/login/forgot-password")}>
                        Solicitar nuevo enlace
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-[400px] shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="h-5 w-5 text-green-600"/> Nueva Contraseña
          </CardTitle>
          <CardDescription>
            Creá tu nueva clave para acceder al sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Nueva Contraseña</label>
                <div className="relative">
                    <Input 
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        required
                        className="pr-10"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Repetir Contraseña</label>
                <div className="relative">
                    <Input 
                        type={showConfirm ? "text" : "password"} 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirmar clave"
                        required
                        className="pr-10"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary">
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Actualizar Contraseña"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}