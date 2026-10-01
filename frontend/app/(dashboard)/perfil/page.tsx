"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Store, Upload, Loader2, Trash2 } from "lucide-react"
import { useBusiness } from "@/context/business-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { FacturacionConfig } from "@/components/facturacion-config"

export default function PerfilPage() {
  const { businessName, setBusinessName, logoUrl, setLogoUrl, refreshProfile } = useBusiness()
  const { toast } = useToast()
  
  const [isSaving, setIsSaving] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false) 

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) setUserEmail(user.email)
    }
    getUser()
  }, [])

  // --- LÓGICA PARA SUBIR IMAGEN ---
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file) return

      setUploadingImage(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No usuario")

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName)

      setLogoUrl(publicUrlData.publicUrl)
      toast({ title: "Logo subido", description: "Tocá Guardar cambios para aplicarlo." })

    } catch (error) {
      console.error(error)
      toast({ variant: "destructive", title: "Error", description: "No se pudo subir la imagen." })
    } finally {
      setUploadingImage(false)
    }
  }

  // --- LÓGICA: ELIMINAR LOGO ---
  const handleDeleteLogo = async () => {
    setIsDeleting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('profiles')
        .update({ logo_url: null })
        .eq('id', user.id)

      if (error) throw error

      setLogoUrl(null)
      await refreshProfile()
      
      toast({ title: "Logo quitado" })

    } catch (error) {
      console.error(error)
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar la imagen." })
    } finally {
      setIsDeleting(false)
    }
  }

  // --- GUARDAR DATOS ---
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('profiles')
        .update({
          business_name: businessName,
          logo_url: logoUrl, 
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      await refreshProfile()
      toast({ title: "Cambios guardados" })

    } catch (error) {
      console.error(error)
      toast({ variant: "destructive", title: "Error", description: "No se pudieron guardar los cambios." })
    } finally {
      setIsSaving(false)
    }
  }

  const sendReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(userEmail, { redirectTo: window.location.origin + '/update-password' })
    if (error) toast({ variant: "destructive", title: "Correo no enviado", description: "Probá de nuevo en unos minutos." })
    else toast({ title: "Correo enviado", description: `Revisá ${userEmail} para crear la contraseña nueva.` })
  }

  return (
    <div className="max-w-4xl space-y-10 pb-10">
      <h1 className="page-title">Mi cuenta</h1>

      <section className="grid gap-6 md:grid-cols-[200px_1fr]">
        <div>
          <h2 className="text-lg font-semibold">Comercio</h2>
          <p className="mt-1 text-sm text-muted-foreground">Nombre y logo que se ven en el menú y en los comprobantes.</p>
        </div>
        <div className="space-y-5 rounded-md border bg-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
              {uploadingImage ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : logoUrl ? (
                <img src={logoUrl} alt="Logo actual" className="h-full w-full object-cover" />
              ) : (
                <Store className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <label className="cursor-pointer focus-within:ring-2 focus-within:ring-ring">
                  <Upload /> {logoUrl ? "Cambiar logo" : "Subir logo"}
                  <input type="file" accept="image/*" className="sr-only" onChange={handleLogoUpload} disabled={uploadingImage || isDeleting} />
                </label>
              </Button>
              {logoUrl && (
                <Button variant="ghost" size="sm" onClick={handleDeleteLogo} disabled={isDeleting} className="text-muted-foreground hover:text-destructive">
                  {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />} Quitar
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">PNG o JPG cuadrado, 200 × 200 px o más.</p>

          <div className="space-y-2">
            <Label htmlFor="businessName">Nombre del comercio</Label>
            <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </div>

          <Button onClick={handleSave} disabled={isSaving || uploadingImage} className="font-semibold">
            {isSaving && <Loader2 className="animate-spin" />}
            Guardar cambios
          </Button>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-[200px_1fr]">
        <div>
          <h2 className="text-lg font-semibold">Acceso</h2>
          <p className="mt-1 text-sm text-muted-foreground">Para cambiar el email, pedíselo al administrador del sistema.</p>
        </div>
        <div className="space-y-5 rounded-md border bg-card p-5">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium break-all">{userEmail || "…"}</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            <p className="text-sm">Te mandamos un enlace para crear una contraseña nueva.</p>
            <Button variant="outline" size="sm" onClick={sendReset} disabled={!userEmail}>
              Cambiar contraseña
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-[200px_1fr]">
        <div>
          <h2 className="text-lg font-semibold">Facturación electrónica</h2>
          <p className="mt-1 text-sm text-muted-foreground">Datos con los que se emiten tus facturas ante ARCA.</p>
        </div>
        <div className="rounded-md border bg-card p-5">
          <FacturacionConfig />
        </div>
      </section>
    </div>
  )
}
