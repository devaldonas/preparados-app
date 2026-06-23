// app/admin/usuarios/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import { Search, User, Mail, Calendar, Check, X, MapPin, Package } from 'lucide-react'

interface Profile {
  id: string
  full_name: string
  email: string
  created_at: string
  cep: string
  mochila_tipo: string
  group_id: number
}

export default function AdminUsuarios() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    carregarUsuarios()
  }, [])

  const carregarUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <NavBar showBackButton={true} backButtonPath="/admin" />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">👥 Usuários</h1>
            <p className="text-gray-500 text-sm">Gerencie todos os usuários do aplicativo</p>
          </div>
          <span className="text-sm text-gray-500">Total: {users.length}</span>
        </div>

        {/* Busca */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#FFB800] outline-none"
            />
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                    Cadastro
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                    Localização
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                    Mochila
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <User size={16} className="text-gray-600" />
                          </div>
                          <span className="font-medium text-sm text-gray-900">
                            {user.full_name || 'Sem nome'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-600">{user.email || 'Sem email'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {formatDate(user.created_at)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {user.cep ? (
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-600">CEP: {user.cep}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Não definido</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {user.mochila_tipo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#FFB800]/10 text-[#FFB800] text-xs font-medium rounded-full">
                            <Package size={12} />
                            {user.mochila_tipo}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Não definido</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}