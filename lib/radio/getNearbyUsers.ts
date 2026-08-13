// lib/radio/getNearbyUsers.ts
import { supabase } from '@/lib/supabaseClient';
import { NearbyUser } from '@/types/radio';

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

interface SupabaseUser {
  id: string;
  full_name: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  last_location_update: string;
  subscription_status: string;
}

export async function getNearbyUsers(
  userLatitude: number,
  userLongitude: number,
  radius: number = 999999
): Promise<NearbyUser[]> {
  try {
    // 🔥 CORRIGIDO: buscar usuários com as any
    const { data: users, error } = await (supabase
      .from('profiles') as any)
      .select(`
        id,
        full_name,
        latitude,
        longitude,
        city,
        state,
        last_location_update,
        subscription_status
      `)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (error) {
      console.error('Erro ao buscar usuários:', error);
      return getMockUsers(userLatitude, userLongitude);
    }

    if (!users || users.length === 0) {
      return getMockUsers(userLatitude, userLongitude);
    }

    console.log(`✅ ${users.length} usuários com localização encontrados`);

    const filteredUsers = (users as SupabaseUser[]).filter((user) => {
      if (!user.latitude || !user.longitude) return false;
      const distance = calculateDistance(
        userLatitude,
        userLongitude,
        user.latitude,
        user.longitude
      );
      return distance <= radius;
    });

    return filteredUsers.map((user) => ({
      id: user.id,
      full_name: user.full_name || 'Usuário',
      latitude: user.latitude,
      longitude: user.longitude,
      city: user.city || '',
      state: user.state || '',
      status: user.subscription_status === 'active' ? 'online' : 'offline',
      lastSeen: user.last_location_update || new Date().toISOString(),
      avatar_url: undefined,
    }));
  } catch (error) {
    console.error('Erro ao buscar usuários próximos:', error);
    return getMockUsers(userLatitude, userLongitude);
  }
}

function getMockUsers(lat: number, lng: number): NearbyUser[] {
  const names = ['Ana', 'Carlos', 'Mariana', 'João', 'Fernanda', 'Rafael', 'Beatriz', 'Lucas'];
  const statuses: ('online' | 'offline' | 'away')[] = ['online', 'online', 'away', 'offline', 'online', 'online', 'offline', 'away'];
  
  return names.map((name, index) => ({
    id: `mock-${index + 1}`,
    full_name: name,
    latitude: lat + (Math.random() - 0.5) * 0.02,
    longitude: lng + (Math.random() - 0.5) * 0.02,
    city: 'Sua Cidade',
    state: 'Estado',
    status: statuses[index % statuses.length],
    lastSeen: new Date().toISOString(),
    avatar_url: undefined,
  }));
}

export async function getNearbyUsersByStatus(
  userLatitude: number,
  userLongitude: number,
  status: 'online' | 'offline' | 'away' = 'online',
  radius: number = 999999
): Promise<NearbyUser[]> {
  const users = await getNearbyUsers(userLatitude, userLongitude, radius);
  return users.filter((user) => user.status === status);
}