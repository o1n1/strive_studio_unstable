import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'

// Obtener credenciales de las variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validar que existan las credenciales
if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('❌ Faltan credenciales de Supabase')
  logger.error('URL:', supabaseUrl ? '✅' : '❌')
  logger.error('Key:', supabaseAnonKey ? '✅' : '❌')
  throw new Error('Faltan las credenciales de Supabase en .env.local')
}

logger.log('✅ Credenciales de Supabase cargadas')

// Crear y exportar el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})