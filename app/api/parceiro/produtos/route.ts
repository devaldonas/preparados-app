// app/api/parceiros/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// Listar parceiros (admin)
export async function GET(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('partners')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: partners, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      partners: partners || []
    })

  } catch (error) {
    console.error('Erro ao listar parceiros:', error)
    return NextResponse.json(
      { error: 'Erro ao listar parceiros' },
      { status: 500 }
    )
  }
}

// Criar parceiro (usuário comum)
export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      company_name, 
      cnpj, 
      email, 
      phone, 
      address, 
      city, 
      state, 
      zip, 
      description, 
      website 
    } = body

    // Validar dados obrigatórios
    if (!company_name || !cnpj || !email) {
      return NextResponse.json(
        { error: 'Nome da empresa, CNPJ e email são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se já é parceiro
    const { data: existing, error: existingError } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Você já possui um cadastro como parceiro' },
        { status: 409 }
      )
    }

    // Verificar se o CNPJ já está cadastrado
    const { data: existingCnpj } = await supabase
      .from('partners')
      .select('id')
      .eq('cnpj', cnpj)
      .single()

    if (existingCnpj) {
      return NextResponse.json(
        { error: 'Este CNPJ já está cadastrado' },
        { status: 409 }
      )
    }

    // Criar parceiro
    const { data: partner, error: insertError } = await supabase
      .from('partners')
      .insert({
        user_id: user.id,
        company_name,
        cnpj,
        email,
        phone,
        address,
        city,
        state,
        zip,
        description,
        website,
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({
      success: true,
      partner: partner,
      message: 'Cadastro enviado com sucesso! Aguarde aprovação.'
    })

  } catch (error) {
    console.error('Erro ao criar parceiro:', error)
    return NextResponse.json(
      { error: 'Erro ao criar parceiro' },
      { status: 500 }
    )
  }
}

// Atualizar parceiro (admin)
export async function PUT(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

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
      rejection_reason,
      commission_rate,
      ...updateData 
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID do parceiro é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se parceiro existe
    const { data: existing, error: existingError } = await supabase
      .from('partners')
      .select('id')
      .eq('id', id)
      .single()

    if (existingError || !existing) {
      return NextResponse.json(
        { error: 'Parceiro não encontrado' },
        { status: 404 }
      )
    }

    // Preparar dados para atualização
    const updatePayload: any = {
      ...updateData,
      updated_at: new Date().toISOString()
    }

    if (status) {
      updatePayload.status = status
      if (status === 'approved') {
        updatePayload.approved_at = new Date().toISOString()
      } else if (status === 'rejected') {
        updatePayload.rejected_at = new Date().toISOString()
        updatePayload.rejection_reason = rejection_reason || ''
      }
    }

    if (commission_rate) {
      updatePayload.commission_rate = commission_rate
    }

    const { data: partner, error: updateError } = await supabase
      .from('partners')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      partner: partner,
      message: 'Parceiro atualizado com sucesso!'
    })

  } catch (error) {
    console.error('Erro ao atualizar parceiro:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar parceiro' },
      { status: 500 }
    )
  }
}