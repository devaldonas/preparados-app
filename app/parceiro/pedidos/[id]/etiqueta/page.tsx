'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer, Download, Truck, Package, User, MapPin, Phone, Mail } from 'lucide-react'

interface Pedido {
  id: number
  user_id: string
  total_amount: number
  shipping_status: string
  created_at: string
  shipping_address: {
    name: string
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    cep: string
    phone?: string
    email?: string
  }
  items: any[]
}

export default function GerarEtiqueta({ params }: { params: { id: string } }) {
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [parceiro, setParceiro] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const etiquetaRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Buscar pedido
        const { data: pedidoData } = await (supabase
          .from('orders') as any)
          .select(`
            *,
            items:order_items(*, product:products(*))
          `)
          .eq('id', parseInt(params.id))
          .single()

        if (pedidoData) {
          setPedido(pedidoData)
        }

        // Buscar dados do parceiro logado
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: partnerData } = await (supabase
            .from('partners') as any)
            .select('*')
            .eq('user_id', user.id)
            .single()
          
          setParceiro(partnerData)
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        router.push('/parceiro/pedidos')
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [params.id])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    )
  }

  if (!pedido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Pedido não encontrado</p>
      </div>
    )
  }

  const endereco = pedido.shipping_address || {
    name: 'Cliente',
    street: 'Rua Exemplo',
    number: '123',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    cep: '00000-000'
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/parceiro/pedidos/${pedido.id}`}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-black">Etiqueta de Envio</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {/* Etiqueta - Modelo Correios */}
          <div ref={etiquetaRef} className="border-2 border-gray-300 rounded-lg p-6 mb-6 bg-white" id="etiqueta">
            {/* Cabeçalho */}
            <div className="text-center border-b border-gray-200 pb-4 mb-4">
              <h2 className="text-xl font-bold text-[#FFB800]">PREPARADO</h2>
              <p className="text-sm text-gray-500">Etiqueta de Envio - Correios</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Remetente */}
              <div className="border-r border-gray-200 pr-6">
                <div className="flex items-center gap-2 mb-2">
                  <Package size={18} className="text-gray-500" />
                  <h3 className="font-semibold text-gray-700 text-sm">Remetente</h3>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{parceiro?.company_name || 'Parceiro'}</p>
                  <p className="text-gray-600">{parceiro?.address || 'Endereço do parceiro'}</p>
                  <p className="text-gray-600">
                    {parceiro?.city || 'Cidade'} - {parceiro?.state || 'UF'}
                  </p>
                  <p className="text-gray-600">CEP: {parceiro?.zip || '00000-000'}</p>
                  <p className="text-gray-600">CNPJ: {parceiro?.cnpj || '00.000.000/0000-00'}</p>
                  <p className="text-gray-600">Tel: {parceiro?.phone || '(00) 0000-0000'}</p>
                </div>
              </div>

              {/* Destinatário */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User size={18} className="text-gray-500" />
                  <h3 className="font-semibold text-gray-700 text-sm">Destinatário</h3>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{endereco.name || 'Cliente'}</p>
                  <p className="text-gray-600">{endereco.street || 'Rua'}, {endereco.number || 'Nº'}</p>
                  {endereco.complement && (
                    <p className="text-gray-600">Complemento: {endereco.complement}</p>
                  )}
                  <p className="text-gray-600">{endereco.neighborhood || 'Bairro'}</p>
                  <p className="text-gray-600">
                    {endereco.city || 'Cidade'} - {endereco.state || 'UF'}
                  </p>
                  <p className="text-gray-600 font-medium">CEP: {endereco.cep || '00000-000'}</p>
                  {endereco.phone && (
                    <p className="text-gray-600">Tel: {endereco.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Informações do Pedido */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Pedido</p>
                  <p className="font-medium text-sm">#{pedido.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Data</p>
                  <p className="font-medium text-sm">
                    {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Itens</p>
                  <p className="font-medium text-sm">{pedido.items?.length || 0}</p>
                </div>
              </div>
            </div>

            {/* Itens (opcional) */}
            {pedido.items && pedido.items.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Itens do Pedido</p>
                <div className="space-y-1">
                  {pedido.items.map((item: any, index: number) => (
                    <p key={index} className="text-sm text-gray-600">
                      {item.product?.name || 'Produto'} x {item.quantity}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Código de Barras (simulado) */}
            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <div className="inline-block bg-gray-100 px-6 py-2 rounded">
                <div className="flex items-center gap-2 justify-center">
                  <div className="h-8 w-48 bg-black/10 rounded flex items-center justify-center">
                    <span className="text-xs font-mono text-gray-600">||| || ||| ||| || |||| || |||</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">Código de rastreio: PREP-{String(pedido.id).padStart(6, '0')}</p>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handlePrint}
              className="flex-1 bg-[#FFB800] text-black py-3 rounded-lg font-semibold hover:bg-[#E5A600] transition flex items-center justify-center gap-2"
            >
              <Printer size={18} />
              Imprimir Etiqueta
            </button>
            <button
              onClick={() => window.location.href = `/parceiro/pedidos/${pedido.id}`}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              Voltar ao Pedido
            </button>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">
              ⚠️ Esta etiqueta é um modelo padrão. Para integração real com os Correios, 
              é necessário contrato e credenciais.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
