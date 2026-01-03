"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Shield, Store } from "lucide-react"

export default function PerfilPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Cuenta</h1>
        <p className="text-muted-foreground">Administra tu información personal y la configuración de tu negocio.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        
        {/* TARJETA DE INFORMACIÓN PERSONAL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" /> 
                Información Personal
            </CardTitle>
            <CardDescription>Datos asociados a tu usuario de sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="username">Nombre de Usuario</Label>
                <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="username" defaultValue="UsuarioDemo" disabled className="pl-9 bg-muted" />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="email" defaultValue="demo@lacuerda.com" disabled className="pl-9 bg-muted" />
                </div>
            </div>
          </CardContent>
        </Card>

        {/* TARJETA DE DATOS DEL COMERCIO */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-orange-500" />
                Datos del Comercio
            </CardTitle>
            <CardDescription>Información visible en tus comprobantes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label>Nombre del Negocio</Label>
                <Input defaultValue="La Cuerda Bebidas" />
            </div>
            <div className="space-y-2">
                <Label>Dirección</Label>
                <Input placeholder="Ej: Av. Siempre Viva 123" />
            </div>
             <Button variant="outline" className="w-full mt-2">Guardar Cambios</Button>
          </CardContent>
        </Card>

        {/* TARJETA DE SEGURIDAD (Ocupa todo el ancho abajo) */}
        <Card className="md:col-span-2">
           <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Seguridad
            </CardTitle>
            <CardDescription>Gestiona tu contraseña y acceso.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                    <h4 className="font-medium">Contraseña</h4>
                    <p className="text-sm text-muted-foreground">Se recomienda cambiarla cada 3 meses.</p>
                </div>
                <Button variant="secondary">Cambiar contraseña</Button>
             </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}