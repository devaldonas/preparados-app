'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Gift, Check, X } from 'lucide-react';

interface CupomPromocionalProps {
  onSuccess?: () => void;
}

export default function CupomPromocional({ onSuccess }: CupomPromocionalProps) {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<{ texto: string; tipo: 'success' | 'error' | '' }>({
    texto: '',
    tipo: ''
  });

  const aplicarCupom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!codigo.trim()) {
      setMensagem({ texto: 'Digite um código', tipo: 'error' });
      return;
    }

    setLoading(true);
    setMensagem({ texto: '', tipo: '' });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setMensagem({ texto: 'Faça login para usar um cupom', tipo: 'error' });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('aplicar_cupom', {
        p_usuario_id: user.id,
        p_codigo: codigo.trim().toUpperCase()
      });

      if (error) throw error;

      if (data.success) {
        setMensagem({ texto: data.message, tipo: 'success' });
        setCodigo('');
        if (onSuccess) onSuccess();
      } else {
        setMensagem({ texto: data.message, tipo: 'error' });
      }
    } catch (error) {
      console.error('Erro ao aplicar cupom:', error);
      setMensagem({ texto: 'Erro ao aplicar cupom. Tente novamente.', tipo: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Gift size={20} className="text-[#FFB800]" />
        <h3 className="font-semibold text-gray-800">Código Promocional</h3>
      </div>

      <form onSubmit={aplicarCupom} className="flex gap-2">
        <input
          type="text"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="Digite o código"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent text-sm uppercase"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[#FFB800] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#E6A600] transition disabled:opacity-50"
        >
          {loading ? '...' : 'Aplicar'}
        </button>
      </form>

      {mensagem.texto && (
        <div className={`mt-2 p-2 rounded-lg text-sm flex items-center gap-2 ${
          mensagem.tipo === 'success' 
            ? 'bg-green-50 text-green-700' 
            : 'bg-red-50 text-red-700'
        }`}>
          {mensagem.tipo === 'success' ? <Check size={16} /> : <X size={16} />}
          {mensagem.texto}
        </div>
      )}
    </div>
  );
}
