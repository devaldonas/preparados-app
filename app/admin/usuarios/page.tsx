'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, Search, Check, X, AlertCircle, Shield } from 'lucide-react'

export default function AdminUsuarios() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('todos')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: profile } = await (supabase
          .from('profiles') as any)
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role !== 'admin') {
          router.push('/dashboard')
          return
        }

        await carregarUsuarios()
      } catch (error) {
        console.error('Erro ao verificar admin:', error)
        router.push('/dashboard')
      }
    }

    checkAdmin()
  }, [])

  const carregarUsuarios = async () => {
    try {
      const { data, error } = await (supabase
        .from('profiles') as any)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const atualizarRole = async (userId: string, novaRole: string) => {
    try {
      const { error } = await (supabase
        .from('profiles') as any)
        .update({ role: novaRole })
        .eq('id', userId)

      if (error) throw error

      setUsers(users.map((u: any) => 
        u.id === userId ? { ...u, role: novaRole } : u
      ))

      setSuccessMessage(`Role atualizada para ${novaRole}!`)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Erro ao atualizar role:', error)
      setErrorMessage('Erro ao atualizar role')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-semibold">Admin</span>
      case 'partner':
        return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">Parceiro</span>
      default:
        return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-semibold">Usuário</span>
    }
  }

  const filtrarUsuarios = () => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter((u: any) => 
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterRole !== 'todos') {
      filtered = filtered.filter((u: any) => u.role === filterRole)
    }

    return filtered
  }

  const usuariosFiltrados = filtrarUsuarios()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black">Usuários</h1>
            <p className="text-gray-500 text-sm">Gerencie todos os usuários da plataforma</p>
          </div>
          <Link
            href="/admin"
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            ← Voltar
          </Link>
        </div>

        {/* Mensagens */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <Check size={18} />
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle size={18} />
            {errorMessage}
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar usuários por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#FFB800] outline-none"
                />
              </div>
            </div>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#FFB800] outline-none"
            >
              <option value="todos">Todas roles</option>
              <option value="admin">Admin</option>
              <option value="partner">Parceiro</option>
              <option value="user">Usuário</option>
            </select>
          </div>
        </div>

        {/* Lista de usuários */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-3 text-sm font-semibold text-gray-600">Usuário</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-600">Email</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-600">Role</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((user: any) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#FFB800]/10 rounded-full flex items-center justify-center">
                            <span className="text-[#FFB800] font-bold">
                              {user.full_name?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-black">{user.full_name || 'Sem nome'}</p>
                            <p className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-gray-600 text-sm">
                        {user.email || 'Sem email'}
                      </td>
                      <td className="p-3">
                        {getRoleBadge(user.role || 'user')}
                      </td>
                      <td className="p-3">
                        <select
                          value={user.role || 'user'}
                          onChange={(e) => atualizarRole(user.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded px-2 py-1 focus:border-[#FFB800] outline-none"
                        >
                          <option value="user">Usuário</option>
                          <option value="partner">Parceiro</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          Total: {usuariosFiltrados.length} usuários
          {searchTerm && ` (filtrados de ${users.length})`}
        </div>
      </div>
    </div>
  )
}