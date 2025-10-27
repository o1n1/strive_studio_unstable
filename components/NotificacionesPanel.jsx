'use client'

import { useState, useEffect } from 'react'
import { Bell, X, CheckCircle, AlertTriangle, FileText, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'

export default function NotificacionesPanel() {
  const { user } = useUser()
  const [notificaciones, setNotificaciones] = useState([])
  const [mostrarPanel, setMostrarPanel] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user?.id) {
      cargarNotificaciones()
      
      // Suscribirse a nuevas notificaciones
      const channel = supabase
        .channel('notificaciones-changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, () => {
          cargarNotificaciones()
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user?.id])

  const cargarNotificaciones = async () => {
    if (!user?.id) return

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    setNotificaciones(data || [])
  }

  const marcarComoLeida = async (id) => {
    await supabase
      .from('notifications')
      .update({ leido: true })
      .eq('id', id)
    
    cargarNotificaciones()
  }

  const marcarTodasLeidas = async () => {
    setLoading(true)
    await supabase
      .from('notifications')
      .update({ leido: true })
      .eq('user_id', user?.id)
      .eq('leido', false)
    
    await cargarNotificaciones()
    setLoading(false)
  }

  const noLeidas = notificaciones.filter(n => !n.leido).length

  const getIcono = (tipo) => {
    switch (tipo) {
      case 'sistema': return AlertTriangle
      case 'documentos': return FileText
      case 'clase': return Calendar
      default: return Bell
    }
  }

  return (
    <>
      {/* Botón Notificaciones */}
      <button
        onClick={() => setMostrarPanel(true)}
        className="relative p-2 rounded-lg transition-all hover:opacity-80"
        style={{ background: 'rgba(156, 122, 94, 0.2)' }}
      >
        <Bell size={20} style={{ color: '#B39A72' }} />
        {noLeidas > 0 && (
          <span 
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: '#ef4444', color: '#fff' }}
          >
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {/* Panel Lateral */}
      {mostrarPanel && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => setMostrarPanel(false)}
          />

          {/* Panel */}
          <div 
            className="fixed top-0 right-0 h-full w-full max-w-md z-50 overflow-y-auto animate-slide-left"
            style={{ background: '#0A0A0A', borderLeft: '1px solid rgba(156, 122, 94, 0.3)' }}
          >
            {/* Header */}
            <div 
              className="sticky top-0 z-10 p-6 border-b"
              style={{ background: '#0A0A0A', borderColor: 'rgba(156, 122, 94, 0.2)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Notificaciones
                </h2>
                <button 
                  onClick={() => setMostrarPanel(false)}
                  className="p-2 rounded-lg hover:opacity-80 transition-all"
                  style={{ background: 'rgba(156, 122, 94, 0.2)' }}
                >
                  <X size={20} style={{ color: '#B39A72' }} />
                </button>
              </div>

              {noLeidas > 0 && (
                <button
                  onClick={marcarTodasLeidas}
                  disabled={loading}
                  className="text-sm font-medium hover:opacity-80 transition-all disabled:opacity-50"
                  style={{ color: '#AE3F21' }}
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            {/* Lista */}
            <div className="p-4 space-y-2">
              {notificaciones.length === 0 ? (
                <div className="text-center py-12">
                  <Bell size={48} className="mx-auto mb-4 opacity-30" style={{ color: '#B39A72' }} />
                  <p style={{ color: '#B39A72' }}>No hay notificaciones</p>
                </div>
              ) : (
                notificaciones.map(notif => {
                  const Icono = getIcono(notif.tipo)
                  return (
                    <div
                      key={notif.id}
                      onClick={() => !notif.leido && marcarComoLeida(notif.id)}
                      className="p-4 rounded-xl cursor-pointer transition-all hover:opacity-80"
                      style={{
                        background: notif.leido 
                          ? 'rgba(255, 252, 243, 0.02)' 
                          : 'rgba(174, 63, 33, 0.1)',
                        border: `1px solid ${notif.leido ? 'rgba(156, 122, 94, 0.2)' : 'rgba(174, 63, 33, 0.3)'}`
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(174, 63, 33, 0.2)' }}
                        >
                          <Icono size={18} style={{ color: '#AE3F21' }} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 
                              className="font-semibold text-sm"
                              style={{ color: '#FFFCF3' }}
                            >
                              {notif.titulo}
                            </h4>
                            {!notif.leido && (
                              <div 
                                className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                                style={{ background: '#AE3F21' }}
                              />
                            )}
                          </div>
                          
                          <p 
                            className="text-sm mb-2 whitespace-pre-line"
                            style={{ color: '#B39A72' }}
                          >
                            {notif.mensaje}
                          </p>
                          
                          <p className="text-xs" style={{ color: '#9C7A5E' }}>
                            {new Date(notif.created_at).toLocaleDateString('es-MX', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slide-left {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-left {
          animation: slide-left 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
