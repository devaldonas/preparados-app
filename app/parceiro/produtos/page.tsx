// app/parceiro/produtos/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import NavBar from '@/components/NavBar'
import { Package, Plus, Edit, Eye, Trash2, Check, X, AlertCircle, Loader2 } from 'lucide-react'

interface PartnerProduct {
  id: string
  partner_id: string
  product_id: number
  partner_price: number
  commission: number
  is_active: boolean
  created_at: string
  products?: {
    id: number
    name: string
    description: string
    price: number
    image_url: string
    category: string
    stock: number
  }
}

export default function PartnerProdutos() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<PartnerProduct[]>([])
  const [partner, setPartner] = useState<any>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [availableProducts, setAvailableProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [partnerPrice, setPartnerPrice] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Buscar parceiro
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (partnerError || !partnerData) {
        router.push('/parceiro/cadastro')
        return
      }

      setPartner(partnerData)

      // Buscar produtos do parceiro
      const { data: productsData, error: productsError } = await supabase
        .from('partner_products')
        .select(`
          *,
          products:product_id (
            id,
            name,
            description,
            price,
            image_url,
            category,
            stock
          )
        `)
        .eq('partner_id', partnerData.id)
        .order('created_at', { ascending: false })

      if (productsError) {
        console.error('Erro ao carregar produtos:', productsError)
      } else {
        setProducts(productsData || [])
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const carregarProdutosDisponiveis = async () => {
    try {
      // Buscar produtos já vinculados
      const partnerProductIds = products.map(p => p.product_id)
      
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (partnerProductIds.length > 0) {
        query = query.not('id', 'in', `(${partnerProductIds.join(',')})`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao carregar produtos disponíveis:', error)
      } else {
        setAvailableProducts(data || [])
      }
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  const handleOpenAddModal = () => {
    setShowAddModal(true)
    setSelectedProduct('')
    setPartnerPrice('')
    setError('')
    carregarProdutosDisponiveis()
  }

  const handleAddProduct = async () => {
    if (!selectedProduct || !partnerPrice) {
      setError('Selecione um produto e defina o preço')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const price = parseFloat(partnerPrice)
      if (isNaN(price) || price <= 0) {
        setError('Preço inválido')
        setSubmitting(false)
        return
      }

      const commissionRate = partner?.commission_rate || 15
      const commissionAmount = (price * commissionRate) / 100

      const { data, error: insertError } = await supabase
        .from('partner_products')
        .insert({
          partner_id: partner.id,
          product_id: parseInt(selectedProduct),
          partner_price: price,
          commission: commissionAmount,
          is_active: true
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      setSuccess('Produto adicionado com sucesso!')
      setTimeout(() => setSuccess(''), 3000)
      
      setShowAddModal(false)
      carregarDados()

    } catch (error) {
      console.error('Erro ao adicionar produto:', error)
      setError('Erro ao adicionar produto. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('partner_products')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (error) throw error

      setProducts(products.map(p =>
        p.id === productId ? { ...p, is_active: !currentStatus } : p
      ))

    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      setError('Erro ao atualizar status')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleRemoveProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja remover este produto?')) return

    try {
      const { error } = await supabase
        .from('partner_products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      setProducts(products.filter(p => p.id !== productId))
      setSuccess('Produto removido com sucesso!')
      setTimeout(() => setSuccess(''), 3000)

    } catch (error) {
      console.error('Erro ao remover produto:', error)
      setError('Erro ao remover produto')
      setTimeout(() => setError(''), 3000)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
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
      <NavBar showBackButton={true} backButtonPath="/parceiro/dashboard" />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📦 Meus Produtos</h1>
            <p className="text-sm text-gray-500">
              {partner?.company_name || 'Sua empresa'}
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="bg-[#FFB800] hover:bg-[#E5A600] text-black font-display font-bold px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <Plus size={18} />
            Adicionar Produto
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <Check size={18} />
            {success}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {products.length === 0 ? (
            <div className="p-8 text-center">
              <Package size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Nenhum produto adicionado</p>
              <p className="text-sm text-gray-400">
                Clique em "Adicionar Produto" para começar a vender na nossa loja.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                      Preço
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                      Comissão
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
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            <img
                              src={product.products?.image_url || '/images/placeholder.jpg'}
                              alt={product.products?.name}
                              className="w-8 h-8 object-contain"
                              onError={(e) => { e.currentTarget.src = '/images/placeholder.jpg' }}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              {product.products?.name || `Produto ${product.product_id}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {product.products?.category || 'Sem categoria'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-display font-bold text-[#FFB800]">
                          {formatPrice(product.partner_price)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900">
                          {formatPrice(product.commission)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStatus(product.id, product.is_active)}
                          className={`px-2 py-1 rounded-full text-xs font-medium transition ${
                            product.is_active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {product.is_active ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">
                          {formatDate(product.created_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRemoveProduct(product.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Remover"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-500">
          Total: {products.length} produtos
        </div>
      </div>

      {/* Modal Adicionar Produto */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Adicionar Produto</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Produto *
                  </label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#FFB800] outline-none"
                  >
                    <option value="">Selecione um produto</option>
                    {availableProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {formatPrice(product.price)}
                      </option>
                    ))}
                  </select>
                  {availableProducts.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Todos os produtos já estão adicionados.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço do Parceiro (R$) *
                  </label>
                  <input
                    type="number"
                    value={partnerPrice}
                    onChange={(e) => setPartnerPrice(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#FFB800] outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Comissão: {partner?.commission_rate || 15}% sobre o valor
                  </p>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddProduct}
                    disabled={submitting}
                    className="flex-1 bg-[#FFB800] text-black py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Adicionando...
                      </>
                    ) : (
                      'Adicionar'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}