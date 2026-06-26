// app/api/parceiro/cadastro/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, company_name, cnpj, email, phone, address, city, state, zip, description, website } = body

    // Validar dados
    if (!user_id || !company_name || !cnpj || !email) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não preenchidos' },
        { status: 400 }
      )
    }

    // Verificar se já existe parceiro com este CNPJ
    const { data: existing } = await supabase
      .from('partners')
      .select('id')
      .eq('cnpj', cnpj)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Este CNPJ já está cadastrado' },
        { status: 409 }
      )
    }

    // Criar parceiro
    const { data, error } = await supabase
      .from('partners')
      .insert({
        user_id,
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

    if (error) throw error

    return NextResponse.json({
      success: true,
      partner: data,
      message: 'Cadastro enviado com sucesso! Aguarde aprovação.'
    })

  } catch (error) {
    console.error('Erro ao cadastrar parceiro:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao cadastrar' },
      { status: 500 }
    )
  }
}