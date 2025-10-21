import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token requerido' },
        { status: 400 }
      )
    }

    console.log('🔍 [API] Verificando token:', token)

    // Usar Service Role Key para bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Buscar invitación por token
    const { data: invitacion, error } = await supabase
      .from('coach_invitations')
      .select('*')
      .eq('token', token)
      .single()

    if (error) {
      console.error('❌ [API] Error al buscar invitación:', error)
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 404 }
      )
    }

    console.log('✅ [API] Invitación encontrada:', invitacion.id)

    // Verificar estado
    if (invitacion.estado !== 'pendiente') {
      console.log('⚠️ [API] Invitación no está pendiente:', invitacion.estado)
      return NextResponse.json(
        { error: `Esta invitación ya fue ${invitacion.estado}` },
        { status: 400 }
      )
    }

    // Verificar expiración
    const ahora = new Date()
    const expiracion = new Date(invitacion.expira_en)
    
    if (expiracion < ahora) {
      console.log('⚠️ [API] Invitación expirada')
      
      // Marcar como expirada
      await supabase
        .from('coach_invitations')
        .update({ estado: 'expirado' })
        .eq('id', invitacion.id)

      return NextResponse.json(
        { error: 'Esta invitación ha expirado' },
        { status: 400 }
      )
    }

    console.log('✅ [API] Invitación válida')

    return NextResponse.json({
      success: true,
      invitacion: {
        id: invitacion.id,
        email: invitacion.email,
        categoria: invitacion.categoria,
        expira_en: invitacion.expira_en,
        mensaje_personalizado: invitacion.mensaje_personalizado
      }
    })

  } catch (error) {
    console.error('❌ [API] Error en verify-invitation:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
