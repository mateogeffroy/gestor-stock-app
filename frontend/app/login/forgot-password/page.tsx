"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { AuthShell } from "@/components/auth-shell"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { toast } = useToast()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/send-recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo enviar el enlace. Probá de nuevo en unos minutos.")

      setSent(true)
    } catch (error: any) {
      toast({ title: "Enlace no enviado", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const volver = (
    <Link href="/login" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
      Volver a ingresar
    </Link>
  )

  if (sent) {
    return (
      <AuthShell
        title="Revisá tu correo"
        subtitle={<>Mandamos el enlace para crear una contraseña nueva a <strong className="text-foreground">{email}</strong>.</>}
        footer={volver}
      >
        <p className="text-sm text-muted-foreground">Si no llega en unos minutos, mirá en spam.</p>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Recuperar acceso" subtitle="Te mandamos un enlace para crear una contraseña nueva." footer={volver}>
      <form onSubmit={handleReset} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <Button type="submit" size="lg" className="w-full font-semibold" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          Enviar enlace
        </Button>
      </form>
    </AuthShell>
  )
}
