// app/mentoria/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Play, Calendar, Users, Bell, BellOff, Clock, X, Trash2 } from 'lucide-react';
import YouTubePlayer from '@/components/YouTubePlayer';

interface Live {
  id: number;
  youtube_id: string;
  titulo: string;
  descricao: string;
  data_hora: string;
  duracao: number;
  is_active: boolean;
  is_live: boolean;
}

interface Notificacao {
  id: number;
  live_id: number;
  usuario_id: string;
  mensagem: string;
  lida: boolean;
  enviado: boolean;
  enviado_em: string;
  created_at: string;
}

export default function MentoriaPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState<Live | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [userName, setUserName] = useState('');
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoadingNotificacoes, setIsLoadingNotificacoes] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUser(user);

      const { data: profile, error } = await (supabase
        .from('profiles') as any)
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (!error && profile) {
        setUserName(profile.full_name || 'Preparado');
      }

      await carregarLive();
      await carregarNotificacoes();
      setLoading(false);
    };

    getUser();
  }, []);

  const carregarLive = async () => {
    try {
      console.log('📡 Buscando live ativa...');
      
      const { data, error } = await (supabase
        .from('mentoria_lives') as any)
        .select('*')
        .eq('is_active', true)
        .order('data_hora', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao carregar live:', error);
        setLive(null);
        return;
      }

      if (data) {
        console.log('✅ Live carregada:', data);
        setLive(data as Live);
      } else {
        console.log('ℹ️ Nenhuma live ativa encontrada');
        setLive(null);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar live:', error);
      setLive(null);
    }
  };

  const carregarNotificacoes = async () => {
    if (!user) {
      console.log('ℹ️ Usuário não autenticado');
      return;
    }

    setIsLoadingNotificacoes(true);
    try {
      console.log('📡 Buscando notificações para o usuário:', user.id);
      
      const { data, error } = await (supabase
        .from('mentoria_notificacoes') as any)
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar notificações:', error);
        return;
      }

      if (data && data.length > 0) {
        console.log('📊 Notificações brutas:', data.length);
        
        // 🔥 DEDUPLICAÇÃO: Remover notificações com o mesmo live_id
        const seen = new Set();
        const notificacoesUnicas = data.filter((notif: Notificacao) => {
          const key = `${notif.live_id}-${notif.usuario_id}`;
          if (seen.has(key)) {
            console.log(`🗑️ Removendo duplicata para live_id: ${notif.live_id}`);
            return false;
          }
          seen.add(key);
          return true;
        });

        console.log('✅ Notificações únicas:', notificacoesUnicas.length);
        setNotificacoes(notificacoesUnicas);
      } else {
        console.log('ℹ️ Nenhuma notificação encontrada');
        setNotificacoes([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar notificações:', error);
    } finally {
      setIsLoadingNotificacoes(false);
    }
  };

  // 🔥 FUNÇÃO PARA LIMPAR TODAS AS NOTIFICAÇÕES DO USUÁRIO
  const limparTodasNotificacoes = async () => {
    if (!user) return;
    
    if (!confirm('Tem certeza que deseja limpar todas as notificações?')) return;

    try {
      console.log('🗑️ Limpando todas as notificações do usuário:', user.id);
      
      const { error } = await (supabase
        .from('mentoria_notificacoes') as any)
        .delete()
        .eq('usuario_id', user.id);

      if (error) {
        console.error('❌ Erro ao limpar notificações:', error);
        alert('Erro ao limpar notificações');
        return;
      }

      console.log('✅ Todas as notificações foram removidas');
      setNotificacoes([]);
      alert('✅ Todas as notificações foram removidas!');
    } catch (error) {
      console.error('❌ Erro ao limpar notificações:', error);
      alert('Erro ao limpar notificações');
    }
  };

  // 🔥 FUNÇÃO PARA REMOVER UMA NOTIFICAÇÃO ESPECÍFICA
  const removerNotificacao = async (id: number) => {
    try {
      console.log('🗑️ Removendo notificação:', id);
      
      const { error } = await (supabase
        .from('mentoria_notificacoes') as any)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao remover notificação:', error);
        return;
      }

      setNotificacoes(notificacoes.filter(n => n.id !== id));
      console.log('✅ Notificação removida');
    } catch (error) {
      console.error('❌ Erro ao remover notificação:', error);
    }
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    
    if (!notificationsEnabled) {
      alert('🔔 Notificações ativadas! Você receberá alertas sobre novas lives.');
    } else {
      alert('🔕 Notificações desativadas.');
    }
  };

  const toggleShowNotifications = () => {
    setShowNotifications(!showNotifications);
    // Recarregar notificações ao abrir
    if (!showNotifications) {
      carregarNotificacoes();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    );
  }

  if (!live) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <img 
            src="/images/mentoria-icon.png" 
            alt="Mentoria" 
            className="w-20 h-20 mx-auto mb-4 object-contain opacity-50"
          />
          <h1 className="text-2xl font-bold text-black mb-2">Mentoria Preparado</h1>
          <p className="text-gray-600">Em breve, novas lives serão anunciadas!</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-6 bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="/images/mentoria-icon.png" 
            alt="Mentoria" 
            className="w-20 h-20 mx-auto mb-4 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <h1 className="text-3xl font-bold text-black mb-2">Mentoria Preparado</h1>
          <p className="text-gray-600">
            Aprenda com especialistas e esteja preparado para qualquer emergência
          </p>
        </div>

        {/* Status da Live */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${live.is_live ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="font-semibold text-black">
              {live.is_live ? '🔴 AO VIVO' : 'Próxima live em breve'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Botão de Notificações com contador */}
            <button
              onClick={toggleShowNotifications}
              className="p-2 rounded-lg hover:bg-gray-100 transition relative"
              title="Ver notificações"
            >
              <Bell size={18} />
              {notificacoes.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notificacoes.length}
                </span>
              )}
            </button>
            <button
              onClick={toggleNotifications}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
              title={notificationsEnabled ? 'Desativar notificações' : 'Ativar notificações'}
            >
              {notificationsEnabled ? <BellOff size={18} /> : <Bell size={18} />}
            </button>
          </div>
        </div>

        {/* Dropdown de Notificações */}
        {showNotifications && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-6 max-h-80 overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-black">Notificações</h3>
              <div className="flex gap-2">
                {notificacoes.length > 0 && (
                  <button
                    onClick={limparTodasNotificacoes}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                  >
                    <Trash2 size={14} />
                    Limpar todas
                  </button>
                )}
                <button
                  onClick={toggleShowNotifications}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            {isLoadingNotificacoes ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFB800] mx-auto" />
              </div>
            ) : notificacoes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhuma notificação</p>
            ) : (
              <div className="space-y-2">
                {notificacoes.map((notif) => (
                  <div
                    key={notif.id}
                    className="flex justify-between items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">
                        {notif.mensagem || `Nova live: ${live?.titulo || 'Mentoria'}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notif.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <button
                      onClick={() => removerNotificacao(notif.id)}
                      className="ml-2 text-gray-400 hover:text-red-500 transition"
                      title="Remover notificação"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Player do YouTube */}
        <YouTubePlayer videoId={live.youtube_id} />

        {/* Informações da Live */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#FFB800] flex items-center justify-center flex-shrink-0">
              <Play className="w-6 h-6 text-black" />
            </div>
            <div>
              <h3 className="font-bold text-black text-lg">{live.titulo}</h3>
              <p className="text-gray-600 text-sm mt-1">
                {live.descricao || 'Toda semana, Michel Still, especialista em preparação para emergências, compartilha conhecimentos valiosos para você e sua família.'}
              </p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {live.data_hora ? new Date(live.data_hora).toLocaleString('pt-BR') : 'Data a definir'}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {live.is_live ? 'Ao vivo agora!' : 'Próxima live em breve'}
                </span>
                {live.duracao && live.duracao > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {live.duracao} min
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Botão Voltar */}
        <div className="mt-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    </div>
  );
}