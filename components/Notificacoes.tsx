// components/Notificacoes.tsx
'use client';

import React, { useState, useEffect } from 'react';
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
}

export default function Notificacoes() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

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
  }, []);

  const carregarNotificacoes = async (userId: string) => {
    // Buscar notificações do usuário
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
          youtube_id
        )
      `)
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      const formatted = data.map((item: any) => {
        // CORREÇÃO: verifica se mentoria_lives é um array ou objeto
        const live = Array.isArray(item.mentoria_lives) 
          ? item.mentoria_lives[0] 
          : item.mentoria_lives;
        
        return {
          id: item.id,
          tipo: 'mentoria' as const,
          titulo: 'Nova Live!',
          mensagem: live?.titulo || 'Nova mentoria disponível',
          link: '/mentoria',
          lida: item.enviado || false,
          created_at: item.created_at,
        };
      });
      setNotificacoes(formatted);
      setHasNew(formatted.some(n => !n.lida));
    }
  };

  const configurarListener = async (userId: string) => {
    // Assinar canal de notificações em tempo real
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
          await carregarNotificacoes(userId);
          setHasNew(true);
        }
      )
      .subscribe();
  };

  const marcarComoLida = async (id: number) => {
    setNotificacoes(prev => 
      prev.map(n => n.id === id ? { ...n, lida: true } : n)
    );
    setHasNew(notificacoes.some(n => !n.lida && n.id !== id));
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'mentoria': return <Calendar size={16} className="text-[#FFB800]" />;
      case 'pedido': return <ShoppingBag size={16} className="text-blue-500" />;
      default: return <Calendar size={16} className="text-green-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition"
      >
        {hasNew ? (
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
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-72">
              {notificacoes.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Nenhuma notificação
                </div>
              ) : (
                notificacoes.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      marcarComoLida(notif.id);
                      if (notif.link) router.push(notif.link);
                      setIsOpen(false);
                    }}
                    className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition ${
                      !notif.lida ? 'bg-[#FFB800]/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getIcon(notif.tipo)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-black truncate">
                          {notif.titulo}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {notif.mensagem}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(notif.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
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