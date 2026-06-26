// app/parceiro/produtos/novo/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import NavBar from '@/components/NavBar'
import { ArrowLeft, Package, Loader2, Check, AlertCircle } from 'lucide-react'

export default function NovoProdutoParceiro() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [partner, setPartner] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [partnerPrice, setPartnerPrice] = useState('')
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

      if (partnerError) {
        router.push('/parceiro/cadastro')
        return
      }

      setPartner(partnerData)

      // Buscar produtos disponíveis (que não estão no catálogo do parceiro)
      const { data: partnerProducts } = await supabase
        .from('partner_products')
        .select('product_id')
        .eq('partner_id', partnerData.id)

      const productIds = partnerProducts?.map(p => p.product_id) || []

      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (productIds.length > 0) {
        query = query.not('id', 'in', `(${productIds.join(',')})`)
      }

      const { data: availableProducts } = await query
      setProducts(availableProducts || [])

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (!selectedProduct || !partnerPrice) {
        setError('Selecione um produto e defina o preço')
        setLoading(false)
        return
      }

      const price = parseFloat(partnerPrice)
      if (isNaN(price) || price <= 0) {
        setError('Preço inválido')
        setLoading(false)
        return
      }

      const commissionRate = partner?.commission_rate || 15
      const commissionAmount = (price * commissionRate) / 100

      const { error: insertError } = await supabase
        .from('partner_products')
        .insert({
          partner_id: partner.id,
          product_id: parseInt(selectedProduct),
          partner_price: price,
          commission: commissionAmount,
          is_active: true
        })

      if (insertError) throw insertError

      setSuccess('Produto adicionado com sucesso!')
      setTimeout(() => {
        router.push('/parceiro/produtos')
      }, 1500)

    } catch (error) {
      console.error('Erro ao adicionar produto:', error)
      setError('Erro ao adicionar produto. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <NavBar showBackButton={true} backButtonPath="/parceiro/produtos" />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/parceiro/produtos"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Adicionar Produto</h1>
            <p className="text-sm text-gray-500">Selecione um produto para vender na loja</p>
          </div>
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

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Produto *
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#FFB800] outline-none"
                required
              >
                <option value="">Selecione um produto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {formatPrice(product.price)}
                  </option>
                ))}
              </select>
              {products.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Todos os produtos já estão adicionados ao seu catálogo.
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
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Comissão: {partner?.commission_rate || 15}% sobre o valor
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <Link
                href="/parceiro/produtos"
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition text-center"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading || products.length === 0}
                className="flex-1 bg-[#FFB800] hover:bg-[#E5A600] text-black py-2 rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  'Adicionar Produto'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}