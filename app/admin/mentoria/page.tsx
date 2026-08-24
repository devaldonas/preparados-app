'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Live {
  id: number;
  youtube_id: string;
  titulo: string;
  descricao: string;
  data_hora: string;
  duracao: number;
  is_active: boolean;
  is_live: boolean;
  stream_url: string;
  poster_url: string;
  disponivel_apos_live: boolean;
}

export default function AdminMentoria() {
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Live | null>(null);
  const [formData, setFormData] = useState({
    youtube_id: '',
    titulo: '',
    descricao: '',
    data_hora: '',
    duracao: '',
    is_active: true,
    is_live: false,
    stream_url: '',
    poster_url: '',
    disponivel_apos_live: true
  });

  useEffect(() => {
    fetchLives();
  }, []);

  const fetchLives = async () => {
    try {
      const { data, error } = await supabase
        .from('mentoria_lives')
        .select('*')
        .order('data_hora', { ascending: false });

      if (error) throw error;
      setLives(data || []);
    } catch (error) {
      console.error('Erro ao buscar lives:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!formData.youtube_id || !formData.titulo || !formData.data_hora || !formData.duracao) {
        alert('Preencha todos os campos obrigatórios');
        return;
      }

      const dataHoraObj = new Date(formData.data_hora);
      if (isNaN(dataHoraObj.getTime())) {
        alert('Data inválida');
        return;
      }
      
      const payload = {
        youtube_id: formData.youtube_id.trim(),
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim() || null,
        data_hora: dataHoraObj.toISOString(),
        duracao: parseInt(formData.duracao) || 60,
        is_active: formData.is_active,
        is_live: formData.is_live,
        stream_url: formData.stream_url.trim() || null,
        poster_url: formData.poster_url.trim() || null,
        disponivel_apos_live: formData.disponivel_apos_live
      };

      let result;
      if (editing) {
        result = await supabase
          .from('mentoria_lives')
          .update(payload)
          .eq('id', editing.id);
      } else {
        result = await supabase
          .from('mentoria_lives')
          .insert([payload]);
      }

      if (result.error) throw result.error;
      
      await fetchLives();
      resetForm();
      alert(editing ? 'Live atualizada com sucesso!' : 'Live criada com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao salvar:', error);
      alert(`Erro: ${error?.message || 'Verifique o console'}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta live?')) return;
    
    try {
      const { error } = await supabase
        .from('mentoria_lives')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchLives();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir');
    }
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({
      youtube_id: '',
      titulo: '',
      descricao: '',
      data_hora: '',
      duracao: '',
      is_active: true,
      is_live: false,
      stream_url: '',
      poster_url: '',
      disponivel_apos_live: true
    });
  };

  const handleEdit = (live: Live) => {
    setEditing(live);
    const dataLocal = live.data_hora ? new Date(live.data_hora).toISOString().slice(0, 16) : '';
    
    setFormData({
      youtube_id: live.youtube_id || '',
      titulo: live.titulo || '',
      descricao: live.descricao || '',
      data_hora: dataLocal,
      duracao: String(live.duracao || ''),
      is_active: live.is_active,
      is_live: live.is_live,
      stream_url: live.stream_url || '',
      poster_url: live.poster_url || '',
      disponivel_apos_live: live.disponivel_apos_live !== false
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFB800]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-black">Administração de Mentoria</h1>
        <button
          onClick={resetForm}
          className="bg-[#FFB800] text-black px-4 py-2 rounded-lg hover:bg-[#E6A600] transition font-semibold"
        >
          Nova Live
        </button>
      </div>

      <div className="bg-white rounded-lg p-6 mb-8 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          {editing ? 'Editar Live' : 'Nova Live'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">YouTube ID *</label>
              <input
                type="text"
                value={formData.youtube_id}
                onChange={(e) => setFormData({ ...formData, youtube_id: e.target.value })}
                placeholder="Ex: dQw4w9WgXcQ"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-[#FFB800] outline-none text-gray-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Título *</label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-[#FFB800] outline-none text-gray-800"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-700">Descrição</label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-[#FFB800] outline-none text-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Data e Hora *</label>
              <input
                type="datetime-local"
                value={formData.data_hora}
                onChange={(e) => setFormData({ ...formData, data_hora: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-[#FFB800] outline-none text-gray-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Duração (minutos) *</label>
              <input
                type="number"
                value={formData.duracao}
                onChange={(e) => setFormData({ ...formData, duracao: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-[#FFB800] outline-none text-gray-800"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">URL do Poster</label>
              <input
                type="url"
                value={formData.poster_url}
                onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                placeholder="https://img.youtube.com/vi/ID/hqdefault.jpg"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-[#FFB800] outline-none text-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">URL do Stream (opcional)</label>
              <input
                type="url"
                value={formData.stream_url}
                onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
                placeholder="https://exemplo.com/stream.m3u8"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-[#FFB800] outline-none text-gray-800"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-gray-700">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 accent-[#FFB800]"
              />
              <span>Ativa</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-gray-700">
              <input
                type="checkbox"
                checked={formData.is_live}
                onChange={(e) => setFormData({ ...formData, is_live: e.target.checked })}
                className="w-4 h-4 accent-[#FFB800]"
              />
              <span>Ao Vivo Agora</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-gray-700">
              <input
                type="checkbox"
                checked={formData.disponivel_apos_live}
                onChange={(e) => setFormData({ ...formData, disponivel_apos_live: e.target.checked })}
                className="w-4 h-4 accent-[#FFB800]"
              />
              <span>Disponível após a live</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="bg-[#FFB800] text-black px-6 py-2 rounded-lg hover:bg-[#E6A600] transition font-semibold"
            >
              {editing ? 'Atualizar' : 'Criar'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lives.map((live) => {
          const isPassada = new Date(live.data_hora) < new Date() && !live.is_live;
          return (
            <div key={live.id} className="bg-white rounded-lg overflow-hidden border border-gray-200">
              <div className="aspect-video bg-gray-200 relative">
                {live.poster_url ? (
                  <img 
                    src={live.poster_url} 
                    alt={live.titulo}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    Sem imagem
                  </div>
                )}
                {live.is_live && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
                    LIVE
                  </div>
                )}
                {isPassada && (
                  <div className="absolute top-2 right-2 bg-gray-500 text-white px-2 py-1 rounded text-xs">
                    Gravada
                  </div>
                )}
                {live.youtube_id && (
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    YouTube
                  </div>
                )}
                {!live.disponivel_apos_live && isPassada && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">Indisponível</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 text-lg">{live.titulo}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{live.descricao}</p>
                <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                  <span>{new Date(live.data_hora).toLocaleDateString('pt-BR')}</span>
                  <span>{live.duracao} min</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleEdit(live)}
                    className="flex-1 bg-[#FFB800] text-black px-3 py-1 rounded hover:bg-[#E6A600] transition text-sm font-semibold"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(live.id)}
                    className="flex-1 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition text-sm"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {lives.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          Nenhuma live cadastrada.
        </div>
      )}
    </div>
  );
}
