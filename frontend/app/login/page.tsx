"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { AuthShell, PasswordToggle } from "@/components/auth-shell"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      router.push("/ventas")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "No pudimos iniciar sesión",
        description: error.message === "Invalid login credentials" ? "El email o la contraseña no coinciden." : error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Abrir el mostrador" subtitle="Ingresá con el email de tu comercio.">
      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link href="/login/forgot-password" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              La olvidé
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pr-20"
            />
            <PasswordToggle shown={showPassword} onToggle={() => setShowPassword(!showPassword)} />
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full font-semibold" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          Ingresar
        </Button>
      </form>
    </AuthShell>
  )
}
