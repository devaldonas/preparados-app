// components/YouTubePlayer.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';

interface YouTubePlayerProps {
  videoId: string;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const isApiReady = useRef(false);

  const cleanId = videoId?.replace(/\?.*$/, '').trim() || '';

  useEffect(() => {
    if (!cleanId) return;

    if (window.YT && window.YT.Player) {
      isApiReady.current = true;
      createPlayer();
      return;
    }

    const script = document.getElementById('youtube-api-script');
    if (!script) {
      const newScript = document.createElement('script');
      newScript.id = 'youtube-api-script';
      newScript.src = 'https://www.youtube.com/iframe_api';
      newScript.async = true;
      document.body.appendChild(newScript);
    }

    window.onYouTubeIframeAPIReady = () => {
      isApiReady.current = true;
      createPlayer();
    };

    return () => {
      if (player && player.destroy) {
        player.destroy();
      }
    };
  }, [cleanId]);

  const createPlayer = () => {
    if (!playerContainerRef.current || !window.YT) return;

    try {
      const newPlayer = new window.YT.Player(playerContainerRef.current, {
        videoId: cleanId,
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          controls: 0,
          fs: 0,
          iv_load_policy: 3,
          disablekb: 1,
          cc_load_policy: 0,
          hl: 'pt',
        },
        events: {
          onReady: () => {
            console.log('✅ Player do YouTube pronto!');
            setIsLoading(false);
            setIsPlayerReady(true);
            setPlayer(newPlayer);
          },
          onStateChange: (event: any) => {
            const state = event.data;
            setIsPlaying(state === 1);
          },
          onError: (error: any) => {
            console.error('❌ Erro no player:', error);
            setIsLoading(false);
          },
        },
      });
    } catch (error) {
      console.error('❌ Erro ao criar player:', error);
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    if (!player || !isPlayerReady) {
      console.log('⏳ Player ainda não está pronto');
      return;
    }
    
    try {
      if (isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    } catch (error) {
      console.error('❌ Erro ao controlar player:', error);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      container.requestFullscreen().catch(() => {});
    }
  };

  if (!cleanId) {
    return (
      <div className="bg-black rounded-xl overflow-hidden shadow-lg aspect-video w-full flex items-center justify-center">
        <p className="text-gray-400">Vídeo indisponível</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="bg-black rounded-xl overflow-hidden shadow-lg aspect-video w-full relative group">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]" />
          <p className="text-gray-400 text-sm ml-3">Carregando vídeo...</p>
        </div>
      )}

      <div ref={playerContainerRef} className="w-full h-full" />

      {!isPlayerReady && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-15 bg-black/50">
          <p className="text-white text-sm">Preparando player...</p>
        </div>
      )}

      {isPlayerReady && !isPlaying && (
        <div 
          className="absolute inset-0 z-20"
          style={{ pointerEvents: 'auto', background: 'transparent' }}
          onClick={togglePlay}
        />
      )}

      {isPlayerReady && !isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-15 pointer-events-none">
          <div className="bg-black/50 px-6 py-3 rounded-full backdrop-blur-sm">
            <p className="text-white/70 text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
                <polygon points="5,3 19,12 5,21" />
              </svg>
              Clique para reproduzir
            </p>
          </div>
        </div>
      )}

      {isPlaying && isPlayerReady && (
        <div className="absolute top-4 left-4 z-25 pointer-events-none">
          <span className="text-xs text-green-400 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Reproduzindo
          </span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              togglePlay(); 
            }}
            className="text-white hover:text-[#FFB800] transition-colors disabled:opacity-50"
            disabled={!isPlayerReady}
            title={isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>

          <span className="text-white/60 text-sm">
            {isPlaying ? '▶ Reproduzindo' : '⏸ Pausado'}
          </span>

          <button
            onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
            className="text-white hover:text-[#FFB800] transition-colors ml-auto"
            title="Tela cheia"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        .ytp-subtitles-button { display: none !important; }
        .ytp-subtitles { display: none !important; }
        .captions-text { display: none !important; }
        .ytp-caption-segment { display: none !important; }
        .ytp-caption-window { display: none !important; }
        .ytp-chrome-top { display: none !important; }
      `}</style>
    </div>
  );
};

export default YouTubePlayer;