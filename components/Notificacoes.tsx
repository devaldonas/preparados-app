'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Bell } from 'lucide-react';
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

// Tipo para o payload do Realtime
interface RealtimePayload {
  new: Notificacao;
  old: Notificacao;
  eventType: string;
}

// Tipo para o status do Realtime
type RealtimeStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR';

export default function Notificacoes() {
  const router = useRouter();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        await fetchNotificacoes(user.id);
        
        const newChannel = supabase
          .channel('notificacoes-realtime')
          .on('postgres_changes', 
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'notificacoes',
              filter: `usuario_id=eq.${user.id}`
            }, 
            (payload: RealtimePayload) => {
              const novaNotificacao = payload.new as Notificacao;
              setNotificacoes(prev => [novaNotificacao, ...prev]);
              setNotificacoesNaoLidas(prev => prev + 1);
            }
          )
          .subscribe((status: RealtimeStatus) => {
            console.log('📡 Notificações status:', status);
          });
        
        setChannel(newChannel);
        
        return () => {
          if (newChannel) {
            newChannel.unsubscribe();
          }
        };
      }
    };
    
    getUser();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);

  const fetchNotificacoes = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('usuario_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      const notificacoesData: Notificacao[] = data || [];
      setNotificacoes(notificacoesData);
      const naoLidas = notificacoesData.filter((n: Notificacao) => !n.lida).length || 0;
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
          
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
            <div className="p-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-900">Notificações</h3>
              {notificacoesNaoLidas > 0 && (
                <button
                  onClick={marcarTodasComoLidas}
                  className="text-xs text-blue-600 hover:text-blue-800 transition"
                >
                  Marcar todas
                </button>
              )}
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notificacoes.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Nenhuma notificação
                </div>
              ) : (
                notificacoes.map((notificacao: Notificacao) => (
                  <button
                    key={notificacao.id}
                    onClick={() => handleNotificacaoClick(notificacao)}
                    className={`w-full text-left p-3 hover:bg-gray-50 transition border-b border-gray-100 ${
                      !notificacao.lida ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notificacao.lida ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
                          {notificacao.titulo}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {notificacao.mensagem}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatarData(notificacao.created_at)}
                        </p>
                      </div>
                      {!notificacao.lida && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5"></div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
