import { NextResponse } from 'next/server'

export async function GET() {
  // Simulamos que todo está verde y feliz
  return NextResponse.json({ 
    success: true, 
    serverStatus: {
        AppServer: "OK",
        DbServer: "OK",
        AuthServer: "OK"
    }
  })
}