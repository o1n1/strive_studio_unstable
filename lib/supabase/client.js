import { createClient } from '@supabase/supabase-js'

// Variables de entorno - se acceden directamente en tiempo de ejecución
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validar que existan las credenciales
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CONFIGURACIÓN FALTANTE DE SUPABASE')
  console.error('URL:', supabaseUrl ? '✅ OK' : '❌ FALTA')
  console.error('Key:', supabaseAnonKey ? '✅ OK' : '❌ FALTA')
  throw new Error('Faltan las credenciales de Supabase. Verifica que NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY estén configuradas.')
}

console.log('✅ Credenciales de Supabase cargadas')
console.log('URL:', supabaseUrl)

// Crear cliente de Supabase con configuración optimizada
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'strive-studio'
    }
  }
})

// Exportar el cliente
export const supabase = supabaseClient

// Log para verificar que se creó correctamente
console.log('✅ Cliente Supabase inicializado correctamente')
