'use client';

import React, { useRef, useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  PlayCircle,
  RotateCw
} from 'lucide-react';

interface StreamPlayerProps {
  src?: string;
  youtubeId?: string;
  title?: string;
  isLive?: boolean;
  posterUrl?: string;
}

// Ícone personalizado do YouTube
const YoutubeIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.56 49.56 0 0 1-16.2 0A2 2 0 0 1 2.5 17z"/>
    <path d="M10 15l5-3-5-3z"/>
  </svg>
);

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    // 🔥 REMOVER screen daqui para evitar conflito
  }
}

export default function StreamPlayer({ 
  src, 
  youtubeId, 
  title, 
  isLive, 
  posterUrl
}: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerWrapperRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [playerId] = useState(() => `yt-${Math.random().toString(36).substr(2, 9)}`);

  const extractYoutubeId = (input: string): string | null => {
    if (!input) return null;
    const clean = input.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean;
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&]+)/,
      /(?:youtu\.be\/)([^?]+)/,
      /(?:youtube\.com\/embed\/)([^?]+)/,
      /(?:youtube\.com\/v\/)([^?]+)/
    ];
    for (const pattern of patterns) {
      const match = clean.match(pattern);
      if (match && match[1]) {
        return match[1].split('&')[0].split('?')[0];
      }
    }
    if (clean.includes('&t=') || clean.includes('?t=')) {
      const baseId = clean.split(/[&?]t=/)[0];
      if (baseId && baseId.length === 11) return baseId;
    }
    const possibleId = clean.substring(0, 11);
    if (/^[a-zA-Z0-9_-]{11}$/.test(possibleId)) return possibleId;
    return null;
  };

  const cleanYoutubeId = youtubeId ? extractYoutubeId(youtubeId) : null;

  // 🔥 FUNÇÃO PARA GIRAR A TELA PARA PAISAGEM
  const girarParaPaisagem = async () => {
    try {
      // 🔥 Para dispositivos móveis (Android/iOS)
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape');
        setIsLandscape(true);
        console.log('📱 Tela bloqueada em paisagem');
      } 
      // 🔥 Fallback para navegadores que não suportam screen.orientation.lock
      else if (screen && (screen as any).lockOrientation) {
        (screen as any).lockOrientation('landscape');
        setIsLandscape(true);
        console.log('📱 Tela bloqueada em paisagem (fallback)');
      }
    } catch (error) {
      console.warn('⚠️ Não foi possível bloquear a orientação:', error);
    }
  };

  // 🔥 FUNÇÃO PARA VOLTAR PARA RETRATO
  const voltarParaRetrato = async () => {
    try {
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
        setIsLandscape(false);
        console.log('📱 Tela desbloqueada');
      } else if (screen && (screen as any).unlockOrientation) {
        (screen as any).unlockOrientation();
        setIsLandscape(false);
      }
    } catch (error) {
      console.warn('⚠️ Não foi possível desbloquear a orientação:', error);
    }
  };

  // 🔥 Tela cheia com rotação
  const toggleFullscreen = async () => {
    const element = playerWrapperRef.current;
    if (!element) return;
    
    try {
      const isFullscreenNow = !!(
        document.fullscreenElement || 
        (document as any).webkitFullscreenElement || 
        (document as any).mozFullScreenElement
      );
      
      if (isFullscreenNow) {
        // 🔥 Sair da tela cheia e voltar para retrato
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          (document as any).mozCancelFullScreen();
        }
        setIsFullscreen(false);
        await voltarParaRetrato();
      } else {
        // 🔥 Entrar em tela cheia e girar para paisagem
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          (element as any).mozRequestFullScreen();
        } else {
          // Fallback para iOS via iframe
          const iframe = element.querySelector('iframe');
          if (iframe) {
            try {
              if ((iframe as any).webkitEnterFullscreen) {
                (iframe as any).webkitEnterFullscreen();
              }
            } catch (e) {}
          }
        }
        setIsFullscreen(true);
        
        // 🔥 GIRAR PARA PAISAGEM
        await girarParaPaisagem();
      }
    } catch (e) {
      console.error('Erro no fullscreen:', e);
      // Fallback: tentar com o elemento pai
      try {
        const parent = element.parentElement;
        if (parent) {
          if ((parent as any).webkitRequestFullscreen) {
            (parent as any).webkitRequestFullscreen();
            setIsFullscreen(true);
            await girarParaPaisagem();
          }
        }
      } catch (e2) {}
    }
  };

  // 🔥 BOTÃO PARA GIRAR MANUALMENTE (caso o fullscreen não gire automaticamente)
  const toggleRotate = async () => {
    if (isLandscape) {
      await voltarParaRetrato();
    } else {
      await girarParaPaisagem();
    }
  };

  // Detectar mudanças de fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!(document.fullscreenElement || 
        (document as any).webkitFullscreenElement || 
        (document as any).mozFullScreenElement);
      setIsFullscreen(isFull);
      
      // Se saiu do fullscreen, voltar para retrato
      if (!isFull && isLandscape) {
        voltarParaRetrato();
      }
    };

    // 🔥 Detectar mudanças de orientação
    const handleOrientationChange = () => {
      if (screen.orientation) {
        const isLandscapeMode = screen.orientation.type.includes('landscape');
        setIsLandscape(isLandscapeMode);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    
    if (screen.orientation) {
      screen.orientation.addEventListener('change', handleOrientationChange);
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', handleOrientationChange);
      }
      // 🔥 Garantir que a tela volte ao normal ao desmontar
      voltarParaRetrato();
    };
  }, []);

  // Carregar a API do YouTube
  useEffect(() => {
    if (!cleanYoutubeId) return;

    if (window.YT && window.YT.Player) {
      setApiLoaded(true);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      setApiLoaded(true);
    };

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [cleanYoutubeId]);

  // Inicializar o player
  useEffect(() => {
    if (!apiLoaded || !cleanYoutubeId || !containerRef.current) return;

    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {}
      playerRef.current = null;
    }

    const container = containerRef.current;
    container.innerHTML = '';
    container.id = playerId;

    try {
      const player = new window.YT.Player(playerId, {
        height: '100%',
        width: '100%',
        videoId: cleanYoutubeId,
        playerVars: {
          autoplay: isLive ? 1 : 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          fs: 0,
          autohide: 1,
          disablekb: 1,
          origin: window.location.origin,
          cc_load_policy: 0,
          cc_lang_pref: 'pt',
          hl: 'pt',
          enablejsapi: 1,
          widget_referrer: window.location.origin,
          playsinline: 1
        },
        events: {
          onReady: (event: any) => {
            playerRef.current = event.target;
            setPlayerReady(true);
            console.log(' YouTube Player pronto');
            
            try {
              if (playerRef.current.setOption) {
                playerRef.current.setOption('cc', 'track', {});
              }
            } catch (e) {}
            
            if (isLive) {
              event.target.playVideo();
              setIsPlaying(true);
            }
          },
          onStateChange: (event: any) => {
            if (event.data === 1) {
              setIsPlaying(true);
            } else if (event.data === 2 || event.data === 0) {
              setIsPlaying(false);
            }
            
            try {
              if (playerRef.current && playerRef.current.setOption) {
                playerRef.current.setOption('cc', 'track', {});
              }
            } catch (e) {}
            
            if (playerRef.current) {
              try {
                setCurrentTime(playerRef.current.getCurrentTime() || 0);
                setDuration(playerRef.current.getDuration() || 0);
              } catch (e) {}
            }
          },
          onError: (event: any) => {
            console.error(' Erro no YouTube Player:', event);
            setError('Erro ao carregar o vídeo');
          }
        }
      });
      
      playerRef.current = player;
      
    } catch (error) {
      console.error('Erro ao criar player:', error);
      setError('Erro ao inicializar o player');
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [apiLoaded, cleanYoutubeId, isLive, playerId]);

  const togglePlay = () => {
    if (!playerRef.current || !playerReady) return;
    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch (e) {
      console.error('Erro no play:', e);
    }
  };

  const toggleMute = () => {
    if (!playerRef.current || !playerReady) return;
    try {
      if (isMuted) {
        playerRef.current.unMute();
      } else {
        playerRef.current.mute();
      }
      setIsMuted(!isMuted);
    } catch (e) {
      console.error('Erro no mute:', e);
    }
  };

  // Monitorar mute
  useEffect(() => {
    if (!playerRef.current || !playerReady) return;
    const checkMute = setInterval(() => {
      if (playerRef.current) {
        try {
          const muted = playerRef.current.isMuted();
          if (muted !== isMuted) {
            setIsMuted(muted);
          }
        } catch (e) {}
      }
    }, 1000);
    return () => clearInterval(checkMute);
  }, [playerReady]);

  if (cleanYoutubeId) {
    return (
      <div 
        ref={playerWrapperRef}
        className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group"
      >
        <style>{`
          .ytp-chrome-top,
          .ytp-chrome-bottom,
          .ytp-cued-thumbnail-overlay,
          .ytp-gradient-top,
          .ytp-gradient-bottom,
          .ytp-subtitles-button,
          .ytp-share-button,
          .ytp-watch-later-button,
          .ytp-cards-button,
          .ytp-title,
          .ytp-watermark,
          .ytp-suggestion-set,
          .ytp-panel,
          .ytp-title-text,
          .ytp-title-link,
          button[aria-label*="legenda" i],
          button[aria-label*="Legenda" i],
          button[aria-label*="subtitles" i],
          button[aria-label*="Subtitles" i],
          .ytp-subtitles-button,
          .caption-window,
          .ytp-caption-window-container,
          .ytp-caption-window,
          .ytp-caption-segment,
          .ytp-caption-window-rollup {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
          }
          
          #${playerId} {
            width: 100% !important;
            height: 100% !important;
          }
          
          #${playerId} iframe {
            width: 100% !important;
            height: 100% !important;
            pointer-events: none !important;
          }
        `}</style>
        
        <div ref={containerRef} className="w-full h-full" />
        
        <div className="absolute inset-0 z-20" />
        
        {isLive && (
          <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 z-30 pointer-events-none">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            AO VIVO
          </div>
        )}

        <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 z-30 pointer-events-none">
          <YoutubeIcon />
          <span>YouTube</span>
        </div>

        <div className="absolute bottom-16 left-0 right-0 px-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="pointer-events-auto">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={(e) => {
                if (playerRef.current && playerReady) {
                  try {
                    const time = parseFloat(e.target.value);
                    playerRef.current.seekTo(time, true);
                    setCurrentTime(time);
                  } catch (err) {}
                }
              }}
              className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
            />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none">
          <div className="flex items-center justify-center gap-6 text-white pointer-events-auto">
            <button
              onClick={togglePlay}
              className="p-3 hover:bg-white/20 rounded-full transition touch-manipulation"
              disabled={!playerReady}
            >
              {isPlaying ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
            </button>

            <button
              onClick={toggleMute}
              className="p-2 hover:bg-white/20 rounded-full transition touch-manipulation"
              disabled={!playerReady}
            >
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/20 rounded-full transition touch-manipulation"
            >
              {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>

            {/* 🔥 BOTÃO PARA GIRAR MANUALMENTE */}
            <button
              onClick={toggleRotate}
              className="p-2 hover:bg-white/20 rounded-full transition touch-manipulation"
              title={isLandscape ? 'Voltar para retrato' : 'Girar para paisagem'}
            >
              <RotateCw size={24} className={isLandscape ? 'text-[#FFB800]' : 'text-white'} />
            </button>
          </div>
        </div>

        {!apiLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4" />
              <p className="text-sm">Carregando player...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white z-40">
            <div className="text-center">
              <p className="text-lg font-semibold">{error}</p>
              <p className="text-sm text-gray-400 mt-2">ID: {cleanYoutubeId}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Player para HLS/arquivos locais
  if (src) {
    return (
      <div 
        ref={playerWrapperRef}
        className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group"
      >
        <video
          ref={videoRef}
          src={src}
          poster={posterUrl}
          className="w-full h-full object-contain"
          playsInline
          webkit-playsinline="true"
          onTimeUpdate={(e) => {
            setCurrentTime(e.currentTarget.currentTime);
          }}
          onLoadedMetadata={(e) => {
            setDuration(e.currentTarget.duration);
          }}
          onClick={() => {
            if (videoRef.current) {
              if (isPlaying) {
                videoRef.current.pause();
              } else {
                videoRef.current.play();
              }
              setIsPlaying(!isPlaying);
            }
          }}
        />
        
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-4 text-white">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (videoRef.current) {
                  if (isPlaying) {
                    videoRef.current.pause();
                  } else {
                    videoRef.current.play();
                  }
                  setIsPlaying(!isPlaying);
                }
              }}
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              {isPlaying ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
            </button>
            
            <span className="text-sm font-mono">
              {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}
            </span>
            
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={(e) => {
                if (videoRef.current) {
                  videoRef.current.currentTime = parseFloat(e.target.value);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
            />
            
            <span className="text-sm font-mono">
              {Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}
            </span>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (videoRef.current) {
                  videoRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }}
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                const container = e.currentTarget.closest('.aspect-video');
                if (container) {
                  if (!document.fullscreenElement) {
                    container.requestFullscreen();
                    setIsFullscreen(true);
                    girarParaPaisagem();
                  } else {
                    document.exitFullscreen();
                    setIsFullscreen(false);
                    voltarParaRetrato();
                  }
                }
              }}
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>

            <button
              onClick={toggleRotate}
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              <RotateCw size={20} className={isLandscape ? 'text-[#FFB800]' : 'text-white'} />
            </button>
          </div>
        </div>
        
        {isLive && (
          <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            AO VIVO
          </div>
        )}
      </div>
    );
  }

  // Fallback
  return (
    <div className="relative w-full aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
      <div className="text-center text-gray-400">
        <PlayCircle size={48} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum vídeo disponível</p>
        {youtubeId && (
          <p className="text-xs text-gray-500 mt-2">ID: {youtubeId}</p>
        )}
      </div>
    </div>
  );
}
