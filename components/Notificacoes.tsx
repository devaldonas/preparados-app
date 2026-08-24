'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Bell, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  created_at: string;
  link: string;
  metadata: any;
}

export default function Notificacoes() {
  const router = useRouter();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        await fetchNotificacoes(user.id);
        
        const channel = supabase
          .channel('notificacoes-realtime')
          .on('postgres_changes', 
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'notificacoes',
              filter: `usuario_id=eq.${user.id}`
            }, 
            (payload: any) => {
              const novaNotificacao = payload.new as Notificacao;
              setNotificacoes(prev => [novaNotificacao, ...prev]);
              setNotificacoesNaoLidas(prev => prev + 1);
            }
          )
          .subscribe();
        
        return () => {
          channel.unsubscribe();
        };
      }
    };
    
    getUser();
  }, []);

  const fetchNotificacoes = async (userId: string) => {
    try {
      // Buscar apenas as últimas 50 notificações (para não ficar enorme)
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('usuario_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      setNotificacoes(data || []);
      const naoLidas = data?.filter((n: Notificacao) => !n.lida).length || 0;
      setNotificacoesNaoLidas(naoLidas);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    }
  };

  const marcarComoLida = async (id: string) => {
    try {
      await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', id);
      
      setNotificacoes(prev => 
        prev.map((n: Notificacao) => n.id === id ? { ...n, lida: true } : n)
      );
      setNotificacoesNaoLidas(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const marcarTodasComoLidas = async () => {
    if (!user) return;
    try {
      await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('usuario_id', user.id)
        .eq('lida', false);
      
      setNotificacoes(prev => 
        prev.map((n: Notificacao) => ({ ...n, lida: true }))
      );
      setNotificacoesNaoLidas(0);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  // NOVA FUNÇÃO: Remover notificações lidas
  const removerLidas = async () => {
    if (!user) return;
    const idsLidas = notificacoes.filter((n: Notificacao) => n.lida).map((n: Notificacao) => n.id);
    
    if (idsLidas.length === 0) return;
    
    try {
      await supabase
        .from('notificacoes')
        .delete()
        .eq('usuario_id', user.id)
        .in('id', idsLidas);
      
      setNotificacoes(prev => prev.filter((n: Notificacao) => !n.lida));
    } catch (error) {
      console.error('Erro ao remover notificações lidas:', error);
    }
  };

  const handleNotificacaoClick = (notificacao: Notificacao) => {
    marcarComoLida(notificacao.id);
    setMostrarNotificacoes(false);
    if (notificacao.link) {
      router.push(notificacao.link);
    }
  };

  const formatarData = (data: string) => {
    const now = new Date();
    const date = new Date(data);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'Agora pouco';
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return date.toLocaleDateString('pt-BR');
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setMostrarNotificacoes(!mostrarNotificacoes)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition"
      >
        <Bell size={20} className="text-gray-700" />
        {notificacoesNaoLidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[0.55rem] font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {notificacoesNaoLidas > 9 ? '9+' : notificacoesNaoLidas}
          </span>
        )}
      </button>

      {mostrarNotificacoes && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setMostrarNotificacoes(false)}
          />
          
          {/* CORRIGIDO: Dropdown alinhado à direita e com largura fixa */}
          <div className="absolute right-0 mt-2 w-[340px] max-w-[90vw] bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
            {/* Cabeçalho com ações */}
            <div className="p-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-900">
                Notificações
                {notificacoes.length > 0 && (
                  <span className="ml-2 text-[0.6rem] text-gray-400 font-normal">
                    ({notificacoesNaoLidas} não lidas)
                  </span>
                )}
              </h3>
              <div className="flex gap-1">
                {notificacoesNaoLidas > 0 && (
                  <button
                    onClick={marcarTodasComoLidas}
                    className="text-[0.6rem] text-blue-600 hover:text-blue-800 transition px-2 py-1 hover:bg-blue-50 rounded"
                  >
                    <Check size={12} className="inline mr-0.5" />
                    Marcar
                  </button>
                )}
                {notificacoes.filter((n: Notificacao) => n.lida).length > 0 && (
                  <button
                    onClick={removerLidas}
                    className="text-[0.6rem] text-red-500 hover:text-red-700 transition px-2 py-1 hover:bg-red-50 rounded"
                  >
                    <X size={12} className="inline mr-0.5" />
                    Limpar
                  </button>
                )}
              </div>
            </div>
            
            {/* Lista de notificações */}
            <div className="max-h-[400px] overflow-y-auto">
              {notificacoes.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">
                  Nenhuma notificação
                </div>
              ) : (
                notificacoes.map((notificacao: Notificacao) => (
                  <button
                    key={notificacao.id}
                    onClick={() => handleNotificacaoClick(notificacao)}
                    className={`w-full text-left p-3 hover:bg-gray-50 transition border-b border-gray-100 last:border-0 ${
                      !notificacao.lida ? 'bg-blue-50/50' : 'opacity-70'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${!notificacao.lida ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                          {notificacao.titulo}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {notificacao.mensagem}
                        </p>
                        <p className="text-[0.55rem] text-gray-400 mt-0.5">
                          {formatarData(notificacao.created_at)}
                        </p>
                      </div>
                      {!notificacao.lida && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Rodapé com contagem */}
            <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
              <p className="text-[0.5rem] text-gray-400">
                {notificacoes.filter((n: Notificacao) => !n.lida).length} não lidas • 
                {notificacoes.filter((n: Notificacao) => n.lida).length} lidas
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
