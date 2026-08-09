'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Play, Calendar, Users, Bell, BellOff, CheckCircle, Clock } from 'lucide-react';
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

export default function MentoriaPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState<Live | null>(null);
  const [notifications, setNotifications] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setUserName(profile.full_name || 'Preparado');
      }

      await carregarLive();
      setLoading(false);
    };

    getUser();
  }, []);

  const carregarLive = async () => {
    const { data } = await supabase
      .from('mentoria_lives')
      .select('*')
      .eq('is_active', true)
      .order('data_hora', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      console.log('🎬 Live carregada:', data);
      console.log('📹 YouTube ID:', data.youtube_id);
      setLive(data);
    }
  };

  const toggleNotifications = () => {
    setNotifications(!notifications);
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
            <button
              onClick={toggleNotifications}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
              title={notifications ? 'Desativar notificações' : 'Ativar notificações'}
            >
              {notifications ? <BellOff size={18} /> : <Bell size={18} />}
            </button>
          </div>
        </div>

        {/* Player do YouTube - Usando o componente */}
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
                {live.duracao && (
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