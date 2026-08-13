// app/api/parceiro/comissoes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// Listar comissões do parceiro
export async function GET(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // 🔥 CORRIGIDO: buscar parceiro com as any
    const { data: partner, error: partnerError } = await (supabase
      .from('partners') as any)
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (partnerError || !partner) {
      return NextResponse.json(
        { error: 'Parceiro não encontrado' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // 🔥 CORRIGIDO: query com as any
    let query = (supabase
      .from('partner_commissions') as any)
      .select(`
        *,
        products:product_id (
          name,
          price
        ),
        orders:order_id (
          id,
          created_at
        )
      `)
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: commissions, error: commissionsError } = await query

    if (commissionsError) {
      throw commissionsError
    }

    // Calcular resumo
    const total = commissions?.length || 0
    const pending = commissions?.filter((c: any) => c.status === 'pending').length || 0
    const paid = commissions?.filter((c: any) => c.status === 'paid').length || 0
    const totalAmount = commissions?.reduce((sum: number, c: any) => sum + (c.commission_amount || 0), 0) || 0
    const pendingAmount = commissions?.filter((c: any) => c.status === 'pending')
      .reduce((sum: number, c: any) => sum + (c.commission_amount || 0), 0) || 0

    return NextResponse.json({
      success: true,
      commissions: commissions || [],
      summary: {
        total,
        pending,
        paid,
        totalAmount,
        pendingAmount
      }
    })

  } catch (error) {
    console.error('Erro ao listar comissões:', error)
    return NextResponse.json(
      { error: 'Erro ao listar comissões' },
      { status: 500 }
    )
  }
}

// Registrar comissão (admin)
export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // 🔥 CORRIGIDO: verificar admin com as any
    const { data: profile } = await (supabase
      .from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      partner_id, 
      order_id, 
      product_id, 
      amount, 
      commission_rate, 
      commission_amount 
    } = body

    // Validar dados
    if (!partner_id || !order_id || !product_id || !amount) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // 🔥 CORRIGIDO: verificar parceiro com as any
    const { data: partner, error: partnerError } = await (supabase
      .from('partners') as any)
      .select('id')
      .eq('id', partner_id)
      .maybeSingle()

    if (partnerError || !partner) {
      return NextResponse.json(
        { error: 'Parceiro não encontrado' },
        { status: 404 }
      )
    }

    // 🔥 CORRIGIDO: verificar pedido com as any
    const { data: order, error: orderError } = await (supabase
      .from('orders') as any)
      .select('id')
      .eq('id', order_id)
      .maybeSingle()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    // Calcular comissão
    let finalCommissionAmount = commission_amount
    let finalCommissionRate = commission_rate

    if (!finalCommissionAmount) {
      const rate = finalCommissionRate || 15
      finalCommissionAmount = (amount * rate) / 100
    }

    // 🔥 CORRIGIDO: registrar comissão com as any
    const { data: commission, error: insertError } = await (supabase
      .from('partner_commissions') as any)
      .insert({
        partner_id,
        order_id,
        product_id,
        amount,
        commission_rate: finalCommissionRate || 15,
        commission_amount: finalCommissionAmount,
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({
      success: true,
      commission: commission,
      message: 'Comissão registrada com sucesso!'
    })

  } catch (error) {
    console.error('Erro ao registrar comissão:', error)
    return NextResponse.json(
      { error: 'Erro ao registrar comissão' },
      { status: 500 }
    )
  }
}

// Atualizar comissão (admin)
export async function PUT(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // 🔥 CORRIGIDO: verificar admin com as any
    const { data: profile } = await (supabase
      .from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      id, 
      status,
      paid_at
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID da comissão é obrigatório' },
        { status: 400 }
      )
    }

    // 🔥 CORRIGIDO: verificar comissão com as any
    const { data: existing, error: existingError } = await (supabase
      .from('partner_commissions') as any)
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (existingError || !existing) {
      return NextResponse.json(
        { error: 'Comissão não encontrada' },
        { status: 404 }
      )
    }

    // Preparar dados para atualização
    const updatePayload: any = {
      updated_at: new Date().toISOString()
    }

    if (status) {
      updatePayload.status = status
      if (status === 'paid') {
        updatePayload.paid_at = paid_at || new Date().toISOString()
      }
    }

    // 🔥 CORRIGIDO: atualizar comissão com as any
    const { data: commission, error: updateError } = await (supabase
      .from('partner_commissions') as any)
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      commission: commission,
      message: 'Comissão atualizada com sucesso!'
    })

  } catch (error) {
    console.error('Erro ao atualizar comissão:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar comissão' },
      { status: 500 }
    )
  }
}