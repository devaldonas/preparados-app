// app/admin/parceiros/page.tsx (CORRIGIDO)
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminGuard from '@/components/AdminGuard'
import { Check, X, Eye, Store, Users, Edit, Trash2 } from 'lucide-react'

interface Partner {
  id: number
  user_id: string
  company_name: string
  cnpj: string
  email: string
  phone: string
  status: string
  created_at: string
  updated_at: string
}

function AdminParceirosContent() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({})
  const router = useRouter()

  useEffect(() => {
    carregarParceiros()
  }, [])

  const carregarParceiros = async () => {
    try {
      setLoading(true)
      
      // 🔥 BUSCAR TODOS OS DADOS DO PARCEIRO
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const partnersData = (data as Partner[]) || []
      setPartners(partnersData)

      // Buscar perfis dos usuários (para pegar o nome completo)
      const userIds = partnersData.map(p => p.user_id).filter(id => id)
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds)

        if (!profilesError && profiles) {
          const map: Record<string, any> = {}
          profiles.forEach((p: any) => {
            map[p.id] = p
          })
          setProfilesMap(map)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar parceiros:', error)
    } finally {
      setLoading(false)
    }
  }

  const atualizarStatus = async (partnerId: number, novoStatus: string) => {
    if (!confirm(`Tem certeza que deseja ${novoStatus === 'approved' ? 'aprovar' : 'rejeitar'} este parceiro?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('partners')
        .update({ 
          status: novoStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', partnerId)

      if (error) throw error

      await carregarParceiros()
      alert(`Parceiro ${novoStatus === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso!`)
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status')
    }
  }

  const excluirParceiro = async (partnerId: number) => {
    if (!confirm('Tem certeza que deseja EXCLUIR este parceiro permanentemente? Esta ação não pode ser desfeita!')) {
      return
    }

    try {
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', partnerId)

      if (error) throw error

      await carregarParceiros()
      alert('Parceiro excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir parceiro:', error)
      alert('Erro ao excluir parceiro')
    }
  }

  const editarParceiro = (partnerId: number) => {
    router.push(`/admin/parceiros/${partnerId}/editar`)
  }

  const verParceiro = (partnerId: number) => {
    router.push(`/admin/parceiros/${partnerId}`)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">Aprovado</span>
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold">Pendente</span>
      case 'rejected':
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">Rejeitado</span>
      default:
        return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-semibold">{status}</span>
    }
  }

  const formatarCNPJ = (cnpj: string) => {
    if (!cnpj) return '-'
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black">Parceiros</h1>
            <p className="text-gray-500 text-sm">Gerencie os parceiros vendedores</p>
          </div>
          <Link
            href="/admin"
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            ← Voltar
          </Link>
        </div>

        {partners.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Store size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhum parceiro cadastrado ainda.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Parceiro</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">CNPJ</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Data</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((partner) => {
                    const profile = profilesMap[partner.user_id]
                    const nomeExibicao = partner.company_name || profile?.full_name || 'Usuário'
                    
                    return (
                      <tr key={partner.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#FFB800]/10 rounded-full flex items-center justify-center">
                              <Users size={18} className="text-[#FFB800]" />
                            </div>
                            <div>
                              <p className="font-medium text-black">
                                {nomeExibicao}
                              </p>
                              <p className="text-sm text-gray-500">
                                {partner.email || profile?.email || 'Sem email'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {formatarCNPJ(partner.cnpj)}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(partner.status)}
                        </td>
                        <td className="p-4 text-sm text-gray-500">
                          {new Date(partner.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {/* 🔥 BOTÃO APROVAR */}
                            {partner.status === 'pending' && (
                              <button
                                onClick={() => atualizarStatus(partner.id, 'approved')}
                                className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition"
                                title="Aprovar"
                              >
                                <Check size={18} />
                              </button>
                            )}
                            
                            {/* 🔥 BOTÃO REJEITAR */}
                            {partner.status === 'pending' && (
                              <button
                                onClick={() => atualizarStatus(partner.id, 'rejected')}
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                                title="Rejeitar"
                              >
                                <X size={18} />
                              </button>
                            )}
                            
                            {/* 🔥 BOTÃO EDITAR */}
                            <button
                              onClick={() => editarParceiro(partner.id)}
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                              title="Editar"
                            >
                              <Edit size={18} />
                            </button>
                            
                            {/* 🔥 BOTÃO VER */}
                            <button
                              onClick={() => verParceiro(partner.id)}
                              className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition"
                              title="Ver detalhes"
                            >
                              <Eye size={18} />
                            </button>
                            
                            {/* 🔥 BOTÃO EXCLUIR */}
                            <button
                              onClick={() => excluirParceiro(partner.id)}
                              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                              title="Excluir"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminParceiros() {
  return (
    <AdminGuard>
      <AdminParceirosContent />
    </AdminGuard>
  )
}