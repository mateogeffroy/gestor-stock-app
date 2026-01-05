"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle, Upload, FileKey, FileCheck } from "lucide-react"

export function ArcaConfig() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  
  // Estados del formulario
  const [cuit, setCuit] = useState("")
  const [ptoVenta, setPtoVenta] = useState("")
  const [isProduction, setIsProduction] = useState(false)
  
  // Estado visual de los archivos (solo para saber si ya subió alguno)
  const [hasCert, setHasCert] = useState(false)
  const [hasKey, setHasKey] = useState(false)

  // Estados de carga de archivos
  const [uploadingCert, setUploadingCert] = useState(false)
  const [uploadingKey, setUploadingKey] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
          .from('user_tax_data')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (data) {
          setCuit(data.cuit || "")
          setPtoVenta(data.punto_venta?.toString() || "")
          setIsProduction(data.is_production || false)
          
          // Verificamos si ya existen rutas guardadas
          if (data.cert_path) setHasCert(true)
          if (data.key_path) setHasKey(true)
        }
      } catch (error) {
        console.log("Sin datos previos.")
      } finally {
        setFetching(false)
      }
    }
    fetchData()
  }, [])

  // Función genérica para subir archivos al bucket PRIVADO
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'crt' | 'key') => {
    const file = e.target.files?.[0]
    if (!file) return

    const isCert = type === 'crt'
    isCert ? setUploadingCert(true) : setUploadingKey(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No usuario")

      // Nombre fijo para sobrescribir siempre el mismo archivo y no llenar basura
      // Ej: usuario_123/certificado.crt
      const fileName = `${user.id}/${isCert ? 'certificado.crt' : 'private.key'}`

      // 1. Subir a Storage (Bucket 'certificados')
      const { error: uploadError } = await supabase.storage
        .from('certificados')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // 2. Guardar la referencia en la base de datos
      const updateData = isCert ? { cert_path: fileName } : { key_path: fileName }
      
      const { error: dbError } = await supabase
        .from('user_tax_data')
        .upsert({
            user_id: user.id,
            ...updateData,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (dbError) throw dbError

      // Feedback visual
      if (isCert) setHasCert(true)
      else setHasKey(true)

      toast({ title: "Archivo subido", description: `Tu ${isCert ? 'Certificado' : 'Clave'} se guardó segura.` })

    } catch (error) {
      console.error(error)
      toast({ variant: "destructive", title: "Error", description: "No se pudo subir el archivo." })
    } finally {
      isCert ? setUploadingCert(false) : setUploadingKey(false)
    }
  }

  const handleSaveData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_tax_data')
        .upsert({
          user_id: user.id,
          cuit: cuit,
          punto_venta: parseInt(ptoVenta),
          is_production: isProduction,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (error) throw error
      toast({ title: "Datos guardados", description: "Configuración actualizada." })

    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Verifica los datos." })
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="p-4"><Loader2 className="animate-spin h-5 w-5" /></div>

  return (
    <div className="space-y-6">
      {/* 1. Datos básicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>CUIT del Emisor</Label>
          <Input placeholder="20123456789" value={cuit} onChange={e => setCuit(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Punto de Venta</Label>
          <Input type="number" placeholder="1" value={ptoVenta} onChange={e => setPtoVenta(e.target.value)} />
        </div>
      </div>

      {/* 2. Zona de Carga de Archivos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
        
        {/* Certificado CRT */}
        <div className="border rounded-lg p-4 bg-slate-50 relative">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck className={`h-5 w-5 ${hasCert ? 'text-green-600' : 'text-gray-400'}`} />
            <Label className="font-semibold">Certificado (.crt)</Label>
          </div>
          <p className="text-xs text-muted-foreground mb-3">El archivo público que te da AFIP.</p>
          
          <div className="flex items-center gap-2">
             <Input 
                type="file" 
                accept=".crt"
                className="text-xs"
                onChange={(e) => handleFileUpload(e, 'crt')}
                disabled={uploadingCert}
             />
             {uploadingCert && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          {hasCert && <p className="text-[10px] text-green-600 mt-1 font-medium">✓ Archivo cargado correctamente</p>}
        </div>

        {/* Clave KEY */}
        <div className="border rounded-lg p-4 bg-slate-50 relative">
          <div className="flex items-center gap-2 mb-2">
            <FileKey className={`h-5 w-5 ${hasKey ? 'text-green-600' : 'text-gray-400'}`} />
            <Label className="font-semibold">Clave Privada (.key)</Label>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Tu llave secreta. Nunca la compartas.</p>
          
          <div className="flex items-center gap-2">
             <Input 
                type="file" 
                accept=".key" // Aceptamos .key o .txt si viene de OpenSSL
                className="text-xs"
                onChange={(e) => handleFileUpload(e, 'key')}
                disabled={uploadingKey}
             />
             {uploadingKey && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          {hasKey && <p className="text-[10px] text-green-600 mt-1 font-medium">✓ Archivo cargado correctamente</p>}
        </div>

      </div>

      {/* 3. Modo Producción */}
      <div className="flex items-center justify-between border p-4 rounded-lg">
        <div className="space-y-0.5">
          <Label>Modo Producción</Label>
          <p className="text-sm text-muted-foreground">Activar para facturas reales.</p>
        </div>
        <Switch checked={isProduction} onCheckedChange={setIsProduction} />
      </div>

      <Button onClick={handleSaveData} disabled={loading} className="w-full">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Guardar Configuración
      </Button>
    </div>
  )
}