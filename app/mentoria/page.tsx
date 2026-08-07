'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Play, Calendar, Users, Bell, BellOff, Share2, CheckCircle, Clock } from 'lucide-react';

export default function MentoriaPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [userName, setUserName] = useState('');

  // ID do vídeo do YouTube (substitua pelo seu)
  const VIDEO_ID = 'SEU_VIDEO_ID_AQUI';
  const embedUrl = `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=0&modestbranding=1&rel=0`;

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUser(user);

      // Buscar nome do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setUserName(profile.full_name || 'Preparado');
      }

      // Verificar se a live está ativa (simulação)
      // Você pode integrar com YouTube Data API para verificar status real
      const checkLiveStatus = async () => {
        // Simulação: live ativa em dias específicos
        const now = new Date();
        const day = now.getDay(); // 0=domingo, 1=segunda...
        const hour = now.getHours();
        // Exemplo: live ativa aos domingos das 19h às 20h
        const isLiveNow = (day === 0 && hour >= 19 && hour < 20);
        setIsLive(isLiveNow);
      };

      checkLiveStatus();
      setLoading(false);
    };

    getUser();
  }, [router]);

  const toggleNotifications = () => {
    setNotifications(!notifications);
    // Aqui você pode salvar a preferência no Supabase
  };

  const shareLive = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Mentoria Preparado - Ao Vivo',
        text: 'Assista à mentoria ao vivo!',
        url: `https://preparado.vercel.app/mentoria`
      });
    } else {
      navigator.clipboard.writeText(`https://preparado.vercel.app/mentoria`);
      alert('Link copiado para a área de transferência!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
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
            <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="font-semibold text-black">
              {isLive ? '🔴 AO VIVO' : 'Próxima live em breve'}
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
            <button
              onClick={shareLive}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
              title="Compartilhar"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* Player do YouTube */}
        <div className="bg-black rounded-xl overflow-hidden shadow-lg mb-6 aspect-video">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Mentoria Preparado - Ao Vivo"
          />
        </div>

        {/* Informações da Live */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#FFB800] flex items-center justify-center flex-shrink-0">
              <Play className="w-6 h-6 text-black" />
            </div>
            <div>
              <h3 className="font-bold text-black text-lg">Mentoria Semanal</h3>
              <p className="text-gray-600 text-sm mt-1">
                Toda semana, especialistas em preparação para emergências compartilham 
                conhecimentos valiosos para você e sua família.
              </p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  Domingos às 19h
                </span>
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {isLive ? 'Ao vivo agora!' : 'Próxima: Domingo 19h'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Próximos Temas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h4 className="font-semibold text-black mb-4">📋 Próximos Temas</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-[#FFB800]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#FFB800]">1</span>
              </div>
              <div>
                <p className="font-medium text-black text-sm">Preparação para Desastres Naturais</p>
                <p className="text-xs text-gray-500">Domingo, 20h</p>
              </div>
              <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-[#FFB800]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#FFB800]">2</span>
              </div>
              <div>
                <p className="font-medium text-black text-sm">Primeiros Socorros Avançados</p>
                <p className="text-xs text-gray-500">Domingo, 21h</p>
              </div>
              <Clock className="w-4 h-4 text-gray-400 ml-auto" />
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
