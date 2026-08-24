'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import StreamPlayer from '@/components/StreamPlayer';

interface Live {
  id: string;
  youtube_id: string;
  titulo: string;
  descricao: string;
  data_hora: string;
  duracao: string;
  is_active: boolean;
  is_live: boolean;
  stream_url: string;
  poster_url: string;
  disponivel_apos_live: boolean;
}

export default function MentoriaPage() {
  const [lives, setLives] = useState<Live[]>([]);
  const [liveAtiva, setLiveAtiva] = useState<Live | null>(null);
  const [livesPassadas, setLivesPassadas] = useState<Live[]>([]);
  const [livesFuturas, setLivesFuturas] = useState<Live[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoSelecionado, setVideoSelecionado] = useState<Live | null>(null);

  useEffect(() => {
    fetchLives();

    const subscription = supabase
      .channel('mentoria_lives')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'mentoria_lives' 
        }, 
        () => {
          fetchLives();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchLives = async () => {
    try {
      const { data, error } = await supabase
        .from('mentoria_lives')
        .select('*')
        .eq('is_active', true)
        .order('data_hora', { ascending: true });

      if (error) throw error;

      const agora = new Date();
      const livesData = data || [];

      const aoVivo = livesData.find(live => live.is_live);
      setLiveAtiva(aoVivo || null);

      const passadas = livesData.filter(live => {
        const dataLive = new Date(live.data_hora);
        return dataLive < agora && !live.is_live && live.disponivel_apos_live !== false;
      });
      setLivesPassadas(passadas);

      const futuras = livesData.filter(live => {
        const dataLive = new Date(live.data_hora);
        return dataLive >= agora && !live.is_live;
      });
      setLivesFuturas(futuras);

    } catch (error) {
      console.error('Erro ao buscar lives:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssistir = (live: Live) => {
    setVideoSelecionado(live);
    // Scroll para o topo da página
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fecharPlayer = () => {
    setVideoSelecionado(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Mentoria</h1>
      
      {/* Player em destaque para vídeo selecionado */}
      {videoSelecionado && (
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">
              {videoSelecionado.titulo}
            </h2>
            <button
              onClick={fecharPlayer}
              className="text-gray-400 hover:text-white transition"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <StreamPlayer
              youtubeId={videoSelecionado.youtube_id}
              title={videoSelecionado.titulo}
              isLive={false}
              posterUrl={videoSelecionado.poster_url}
            />
            <div className="p-6">
              <p className="text-gray-400">{videoSelecionado.descricao}</p>
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                <span>{new Date(videoSelecionado.data_hora).toLocaleDateString('pt-BR')}</span>
                <span>{videoSelecionado.duracao} minutos</span>
                <span className="bg-gray-700 px-2 py-1 rounded text-xs">Gravada</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Live Ativa */}
      {liveAtiva && !videoSelecionado && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            Ao Vivo Agora
          </h2>
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <StreamPlayer
              youtubeId={liveAtiva.youtube_id}
              title={liveAtiva.titulo}
              isLive={true}
              posterUrl={liveAtiva.poster_url}
            />
            <div className="p-6">
              <h3 className="text-xl font-bold text-white">{liveAtiva.titulo}</h3>
              <p className="text-gray-400 mt-2">{liveAtiva.descricao}</p>
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                <span>{new Date(liveAtiva.data_hora).toLocaleDateString('pt-BR')}</span>
                <span>{liveAtiva.duracao} minutos</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Próximas Lives */}
      {livesFuturas.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">
            Próximas Lives
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {livesFuturas.map((live) => (
              <div key={live.id} className="bg-gray-800 rounded-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="aspect-video bg-gray-700 relative">
                  {live.poster_url ? (
                    <img 
                      src={live.poster_url} 
                      alt={live.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      Sem imagem
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                    Em breve
                  </div>
                  {live.youtube_id && (
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <span>YouTube</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{live.titulo}</h3>
                  <p className="text-sm text-gray-400 mt-1 line-clamp-2">{live.descricao}</p>
                  <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                    <span>{new Date(live.data_hora).toLocaleDateString('pt-BR')}</span>
                    <span>{live.duracao} min</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lives Passadas */}
      {livesPassadas.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-6">
            Lives Passadas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {livesPassadas.map((live) => (
              <div key={live.id} className="bg-gray-800 rounded-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="aspect-video bg-gray-700 relative">
                  {live.poster_url ? (
                    <img 
                      src={live.poster_url} 
                      alt={live.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      Sem imagem
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-gray-500 text-white px-2 py-1 rounded text-xs">
                    Gravada
                  </div>
                  {live.youtube_id && (
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <span>YouTube</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{live.titulo}</h3>
                  <p className="text-sm text-gray-400 mt-1 line-clamp-2">{live.descricao}</p>
                  <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                    <span>{new Date(live.data_hora).toLocaleDateString('pt-BR')}</span>
                    <span>{live.duracao} min</span>
                  </div>
                  <button
                    onClick={() => handleAssistir(live)}
                    className="mt-4 w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition text-sm"
                  >
                    Assistir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensagem quando não há nada */}
      {!liveAtiva && livesFuturas.length === 0 && livesPassadas.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Nenhuma live disponível no momento.
        </div>
      )}
    </div>
  );
}
