'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer, Download, Truck } from 'lucide-react'

export default function GerarEtiqueta({ params }: { params: { id: string } }) {
  const [pedido, setPedido] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const carregarPedido = async () => {
      try {
        const { data: pedidoData } = await (supabase
          .from('orders') as any)
          .select('*')
          .eq('id', parseInt(params.id))
          .single()

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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {/* Etiqueta */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6" id="etiqueta">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-black">PREPARADO</h2>
              <p className="text-sm text-gray-500">Etiqueta de Envio</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Destinatário</p>
                <p className="font-medium">{pedido.shipping_address?.name || 'Cliente'}</p>
                <p className="text-sm text-gray-600">{pedido.shipping_address?.street}</p>
                <p className="text-sm text-gray-600">{pedido.shipping_address?.number}</p>
                {pedido.shipping_address?.complement && (
                  <p className="text-sm text-gray-600">{pedido.shipping_address?.complement}</p>
                )}
                <p className="text-sm text-gray-600">{pedido.shipping_address?.neighborhood}</p>
                <p className="text-sm text-gray-600">
                  {pedido.shipping_address?.city} - {pedido.shipping_address?.state}
                </p>
                <p className="text-sm text-gray-600">CEP: {pedido.shipping_address?.cep}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Remetente</p>
                <p className="font-medium">Parceiro Preparado</p>
                <p className="text-sm text-gray-600">Endereço do parceiro</p>
                <p className="text-sm text-gray-600">Cidade - UF</p>
                <p className="text-sm text-gray-600">CEP: 00000-000</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pedido</p>
                  <p className="font-medium">#{pedido.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data</p>
                  <p className="font-medium">{new Date(pedido.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Itens</p>
                  <p className="font-medium">{pedido.items?.length || 0}</p>
                </div>
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
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Voltar ao Pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
