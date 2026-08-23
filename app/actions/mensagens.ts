'use server'

import { supabase } from '@/lib/supabaseClient'
import { createClient } from '@/lib/supabaseServer'

export async function enviarMensagemGrupo(groupId: number, userId: string, userName: string, content: string) {
  try {
    // Inserir mensagem
    const { data: message, error } = await supabase
      .from('group_messages')
      .insert({
        group_id: groupId,
        user_id: userId,
        user_name: userName,
        content: content
      })
      .select()
      .single()

    if (error) throw error

    // As notificações são criadas automaticamente pela trigger do banco
    return { success: true, message }
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    return { success: false, error }
  }
}

export async function enviarMensagemPrivada(senderId: string, receiverId: string, content: string) {
  try {
    // Inserir mensagem
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content: content
      })
      .select()
      .single()

    if (error) throw error

    // Buscar nome do remetente
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', senderId)
      .single()

    // Criar notificação para o destinatário
    await supabase
      .from('message_notifications')
      .insert({
        user_id: receiverId,
        sender_id: senderId,
        sender_name: profile?.full_name || 'Usuário',
        message_id: message.id,
        type: 'private',
        content: content,
        created_at: new Date().toISOString()
      })

    return { success: true, message }
  } catch (error) {
    console.error('Erro ao enviar mensagem privada:', error)
    return { success: false, error }
  }
}
