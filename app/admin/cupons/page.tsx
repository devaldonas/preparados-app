'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Trash2, Edit, Copy, Check, X, Search } from 'lucide-react';

interface Cupom {
  id: string;
  codigo: string;
  tipo: 'free_12months' | 'desconto' | 'credito';
  valor: number;
  descricao: string;
  usado_por: string | null;
  usado_em: string | null;
  valido_ate: string | null;
  ativo: boolean;
  max_uso: number;
  usado_vezes: number;
  created_at: string;
  created_by: string | null;
}

export default function AdminCupons() {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Cupom | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    codigo: '',
    tipo: 'free_12months',
    valor: '',
    descricao: '',
    valido_ate: '',
    max_uso: '1',
    ativo: true
  });

  useEffect(() => {
    carregarCupons();
  }, []);

  const carregarCupons = async () => {
    try {
      const { data, error } = await supabase
        .from('cupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCupons(data || []);
    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        codigo: formData.codigo.toUpperCase().trim(),
        tipo: formData.tipo,
        valor: parseFloat(formData.valor) || 0,
        descricao: formData.descricao.trim(),
        valido_ate: formData.valido_ate ? new Date(formData.valido_ate).toISOString() : null,
        max_uso: parseInt(formData.max_uso) || 1,
        ativo: formData.ativo
      };

      let result;
      if (editing) {
        result = await supabase
          .from('cupons')
          .update(payload)
          .eq('id', editing.id);
      } else {
        result = await supabase
          .from('cupons')
          .insert([payload]);
      }

      if (result.error) throw result.error;
      
      await carregarCupons();
      resetForm();
      alert(editing ? 'Cupom atualizado!' : 'Cupom criado!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar cupom');
    }
  };

  const deletarCupom = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cupom?')) return;
    
    try {
      const { error } = await supabase
        .from('cupons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await carregarCupons();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir cupom');
    }
  };

  const copiarCodigo = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    alert('Código copiado!');
  };

  const resetForm = () => {
    setEditing(null);
    setShowModal(false);
    setFormData({
      codigo: '',
      tipo: 'free_12months',
      valor: '',
      descricao: '',
      valido_ate: '',
      max_uso: '1',
      ativo: true
    });
  };

  const editarCupom = (cupom: Cupom) => {
    setEditing(cupom);
    setFormData({
      codigo: cupom.codigo,
      tipo: cupom.tipo,
      valor: String(cupom.valor || ''),
      descricao: cupom.descricao || '',
      valido_ate: cupom.valido_ate ? new Date(cupom.valido_ate).toISOString().slice(0, 16) : '',
      max_uso: String(cupom.max_uso || 1),
      ativo: cupom.ativo
    });
    setShowModal(true);
  };

  const getTipoLabel = (tipo: string) => {
    const labels = {
      free_12months: '🎁 12 meses grátis',
      desconto: '💰 Desconto',
      credito: '💳 Crédito'
    };
    return labels[tipo as keyof typeof labels] || tipo;
  };

  const getStatusBadge = (ativo: boolean, usado_vezes: number, max_uso: number) => {
    if (!ativo) return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">Inativo</span>;
    if (usado_vezes >= max_uso) return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">Esgotado</span>;
    return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">Ativo</span>;
  };

  const cuponsFiltrados = cupons.filter(c => 
    c.codigo.toLowerCase().includes(search.toLowerCase()) ||
    c.descricao?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFB800]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-black">Cupons Promocionais</h1>
          <p className="text-sm text-gray-500">Gerencie cupons para influencers e promoções</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#FFB800] text-black px-4 py-2 rounded-lg hover:bg-[#E6A600] transition flex items-center gap-2 font-semibold"
        >
          <Plus size={20} />
          Novo Cupom
        </button>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cupom..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
          />
        </div>
      </div>

      {/* Lista de Cupons */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usos</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Válido até</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cuponsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Nenhum cupom cadastrado
                  </td>
                </tr>
              ) : (
                cuponsFiltrados.map((cupom) => (
                  <tr key={cupom.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                        {cupom.codigo}
                      </code>
                      <button
                        onClick={() => copiarCodigo(cupom.codigo)}
                        className="ml-2 p-1 hover:bg-gray-200 rounded transition"
                      >
                        <Copy size={14} className="text-gray-400" />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm">{getTipoLabel(cupom.tipo)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{cupom.descricao || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      {cupom.usado_vezes}/{cupom.max_uso}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(cupom.ativo, cupom.usado_vezes, cupom.max_uso)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {cupom.valido_ate ? new Date(cupom.valido_ate).toLocaleDateString('pt-BR') : 'Sem prazo'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => editarCupom(cupom)}
                          className="p-1 hover:bg-blue-50 rounded transition text-blue-600"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => deletarCupom(cupom.id)}
                          className="p-1 hover:bg-red-50 rounded transition text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criar/Editar */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={resetForm} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    {editing ? 'Editar Cupom' : 'Novo Cupom'}
                  </h2>
                  <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código *
                    </label>
                    <input
                      type="text"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                      placeholder="Ex: INFLUENCER2026"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] uppercase"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo *
                    </label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800]"
                    >
                      <option value="free_12months">🎁 12 meses grátis</option>
                      <option value="desconto">💰 Desconto</option>
                      <option value="credito">💳 Crédito</option>
                    </select>
                  </div>

                  {formData.tipo === 'credito' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.valor}
                        onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <input
                      type="text"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Ex: Cupom para influencers"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Válido até (opcional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.valido_ate}
                      onChange={(e) => setFormData({ ...formData, valido_ate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Máximo de usos
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.max_uso}
                      onChange={(e) => setFormData({ ...formData, max_uso: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.ativo}
                      onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                      className="w-4 h-4 accent-[#FFB800]"
                    />
                    <label className="text-sm text-gray-700">Ativo</label>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-[#FFB800] text-black py-2 rounded-lg font-semibold hover:bg-[#E6A600] transition"
                    >
                      {editing ? 'Atualizar' : 'Criar'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
