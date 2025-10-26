import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

import { withAuth } from '@/lib/auth/api-auth'

export const POST = withAuth(
  async (request, { user, profile, supabase }) => {
    const { coachId } = await request.json()

    if (!coachId) {
      return NextResponse.json(
        { error: 'ID de coach requerido' },
        { status: 400 }
      )
    }

    console.log('✅ [API] Aprobando coach:', coachId)

    // Actualizar estado del coach
    const { error: updateError } = await supabase
      .from('coaches')
      .update({
        estado: 'activo',
        activo: true,
        fecha_aprobacion: new Date().toISOString().split('T')[0],
        aprobado_por: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', coachId)

    if (updateError) {
      console.error('❌ Error actualizando coach:', updateError)
      return NextResponse.json(
        { error: 'Error al aprobar coach: ' + updateError.message },
        { status: 500 }
      )
    }

    // TODO: Enviar email de bienvenida al coach
    // TODO: Enviar notificación al equipo

    console.log('✅ [API] Coach aprobado exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Coach aprobado exitosamente'
    })
  },
  { allowedRoles: ['admin'] }
)