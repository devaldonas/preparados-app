'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Printer } from 'lucide-react'
import AdminGuard from '@/components/AdminGuard'

interface Order {
  id: number
  user_id: string
  status: string
  total_amount: number
  payment_status: string
  created_at: string
  shipping_address: any
}

function AdminExpedicaoContent() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  useEffect(() => {
    carregarPedidos()
  }, [])

  const carregarPedidos = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders((data as Order[]) || [])
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const atualizarStatus = async (orderId: number, novoStatus: string) => {
    try {
      const { error } = await (supabase
        .from('orders') as any)
        .update({ 
          status: novoStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error
      await carregarPedidos()
      alert('Status atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'paid': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente'
      case 'paid': return 'Pago'
      case 'shipped': return 'Enviado'
      case 'delivered': return 'Entregue'
      case 'cancelled': return 'Cancelado'
      default: return status
    }
  }

  // =====================================================
  // IMPRIMIR ETIQUETA DOS CORREIOS
  // =====================================================
  const imprimirEtiquetaCorreios = (pedido: Order) => {
    if (!pedido) return

    const remetente = {
      nome: 'Preparado Store Ltda',
      cep: '04711130',
      endereco: 'Avenida Doutor Chucri Zaidan',
      numero: '1240',
      complemento: '',
      bairro: 'Vila Cordeiro',
      cidade: 'São Paulo',
      uf: 'SP'
    }

    let destinatario = {
      nome: 'Cliente',
      cep: '00000000',
      endereco: 'Endereço não informado',
      numero: 'S/N',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: ''
    }

    try {
      const addr = typeof pedido.shipping_address === 'string' 
        ? JSON.parse(pedido.shipping_address) 
        : pedido.shipping_address || {}

      destinatario = {
        nome: addr.name || 'Cliente',
        cep: addr.zip || addr.cep || '00000000',
        endereco: addr.street || 'Endereço não informado',
        numero: addr.number || 'S/N',
        complemento: addr.complement || '',
        bairro: addr.neighborhood || '',
        cidade: addr.city || '',
        uf: addr.state || ''
      }
    } catch (e) {
      console.error('Erro ao parsear endereço:', e)
    }

    const observacao = `Pedido #${pedido.id} - ${new Date(pedido.created_at).toLocaleDateString()}`.slice(0, 60)

    const conteudoEtiqueta = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Etiqueta Correios - Pedido #${pedido.id}</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Arial', sans-serif; background: #fff; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
          .etiqueta { width: 9.5cm; background: #fff; border: 1px solid #000; padding: 0.2cm; box-sizing: border-box; }
          .bloco1 { height: 5.5cm; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 0.3cm; position: relative; border: none; }
          .bloco1 .canto { position: absolute; width: 16px; height: 16px; }
          .bloco1 .canto-superior-esquerdo { top: -2px; left: -2px; border-top: 2px solid #000; border-left: 2px solid #000; border-radius: 8px 0 0 0; }
          .bloco1 .canto-superior-direito { top: -2px; right: -2px; border-top: 2px solid #000; border-right: 2px solid #000; border-radius: 0 8px 0 0; }
          .bloco1 .canto-inferior-esquerdo { bottom: -2px; left: -2px; border-bottom: 2px solid #000; border-left: 2px solid #000; border-radius: 0 0 0 8px; }
          .bloco1 .canto-inferior-direito { bottom: -2px; right: -2px; border-bottom: 2px solid #000; border-right: 2px solid #000; border-radius: 0 0 8px 0; }
          .bloco1 .titulo { font-size: 14px; font-weight: bold; letter-spacing: 2px; }
          .bloco1 .subtitulo { font-size: 10px; margin-top: 4px; color: #333; }
          .bloco2 { height: 1cm; display: flex; flex-direction: column; justify-content: center; padding: 0 0.2cm; font-size: 10px; border-bottom: 1px dashed #ccc; }
          .bloco2 .linha { display: flex; align-items: center; gap: 4px; }
          .bloco2 .linha span { white-space: nowrap; }
          .bloco2 .linha .linha-pontilhada { flex: 1; border-bottom: 1px dotted #000; min-width: 30px; }
          .bloco3 { height: 1cm; border: 1px solid #000; padding: 0.1cm 0.2cm; display: flex; flex-direction: column; justify-content: center; }
          .bloco3 .vizinho-titulo { background: #000; color: #fff; font-weight: bold; font-size: 9px; padding: 1px 4px; display: inline-block; letter-spacing: 1px; }
          .bloco3 .vizinho-resposta { font-size: 10px; margin-top: 1px; padding-left: 2px; }
          .bloco4 { height: 4.5cm; border: 1px solid #000; padding: 0.15cm 0.2cm; display: flex; flex-direction: column; justify-content: space-between; position: relative; }
          .bloco4 .logo-correios { position: absolute; top: 0.1cm; right: 0.2cm; width: 1.3cm; height: 0.4cm; font-size: 9px; font-weight: bold; color: #003399; text-align: right; }
          .bloco4 .dest-titulo { background: #000; color: #fff; font-weight: bold; font-size: 9px; padding: 1px 4px; display: inline-block; letter-spacing: 1px; width: fit-content; }
          .bloco4 .dest-linha { font-size: 11px; padding: 1px 0; }
          .bloco4 .codigo-barras { display: flex; align-items: center; gap: 0.3cm; margin-top: 2px; }
          .bloco4 .codigo-barras svg { width: 4.5cm; height: 2cm; border: none !important; }
          .bloco4 .codigo-barras svg text { display: none !important; }
          .bloco4 .observacao { font-size: 8px; color: #555; flex: 1; padding-left: 0.2cm; }
          .bloco5 { height: 1.5cm; padding: 0.1cm 0.2cm; display: flex; flex-direction: column; justify-content: center; border-top: 1px dashed #ccc; }
          .bloco5 .rem-linha { font-size: 9px; padding: 1px 0; }
          @media print { body { padding: 0; background: #fff; } .etiqueta { border: 1px solid #000; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="etiqueta">
          <div class="bloco1">
            <div class="canto canto-superior-esquerdo"></div>
            <div class="canto canto-superior-direito"></div>
            <div class="canto canto-inferior-esquerdo"></div>
            <div class="canto canto-inferior-direito"></div>
            <div class="titulo">USO EXCLUSIVO DOS CORREIOS</div>
            <div class="subtitulo">Cole aqui a etiqueta com o código identificador da encomenda</div>
          </div>
          <div class="bloco2">
            <div class="linha"><span>Recebedor:</span><span class="linha-pontilhada"></span></div>
            <div class="linha"><span>Assinatura:</span><span class="linha-pontilhada" style="flex: 0.6;"></span><span>Documento:</span><span class="linha-pontilhada" style="flex: 0.4;"></span></div>
          </div>
          <div class="bloco3">
            <div class="vizinho-titulo">ENTREGA NO VIZINHO AUTORIZADA?</div>
            <div class="vizinho-resposta">Entrega no vizinho NÃO autorizada</div>
          </div>
          <div class="bloco4">
            <div class="logo-correios">CORREIOS</div>
            <div class="dest-titulo">DESTINATÁRIO</div>
            <div class="dest-linha"><strong>${destinatario.nome}</strong></div>
            <div class="dest-linha">${destinatario.endereco}</div>
            <div class="dest-linha">${destinatario.numero}${destinatario.complemento ? ', ' + destinatario.complemento : ''}</div>
            <div class="dest-linha">${destinatario.bairro}</div>
            <div class="dest-linha">${destinatario.cep}     ${destinatario.cidade}-${destinatario.uf}</div>
            <div class="codigo-barras">
              <svg id="barcode"></svg>
              <div class="observacao"><strong>Obs:</strong> ${observacao}</div>
            </div>
          </div>
          <div class="bloco5">
            <div class="rem-linha"><strong>Remetente:</strong> ${remetente.nome}</div>
            <div class="rem-linha">${remetente.endereco}, ${remetente.numero}${remetente.complemento ? ', ' + remetente.complemento : ''}</div>
            <div class="rem-linha">${remetente.bairro}</div>
            <div class="rem-linha">${remetente.cep}     ${remetente.cidade}-${remetente.uf}</div>
          </div>
        </div>
        <div style="text-align: center; margin-top: 16px;" class="no-print">
          <button onclick="window.print()" style="padding: 10px 30px; background: #FFB800; color: #000; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 16px; margin-right: 12px;">🖨️ Imprimir Etiqueta</button>
          <button onclick="window.close()" style="padding: 10px 30px; background: #333; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">✕ Fechar</button>
        </div>
        <script>
          window.onload = function() {
            try {
              const cep = '${destinatario.cep}'.replace(/\\D/g, '');
              JsBarcode('#barcode', cep || '00000000', {
                format: 'CODE128',
                width: 1.8,
                height: 70,
                displayValue: false,
                fontSize: 0,
                margin: 0,
                background: '#ffffff',
                lineColor: '#000000'
              });
            } catch(e) { console.log('Erro ao gerar código de barras:', e); }
          };
        </script>
      </body>
      </html>
    `

    const novaJanela = window.open('', '_blank', 'width=800,height=900')
    if (novaJanela) {
      novaJanela.document.write(conteudoEtiqueta)
      novaJanela.document.close()
    } else {
      alert('⚠️ Bloqueio de pop-up detectado. Permita pop-ups para imprimir a etiqueta.')
    }
  }

  const filtrarPedidos = () => {
    if (!searchTerm) return orders
    return orders.filter(order => 
      order.id.toString().includes(searchTerm) ||
      order.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const pedidosFiltrados = filtrarPedidos()

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
          <h1 className="text-2xl font-bold text-black">Expedição</h1>
          <Link
            href="/admin"
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            ← Voltar
          </Link>
        </div>

        {/* Busca */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar pedidos por ID ou usuário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
          />
        </div>

        {/* Lista de pedidos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-3">Pedido</th>
                  <th className="text-left p-3">Usuário</th>
                  <th className="text-left p-3">Total</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Data</th>
                  <th className="text-left p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100">
                    <td className="p-3 font-medium">#{order.id}</td>
                    <td className="p-3 text-gray-600 truncate max-w-[150px]">
                      {order.user_id ? (
                        <span className="font-mono text-xs">{order.user_id.slice(0, 8)}...</span>
                      ) : (
                        <span className="text-gray-400">Não informado</span>
                      )}
                    </td>
                    <td className="p-3 text-gray-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
                    </td>
                    <td className="p-3">
                      <select
                        value={order.status || 'pending'}
                        onChange={(e) => atualizarStatus(order.id, e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status || 'pending')}`}
                      >
                        <option value="pending">Pendente</option>
                        <option value="paid">Pago</option>
                        <option value="shipped">Enviado</option>
                        <option value="delivered">Entregue</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </td>
                    <td className="p-3 text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/pedidos/${order.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Detalhes
                        </Link>
                        {order.shipping_address && (
                          <button
                            onClick={() => imprimirEtiquetaCorreios(order)}
                            className="text-[#FFB800] hover:text-[#E5A600] text-sm flex items-center gap-1"
                            title="Imprimir etiqueta dos Correios"
                          >
                            <Printer size={14} />
                            Etiqueta
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {pedidosFiltrados.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum pedido encontrado.
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminExpedicao() {
  return (
    <AdminGuard>
      <AdminExpedicaoContent />
    </AdminGuard>
  )
}
