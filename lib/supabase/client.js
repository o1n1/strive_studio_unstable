import { createClient } from '@supabase/supabase-js'

// Obtener credenciales de las variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validar que existan las credenciales
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltan credenciales de Supabase')
  console.error('URL:', supabaseUrl ? '✅' : '❌')
  console.error('Key:', supabaseAnonKey ? '✅' : '❌')
  throw new Error('Faltan las credenciales de Supabase en .env.local')
}

console.log('✅ Credenciales de Supabase cargadas:', { 
  url: supabaseUrl,
  keyLength: supabaseAnonKey.length 
})

// Crear y exportar el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})