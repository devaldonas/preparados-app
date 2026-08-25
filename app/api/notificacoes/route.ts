import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get('usuario_id');

    if (!usuarioId) {
      return NextResponse.json({ error: 'usuario_id é obrigatório' }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('❌ Erro ao buscar notificações:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('❌ Erro na API:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
