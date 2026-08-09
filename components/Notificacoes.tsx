// components/Notificacoes.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Bell, BellOff, X, Calendar, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Notificacao {
  id: number;
  tipo: 'mentoria' | 'pedido' | 'sistema';
  titulo: string;
  mensagem: string;
  link?: string;
  lida: boolean;
  created_at: string;
  data_hora?: string | null;
}

export default function Notificacoes() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await carregarNotificacoes(user.id);
        await configurarListener(user.id);
      }
    };
    getUser();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);

  const carregarNotificacoes = async (userId: string) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      console.log('🔔 Carregando notificações para:', userId);

      const { data, error } = await supabase
        .from('mentoria_notificacoes')
        .select(`
          id,
          live_id,
          enviado,
          enviado_em,
          created_at,
          mentoria_lives (
            titulo,
            descricao,
            youtube_id,
            data_hora
          )
        `)
        .eq('usuario_id', userId)
        .eq('enviado', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Erro ao carregar notificações:', error);
        return;
      }

      if (!data || data.length === 0) {
        setNotificacoes([]);
        setHasNew(false);
        return;
      }

      const formatted = data
        .filter(item => item.mentoria_lives)
        .map((item: any) => {
          const live = Array.isArray(item.mentoria_lives) 
            ? item.mentoria_lives[0] 
            : item.mentoria_lives;

          return {
            id: item.id,
            tipo: 'mentoria' as const,
            titulo: '📺 Nova Live!',
            mensagem: live?.titulo || 'Nova mentoria disponível',
            link: '/mentoria',
            lida: false,
            created_at: item.created_at,
            data_hora: live?.data_hora || null,
          };
        });

      setNotificacoes(formatted);
      setHasNew(formatted.length > 0);
    } catch (error) {
      console.error('❌ Erro:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const configurarListener = async (userId: string) => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    const channel = supabase
      .channel('notificacoes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mentoria_notificacoes',
          filter: `usuario_id=eq.${userId}`,
        },
        async (payload) => {
          console.log('📢 Nova notificação recebida:', payload);
          await carregarNotificacoes(userId);
          setIsOpen(true);
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  const marcarComoLida = async (id: number) => {
    setNotificacoes(prev => 
      prev.map(n => n.id === id ? { ...n, lida: true } : n)
    );
    const hasUnread = notificacoes.some(n => !n.lida && n.id !== id);
    setHasNew(hasUnread);
  };

  const limparTodasNotificacoes = async () => {
    if (!user) return;
    if (!confirm('Deseja limpar todas as notificações?')) return;

    try {
      const { error } = await supabase
        .from('mentoria_notificacoes')
        .delete()
        .eq('usuario_id', user.id)
        .eq('enviado', true);

      if (error) {
        console.error('❌ Erro ao limpar notificações:', error);
        alert('Erro ao limpar notificações');
      } else {
        setNotificacoes([]);
        setHasNew(false);
        alert('✅ Notificações limpas!');
      }
    } catch (error) {
      console.error('❌ Erro:', error);
    }
  };

  const removerNotificacao = async (id: number) => {
    if (!confirm('Remover esta notificação?')) return;

    try {
      const { error } = await supabase
        .from('mentoria_notificacoes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao remover notificação:', error);
      } else {
        setNotificacoes(prev => prev.filter(n => n.id !== id));
        if (notificacoes.length <= 1) {
          setHasNew(false);
        }
      }
    } catch (error) {
      console.error('❌ Erro:', error);
    }
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'mentoria': return <Calendar size={16} className="text-[#FFB800]" />;
      case 'pedido': return <ShoppingBag size={16} className="text-blue-500" />;
      default: return <Calendar size={16} className="text-green-500" />;
    }
  };

  const formatarData = (data: string | null | undefined): string => {
    if (!data) return 'Data a definir';
    try {
      const date = new Date(data);
      if (isNaN(date.getTime())) return 'Data inválida';
      return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && user) {
            carregarNotificacoes(user.id);
          }
        }}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition"
      >
        {isLoading ? (
          <Bell size={20} className="text-gray-400 animate-pulse" />
        ) : hasNew ? (
          <Bell size={20} className="text-[#FFB800] fill-[#FFB800]" />
        ) : (
          <Bell size={20} className="text-gray-600" />
        )}
        {hasNew && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h4 className="font-bold text-black">Notificações</h4>
              <div className="flex items-center gap-2">
                {notificacoes.length > 0 && (
                  <button
                    onClick={limparTodasNotificacoes}
                    className="text-xs text-red-500 hover:text-red-700 transition"
                    title="Limpar todas"
                  >
                    Limpar
                  </button>
                )}
                <button
                  onClick={() => {
                    if (user) carregarNotificacoes(user.id);
                  }}
                  className="p-1 hover:bg-gray-100 rounded transition text-xs text-gray-500"
                  title="Recarregar"
                >
                  ↻
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded transition"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-72">
              {isLoading ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Carregando...
                </div>
              ) : notificacoes.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Nenhuma notificação
                </div>
              ) : (
                notificacoes.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition ${
                      !notif.lida ? 'bg-[#FFB800]/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getIcon(notif.tipo)}</div>
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => {
                          marcarComoLida(notif.id);
                          if (notif.link) router.push(notif.link);
                          setIsOpen(false);
                        }}
                      >
                        <p className="text-sm font-semibold text-black truncate">
                          {notif.titulo}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {notif.mensagem}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                          <Calendar size={10} />
                          {formatarData(notif.data_hora)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removerNotificacao(notif.id);
                        }}
                        className="text-gray-400 hover:text-red-500 transition text-sm px-1"
                        title="Remover notificação"
                      >
                        ×
                      </button>
                      {!notif.lida && (
                        <div className="w-2 h-2 bg-[#FFB800] rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}