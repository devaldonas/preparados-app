'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AdminConfiguracoes() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error || !profile) {
          router.push('/dashboard');
          return;
        }

        // Corrigido: usando 'as any' para evitar erro de tipo
        if ((profile as any).role !== 'admin') {
          router.push('/dashboard');
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Erro ao verificar admin:', error);
        router.push('/dashboard');
      }
    };

    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-black mb-6">Configurações</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-gray-600">Configurações do sistema</p>
          {/* Adicione aqui as configurações */}
        </div>
      </div>
    </div>
  );
}