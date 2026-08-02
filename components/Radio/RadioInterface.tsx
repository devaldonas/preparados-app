// components/Radio/RadioInterface.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserLocation } from '@/hooks/useUserLocation';
import { RadioGroup, NearbyUser } from '@/types/radio';
import { getNearbyGroups } from '@/lib/radio/getGroups';
import { getNearbyUsers } from '@/lib/radio/getNearbyUsers';
import KnobElegante from './KnobElegante';
import { supabase } from '@/lib/supabaseClient';
import dynamic from 'next/dynamic';
import AudioSpectrum from './AudioSpectrum';
import { Map, Radar, Sliders } from 'lucide-react';

const MapaComClusters = dynamic(
  () => import('@/components/MapaComClusters'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[200px] rounded-xl overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFB800]" />
      </div>
    )
  }
)

interface RadioInterfaceProps {
  initialChannel?: string;
  initialGroup?: string;
  userLatitude?: number;
  userLongitude?: number;
  onClose?: () => void;
}

interface UserLocation {
  userId: string;
  userName: string | null;
  latitude: number;
  longitude: number;
  groupId: number | null;
  cep: string;
  mochila_tipo: string;
  city: string | null;
  state: string | null;
}

const RadioInterface: React.FC<RadioInterfaceProps> = ({
  initialChannel = 'CH CIDADES',
  initialGroup = 'Todos',
  userLatitude,
  userLongitude,
  onClose,
}) => {
  const router = useRouter();
  
  // Estados do rádio
  const [isOn, setIsOn] = useState(true);
  const [currentChannel, setCurrentChannel] = useState(initialChannel);
  const [selectedGroup, setSelectedGroup] = useState(initialGroup);
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [range, setRange] = useState(50);
  const [activeTab, setActiveTab] = useState<'mapa' | 'controles' | 'radar'>('mapa');
  const [isMicActive, setIsMicActive] = useState(false);
  const [groups, setGroups] = useState<RadioGroup[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSomeoneSpeaking, setIsSomeoneSpeaking] = useState(false);
  const [speakerName, setSpeakerName] = useState('');
  const [speakerCity, setSpeakerCity] = useState('');
  const [audioURLs, setAudioURLs] = useState<{ id: string; url: string; from: string }[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentGroupId, setCurrentGroupId] = useState<string>('todos');

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMouseDownRef = useRef(false);
  const rangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioChannelRef = useRef<any>(null);
  const animationRef = useRef<number>(0);

  // Localização do usuário
  const { latitude, longitude } = useUserLocation();

  // Buscar usuário e verificar se é admin
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name, city, state')
          .eq('id', user.id)
          .single();
        
        if (profile?.role === 'admin') {
          setIsAdmin(true);
        }
        if (profile) {
          setSpeakerName(profile.full_name || 'Usuário');
          setSpeakerCity(profile.city || 'Cidade');
        }
      }
    };
    getUser();
  }, []);

  // Carregar dados
  useEffect(() => {
    const loadRadioData = async () => {
      setIsLoading(true);
      const lat = userLatitude || latitude;
      const lng = userLongitude || longitude;

      if (lat && lng) {
        const nearbyGroups = await getNearbyGroups(lat, lng, range);
        
        if (nearbyGroups.length > 0) {
          setGroups([
            {
              id: 'todos',
              name: 'Todos',
              city: 'Todas as cidades',
              state: 'Brasil',
              latitude: lat,
              longitude: lng,
              members: nearbyGroups.reduce((acc, g) => acc + g.members, 0),
            },
            ...nearbyGroups,
          ]);
        } else {
          setGroups([
            {
              id: 'default',
              name: 'Todos',
              city: 'Sua Cidade',
              state: 'Estado',
              latitude: lat,
              longitude: lng,
              members: 1,
            },
          ]);
        }

        const users = await getNearbyUsers(lat, lng, range);
        setNearbyUsers(users);
        setConnectedUsers(users.filter((u) => u.status === 'online').length);

        // Carrega localizações para o mapa
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, cep, latitude, longitude, mochila_tipo, group_id, city, state')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);

        if (data) {
          setUserLocations(data.map((p: any) => ({
            userId: p.id,
            userName: p.full_name,
            latitude: p.latitude,
            longitude: p.longitude,
            groupId: p.group_id,
            cep: p.cep || '',
            mochila_tipo: p.mochila_tipo || 'BOB',
            city: p.city || null,
            state: p.state || null
          })));
        }
      }
      setIsLoading(false);
    };

    loadRadioData();
  }, [userLatitude, userLongitude, latitude, longitude, range]);

  // Configurar listener de áudio
  useEffect(() => {
  if (selectedGroup && isOn) {
    console.log(`🔄 Grupo mudou para: ${selectedGroup}, configurando listener...`);
    setupAudioListener();
    
    return () => {
      // Só desconecta se não for o mesmo grupo
      if (audioChannelRef.current) {
        console.log(`🔄 Desconectando canal do grupo: ${selectedGroup}`);
        audioChannelRef.current.unsubscribe();
        audioChannelRef.current = null;
      }
    };
  }
}, [selectedGroup]); // ← Removido isOn das dependências

