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
  status: string
  created_at: string
  shipping_address: any
  items: any[]
}

export default function ParceiroPedidoDetalhes({ params }: { params: Promise<{ id: string }> }) {
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const carregarPedido = async () => {
      try {
        const resolvedParams = await params
        const orderId = resolvedParams.id
        
        if (!orderId) {
          router.push('/parceiro/pedidos')
          return
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: pedidoData, error } = await (supabase
          .from('orders') as any)
          .select(`
            *,
            items:order_items(
              *,
              product:products(*)
            )
          `)
          .eq('id', parseInt(orderId))
          .single()

        if (error) {
          console.error('❌ Erro ao carregar pedido:', error)
          router.push('/parceiro/pedidos')
          return
        }

        setPedido(pedidoData)
      } catch (error) {
        console.error('❌ Erro ao carregar pedido:', error)
        router.push('/parceiro/pedidos')
      } finally {
        setLoading(false)
      }
    }

    carregarPedido()
  }, [params, router])

  // 🔥 FUNÇÃO CORRIGIDA - USA API ROUTE
  const atualizarStatus = async (novoStatus: string) => {
    if (!pedido) return
    setUpdating(true)

    try {
      console.log(`📤 Atualizando pedido #${pedido.id} para status: ${novoStatus}`)
      
      // 🔥 Chamar a API route em vez do Supabase diretamente
      const response = await fetch(`/api/parceiro/pedidos/${pedido.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: novoStatus })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar status')
      }

      console.log('✅ Status atualizado com sucesso:', data)

      const statusLabels: Record<string, string> = {
        'pending': 'Pendente',
        'paid': 'Pago',
        'shipped': 'Enviado',
        'delivered': 'Entregue',
        'cancelled': 'Cancelado'
      }
      
      alert(`✅ Pedido #${pedido.id} marcado como ${statusLabels[novoStatus] || novoStatus}!`)
      
      // 🔥 Atualizar o estado local
      setPedido({ ...pedido, status: novoStatus })
      
      // 🔥 Redirecionar para a lista
      setTimeout(() => {
        router.push('/parceiro/pedidos')
      }, 1000)
      
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error)
      alert(`Erro ao atualizar status: ${error instanceof Error ? error.message : 'Tente novamente'}`)
    } finally {
      setUpdating(false)
    }
  }

  const imprimirEtiquetaCorreios = (pedido: Pedido) => {
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

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string, icon: any, color: string }> = {
      'pending': { label: 'Pendente', icon: Clock, color: 'bg-gray-100 text-gray-600' },
      'paid': { label: 'Pago', icon: CheckCircle, color: 'bg-yellow-100 text-yellow-700' },
      'shipped': { label: 'Enviado', icon: Truck, color: 'bg-blue-100 text-blue-700' },
      'delivered': { label: 'Entregue', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
      'cancelled': { label: 'Cancelado', icon: XCircle, color: 'bg-red-100 text-red-700' }
    }
    return configs[status] || configs['pending']
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
          <Link href="/parceiro/pedidos" className="text-[#FFB800] hover:underline mt-2 block">Voltar</Link>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(pedido.status || 'pending')
  const StatusIcon = statusConfig.icon

  let endereco = {}
  try {
    endereco = typeof pedido.shipping_address === 'string' 
      ? JSON.parse(pedido.shipping_address) 
      : pedido.shipping_address || {}
  } catch (e) {}

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/parceiro/pedidos" className="p-2 hover:bg-gray-200 rounded-lg transition">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-black">Pedido #{pedido.id}</h1>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full ${statusConfig.color} flex items-center gap-2`}>
                  <StatusIcon size={16} /> {statusConfig.label}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(pedido.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {pedido.status !== 'delivered' && pedido.status !== 'cancelled' && (
                  <>
                    {pedido.status === 'pending' && (
                      <button 
                        onClick={() => atualizarStatus('paid')} 
                        disabled={updating}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition disabled:opacity-50"
                      >
                        {updating ? 'Atualizando...' : 'Marcar como Pago'}
                      </button>
                    )}
                    {pedido.status === 'paid' && (
                      <>
                        <button onClick={() => atualizarStatus('shipped')} disabled={updating}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition disabled:opacity-50 flex items-center gap-2">
                          <Send size={16} /> Marcar como Enviado
                        </button>
                        <button onClick={() => imprimirEtiquetaCorreios(pedido)}
                          className="px-4 py-2 bg-[#FFB800] text-black rounded-lg text-sm font-medium hover:bg-[#E5A600] transition flex items-center gap-2">
                          <Printer size={16} /> Imprimir Etiqueta
                        </button>
                      </>
                    )}
                    {pedido.status === 'shipped' && (
                      <button onClick={() => atualizarStatus('delivered')} disabled={updating}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition disabled:opacity-50">
                        Marcar como Entregue
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-black mb-4">Itens do Pedido</h2>
            <div className="space-y-3">
              {pedido.items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  {item.product?.image_url && (
                    <img src={item.product.image_url} alt={item.product.name} className="w-16 h-16 object-cover rounded-lg" />
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

          {pedido.shipping_address && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-black mb-4">Endereço de Entrega</h2>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Nome:</span> {(endereco as any).name || 'Cliente'}</p>
                <p><span className="font-medium">Rua:</span> {(endereco as any).street || 'Endereço não informado'}</p>
                <p><span className="font-medium">Número:</span> {(endereco as any).number || 'S/N'}</p>
                {(endereco as any).complement && (
                  <p><span className="font-medium">Complemento:</span> {(endereco as any).complement}</p>
                )}
                <p><span className="font-medium">Bairro:</span> {(endereco as any).neighborhood || ''}</p>
                <p><span className="font-medium">Cidade:</span> {(endereco as any).city || ''} - {(endereco as any).state || ''}</p>
                <p><span className="font-medium">CEP:</span> {(endereco as any).zip || (endereco as any).cep || 'Não informado'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
