'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Share2, Copy, Check, Users, Gift } from 'lucide-react';

export default function Indicacao() {
  const [user, setUser] = useState<any>(null);
  const [codigo, setCodigo] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [totalIndicados, setTotalIndicados] = useState(0);
  const [bonusTotal, setBonusTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Gerar código com os primeiros 8 caracteres do UUID
        setCodigo(user.id.substring(0, 8));
        await carregarEstatisticas(user.id);
      }
    };
    
    getUser();
  }, []);

  const carregarEstatisticas = async (userId: string) => {
    try {
      // Contar quantos usuários foram indicados por este usuário
      const { data: indicados, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('indicado_por', userId);

      if (error) throw error;
      
      const total = indicados?.length || 0;
      setTotalIndicados(total);
      setBonusTotal(total * 5); // R$ 5,00 por indicação
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const copiarCodigo = async () => {
    const texto = `🎒 PREPARADOS - App de Preparação para Emergências!\n\nUse meu código de indicação: ${codigo}\n\nBaixe o app: https://preparados.app\n\nJuntos somos mais fortes! 💪`;
    
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const compartilhar = async () => {
    const texto = `🎒 PREPARADOS - App de Preparação para Emergências!\n\nUse meu código de indicação: ${codigo}\n\nBaixe o app: https://preparados.app\n\nJuntos somos mais fortes! 💪`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PREPARADOS - App de Preparação',
          text: texto,
          url: 'https://preparados.app'
        });
      } catch (err) {
        if ((err as any).name !== 'AbortError') {
          console.error('Erro ao compartilhar:', err);
        }
      }
    } else {
      copiarCodigo();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FFB800]"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Users size={24} className="text-[#FFB800]" />
        <h3 className="text-lg font-semibold text-gray-800">Indique um Amigo</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Convide seus amigos para o PREPARADOS e ganhe <strong>R$ 5,00</strong> por indicação!
      </p>

      {/* Botão para Compartilhar */}
      <button
        onClick={compartilhar}
        className="w-full bg-[#FFB800] text-black font-semibold py-3 rounded-lg hover:bg-[#E6A600] transition flex items-center justify-center gap-2"
      >
        <Share2 size={20} />
        Convidar Amigos
      </button>

      {/* Código para copiar */}
      <div className="mt-4 flex items-center gap-2 bg-gray-50 rounded-lg border border-gray-200 p-3">
        <code className="flex-1 text-sm font-mono text-gray-700 text-center">
          Código: <span className="font-bold text-gray-900">{codigo}</span>
        </code>
        <button
          onClick={copiarCodigo}
          className="p-1.5 hover:bg-gray-200 rounded transition"
          title="Copiar código"
        >
          {copiado ? <Check size={18} className="text-green-500" /> : <Copy size={18} className="text-gray-500" />}
        </button>
      </div>

      {/* Estatísticas */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-800">{totalIndicados}</p>
          <p className="text-xs text-gray-500">Amigos indicados</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-[#FFB800]">
            R$ {bonusTotal.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">Total em bônus</p>
        </div>
      </div>
    </div>
  );
}
