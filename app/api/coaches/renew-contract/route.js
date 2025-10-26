import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/api-auth'
import { generateCoachContractPDF } from '@/lib/pdf/contract-generator'
import crypto from 'crypto'

/**
 * API para renovar/actualizar contratos de coaches
 * Solo accesible por administradores
 * 
 * @route POST /api/coaches/renew-contract
 * @access Admin
 */
export const POST = withAuth(
  async (request, { user, profile, supabase }) => {
    try {
      console.log(`📝 [API] Admin ${profile.nombre} ${profile.apellidos} actualizando contrato...`)

      // Obtener datos del body
      const body = await request.json()
      const {
        coachId,
        contratoId,
        tipo_contrato,
        fecha_inicio,
        fecha_fin,
        sueldo_base,
        comision_por_clase,
        notas,
        es_renovacion
      } = body

      console.log('📝 [API] Datos del contrato:')
      console.log('  - Coach ID:', coachId)
      console.log('  - Contrato ID:', contratoId)
      console.log('  - Tipo:', tipo_contrato)
      console.log('  - Es renovación:', es_renovacion)

      // Validaciones
      if (!coachId || !tipo_contrato || !fecha_inicio) {
        console.error('❌ [API] Faltan campos requeridos')
        return NextResponse.json(
          { error: 'coachId, tipo_contrato y fecha_inicio son requeridos' },
          { status: 400 }
        )
      }

      // Validar tipo de contrato
      const tiposValidos = ['honorarios', 'nomina', 'mixto']
      if (!tiposValidos.includes(tipo_contrato)) {
        console.error('❌ [API] Tipo de contrato inválido:', tipo_contrato)
        return NextResponse.json(
          { error: 'Tipo de contrato inválido. Debe ser: honorarios, nomina o mixto' },
          { status: 400 }
        )
      }

      // Validar fechas
      const inicio = new Date(fecha_inicio)
      if (isNaN(inicio.getTime())) {
        console.error('❌ [API] Fecha de inicio inválida')
        return NextResponse.json(
          { error: 'Fecha de inicio inválida' },
          { status: 400 }
        )
      }

      if (fecha_fin) {
        const fin = new Date(fecha_fin)
        if (isNaN(fin.getTime())) {
          console.error('❌ [API] Fecha de fin inválida')
          return NextResponse.json(
            { error: 'Fecha de fin inválida' },
            { status: 400 }
          )
        }
        if (fin <= inicio) {
          console.error('❌ [API] Fecha de fin debe ser posterior a fecha de inicio')
          return NextResponse.json(
            { error: 'La fecha de fin debe ser posterior a la fecha de inicio' },
            { status: 400 }
          )
        }
      }

      // Verificar que el coach existe
      const { data: coachData, error: coachError } = await supabase
        .from('coaches')
        .select('id, user_id')
        .eq('id', coachId)
        .single()

      if (coachError || !coachData) {
        console.error('❌ [API] Coach no encontrado:', coachError)
        return NextResponse.json(
          { error: 'Coach no encontrado' },
          { status: 404 }
        )
      }

      console.log('✅ [API] Coach encontrado:', coachData.id)

      // Generar hash para el contrato
      const contratoHash = crypto.randomBytes(32).toString('hex')

      let resultado

      if (es_renovacion && contratoId) {
        // Renovación: Finalizar contrato anterior y crear uno nuevo
        console.log('🔄 [API] Procesando renovación de contrato...')

        // Finalizar contrato anterior
        const { error: finalizarError } = await supabase
          .from('coach_contracts')
          .update({
            activo: false,
            fecha_finalizacion: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString()
          })
          .eq('id', contratoId)

        if (finalizarError) {
          console.error('❌ [API] Error al finalizar contrato anterior:', finalizarError)
          return NextResponse.json(
            { error: 'Error al finalizar contrato anterior: ' + finalizarError.message },
            { status: 500 }
          )
        }

        console.log('✅ [API] Contrato anterior finalizado')

        // Crear nuevo contrato
        const { data: nuevoContrato, error: crearError } = await supabase
          .from('coach_contracts')
          .insert({
            coach_id: coachId,
            tipo_contrato,
            fecha_inicio,
            fecha_fin: fecha_fin || null,
            sueldo_base: sueldo_base || null,
            comision_por_clase: comision_por_clase || null,
            activo: true,
            notas: notas || null,
            contrato_hash: contratoHash,
            creado_por: user.id
          })
          .select()
          .single()

        if (crearError) {
          console.error('❌ [API] Error al crear nuevo contrato:', crearError)
          return NextResponse.json(
            { error: 'Error al crear nuevo contrato: ' + crearError.message },
            { status: 500 }
          )
        }

        console.log('✅ [API] Nuevo contrato creado:', nuevoContrato.id)
        resultado = nuevoContrato

      } else {
        // Actualización: Modificar contrato existente
        console.log('📝 [API] Actualizando contrato existente...')

        if (!contratoId) {
          console.error('❌ [API] ID de contrato requerido para actualización')
          return NextResponse.json(
            { error: 'ID de contrato requerido para actualizar' },
            { status: 400 }
          )
        }

        const { data: contratoActualizado, error: actualizarError } = await supabase
          .from('coach_contracts')
          .update({
            tipo_contrato,
            fecha_inicio,
            fecha_fin: fecha_fin || null,
            sueldo_base: sueldo_base || null,
            comision_por_clase: comision_por_clase || null,
            notas: notas || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', contratoId)
          .select()
          .single()

        if (actualizarError) {
          console.error('❌ [API] Error al actualizar contrato:', actualizarError)
          return NextResponse.json(
            { error: 'Error al actualizar contrato: ' + actualizarError.message },
            { status: 500 }
          )
        }

        console.log('✅ [API] Contrato actualizado:', contratoActualizado.id)
        resultado = contratoActualizado
      }

      // TODO: Generar PDF del contrato
      console.log('📄 [API] TODO: Generar PDF del contrato')

      console.log('✅ [API] Proceso completado exitosamente')

      return NextResponse.json({
        success: true,
        message: es_renovacion ? 'Contrato renovado exitosamente' : 'Contrato actualizado exitosamente',
        contract: {
          id: resultado.id,
          coach_id: resultado.coach_id,
          tipo_contrato: resultado.tipo_contrato,
          fecha_inicio: resultado.fecha_inicio,
          fecha_fin: resultado.fecha_fin,
          activo: resultado.activo
        }
      })

    } catch (error) {
      console.error('❌ [API] Error general en POST /api/coaches/renew-contract:', error)
      console.error('❌ [API] Stack trace:', error.stack)
      return NextResponse.json(
        { error: 'Error interno del servidor: ' + error.message },
        { status: 500 }
      )
    }
  },
  { allowedRoles: ['admin'] }
)