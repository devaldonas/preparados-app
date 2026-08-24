'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Wallet, TrendingUp, TrendingDown, Gift } from 'lucide-react';
import BotaoIndicarAmigo from './BotaoIndicarAmigo';

interface Transacao {
  id: string;
  valor: number;
  tipo: 'credito' | 'debito' | 'bonus' | 'saque' | 'indicacao';
  descricao: string;
  saldo_anterior: number;
  saldo_atual: number;
  created_at: string;
}

export default function Carteira() {
  const [user, setUser] = useState<any>(null);
  const [saldo, setSaldo] = useState<number>(0);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalIndicados, setTotalIndicados] = useState(0);
  const [bonusTotal, setBonusTotal] = useState(0);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        await carregarDados(user.id);
        await carregarEstatisticas(user.id);
      }
    };
    
    getUser();
  }, []);

  const carregarDados = async (userId: string) => {
    try {
      const { data: carteira, error: errCarteira } = await supabase
        .from('carteira')
        .select('saldo')
        .eq('usuario_id', userId)
        .single();

      if (errCarteira && errCarteira.code !== 'PGRST116') {
        console.error('Erro ao buscar carteira:', errCarteira);
      }

      setSaldo(carteira?.saldo || 0);

      const { data: transacoes, error: errTransacoes } = await supabase
        .from('transacoes')
        .select('*')
        .eq('usuario_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (errTransacoes) {
        console.error('Erro ao buscar transações:', errTransacoes);
      }

      setTransacoes(transacoes || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarEstatisticas = async (userId: string) => {
    try {
      const { data: indicados, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('indicado_por', userId);

      if (error) throw error;
      
      const total = indicados?.length || 0;
      setTotalIndicados(total);
      setBonusTotal(total * 1);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      credito: 'Crédito',
      debito: 'Débito',
      bonus: 'Bônus',
      saque: 'Saque',
      indicacao: 'Indicação'
    };
    return labels[tipo] || tipo;
  };

  const getTipoIcon = (tipo: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      credito: <TrendingUp size={16} className="text-green-500" />,
      debito: <TrendingDown size={16} className="text-red-500" />,
      bonus: <TrendingUp size={16} className="text-yellow-500" />,
      saque: <TrendingDown size={16} className="text-red-500" />,
      indicacao: <TrendingUp size={16} className="text-blue-500" />
    };
    return icons[tipo] || null;
  };

  const getTipoCor = (tipo: string) => {
    const cores: Record<string, string> = {
      credito: 'text-green-600',
      debito: 'text-red-600',
      bonus: 'text-yellow-600',
      saque: 'text-red-600',
      indicacao: 'text-blue-600'
    };
    return cores[tipo] || 'text-gray-600';
  };

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FFB800]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Card de Saldo */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Wallet size={24} className="text-[#FFB800]" />
          <h2 className="text-lg font-semibold text-gray-800">Minha Carteira</h2>
        </div>
        <div className="mt-2">
          <p className="text-3xl font-bold text-gray-900">{formatarMoeda(saldo)}</p>
          <p className="text-sm text-gray-500">Saldo disponível</p>
        </div>
      </div>

      {/* Seção de Indicação */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Gift size={24} className="text-[#FFB800]" />
          <h3 className="text-lg font-semibold text-gray-800">Indique um Amigo</h3>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Convide seus amigos para o PREPARADOS. Cada indicação gera bônus!
        </p>

        {/* Substituído pelo BotaoIndicarAmigo */}
        <BotaoIndicarAmigo />

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

      {/* Histórico de Transações */}
      <div>
        <h3 className="text-md font-semibold text-gray-800 mb-4">Histórico</h3>
        {transacoes.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            Nenhuma transação ainda.
          </div>
        ) : (
          <div className="space-y-2">
            {transacoes.map((transacao) => (
              <div
                key={transacao.id}
                className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    {getTipoIcon(transacao.tipo)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {getTipoLabel(transacao.tipo)}
                    </p>
                    <p className="text-xs text-gray-500">{transacao.descricao}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatarData(transacao.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${getTipoCor(transacao.tipo)}`}>
                    {transacao.valor > 0 ? '+' : ''}{formatarMoeda(transacao.valor)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Saldo: {formatarMoeda(transacao.saldo_atual)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
