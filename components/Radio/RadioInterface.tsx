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
import { Users, Map, Radar, Sliders } from 'lucide-react';

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
  const [selectedGroup, setSelectedGroup] = useState('Todos');
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<'mapa' | 'controles' | 'radar'>('mapa');
  const [range, setRange] = useState(50);
  const [isMicActive, setIsMicActive] = useState(false);
  const [groups, setGroups] = useState<RadioGroup[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
  // Novo estado para controle de abas
  const [activeControlTab, setActiveControlTab] = useState<'mapa' | 'radar' | 'controles'>('mapa');
  const [isSomeoneSpeaking, setIsSomeoneSpeaking] = useState(false);
  const [speakerName, setSpeakerName] = useState('');
  const [speakerCity, setSpeakerCity] = useState('');

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMouseDownRef = useRef(false);
  const rangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Localização do usuário
  const { latitude, longitude } = useUserLocation();

  // Buscar usuário e verificar se é admin
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile?.role === 'admin') {
          setIsAdmin(true);
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
  }, [userLatitude, userLongitude, latitude, longitude,]);

  // ADICIONE ESTE BLOCO APÓS O useEffect principal:
useEffect(() => {
  if (rangeTimeoutRef.current) {
    clearTimeout(rangeTimeoutRef.current);
  }

  rangeTimeoutRef.current = setTimeout(() => {
    // Apenas atualiza os dados quando o usuário parar de mexer
    const lat = userLatitude || latitude;
    const lng = userLongitude || longitude;
    if (lat && lng && !isLoading) {
      // Recarrega os dados com o novo range
      const reloadData = async () => {
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
        }
        const users = await getNearbyUsers(lat, lng, range);
        setNearbyUsers(users);
        setConnectedUsers(users.filter((u) => u.status === 'online').length);
      };
      reloadData();
    }
  }, 500); // Aguarda 500ms após o último movimento
}, [range]); // ← AGORA O RANGE ESTÁ ISOLADO AQUI

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

  // Canais
  const channels = [
    { id: 'CH CIDADES', label: 'CH CIDADES', available: true },
    { id: 'CH ADMIN', label: 'CH ADMIN', available: isAdmin },
    { id: 'CH 3', label: 'CH 3', available: true },
    { id: 'CH 4', label: 'CH 4', available: true },
  ];

  const colors = {
    background: '#1a1a1a',
    card: '#222222',
    cardBorder: '#333333',
    textPrimary: '#ffffff',
    textSecondary: '#aaaaaa',
    accent: '#FFD700',
    inputBg: '#1e1e1e',
    inputBorder: '#2a2a2a',
  };

  // Mudar canal
  const handleChannelChange = async (channelId: string) => {
    setCurrentChannel(channelId);
    const lat = userLatitude || latitude;
    const lng = userLongitude || longitude;

    if (channelId === 'CH CIDADES') {
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
      }
      setSelectedGroup('Todos');
    } else if (channelId === 'CH ADMIN' && isAdmin) {
      const { data: admins } = await supabase
        .from('profiles')
        .select('id, full_name, city, state, latitude, longitude')
        .eq('role', 'admin')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (admins && admins.length > 0) {
        setGroups([
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
        ]);
      }
      setSelectedGroup('Todos os Admins');
    } else {
      setGroups([
        {
          id: `${channelId.toLowerCase()}-reserved`,
          name: channelId,
          city: 'Reservado',
          state: 'Brasil',
          latitude: lat,
          longitude: lng,
          members: 0,
        },
      ]);
      setSelectedGroup(channelId);
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
      audioRef.current.play().catch(() => {});
    }
  }, [isOn]);

  const handleMicPress = () => {
    if (isOn) {
      isMouseDownRef.current = true;
      setIsMicActive(true);
      playBeep();
    }
  };

  const handleMicRelease = () => {
    if (isOn && isMouseDownRef.current) {
      isMouseDownRef.current = false;
      setIsMicActive(false);
      playBeep();
    }
  };

  // Range change - APENAS atualiza o estado, sem chamar outras funções
  const handleRangeChange = useCallback((newRange: number) => {
  setRange(newRange);
}, []);

  // Efeito separado para atualizar dados quando range mudar (com debounce)

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
        {/* CANAIS - Apenas CH CIDADES e CH ADMIN */}
