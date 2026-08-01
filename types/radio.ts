// types/radio.ts

/**
 * Grupo de rádio - importado do mapa "Pessoas Próximas"
 */
export interface RadioGroup {
  id: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  members: number;
  is_active?: boolean;
}

/**
 * Canal de rádio
 */
export interface RadioChannel {
  id: string;
  name: string;
  label: string;
  type: 'cidades' | 'admin' | 'emergencia';
  groups: RadioGroup[];
}

/**
 * Status do rádio
 */
export interface RadioStatus {
  isOn: boolean;
  currentChannel: string;
  currentGroup: string;
  volume: number;
  isMuted: boolean;
  range: number;
  activeTab: 'mapa' | 'radar';
  isMicActive: boolean;
  connectedUsers: number;
  lastActivity: Date;
}

/**
 * Usuário próximo - para o radar
 */
export interface NearbyUser {
  id: string;
  full_name: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: string;
  avatar_url?: string; // ADICIONADO: campo opcional
}

/**
 * Mensagem de rádio (para futura implementação de chat)
 */
export interface RadioMessage {
  id: string;
  userId: string;
  userName: string;
  groupId: string;
  message: string;
  timestamp: Date;
  type: 'voice' | 'text' | 'alert';
}

/**
 * Configuração do rádio (persistida no Supabase)
 */
export interface RadioConfig {
  userId: string;
  defaultChannel: string;
  defaultGroup: string;
  defaultVolume: number;
  defaultRange: number;
  isActive: boolean;
  updatedAt: Date;
}

/**
 * Estatísticas do rádio
 */
export interface RadioStats {
  totalUsers: number;
  onlineUsers: number;
  activeGroups: number;
  messagesToday: number;
  peakHour: string;
}
