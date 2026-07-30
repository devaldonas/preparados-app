import { supabase } from './supabaseClient'

// 🔥 Opção 1: Usar Resend (recomendado)
export async function enviarEmailResend({
  to,
  subject,
  html,
  from = 'PREPARADO <onboarding@resend.dev>'
}: {
  to: string
  subject: string
  html: string
  from?: string
}) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY

  console.log('📧📧📧 enviarEmailResend FOI CHAMADA!')
  console.log('📧 Para:', to)
  console.log('📧 Assunto:', subject)
  console.log('🔑 RESEND_API_KEY existe?', !!RESEND_API_KEY)

  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY não configurada')
    return { error: 'API de e-mail não configurada' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Erro ao enviar e-mail:', data)
      return { error: data.message || 'Erro ao enviar e-mail' }
    }

    console.log('✅ E-mail enviado com sucesso! ID:', data.id)
    return { success: true, id: data.id }

  } catch (error) {
    console.error('❌ Erro ao enviar e-mail:', error)
    return { error: 'Erro ao enviar e-mail' }
  }
}

// 🔥 Função para enviar e-book
export async function enviarEbookPorEmail({
  email,
  nome,
  produtoNome,
  fileUrl,
  pedidoId
}: {
  email: string
  nome: string
  produtoNome: string
  fileUrl: string
  pedidoId: number
}) {
  console.log('📧📧📧 enviarEbookPorEmail FOI CHAMADA!')
  console.log('📧 Para:', email)
  console.log('📧 Nome:', nome)
  console.log('📧 Produto:', produtoNome)
  console.log('📧 Link:', fileUrl)
  console.log('📧 Pedido:', pedidoId)

  // 🔥 VERIFICAR SE O E-MAIL É VÁLIDO
  if (!email || email === 'cliente@preparado.com') {
    console.error('❌ E-mail inválido ou fallback:', email)
    return { error: 'E-mail inválido' }
  }

  // 🔥 DATA CORRIGIDA (BRASÍLIA - UTC-3)
  const dataCorrigida = new Date()
  dataCorrigida.setHours(dataCorrigida.getHours() - 3)
  const dataFormatada = dataCorrigida.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #FFB800; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: #000; margin: 0; font-size: 24px; }
        .content { background: #fff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #FFB800; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .button:hover { background: #E5A600; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; }
        .info { background: #f5f5f5; padding: 15px; border-radius: 6px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PREPARADO</h1>
      </div>
      <div class="content">
        <h2>Olá, ${nome || 'Cliente'}!</h2>
        <p>Parabéns pela sua compra do e-book <strong>"${produtoNome}"</strong>!</p>
        
        <p>Seu pedido foi confirmado e agora você pode baixar seu e-book clicando no botão abaixo:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${fileUrl}" class="button">Baixar E-book</a>
        </div>
        
        <div class="info">
          <p><strong> Detalhes do pedido:</strong></p>
          <p>Pedido #${pedidoId}</p>
          <p>Data: ${dataFormatada}</p>
          <p>E-mail: ${email}</p>
        </div>
        
        <p><strong>Importante:</strong></p>
        <ul style="color: #666; font-size: 14px;">
          <li>O link é válido por 30 dias.</li>
          <li>Não compartilhe este link com outras pessoas.</li>
          <li>Se tiver problemas para baixar, entre em contato com nosso suporte.</li>
        </ul>
        
        <p style="margin-top: 30px;">
          Agradecemos pela sua compra e esperamos que o conteúdo seja útil para sua preparação!
        </p>
        
        <p>Com ,<br><strong>Equipe PREPARADO</strong></p>
      </div>
      <div class="footer">
        <p>Este e-mail foi enviado automaticamente. Por favor, não responda.</p>
        <p>PREPARADO - Sua preparação para emergências</p>
      </div>
    </body>
    </html>
  `

  return enviarEmailResend({
    to: email,
    subject: `📚 Seu e-book "${produtoNome}" chegou! - PREPARADO`,
    html
  })
}