<div style={{ 
  background: colors.inputBg, 
  borderRadius: '14px', 
  padding: '10px 16px', 
  marginBottom: '8px', 
  border: `1px solid ${colors.inputBorder}` 
}}>
  <div style={{ 
    color: colors.accent, 
    fontSize: '10px', 
    textTransform: 'uppercase', 
    letterSpacing: '1px', 
    marginBottom: '6px', 
    fontWeight: 'bold' 
  }}>
    CANAIS
  </div>
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
    {channels.filter(ch => ch.id === 'CH CIDADES' || ch.id === 'CH ADMIN').map((ch) => (
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
          <span style={{ 
            position: 'absolute', 
            top: '-4px', 
            right: '-4px', 
            fontSize: '7px', 
            background: colors.accent, 
            color: colors.background, 
            padding: '1px 4px', 
            borderRadius: '4px', 
            fontWeight: 'bold' 
          }}>
            🔒
          </span>
        )}
      </button>
    ))}
  </div>
</div>

        {/* GRUPOS */}
        <div style={{ background: colors.inputBg, borderRadius: '14px', padding: '14px 16px', marginBottom: '12px', border: `1px solid ${colors.inputBorder}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ color: colors.accent, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>GRUPOS</div>
            <span style={{ color: colors.textSecondary, fontSize: '10px' }}>{connectedUsers} conectados</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGroup(g.name)}
                style={{
                  textAlign: 'left',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
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
                <span style={{ fontSize: '10px', color: colors.textSecondary }}>{g.members} {g.members === 1 ? 'pessoa' : 'pessoas'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* QUEM ESTÁ FALANDO + ESPECTRO - Versão compacta */}
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
  <AudioSpectrum isActive={isSomeoneSpeaking} color={colors.accent} />
</div>

        {/* MIC - PTT com imagem maior */}
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
    onMouseDown={handleMicPress}
    onMouseUp={handleMicRelease}
    onMouseLeave={handleMicRelease}
    onTouchStart={handleMicPress}
    onTouchEnd={handleMicRelease}
    onTouchCancel={handleMicRelease}
    style={{
      width: '70%',
      padding: '12px',
      borderRadius: '30px',
      border: 'none',
      background: isMicActive && isOn ? `${colors.accent}30` : 'transparent',
      cursor: isOn ? 'pointer' : 'not-allowed',
      opacity: isOn ? 1 : 0.4,
      transition: 'all 0.15s ease',
      transform: isMicActive && isOn ? 'scale(0.95)' : 'scale(1)',
      boxShadow: isMicActive && isOn ? `0 0 30px ${colors.accent}20` : 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '60px',
      touchAction: 'none',
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
      }}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
    {isMicActive && isOn && (
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        background: `radial-gradient(circle, ${colors.accent}15, transparent 70%)`, 
        animation: 'pulse-bg 0.8s ease-in-out infinite' 
      }} />
    )}
  </button>
</div>

 {/* MAPA / RADAR - Tabs */}
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
    // CONTROLES - Knobs lado a lado com botão On/Off
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

      {/* Knobs de Range e Volume lado a lado */}
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
      
      {/* Informações adicionais */}
      <div style={{ 
        color: colors.textSecondary, 
        fontSize: '9px', 
        textAlign: 'center',
        marginTop: '2px',
      }}>
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
<div style={{ background: colors.inputBg, borderRadius: '14px', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', flexWrap: 'wrap', border: `1px solid ${colors.inputBorder}` }}>
  <span style={{ color: isOn ? colors.accent : colors.textSecondary }}>{isOn ? '●' : '●'} {isOn ? 'Conectado' : 'Desconectado'}</span>
  <span style={{ color: colors.cardBorder }}>|</span>
  <span style={{ color: colors.textSecondary }}>CH: {currentChannel}</span>
  <span style={{ color: colors.cardBorder }}>|</span>
  <span style={{ color: colors.textSecondary }}>{selectedGroup || 'Todos'}</span>
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
