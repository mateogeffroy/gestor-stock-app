import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // 1. Generar Link
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        // 🚨 CAMBIO CLAVE: Vamos directo a la página, sin pasar por el callback del servidor
        redirectTo: `${origin}/update-password`
      }
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const recoveryLink = data.properties.action_link

    // 2. Configurar Gmail
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // 3. Diseño del Email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb; text-align: center;">La Cuerda Bebidas</h2>
        <h3 style="color: #0f172a; text-align: center;">Recuperación de Contraseña</h3>
        <p style="font-size: 16px; color: #334155;">Hola,</p>
        <p style="font-size: 16px; color: #334155;">
            Hacé clic en el siguiente botón para crear una nueva contraseña. Al hacerlo, iniciarás sesión automáticamente.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${recoveryLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
              Cambiar Contraseña Ahora
            </a>
        </div>
      </div>
    `

    // 4. Enviar
    await transporter.sendMail({
      from: `"La Cuerda Bebidas" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Restablecer contraseña - La Cuerda Bebidas',
      html: htmlContent,
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error enviando mail:', error)
    return NextResponse.json({ error: 'Error interno al enviar el correo' }, { status: 500 })
  }
}