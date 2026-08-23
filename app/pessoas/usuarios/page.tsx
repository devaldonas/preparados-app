'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, MessageCircle, MapPin } from 'lucide-react'

interface User {
  id: string
  full_name: string
  group_id: number
  group_name: string
  city: string
  state: string
  latitude: number
  longitude: number
}

export default function ListaUsuarios() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    carregarUsuarios()
  }, [])

  const carregarUsuarios = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          city,
          state,
          latitude,
          longitude,
          group_id,
          groups:group_id (
            name
          )
        `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)

      if (error) throw error

      const usersList = (profiles || []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name || 'Usuário',
        group_id: p.group_id,
        group_name: p.groups?.name || 'Sem grupo',
        city: p.city || 'Localização não informada',
        state: p.state || '',
        latitude: p.latitude,
        longitude: p.longitude
      }))

      setUsers(usersList)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const iniciarChat = (userId: string, userName: string) => {
    router.push(`/chat/${userId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/pessoas"
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-black">Preparados no Mapa</h1>
            <p className="text-sm text-gray-500">{users.length} usuários ativos</p>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#FFB800]/10 rounded-full flex items-center justify-center">
                        <img 
                          src="/images/markmap.png" 
                          alt="Preparado" 
                          className="w-6 h-6 object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.full_name}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <img 
                              src="/images/localizacao-icon.jpeg" 
                              alt="Localização" 
                              className="w-3 h-3 object-contain"
                              onError={(e) => { e.currentTarget.style.display = 'none' }}
                            />
                            {user.city}{user.state ? `, ${user.state}` : ''}
                          </span>
                          <span>•</span>
                          <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                            {user.group_name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => iniciarChat(user.id, user.full_name)}
                    className="bg-[#FFB800] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition flex items-center gap-2 text-sm"
                  >
                    <MessageCircle size={16} />
                    Conversar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
