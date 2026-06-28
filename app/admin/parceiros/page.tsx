// app/admin/parceiros/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import { 
  Search, 
  Check, 
  X, 
  AlertCircle, 
  Store, 
  User, 
  Mail, 
  MapPin, 
  Calendar,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'

interface Partner {
  id: string
  user_id: string
  company_name: string
  cnpj: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  description: string
  website: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  user_name?: string
}

export default function AdminParceiros() {
  const router = useRouter()
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    carregarParceiros()
  }, [])

  const carregarParceiros = async () => {
    try {
      // Buscar parceiros
      const { data: partnersData, error: partnersError } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false })

      if (partnersError) throw partnersError

      // Buscar nomes dos usuários
      const partnersWithNames = await Promise.all(
        (partnersData || []).map(async (partner) => {
          if (partner.user_id) {
            const { data: userData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', partner.user_id)
              .single()
            
            return {
              ...partner,
              user_name: userData?.full_name || 'Usuário não encontrado'
            }
          }
          return { ...partner, user_name: 'Usuário não encontrado' }
        })
      )

      setPartners(partnersWithNames)
    } catch (error) {
      console.error('Erro ao carregar parceiros:', error)
      setErrorMessage('Erro ao carregar parceiros')
    } finally {
      setLoading(false)
    }
  }

  const atualizarStatus = async (partnerId: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
    setUpdating(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const updateData: any = {
        status: status,
        updated_at: new Date().toISOString()
      }

      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString()
      } else if (status === 'rejected') {
        updateData.rejected_at = new Date().toISOString()
        updateData.rejection_reason = rejectionReason || ''
      }

      const { error } = await supabase
        .from('partners')
        .update(updateData)
        .eq('id', partnerId)

      if (error) throw error

      // Atualizar lista
      setPartners(partners.map(p =>
        p.id === partnerId ? { ...p, status: status } : p
      ))

      setSuccessMessage(`Parceiro ${status === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso!`)
      setTimeout(() => setSuccessMessage(''), 3000)

      setShowModal(false)
      setSelectedPartner(null)

    } catch (error) {
      console.error('Erro ao atualizar:', error)
      setErrorMessage('Erro ao atualizar status')
    } finally {
      setUpdating(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; icon: any; color: string }> = {
      pending: { label: 'Pendente', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
      approved: { label: 'Aprovado', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
      rejected: { label: 'Rejeitado', icon: XCircle, color: 'text-red-600 bg-red-50' }
    }
    const info = map[status] || map.pending
    const Icon = info.icon
    return (
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${info.color}`}>
        <Icon size={14} />
        {info.label}
      </div>
    )
  }

  // Filtrar parceiros
  const filteredPartners = partners.filter(partner => {
    const matchSearch = 
      partner.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.cnpj?.includes(searchTerm) ||
      partner.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchStatus = filterStatus === 'todos' || partner.status === filterStatus
    
    return matchSearch && matchStatus
  })

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
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🏪 Gerenciar Parceiros</h1>
            <p className="text-gray-500 text-sm">Aprove ou rejeite solicitações de parceiros vendedores</p>
          </div>
          <button
            onClick={carregarParceiros}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-display font-bold px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Atualizar
          </button>
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
                  placeholder="Buscar por empresa, email, CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#FFB800] outline-none"
                />
              </div>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#FFB800] outline-none"
            >
              <option value="todos">Todos os status</option>
              <option value="pending">Pendentes</option>
              <option value="approved">Aprovados</option>
              <option value="rejected">Rejeitados</option>
            </select>
          </div>
        </div>

        {/* Tabela de Parceiros */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                    Responsável
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                    CNPJ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPartners.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Nenhum parceiro encontrado
                    </td>
                  </tr>
                ) : (
                  filteredPartners.map((partner) => (
                    <tr key={partner.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Store size={20} className="text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              {partner.company_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {partner.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-700">
                            {partner.user_name || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 font-mono">
                          {partner.cnpj}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(partner.status)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">
                          {formatDate(partner.created_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelectedPartner(partner)
                            setShowModal(true)
                          }}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Ver detalhes"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          Total: {filteredPartners.length} parceiros
          {searchTerm && ` (filtrados de ${partners.length})`}
        </div>
      </div>

      {/* Modal de Detalhes do Parceiro */}
      {showModal && selectedPartner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedPartner.company_name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedPartner.status === 'pending' ? 'Aguardando aprovação' : 
                     selectedPartner.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedPartner(null)
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Informações do parceiro */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-display font-bold text-gray-900 text-sm mb-3">Informações da Empresa</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Nome</span>
                      <span className="text-gray-900 font-medium">{selectedPartner.company_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">CNPJ</span>
                      <span className="text-gray-900 font-mono">{selectedPartner.cnpj}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">E-mail</span>
                      <span className="text-gray-900">{selectedPartner.email}</span>
                    </div>
                    {selectedPartner.phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Telefone</span>
                        <span className="text-gray-900">{selectedPartner.phone}</span>
                      </div>
                    )}
                    {selectedPartner.website && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Website</span>
                        <a href={selectedPartner.website} target="_blank" rel="noopener noreferrer" className="text-[#FFB800] hover:underline">
                          {selectedPartner.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Endereço */}
                {selectedPartner.address && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-display font-bold text-gray-900 text-sm mb-3">Endereço</h3>
                    <p className="text-sm text-gray-700">
                      {selectedPartner.address}
                      {selectedPartner.city && `, ${selectedPartner.city}`}
                      {selectedPartner.state && `/${selectedPartner.state}`}
                      {selectedPartner.zip && ` - CEP: ${selectedPartner.zip}`}
                    </p>
                  </div>
                )}

                {/* Descrição */}
                {selectedPartner.description && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-display font-bold text-gray-900 text-sm mb-3">Descrição</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {selectedPartner.description}
                    </p>
                  </div>
                )}

                {/* Ações - apenas se estiver pendente */}
                {selectedPartner.status === 'pending' && (
                  <div className="border-t border-gray-100 pt-4">
                    <h3 className="font-display font-bold text-gray-900 text-sm mb-3">Aprovar ou Rejeitar</h3>
                    <div className="flex gap-3">
                      <button
                        onClick={() => atualizarStatus(selectedPartner.id, 'approved')}
                        disabled={updating}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <Check size={18} />
                        Aprovar
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Motivo da rejeição (opcional):')
                          if (reason !== null) {
                            atualizarStatus(selectedPartner.id, 'rejected', reason)
                          }
                        }}
                        disabled={updating}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <X size={18} />
                        Rejeitar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}