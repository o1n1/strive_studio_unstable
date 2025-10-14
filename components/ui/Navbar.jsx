'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, LogOut, Menu, X, User, ChevronDown } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { logoutUser } from '@/lib/supabase/auth'

export default function Navbar() {
  const router = useRouter()
  const { profile } = useUser()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = async () => {
    const result = await logoutUser()
    if (result.success) {
      router.push('/')
    }
  }

  const getDashboardUrl = () => {
    if (!profile) return '/'
    
    switch (profile.rol) {
      case 'admin': return '/admin/dashboard'
      case 'coach': return '/coach/clases'
      case 'cliente': return '/cliente/reservas'
      case 'staff': return '/staff/checkin'
      default: return '/'
    }
  }

  const getRolLabel = (rol) => {
    const labels = {
      admin: 'Administrador',
      coach: 'Coach',
      cliente: 'Cliente',
      staff: 'Staff'
    }
    return labels[rol] || 'Usuario'
  }

  return (
    <nav 
      className="backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 mb-6 sm:mb-8 shadow-xl"
      style={{ 
        background: 'rgba(53, 53, 53, 0.8)',
        border: '1px solid rgba(156, 122, 94, 0.3)'
      }}
    >
      <div className="flex items-center justify-between">
        {/* Logo/Brand */}
        <Link href={getDashboardUrl()}>
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <div 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(174, 63, 33, 0.2)' }}
            >
              <span className="text-xl sm:text-2xl font-bold" style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                S
              </span>
            </div>
            <div className="hidden sm:block">
              <h2 className="text-lg font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                STRIVE
              </h2>
              <p className="text-xs opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                {getRolLabel(profile?.rol)}
              </p>
            </div>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-4">
          <Link href={getDashboardUrl()}>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all hover:opacity-80"
              style={{
                background: 'rgba(174, 63, 33, 0.2)',
                color: '#AE3F21',
                fontFamily: 'Montserrat, sans-serif'
              }}
            >
              <Home size={18} />
              Inicio
            </button>
          </Link>

          {/* User Menu Desktop */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 px-4 py-2 rounded-xl font-semibold transition-all hover:opacity-80"
              style={{
                background: 'rgba(156, 122, 94, 0.2)',
                color: '#FFFCF3',
                fontFamily: 'Montserrat, sans-serif'
              }}
            >
              <User size={18} />
              <span className="max-w-[150px] truncate">
                {profile?.nombre || 'Usuario'}
              </span>
              <ChevronDown size={16} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden z-50"
                style={{ 
                  background: 'rgba(53, 53, 53, 0.95)',
                  border: '1px solid rgba(156, 122, 94, 0.3)'
                }}
              >
                <div className="p-4 border-b" style={{ borderColor: 'rgba(156, 122, 94, 0.2)' }}>
                  <p className="font-semibold text-sm truncate" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    {profile?.nombre} {profile?.apellidos}
                  </p>
                  <p className="text-xs opacity-70 truncate" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    {profile?.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                  style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}
                >
                  <LogOut size={18} />
                  <span className="font-semibold">Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl transition-all hover:opacity-80"
          style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21' }}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pt-4 space-y-3 border-t" style={{ borderColor: 'rgba(156, 122, 94, 0.2)' }}>
          {/* User Info Mobile */}
          <div className="p-3 rounded-xl" style={{ background: 'rgba(156, 122, 94, 0.1)' }}>
            <p className="font-semibold text-sm truncate" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              {profile?.nombre} {profile?.apellidos}
            </p>
            <p className="text-xs opacity-70 truncate" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              {profile?.email}
            </p>
          </div>

          {/* Mobile Actions */}
          <Link href={getDashboardUrl()} onClick={() => setMobileMenuOpen(false)}>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all hover:opacity-80"
              style={{
                background: 'rgba(174, 63, 33, 0.2)',
                color: '#AE3F21',
                fontFamily: 'Montserrat, sans-serif'
              }}
            >
              <Home size={18} />
              Ir al Inicio
            </button>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all hover:opacity-80"
            style={{
              background: 'rgba(156, 122, 94, 0.2)',
              color: '#B39A72',
              fontFamily: 'Montserrat, sans-serif'
            }}
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      )}
    </nav>
  )
}
