"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Shield, Store, FileText, Upload, Loader2, Trash2, CircleHelp } from "lucide-react" // Agregué CircleHelp
import { useBusiness } from "@/context/business-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { ArcaConfig } from "@/components/arca-config"

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
      toast({ title: "Imagen cargada", description: "No olvides guardar los cambios." })

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
      
      toast({ title: "Imagen eliminada", description: "Tu logo se ha quitado correctamente." })

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
      toast({ title: "¡Éxito!", description: "Perfil actualizado correctamente." })

    } catch (error) {
      console.error(error)
      toast({ variant: "destructive", title: "Error", description: "No se pudieron guardar los cambios." })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Cuenta</h1>
        <p className="text-muted-foreground">Administra la identidad de tu comercio.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        
        {/* --- TARJETA 1: DATOS DEL COMERCIO --- */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" /> 
                Datos del Comercio
            </CardTitle>
            <CardDescription>Información visible en el sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* ZONA DE LOGO */}
            <div className="flex items-start gap-4 p-4 border rounded-lg bg-muted/20">
                <div className="h-16 w-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-white relative shrink-0">
                    {uploadingImage ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                        <Upload className="h-6 w-6 text-muted-foreground" />
                    )}
                </div>
                
                <div className="space-y-2 flex-1 overflow-hidden">
                    <Label htmlFor="logo" className="text-sm font-medium">Logo del Comercio</Label>
                    <div className="flex gap-2 items-center">
                      <Input 
                        id="logo" 
                        type="file" 
                        accept="image/*" 
                        className="h-9 text-xs w-full" 
                        onChange={handleLogoUpload} 
                        disabled={uploadingImage || isDeleting} 
                      />
                      {logoUrl && (
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="h-9 w-9 shrink-0"
                          onClick={handleDeleteLogo}
                          disabled={isDeleting}
                        >
                          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">Recomendado: 200x200px (PNG o JPG)</p>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="businessName">Nombre del Comercio</Label>
                <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                        id="businessName" 
                        value={businessName} 
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Ej: Mi Comercio" 
                        className="pl-9" 
                    />
                </div>
            </div>

            {/* AQUI YA NO ESTA EL EMAIL */}

            <Button onClick={handleSave} disabled={isSaving || uploadingImage} className="w-full mt-2">
                {isSaving ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                    </>
                ) : (
                    "Guardar Cambios"
                )}
            </Button>
          </CardContent>
        </Card>

        {/* --- TARJETA 2: SEGURIDAD (AHORA CON EMAIL) --- */}
        <Card className="md:col-span-2 lg:col-span-1 h-fit">
           <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> {/* Cambié a primary para combinar */}
                Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6"> {/* space-y-6 para separar las secciones */}
             
             {/* SECCIÓN 1: CORREO DE ACCESO (NUEVO LUGAR) */}
             <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Correo de Acceso</Label>
                    
                    {/* TOOLTIP DE AYUDA */}
                    <div className="relative group flex items-center">
                        <CircleHelp className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-primary transition-colors" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 p-2 bg-slate-900 text-white text-[10px] rounded-md shadow-lg z-50 pointer-events-none text-center leading-tight">
                             Por seguridad, el cambio de correo debe ser gestionado por el administrador del sistema.
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                        </div>
                    </div>
                </div>

                {/* VISUALIZACIÓN COMO DATO PLANO (NO INPUT) */}
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md border border-dashed border-gray-200">
                    <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center border shrink-0">
                        <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium truncate text-foreground/80">
                        {userEmail || "Cargando..."}
                    </span>
                </div>
             </div>

             {/* SECCIÓN 2: CONTRASEÑA */}
             <div className="flex flex-col gap-4 p-4 border rounded-lg">
                <div className="space-y-1">
                    <h4 className="font-medium text-sm">Contraseña</h4>
                    <p className="text-xs text-muted-foreground">Te enviaremos un correo para restablecerla.</p>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={async () => {
                      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, { redirectTo: window.location.origin + '/update-password' })
                      if(!error) toast({ title: "Correo enviado", description: "Revisa tu bandeja de entrada." })
                }}>
                    Cambiar contraseña via Email
                </Button>
             </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}