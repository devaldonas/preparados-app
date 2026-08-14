'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, Truck, CheckCircle, Clock, XCircle, Printer, Send } from 'lucide-react'

interface Pedido {
  id: number
  user_id: string
  total_amount: number
  payment_status: string
  shipping_status: string
  created_at: string
  shipping_address: any
  items: any[]
}

export default function ParceiroPedidoDetalhes({ params }: { params: { id: string } }) {
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const carregarPedido = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: pedidoData, error } = await (supabase
          .from('orders') as any)
          .select(`
            *,
            items:order_items(*, product:products(*))
          `)
          .eq('id', parseInt(params.id))
          .single()

        if (error) throw error
        setPedido(pedidoData)
      } catch (error) {
        console.error('Erro ao carregar pedido:', error)
        router.push('/parceiro/pedidos')
      } finally {
        setLoading(false)
      }
    }

    carregarPedido()
  }, [params.id])

  const atualizarStatus = async (status: string) => {
    if (!pedido) return
    setUpdating(true)

    try {
      const { error } = await (supabase
        .from('orders') as any)
        .update({ shipping_status: status })
        .eq('id', pedido.id)

      if (error) throw error

      setPedido({ ...pedido, shipping_status: status })
      alert(`✅ Status atualizado para: ${status}`)
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string, icon: any, color: string }> = {
      'pendente': { label: 'Pendente', icon: Clock, color: 'bg-gray-100 text-gray-600' },
      'pago': { label: 'Pago', icon: CheckCircle, color: 'bg-yellow-100 text-yellow-700' },
      'enviado': { label: 'Enviado', icon: Truck, color: 'bg-blue-100 text-blue-700' },
      'entregue': { label: 'Entregue', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
      'cancelado': { label: 'Cancelado', icon: XCircle, color: 'bg-red-100 text-red-700' }
    }
    return configs[status] || configs['pendente']
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
        <div className="text-center">
          <p className="text-gray-500">Pedido não encontrado</p>
          <Link href="/parceiro/pedidos" className="text-[#FFB800] hover:underline mt-2 block">
            Voltar
          </Link>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(pedido.shipping_status || 'pendente')
  const StatusIcon = statusConfig.icon

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/parceiro/pedidos"
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-black">Pedido #{pedido.id}</h1>
        </div>

        <div className="space-y-4">
          {/* Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full ${statusConfig.color} flex items-center gap-2`}>
                  <StatusIcon size={16} />
                  {statusConfig.label}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(pedido.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {pedido.shipping_status !== 'entregue' && pedido.shipping_status !== 'cancelado' && (
                  <>
                    {pedido.shipping_status === 'pendente' && (
                      <button
                        onClick={() => atualizarStatus('pago')}
                        disabled={updating}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition disabled:opacity-50"
                      >
                        Marcar como Pago
                      </button>
                    )}
                    {pedido.shipping_status === 'pago' && (
                      <>
                        <button
                          onClick={() => atualizarStatus('enviado')}
                          disabled={updating}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition disabled:opacity-50 flex items-center gap-2"
                        >
                          <Send size={16} />
                          Marcar como Enviado
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition flex items-center gap-2"
                        >
                          <Printer size={16} />
                          Imprimir Etiqueta
                        </button>
                      </>
                    )}
                    {pedido.shipping_status === 'enviado' && (
                      <button
                        onClick={() => atualizarStatus('entregue')}
                        disabled={updating}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition disabled:opacity-50"
                      >
                        Marcar como Entregue
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Itens */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-black mb-4">Itens do Pedido</h2>
            <div className="space-y-3">
              {pedido.items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  {item.product?.image_url && (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-black">{item.product?.name || 'Produto'}</p>
                    <p className="text-sm text-gray-500">Qtd: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-black">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
              <span className="font-medium text-gray-600">Total</span>
              <span className="font-bold text-lg text-black">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.total_amount)}
              </span>
            </div>
          </div>

          {/* Endereço */}
          {pedido.shipping_address && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-black mb-4">Endereço de Entrega</h2>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Rua:</span> {pedido.shipping_address.street}</p>
                <p><span className="font-medium">Número:</span> {pedido.shipping_address.number}</p>
                {pedido.shipping_address.complement && (
                  <p><span className="font-medium">Complemento:</span> {pedido.shipping_address.complement}</p>
                )}
                <p><span className="font-medium">Bairro:</span> {pedido.shipping_address.neighborhood}</p>
                <p><span className="font-medium">Cidade:</span> {pedido.shipping_address.city} - {pedido.shipping_address.state}</p>
                <p><span className="font-medium">CEP:</span> {pedido.shipping_address.cep}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
