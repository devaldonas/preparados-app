// app/api/disasters/notify/route.ts
//
// 🔥 API chamada pelo cron da Vercel a cada 15 minutos.
// Busca alertas críticos (alertLevel === 'red') na API de disasters
// e cria uma notificação para TODOS os usuários.
//
// Anti-duplicata: guarda o ID do evento no metadata da notificação
// e pula se já notificou.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 🔥 Cliente admin (service role) — NÃO usa o cliente público
// porque precisamos inserir notificações para TODOS os usuários,
// e a RLS bloquearia isso.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

interface DisasterEvent {
  id: string
  type: string
  typeCode: string
  title: string
  description: string
  latitude: number
  longitude: number
  alertLevel: 'green' | 'orange' | 'red'
  alertLevelLabel: string
  date: string
  country?: string
  region?: string
  source?: string
}

export async function GET(request: Request) {
  // 🔥 Verificação de segurança: só o cron da Vercel pode chamar
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Em produção, exige o header Authorization da Vercel
  if (process.env.NODE_ENV === 'production' && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  console.log('🚨 [NOTIFY] Iniciando verificação de alertas críticos...')

  try {
    // ============================================================
    // 1. Buscar alertas na API de disasters
    // ============================================================
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://preparados-app.vercel.app'
    const response = await fetch(`${baseUrl}/api/disasters`, {
      headers: { 'Accept': 'application/json' }
    })

    if (!response.ok) {
      throw new Error(`Erro ao buscar disasters: ${response.status}`)
    }

    const data = await response.json()
    const events: DisasterEvent[] = data.events || []

    console.log(`📡 [NOTIFY] ${events.length} eventos recebidos`)

    // ============================================================
    // 2. Filtrar apenas os críticos (red)
    // ============================================================
    const criticos = events.filter(e => e.alertLevel === 'red')

    console.log(`🔴 [NOTIFY] ${criticos.length} eventos críticos`)

    if (criticos.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum alerta crítico no momento',
        total_eventos: events.length,
        criticos: 0
      })
    }

    // ============================================================
    // 3. Buscar TODOS os usuários (para notificar)
    // ============================================================
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id')

    if (usersError || !users) {
      throw new Error(`Erro ao buscar usuários: ${usersError?.message}`)
    }

    console.log(`👥 [NOTIFY] ${users.length} usuários para notificar`)

    // ============================================================
    // 4. Para cada evento crítico, verificar se já notificou
    // ============================================================
    let notificacoesCriadas = 0
    let eventosNovos = 0

    for (const evento of criticos) {
      // Verifica se já existe notificação com esse disaster_id
      const { data: existente } = await supabaseAdmin
        .from('notificacoes')
        .select('id')
        .eq('metadata->>disaster_id', evento.id)
        .limit(1)
        .maybeSingle()

      if (existente) {
        console.log(`⏭️ [NOTIFY] Evento ${evento.id} já notificado, pulando`)
        continue
      }

      eventosNovos++
      console.log(`🆕 [NOTIFY] Notificando evento: ${evento.type} - ${evento.title}`)

      // Monta a mensagem
      const titulo = `🚨 ALERTA CRÍTICO: ${evento.type}`
      const mensagem = evento.title || evento.description || 'Alerta crítico detectado'
      const link = '/catastrofes'

      // Insere notificação para TODOS os usuários (em lote)
      const notificacoes = users.map((u: any) => ({
        usuario_id: u.id,
        titulo,
        mensagem,
        tipo: 'critico',
        lida: false,
        link,
        metadata: {
          disaster_id: evento.id,
          type: evento.type,
          alertLevel: evento.alertLevel,
          source: evento.source,
          latitude: evento.latitude,
          longitude: evento.longitude
        }
      }))

      // Insere em lotes de 500 (limite seguro do Supabase)
      const BATCH_SIZE = 500
      for (let i = 0; i < notificacoes.length; i += BATCH_SIZE) {
        const lote = notificacoes.slice(i, i + BATCH_SIZE)
        const { error: insertError } = await supabaseAdmin
          .from('notificacoes')
          .insert(lote)

        if (insertError) {
          console.error(`❌ [NOTIFY] Erro no lote ${i}:`, insertError)
        } else {
          notificacoesCriadas += lote.length
        }
      }
    }

    console.log(`✅ [NOTIFY] Concluído: ${eventosNovos} eventos novos, ${notificacoesCriadas} notificações criadas`)

    return NextResponse.json({
      success: true,
      total_eventos: events.length,
      criticos: criticos.length,
      eventos_novos: eventosNovos,
      notificacoes_criadas: notificacoesCriadas
    })

  } catch (error) {
    console.error('❌ [NOTIFY] Erro:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
