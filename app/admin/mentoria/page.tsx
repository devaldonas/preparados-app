'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Calendar, Video, Bell, ArrowLeft } from 'lucide-react';

interface Live {
  id: number;
  youtube_id: string;
  titulo: string;
  descricao: string;
  data_hora: string;
  duracao: number;
  is_active: boolean;
  is_live: boolean;
  created_at: string;
}

export default function AdminMentoria() {
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingLive, setEditingLive] = useState<Live | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    youtube_id: '',
    titulo: '',
    descricao: '',
    data_hora: '',
    duracao: 60,
    is_active: true,
    is_live: false,
  });

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

        if (error) {
          console.error('Erro ao buscar perfil:', error);
          router.push('/dashboard');
          return;
        }

        // CORRIGIDO: usando any para evitar erro de tipo
        const profileData = profile as any;
        if (profileData?.role !== 'admin') {
          router.push('/dashboard');
          return;
        }

        setIsAdmin(true);
        await carregarLives();
      } catch (error) {
        console.error('Erro ao verificar admin:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [router]);

  const carregarLives = async () => {
    try {
      const { data, error } = await supabase
        .from('mentoria_lives')
        .select('*')
        .order('data_hora', { ascending: false });

      if (error) {
        console.error('Erro ao carregar lives:', error);
        setLives([]);
      } else {
        setLives(data as Live[] || []);
      }
    } catch (error) {
      console.error('Erro ao carregar lives:', error);
      setLives([]);
    } finally {
      setLoading(false);
    }
  };

  const salvarLive = async () => {
    if (!formData.youtube_id || !formData.titulo) {
      alert('Preencha o ID do YouTube e o título');
      return;
    }

    const liveData = {
      ...formData,
      data_hora: formData.data_hora ? new Date(formData.data_hora).toISOString() : null,
    };

    try {
      let error;
      if (editingLive) {
        const { error: updateError } = await (supabase
          .from('mentoria_lives') as any)
          .update(liveData)
          .eq('id', editingLive.id);
        error = updateError;
      } else {
        const { error: insertError } = await (supabase
          .from('mentoria_lives') as any)
          .insert([liveData]);
        error = insertError;
      }

      if (error) throw error;

      alert('Live salva com sucesso!');
      setShowForm(false);
      setEditingLive(null);
      setFormData({
        youtube_id: '',
        titulo: '',
        descricao: '',
        data_hora: '',
        duracao: 60,
        is_active: true,
        is_live: false,
      });
      await carregarLives();
    } catch (error) {
      console.error('Erro ao salvar live:', error);
      alert('Erro ao salvar: ' + (error as any).message);
    }
  };

  const deletarLive = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta live?')) return;

    try {
      const { error } = await (supabase
        .from('mentoria_lives') as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      await carregarLives();
    } catch (error) {
      console.error('Erro ao deletar live:', error);
      alert('Erro ao deletar: ' + (error as any).message);
    }
  };

  const enviarNotificacao = async (liveId: number) => {
    if (!confirm('Enviar notificação push para todos os usuários?')) return;

    try {
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id');

      if (usersError) throw usersError;

      if (!users || users.length === 0) {
        alert('Nenhum usuário encontrado');
        return;
      }

      const notificacoes = users.map((user: any) => ({
        usuario_id: user.id,
        live_id: liveId,
        enviado: true,
        enviado_em: new Date().toISOString(),
      }));

      const { error } = await (supabase
        .from('mentoria_notificacoes') as any)
        .insert(notificacoes);

      if (error) throw error;

      alert(`✅ Notificações enviadas para ${users.length} usuários!`);
    } catch (error) {
      console.error('Erro ao enviar notificações:', error);
      alert('Erro ao enviar notificações: ' + (error as any).message);
    }
  };

  const editarLive = (live: Live) => {
    setEditingLive(live);
    setFormData({
      youtube_id: live.youtube_id,
      titulo: live.titulo,
      descricao: live.descricao || '',
      data_hora: live.data_hora ? new Date(live.data_hora).toISOString().slice(0, 16) : '',
      duracao: live.duracao || 60,
      is_active: live.is_active,
      is_live: live.is_live || false,
    });
    setShowForm(true);
  };

  if (loading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header com botão Voltar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
              title="Voltar ao Admin"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Voltar</span>
            </button>
            <h1 className="text-2xl font-bold text-black">Gerenciar Mentoria</h1>
          </div>
          <button
            onClick={() => {
              setEditingLive(null);
              setFormData({
                youtube_id: '',
                titulo: '',
                descricao: '',
                data_hora: '',
                duracao: 60,
                is_active: true,
                is_live: false,
              });
              setShowForm(!showForm);
            }}
            className="bg-[#FFB800] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition flex items-center gap-2"
          >
            <Plus size={20} />
            Nova Live
          </button>
        </div>

        {/* Formulário */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="font-bold text-black mb-4">
              {editingLive ? 'Editar Live' : 'Nova Live'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID do YouTube <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.youtube_id}
                  onChange={(e) => setFormData({ ...formData, youtube_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Ex: dQw4w9WgXcQ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Título da live"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Descrição da live"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data e Hora
                </label>
                <input
                  type="datetime-local"
                  value={formData.data_hora}
                  onChange={(e) => setFormData({ ...formData, data_hora: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duração (minutos)
                </label>
                <input
                  type="number"
                  value={formData.duracao}
                  onChange={(e) => setFormData({ ...formData, duracao: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  min="15"
                  max="180"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700">Ativo</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_live}
                    onChange={(e) => setFormData({ ...formData, is_live: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700">Ao Vivo</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={salvarLive}
                className="bg-[#FFB800] text-black px-6 py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingLive(null);
                }}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Lista de Lives */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Live</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">YouTube ID</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Data/Hora</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {lives.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      Nenhuma live cadastrada. Clique em "Nova Live" para começar.
                    </td>
                  </tr>
                ) : (
                  lives.map((live) => (
                    <tr key={live.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-black">{live.titulo}</p>
                          <p className="text-xs text-gray-500 truncate max-w-xs">{live.descricao}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">{live.youtube_id}</td>
                      <td className="px-4 py-3 text-sm">
                        {live.data_hora ? new Date(live.data_hora).toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${live.is_live ? 'bg-red-500 text-white animate-pulse' : live.is_active ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                          {live.is_live ? 'AO VIVO' : live.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => editarLive(live)}
                            className="p-1 hover:bg-gray-200 rounded transition"
                            title="Editar"
                          >
                            <Edit size={16} className="text-gray-600" />
                          </button>
                          <button
                            onClick={() => enviarNotificacao(live.id)}
                            className="p-1 hover:bg-gray-200 rounded transition"
                            title="Enviar notificação"
                          >
                            <Bell size={16} className="text-blue-500" />
                          </button>
                          <button
                            onClick={() => deletarLive(live.id)}
                            className="p-1 hover:bg-gray-200 rounded transition"
                            title="Deletar"
                          >
                            <Trash2 size={16} className="text-red-500" />
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
      </div>
    </div>
  );
}