// Reconectar quando o rádio for ligado/desligado
useEffect(() => {
  if (isOn && selectedGroup) {
    console.log('🔄 Rádio ligado, reconectando canal...');
    // Pequeno delay para evitar conflitos
    setTimeout(() => {
      setupAudioListener();
    }, 100);
  } else if (!isOn && audioChannelRef.current) {
    console.log('🔇 Rádio desligado, desconectando canal...');
    audioChannelRef.current.unsubscribe();
    audioChannelRef.current = null;
  }
}, [isOn]);

  // Função para abrir chat do grupo
  const abrirChatDoGrupo = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('group_id')
        .eq('id', userId)
        .single();

      if (profile?.group_id) {
        router.push(`/grupo/${profile.group_id}`);
      } else {
        router.push('/grupo');
      }
    } catch (error) {
      console.error('Erro ao abrir chat:', error);
    }
  };

  /// Setup do listener de áudio com ID do grupo
const setupAudioListener = (groupId?: string) => {
  const groupIdToUse = groupId || currentGroupId || 'todos';
  
  console.log(`🎧 Configurando listener para o grupo ID: ${groupIdToUse}`);
  
  // Se já tiver um canal, desconecta
  if (audioChannelRef.current) {
    console.log('🔄 Desconectando canal anterior');
    audioChannelRef.current.unsubscribe();
    audioChannelRef.current = null;
  }
  
  // USANDO CANAL FIXO PARA TESTE - Mude para groupIdToUse depois
  const channelName = `radio:teste`; // Canal fixo para teste
  // const channelName = `radio:${groupIdToUse}`; // Descomente depois
  
  console.log(`📡 Usando canal: ${channelName}`);
  
  const channel = supabase.channel(channelName);
  
  // Listener para QUALQUER broadcast (debug)
  channel.on('broadcast', { event: '*' }, (payload) => {
    console.log('📡📡📡 BROADCAST GENÉRICO RECEBIDO:', payload);
  });
  
  channel
    .on('broadcast', { event: 'novo-audio' }, (payload) => {
      console.log('📡 Áudio RECEBIDO via broadcast (evento específico):', payload);
      handleReceivedAudio(payload.payload);
    })
    .subscribe((status) => {
      console.log(`📡 Status do canal: ${status}`);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Canal SUBSCRIBED - Pronto para receber mensagens!');
      }
    });
  
  audioChannelRef.current = channel;
  console.log('✅ Listener configurado com sucesso!');
};

  // Processar áudio recebido
  const handleReceivedAudio = (payload: any) => {
  console.log('📡 handleReceivedAudio chamado');
  console.log('📡 Payload recebido:', payload);
  console.log('📡 De: ', payload.from);
  console.log('📡 Meu ID:', currentUser?.id);
  console.log('📡 Comparação:', payload.from === currentUser?.id);
  
  // CORREÇÃO: Comparação mais robusta
  if (payload.from === currentUser?.id || payload.from === currentUser?.id?.toString()) {
    console.log('🔇 Ignorando próprio áudio');
    return;
  }
  
  console.log('✅ Áudio de outro usuário!');
  
  // Atualiza quem está falando
  setIsSomeoneSpeaking(true);
  setSpeakerName(payload.fromName || 'Preparado');
  setSpeakerCity(payload.fromCity || 'Cidade');
  
  // Toca o beep de recebimento
  playBeep();
  
  // Converte base64 para Blob e reproduz
  try {
    console.log('🔄 Convertendo base64 para áudio...');
    const audioBlob = base64ToBlob(payload.audio);
    console.log('📦 Áudio convertido, tamanho:', audioBlob.size);
    const url = URL.createObjectURL(audioBlob);
    console.log('🔗 URL criada:', url);
    
    // Adiciona ao histórico
    setAudioURLs(prev => [...prev, {
      id: payload.id,
      url: url,
      from: payload.fromName || 'Preparado'
    }]);
    
    // Reproduz o áudio
    const audio = new Audio(url);
    audio.volume = volume / 100;
    console.log('▶️ Reproduzindo áudio...');
    audio.play()
      .then(() => console.log('✅ Áudio reproduzido com sucesso!'))
      .catch(e => console.log('❌ Erro ao reproduzir:', e));
    
    // Reseta o estado após o áudio terminar
    audio.onended = () => {
      console.log('⏹️ Áudio terminou');
      setIsSomeoneSpeaking(false);
    };
  } catch (err) {
    console.error('❌ Erro ao processar áudio:', err);
  }
};

  // Converter base64 para Blob
  const base64ToBlob = (base64: string) => {
    const parts = base64.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    
    return new Blob([uInt8Array], { type: contentType });
  };

  // Canais
  const channels = [
    { id: 'CH CIDADES', label: 'CH CIDADES', available: true },
    { id: 'CH ADMIN', label: 'CH ADMIN', available: isAdmin },
  ];

  const colors = {
    background: '#0a0a0a',
    card: '#111111',
    cardBorder: '#1a1a1a',
    textPrimary: '#ffffff',
    textSecondary: '#888888',
    accent: '#FFD700',
    inputBg: '#0d0d0d',
    inputBorder: '#1a1a1a',
  };

 // Mudar canal
