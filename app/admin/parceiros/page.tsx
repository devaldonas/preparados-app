// app/admin/parceiros/page.tsx (CORRIGIDO)
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import NavBar from '@/components/NavBar'
import { Check, X, RefreshCw } from 'lucide-react'

export default function AdminParceiros() {
  const [partners, setPartners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todos')
  const [message, setMessage] = useState('')

  const carregar = async () => {
    setLoading(true)
    
    // 🔥 QUERY SIMPLES
    let query = supabase.from('partners').select('*').order('created_at', { ascending: false })
    
    if (filter !== 'todos') {
      query = query.eq('status', filter)
    }
    
    const { data, error } = await query
    
    if (!error && data) {
      // Buscar perfis
      const userIds = data.map(p => p.user_id).filter(id => id)
      let profilesMap: Record<string, any> = {}
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .in('id', userIds)
        
        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => ({ ...acc, [p.id]: p }), {})
        }
      }
      
      setPartners(data.map(p => ({
        ...p,
        full_name: profilesMap[p.user_id]?.full_name || 'Não definido'
      })))
    }
    
    setLoading(false)
  }

  useEffect(() => {
    carregar()
  }, [filter])

  const aprovar = async (id: string) => {
    try {
      // 🔥 ATUALIZAR STATUS
      const { error } = await supabase
        .from('partners')
        .update({ 
          status: 'approved', 
          approved_at: new Date().toISOString() 
        })
        .eq('id', id)
      
      if (error) {
        console.error('Erro ao aprovar:', error)
        setMessage('❌ Erro ao aprovar parceiro')
        setTimeout(() => setMessage(''), 3000)
        return
      }

      // 🔥 ATUALIZAR ROLE DO USUÁRIO
      const partner = partners.find(p => p.id === id)
      if (partner?.user_id) {
        await supabase
          .from('profiles')
          .update({ role: 'partner' })
          .eq('id', partner.user_id)
      }

      setMessage('✅ Parceiro aprovado com sucesso!')
      setTimeout(() => setMessage(''), 3000)
      
      // 🔥 RECARREGAR LISTA
      await carregar()
      
    } catch (error) {
      console.error('Erro:', error)
      setMessage('❌ Erro ao aprovar parceiro')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const rejeitar = async (id: string) => {
    try {
      const { error } = await supabase
        .from('partners')
        .update({ 
          status: 'rejected', 
          rejected_at: new Date().toISOString() 
        })
        .eq('id', id)
      
      if (error) {
        console.error('Erro ao rejeitar:', error)
        setMessage('❌ Erro ao rejeitar parceiro')
        setTimeout(() => setMessage(''), 3000)
        return
      }

      setMessage('❌ Parceiro rejeitado com sucesso!')
      setTimeout(() => setMessage(''), 3000)
      
      await carregar()
      
    } catch (error) {
      console.error('Erro:', error)
      setMessage('❌ Erro ao rejeitar parceiro')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const getStatus = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    const labels = {
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  const pendentes = partners.filter(p => p.status === 'pending').length

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <NavBar showBackButton={true} backButtonPath="/admin" />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🤝 Parceiros</h1>
          <button onClick={carregar} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg flex items-center gap-2">
            <RefreshCw size={18} />
            Atualizar
          </button>
        </div>

        {message && (
          <div className={`border px-4 py-3 rounded-lg mb-4 ${
            message.includes('✅') 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter('todos')}
            className={`px-3 py-1 rounded-lg text-sm ${filter === 'todos' ? 'bg-[#FFB800] text-black' : 'bg-gray-200'}`}
          >
            Todos ({partners.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-lg text-sm ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}
          >
            Pendentes ({pendentes})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1 rounded-lg text-sm ${filter === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
          >
            Aprovados ({partners.filter(p => p.status === 'approved').length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1 rounded-lg text-sm ${filter === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
          >
            Rejeitados ({partners.filter(p => p.status === 'rejected').length})
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {partners.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Nenhum parceiro encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Empresa</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Responsável</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {partners.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{p.company_name}</td>
                      <td className="px-4 py-3">{p.full_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{p.email}</td>
                      <td className="px-4 py-3">{getStatus(p.status)}</td>
                      <td className="px-4 py-3">
                        {p.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => aprovar(p.id)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
                              title="Aprovar"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => rejeitar(p.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                              title="Rejeitar"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}