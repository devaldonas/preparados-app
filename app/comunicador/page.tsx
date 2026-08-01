'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import BotaoIndicarAmigo from '@/components/BotaoIndicarAmigo';
import RadioInterface from '@/components/Radio/RadioInterface';
import { ArrowLeft, Radio } from 'lucide-react';

export default function ComunicadorPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState(0);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
      } else {
        setUser(user);
        
        // Buscar localização do usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('latitude, longitude, city, state, full_name')
          .eq('id', user.id)
          .single();
          
        if (profile?.latitude && profile?.longitude) {
          setUserLocation({
            latitude: profile.latitude,
            longitude: profile.longitude,
          });
        }

        // Buscar todos os grupos ativos
        const { data: groupsData } = await supabase
          .from('groups')
          .select('id, name, city_name, member_count, center_latitude, center_longitude')
          .eq('is_active', true)
          .order('member_count', { ascending: false });

        if (groupsData) {
          setGroups(groupsData);
          console.log(`📡 ${groupsData.length} grupos carregados:`, groupsData);
        }

        // Buscar usuários online (com localização)
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .eq('subscription_status', 'active');

        setOnlineUsers(usersData?.length || 0);
      }
      setLoading(false);
    };
    getUser();
  }, [router]);

  const handleClose = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700] mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando comunicador...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header com botão voltar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={handleClose}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#FFD700]" />
            <h1 className="text-lg font-bold text-white">Comunicador Via Rádio</h1>
          </div>
          <div className="w-20" />
        </div>
      </div>

      {/* Conteúdo do Rádio */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col items-center">
        <RadioInterface
          initialChannel="CH CIDADES"
          initialGroup={groups.length > 0 ? groups[0].name : "Todos"}
          userLatitude={userLocation?.latitude}
          userLongitude={userLocation?.longitude}
          onClose={handleClose}
        />
        
        {/* Botão Indicar Amigo */}
        <div className="mt-6 w-full max-w-[420px]">
          <BotaoIndicarAmigo />
        </div>
      </div>
    </div>
  );
}
