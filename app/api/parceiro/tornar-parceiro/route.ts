import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, companyName, cnpj, phone, address, city, state, zip, description, website } = body

    console.log('📥 Tornando usuário parceiro:', { userId, companyName, cnpj })

    if (!userId || !companyName || !cnpj) {
      return NextResponse.json(
        { success: false, error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // 🔥 1. Verificar se o usuário já é parceiro
    const { data: existingPartner } = await supabase
      .from('partners')
      .select('id, status')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingPartner) {
      return NextResponse.json(
        {
          success: false,
          error: 'Você já é um parceiro cadastrado.',
          partner: existingPartner
        },
        { status: 400 }
      )
    }

    // 🔥 2. Atualizar o role do usuário para 'partner'
    const { error: roleError } = await supabase
      .from('profiles')
      .update({ role: 'partner', updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (roleError) {
      console.error('❌ Erro ao atualizar role:', roleError)
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar perfil' },
        { status: 500 }
      )
    }

    // 🔥 3. Criar o registro na tabela partners
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .insert([{
        user_id: userId,
        company_name: companyName,
        cnpj: cnpj.replace(/\D/g, ''),
        phone: phone || '',
        email: '',
        address: address || '',
        city: city || '',
        state: state || '',
        zip: zip || '',
        description: description || '',
        website: website || '',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (partnerError) {
      console.error('❌ Erro ao criar parceiro:', partnerError)
      return NextResponse.json(
        { success: false, error: 'Erro ao criar cadastro de parceiro' },
        { status: 500 }
      )
    }

    console.log('✅ Parceiro criado:', partner.id)

    return NextResponse.json({
      success: true,
      partner,
      message: 'Cadastro de parceiro enviado para aprovação!'
    })

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
