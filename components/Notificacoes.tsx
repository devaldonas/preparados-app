'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Bell, Check, X, AlertTriangle, MessageCircle } from 'lucide-react';
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const channelRef = useRef<any>(null);
  const [realtimeStatus, setRealtimeStatus] = useState('desconectado');
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotificacoes = async (userId: string) => {
    try {
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

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        await fetchNotificacoes(user.id);
        
        // Configurar Realtime
        if (channelRef.current) {
          channelRef.current.unsubscribe();
        }
        
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
              console.log('🔔 Nova notificação (Realtime):', novaNotificacao);
              setNotificacoes(prev => [novaNotificacao, ...prev]);
              setNotificacoesNaoLidas(prev => prev + 1);
            }
          )
          .subscribe((status: string) => {
            console.log('📡 Notificações status:', status);
            setRealtimeStatus(status);
          });
        
        channelRef.current = channel;
        
        // POLLING: Buscar a cada 10 segundos (fallback)
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        pollingIntervalRef.current = setInterval(() => {
          if (user) {
            fetchNotificacoes(user.id);
          }
        }, 10000);
        
        return () => {
          if (channelRef.current) {
            channelRef.current.unsubscribe();
          }
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
        };
      }
    };
    
    getUser();
  }, []);

  // Resto do código (marcarComoLida, marcarTodasComoLidas, removerLidas, etc)
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

  useEffect(() => {
    if (mostrarNotificacoes && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const dropdownWidth = 360;
      
      let left = rect.right - dropdownWidth;
      
      if (left < 10) {
        left = 10;
      }
      
      if (left + dropdownWidth > windowWidth - 10) {
        left = windowWidth - dropdownWidth - 10;
      }
      
      setDropdownPosition({
        top: rect.bottom + 8,
        left: left
      });
    }
  }, [mostrarNotificacoes]);

  const getIcon = (tipo: string) => {
    if (tipo === 'critico') {
      return <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />;
    } else if (tipo === 'info' || tipo === 'success' || tipo === 'warning') {
      return <MessageCircle size={16} className="text-blue-500 flex-shrink-0" />;
    }
    return <Bell size={16} className="text-gray-400 flex-shrink-0" />;
  };

  const getBgColor = (tipo: string, lida: boolean) => {
    if (lida) return 'opacity-70';
    if (tipo === 'critico') return 'bg-red-50/50 border-l-4 border-l-red-500';
    if (tipo === 'info' || tipo === 'success' || tipo === 'warning') return 'bg-blue-50/50 border-l-4 border-l-blue-500';
    return 'bg-gray-50';
  };

  if (!user) return null;

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
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
          
          <div 
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: '360px',
              maxWidth: 'calc(100vw - 20px)',
              maxHeight: 'calc(100vh - 100px)'
            }}
          >
            <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">Notificações</h3>
                <span className={`text-[0.5rem] px-2 py-0.5 rounded-full ${
                  realtimeStatus === 'SUBSCRIBED' 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-yellow-100 text-yellow-600'
                }`}>
                  {realtimeStatus === 'SUBSCRIBED' ? '🔴 Ao vivo' : '🔄 Atualizando...'}
                </span>
                {notificacoes.length > 0 && (
                  <span className="text-[0.6rem] text-gray-400 font-normal">
                    ({notificacoesNaoLidas} não lidas)
                  </span>
                )}
              </div>
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
            
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(60vh - 80px)' }}>
              {notificacoes.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">
                  Nenhuma notificação
                </div>
              ) : (
                notificacoes.map((notificacao: Notificacao) => (
                  <button
                    key={notificacao.id}
                    onClick={() => handleNotificacaoClick(notificacao)}
                    className={`w-full text-left p-3 hover:bg-gray-50 transition border-b border-gray-100 last:border-0 ${getBgColor(notificacao.tipo, notificacao.lida)}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        {getIcon(notificacao.tipo)}
                      </div>
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
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="p-2 border-t border-gray-100 bg-gray-50 text-center sticky bottom-0">
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