const handleChannelChange = async (channelId: string) => {
  setCurrentChannel(channelId);
  const lat = userLatitude || latitude;
  const lng = userLongitude || longitude;

  if (channelId === 'CH CIDADES') {
    const nearbyGroups = await getNearbyGroups(lat, lng, range);
    if (nearbyGroups.length > 0) {
      const groupsWithIds = [
        {
          id: 'todos',
          name: 'Todos',
          city: 'Todas as cidades',
          state: 'Brasil',
          latitude: lat,
          longitude: lng,
          members: nearbyGroups.reduce((acc, g) => acc + g.members, 0),
        },
        ...nearbyGroups,
      ];
      setGroups(groupsWithIds);
      
      // Seleciona o primeiro grupo (Todos) e salva o ID
      const firstGroup = groupsWithIds[0];
      setSelectedGroup(firstGroup.name);
      setCurrentGroupId(firstGroup.id);
      
      // Configura o listener com o ID do grupo
      setupAudioListener(firstGroup.id);
    } else {
      const defaultGroup = {
        id: 'default',
        name: 'Todos',
        city: 'Sua Cidade',
        state: 'Estado',
        latitude: lat,
        longitude: lng,
        members: 1,
      };
      setGroups([defaultGroup]);
      setSelectedGroup(defaultGroup.name);
      setCurrentGroupId(defaultGroup.id);
      setupAudioListener(defaultGroup.id);
    }
  } else if (channelId === 'CH ADMIN' && isAdmin) {
    const { data: admins } = await supabase
      .from('profiles')
      .select('id, full_name, city, state, latitude, longitude')
      .eq('role', 'admin')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (admins && admins.length > 0) {
      const adminGroups = [
        {
          id: 'todos-admin',
          name: 'Todos os Admins',
          city: 'Administradores',
          state: 'Brasil',
          latitude: lat,
          longitude: lng,
          members: admins.length,
        },
        ...admins.map((admin) => ({
          id: `admin-${admin.id}`,
          name: admin.full_name || 'Admin',
          city: admin.city || 'Cidade',
          state: admin.state || 'Estado',
          latitude: admin.latitude || 0,
          longitude: admin.longitude || 0,
          members: 1,
        })),
      ];
      setGroups(adminGroups);
      
      const firstGroup = adminGroups[0];
      setSelectedGroup(firstGroup.name);
      setCurrentGroupId(firstGroup.id);
      setupAudioListener(firstGroup.id);
    }
    setSelectedGroup('Todos os Admins');
  }
};
  // Áudio do beep
  useEffect(() => {
    audioRef.current = new Audio('/roger-beep.mp3');
    audioRef.current.load();
  }, []);

  const playBeep = useCallback(() => {
    if (audioRef.current && isOn) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = volume / 100;
      audioRef.current.play().catch(() => {});
    }
  }, [isOn, volume]);

  // Funções de gravação de áudio
  const startRecording = async () => {
  console.log('🎤 startRecording chamado');
  console.log('isOn:', isOn);
  console.log('currentUser:', currentUser);
  
  if (!isOn) {
    console.log('❌ Rádio desligado, não pode gravar');
    return;
  }

  if (!currentUser) {
    console.log('❌ Usuário não autenticado');
    return;
  }

  try {
    console.log('🎤 Solicitando acesso ao microfone...');
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: { 
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } 
    });
    console.log('✅ Microfone acessado com sucesso!');
    
    // Analisador de áudio
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const updateLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const level = Math.min(100, (average / 255) * 100);
      setAudioLevel(level);
      animationRef.current = requestAnimationFrame(updateLevel);
    };
    
    updateLevel();
    
    mediaRecorderRef.current = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });
    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      console.log('📦 Dados de áudio disponíveis:', event.data.size);
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = async () => {
      console.log('🛑 Gravação finalizada');
      console.log('📦 Chunks de áudio:', audioChunksRef.current.length);
      
      if (audioChunksRef.current.length === 0) {
        console.log('⚠️ Nenhum dado de áudio foi gravado');
        return;
      }
      
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      console.log('📦 Tamanho do áudio:', audioBlob.size, 'bytes');
      
      if (audioBlob.size > 0) {
        await enviarAudio(audioBlob);
      } else {
        console.log('⚠️ Áudio vazio, não enviado');
      }
      
      stream.getTracks().forEach(track => track.stop());
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setAudioLevel(0);
    };

    mediaRecorderRef.current.start();
    console.log('🎤 Gravação iniciada!');
    setIsRecording(true);
    setIsMicActive(true);
    setIsSomeoneSpeaking(true);
    
    playBeep();
    
    // REMOVIDO: timeout de 15 segundos - agora o usuário controla

  } catch (err) {
    console.error('❌ Erro ao acessar microfone:', err);
    alert('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
  }
};

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsMicActive(false);
      setIsSomeoneSpeaking(false);
      playBeep();
    }
  };

  const enviarAudio = async (audioBlob: Blob) => {
  console.log('📤 enviarAudio chamado');
  console.log('📤 enviarAudio chamado');
  console.log('📤 currentUser:', currentUser);
  console.log('📤 currentUser.id:', currentUser?.id);
  
  if (!currentUser) {
    console.log('❌ Usuário não autenticado');
    return;
  }
  
  // Verifica se o canal existe
  if (!audioChannelRef.current) {
    console.log('❌ Canal não configurado, configurando...');
    setupAudioListener();
    await new Promise(resolve => setTimeout(resolve, 500));
    if (!audioChannelRef.current) {
      console.log('❌ Falha ao configurar canal');
      return;
    }
  }
  
  try {
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      console.log('📤 Áudio convertido, tamanho:', base64Audio.length);
      
      // CORRIGIDO: payload definido corretamente
      const payload = {
        type: 'broadcast',
        event: 'novo-audio',
        payload: {
          id: `${Date.now()}_${currentUser.id}`,
          audio: base64Audio,
          from: currentUser.id,
          fromName: speakerName || 'Preparado',
          fromCity: speakerCity || 'Cidade',
          timestamp: Date.now()
        }
      };
      
      console.log('📤 Enviando payload...');
      
      try {
        await audioChannelRef.current.send(payload);
        console.log('✅ Áudio enviado com sucesso!');
      } catch (sendError) {
        console.error('❌ Erro ao enviar:', sendError);
      }
    };
  } catch (error) {
    console.error('❌ Erro ao enviar áudio:', error);
  }
};
  // Range change
  const handleRangeChange = useCallback((newRange: number) => {
    setRange(newRange);
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', background: colors.card, borderRadius: '24px' }}>
        <div style={{ color: colors.accent, fontSize: '18px' }}>Carregando radio...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <div style={{ background: colors.card, borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '420px', border: `1px solid ${colors.cardBorder}`, boxShadow: '0 20px 60px rgba(0,0,0,0.6)', position: 'relative' }}>
        
        {/* Botão fechar */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'transparent',
              border: 'none',
              color: colors.textSecondary,
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '8px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            ✕
          </button>
        )}

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: `1px solid ${colors.cardBorder}` }}>
          <span style={{ color: colors.accent, fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px' }}>
            RÁDIO COMUNICADOR
          </span>
        </div>

        {/* CANAIS */}
        <div style={{ background: colors.inputBg, borderRadius: '14px', padding: '10px 16px', marginBottom: '8px', border: `1px solid ${colors.inputBorder}` }}>
          <div style={{ color: colors.accent, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', fontWeight: 'bold' }}>
            CANAIS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => { if (ch.available) handleChannelChange(ch.id); }}
                style={{
                  padding: '6px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: ch.available && isOn ? 'pointer' : 'not-allowed',
                  opacity: ch.available && isOn ? 1 : 0.4,
                  background: currentChannel === ch.id && ch.available ? colors.accent : 'transparent',
                  color: currentChannel === ch.id && ch.available ? colors.background : colors.textSecondary,
                  transition: 'all 0.2s',
                  borderBottom: currentChannel === ch.id && ch.available ? `2px solid ${colors.accent}` : `1px solid ${colors.inputBorder}`,
                  position: 'relative',
                }}
                disabled={!ch.available || !isOn}
              >
                {ch.label}
                {!ch.available && (
                  <span style={{ position: 'absolute', top: '-4px', right: '-4px', fontSize: '7px', background: colors.accent, color: colors.background, padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>
                    🔒
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* QUEM ESTÁ FALANDO + ESPECTRO */}
        <div style={{ 
          background: colors.inputBg, 
          borderRadius: '14px', 
          padding: '6px 12px', 
          marginBottom: '8px', 
          border: `1px solid ${colors.inputBorder}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ 
                width: '20px', 
                height: '20px', 
                borderRadius: '50%', 
                background: isSomeoneSpeaking ? colors.accent : '#2a2a2a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                fontWeight: 'bold',
                color: isSomeoneSpeaking ? colors.background : colors.textSecondary,
              }}>
                {isSomeoneSpeaking ? speakerName.charAt(0).toUpperCase() : '?'}
              </div>
              <span style={{ color: colors.textPrimary, fontSize: '12px', fontWeight: 'bold' }}>
                {isSomeoneSpeaking ? speakerName : '---'}
              </span>
              {isSomeoneSpeaking && (
                <span style={{ color: colors.accent, fontSize: '8px', fontWeight: 'bold' }}>
                  ● AO VIVO
                </span>
              )}
            </div>
            <span style={{ color: colors.textSecondary, fontSize: '8px' }}>
              {isSomeoneSpeaking ? speakerCity : '---'}
            </span>
          </div>
          <AudioSpectrum isActive={isSomeoneSpeaking || isRecording} color={colors.accent} />
        </div>

        {/* GRUPOS */}
        <div style={{ background: colors.inputBg, borderRadius: '14px', padding: '10px 16px', marginBottom: '8px', border: `1px solid ${colors.inputBorder}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ color: colors.accent, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>GRUPOS</div>
            <span style={{ color: colors.textSecondary, fontSize: '9px' }}>{connectedUsers} conectados</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '150px', overflowY: 'auto' }}>
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGroup(g.name)}
                style={{
                  textAlign: 'left',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  border: 'none',
                  cursor: isOn ? 'pointer' : 'not-allowed',
                  opacity: isOn ? 1 : 0.5,
                  background: selectedGroup === g.name ? `${colors.accent}15` : 'transparent',
                  color: selectedGroup === g.name ? colors.accent : colors.textSecondary,
                  borderLeft: selectedGroup === g.name ? `3px solid ${colors.accent}` : '3px solid transparent',
                  transition: 'all 0.2s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                disabled={!isOn}
              >
                <span>{g.name}</span>
                <span style={{ fontSize: '9px', color: colors.textSecondary }}>{g.members} {g.members === 1 ? 'pessoa' : 'pessoas'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* MIC - PTT com comportamento correto (pressionar e segurar) */}
<div style={{ 
  background: colors.inputBg, 
  borderRadius: '14px', 
  padding: '12px 16px', 
  marginBottom: '8px', 
  border: `1px solid ${colors.inputBorder}`, 
  display: 'flex', 
  justifyContent: 'center' 
}}>
  <button
    onPointerDown={(e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isOn && !isRecording) {
        console.log('🎤 PTT PRESSIONADO - Iniciando gravação');
        startRecording();
      }
    }}
    onPointerUp={(e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isOn && isRecording) {
        console.log('🛑 PTT SOLTO - Parando gravação');
        stopRecording();
      }
    }}
    onPointerLeave={(e) => {
      if (isOn && isRecording) {
        console.log('🛑 PTT CANCELADO - Mouse saiu do botão');
        stopRecording();
      }
    }}
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
    }}
    onDragStart={(e) => {
      e.preventDefault();
      e.stopPropagation();
    }}
    style={{
      width: '70%',
      padding: '12px',
      borderRadius: '30px',
      border: 'none',
      background: isRecording && isOn ? `${colors.accent}30` : 'transparent',
      cursor: isOn ? 'pointer' : 'not-allowed',
      opacity: isOn ? 1 : 0.4,
      transition: 'all 0.15s ease',
      transform: isRecording && isOn ? 'scale(0.95)' : 'scale(1)',
      boxShadow: isRecording && isOn ? `0 0 30px ${colors.accent}20` : 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '60px',
      touchAction: 'none',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none',
    }}
    disabled={!isOn}
  >
    <img
      src="/botao-ptt.png"
      alt="PTT"
      style={{
        width: '120px',
        height: '60px',
        objectFit: 'contain',
        pointerEvents: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      draggable={false}
      onDragStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    />
    {isRecording && isOn && (
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        background: `radial-gradient(circle, ${colors.accent}15, transparent 70%)`, 
        animation: 'pulse-bg 0.8s ease-in-out infinite' 
      }} />
    )}
    {isRecording && isOn && (
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '10px',
        color: colors.accent,
        fontWeight: 'bold',
        background: 'rgba(0,0,0,0.7)',
        padding: '2px 12px',
        borderRadius: '10px',
        animation: 'pulse-text 0.8s ease-in-out infinite',
      }}>
        🎤 GRAVANDO...
      </div>
    )}
  </button>
</div>

        {/* MAPA / CONTROLES / RADAR - Tabs */}
        <div style={{ 
          display: 'flex', 
          borderRadius: '14px', 
          overflow: 'hidden', 
          border: `1px solid ${colors.accent}`, 
          marginBottom: '8px' 
        }}>
          {[
            { id: 'mapa', label: 'Mapa', icon: Map },
            { id: 'controles', label: 'Controles', icon: Sliders },
            { id: 'radar', label: 'Radar', icon: Radar },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'mapa' | 'controles' | 'radar')}
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === tab.id ? colors.accent : 'transparent',
                color: activeTab === tab.id ? colors.background : colors.textSecondary,
                transition: 'all 0.3s',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTEÚDO MAPA / CONTROLES / RADAR */}
        <div style={{ 
          background: colors.inputBg, 
          borderRadius: '14px', 
          padding: '4px', 
          marginBottom: '8px', 
          minHeight: '180px', 
          border: `1px solid ${colors.inputBorder}`, 
          overflow: 'hidden' 
        }}>
          {activeTab === 'mapa' ? (
            <MapaComClusters userLocations={userLocations} showGroupsList={false} onUserSelect={abrirChatDoGrupo} />
          ) : activeTab === 'controles' ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '12px', 
              gap: '8px', 
              minHeight: '180px' 
            }}>
              {/* Botão On/Off */}
              <button
                onClick={() => setIsOn(!isOn)}
                style={{
                  background: isOn ? colors.accent : colors.cardBorder,
                  color: isOn ? colors.background : colors.textSecondary,
                  border: 'none',
                  padding: '4px 20px',
                  borderRadius: '16px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: isOn ? `0 0 15px ${colors.accent}40` : 'none',
                }}
              >
                {isOn ? 'ON' : 'OFF'}
              </button>

              {/* Knobs */}
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: '100%' 
              }}>
                <KnobElegante 
                  value={range} 
                  onChange={handleRangeChange} 
                  min={10} 
                  max={100} 
                  label="Range" 
                  unit="Km" 
                  disabled={!isOn} 
                />
                
                <div style={{ width: '1px', height: '40px', background: '#2a2a2a' }} />
                
                <div style={{ position: 'relative' }}>
                  <KnobElegante
                    value={isMuted ? 0 : volume}
                    onChange={(val) => { setVolume(val); if (val > 0) setIsMuted(false); }}
                    min={0}
                    max={100}
                    label="Volume"
                    unit="%"
                    disabled={!isOn}
                  />
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '4px',
                      background: colors.card,
                      border: `1px solid ${colors.cardBorder}`,
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      color: isMuted ? colors.accent : colors.textSecondary,
                      cursor: 'pointer',
                      fontSize: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                      zIndex: 2,
                      transition: 'all 0.2s',
                    }}
                    disabled={!isOn}
                  >
                    {isMuted ? '🔇' : '🔊'}
                  </button>
                </div>
              </div>
              
              {/* Informações */}
              <div style={{ color: colors.textSecondary, fontSize: '9px', textAlign: 'center', marginTop: '2px' }}>
                {connectedUsers} conectados
              </div>
            </div>
          ) : (
            // RADAR
            <div style={{ 
              position: 'relative', 
              width: '120px', 
              height: '120px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '20px auto' 
            }}>
              <div style={{ position: 'absolute', inset: 0, border: `2px solid ${colors.accent}20`, borderRadius: '50%', animation: 'radar-pulse 2s ease-out infinite' }} />
              <div style={{ position: 'absolute', inset: '10px', border: `2px solid ${colors.accent}15`, borderRadius: '50%', animation: 'radar-pulse 2s ease-out 0.5s infinite' }} />
              <div style={{ position: 'absolute', inset: '20px', border: `2px solid ${colors.accent}10`, borderRadius: '50%', animation: 'radar-pulse 2s ease-out 1s infinite' }} />
              <div style={{ position: 'absolute', inset: '30px', border: `2px solid ${colors.accent}5`, borderRadius: '50%', animation: 'radar-pulse 2s ease-out 1.5s infinite' }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', width: '55px', height: '2px', background: `linear-gradient(to right, ${colors.accent}, transparent)`, transformOrigin: 'left center', animation: 'radar-spin 3s linear infinite', borderRadius: '2px', boxShadow: `0 0 10px ${colors.accent}40` }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', width: '6px', height: '6px', background: colors.accent, borderRadius: '50%', transform: 'translate(-50%, -50%)', boxShadow: `0 0 20px ${colors.accent}60` }} />
              {nearbyUsers.slice(0, 6).map((user, index) => {
                const angle = (index / 6) * 360;
                const distance = 20 + Math.random() * 25;
                const rad = (angle * Math.PI) / 180;
                const x = 60 + distance * Math.cos(rad);
                const y = 60 + distance * Math.sin(rad);
                return (
                  <div key={user.id} style={{ position: 'absolute', left: `${x - 3}%`, top: `${y - 3}%`, width: '6px', height: '6px', borderRadius: '50%', background: user.status === 'online' ? '#FFD700' : '#444444', boxShadow: user.status === 'online' ? '0 0 10px rgba(255,215,0,0.5)' : 'none', animation: user.status === 'online' ? 'pulse-dot 1.5s ease-in-out infinite' : 'none' }} />
                );
              })}
            </div>
          )}
        </div>

        {/* STATUS */}
        <div style={{ background: colors.inputBg, borderRadius: '14px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '10px', flexWrap: 'wrap', border: `1px solid ${colors.inputBorder}` }}>
          <span style={{ color: isOn ? colors.accent : colors.textSecondary }}>
            {isOn ? '●' : '●'} {isOn ? 'Conectado' : 'Desconectado'}
          </span>
          <span style={{ color: colors.cardBorder }}>|</span>
          <span style={{ color: colors.textSecondary }}>CH: {currentChannel}</span>
          <span style={{ color: colors.cardBorder }}>|</span>
          <span style={{ color: colors.textSecondary }}>{selectedGroup}</span>
          <span style={{ color: colors.cardBorder }}>|</span>
          <span style={{ color: colors.textSecondary }}>{connectedUsers} online</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse-bg { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.5; } }
        @keyframes radar-pulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
        @keyframes radar-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.7); } }
      `}</style>
    </div>
  );
};

export default RadioInterface;