// lib/radio/getGroups.ts
import { supabase } from '@/lib/supabaseClient';
import { RadioGroup } from '@/types/radio';

interface SupabaseGroup {
  id: string;
  name: string;
  city_name: string;
  center_latitude: number;
  center_longitude: number;
  member_count: number;
  is_active: boolean;
}

export async function getNearbyGroups(
  userLatitude: number,
  userLongitude: number,
  radius: number = 50
): Promise<RadioGroup[]> {
  try {
    // Busca TODOS os grupos ativos
    const { data: groups, error } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        city_name,
        center_latitude,
        center_longitude,
        member_count,
        is_active
      `)
      .eq('is_active', true)
      .order('member_count', { ascending: false });

    if (error) {
      console.error('Erro ao buscar grupos:', error);
      return getMockGroups(userLatitude, userLongitude);
    }

    if (!groups || groups.length === 0) {
      console.warn('Nenhum grupo encontrado no banco');
      return getMockGroups(userLatitude, userLongitude);
    }

    console.log(`✅ ${groups.length} grupos encontrados no banco`);

    // Agrupa por cidade e soma os membros
    const cityMap = new Map<string, { 
      id: string; 
      name: string; 
      city: string; 
      members: number;
      latitude: number;
      longitude: number;
    }>();

    (groups as SupabaseGroup[]).forEach((group) => {
      const cityName = group.city_name || 'Cidade não informada';
      
      if (cityMap.has(cityName)) {
        // Soma os membros se a cidade já existe
        const existing = cityMap.get(cityName)!;
        existing.members += group.member_count || 0;
      } else {
        // Cria nova entrada para a cidade
        cityMap.set(cityName, {
          id: `city-${cityName.replace(/\s/g, '-')}`,
          name: cityName,
          city: cityName,
          members: group.member_count || 0,
          latitude: group.center_latitude || 0,
          longitude: group.center_longitude || 0,
        });
      }
    });

    // Converte o Map para array e ordena por número de membros
    const mappedGroups = Array.from(cityMap.values())
      .sort((a, b) => b.members - a.members)
      .map((city) => ({
        id: city.id,
        name: city.name, // Nome da cidade
        city: city.city,
        state: 'Brasil',
        latitude: city.latitude,
        longitude: city.longitude,
        members: city.members,
      }));

    if (mappedGroups.length === 0) {
      return getMockGroups(userLatitude, userLongitude);
    }

    return mappedGroups;
  } catch (error) {
    console.error('Erro ao buscar grupos:', error);
    return getMockGroups(userLatitude, userLongitude);
  }
}

function getMockGroups(lat: number, lng: number): RadioGroup[] {
  return [
    {
      id: 'mock-1',
      name: 'Sua Cidade',
      city: 'Sua Cidade',
      state: 'Estado',
      latitude: lat + 0.01,
      longitude: lng + 0.01,
      members: 12,
    },
    {
      id: 'mock-2',
      name: 'Cidade Vizinha',
      city: 'Cidade Vizinha',
      state: 'Estado',
      latitude: lat - 0.015,
      longitude: lng + 0.02,
      members: 8,
    },
  ];
}

export async function getGroupsByCity(city: string): Promise<RadioGroup[]> {
  try {
    const { data: groups, error } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        city_name,
        center_latitude,
        center_longitude,
        member_count
      `)
      .eq('city_name', city)
      .eq('is_active', true)
      .order('member_count', { ascending: false });

    if (error || !groups) {
      return [];
    }

    // Agrupa por cidade (mesma lógica)
    const cityMap = new Map<string, { 
      id: string; 
      name: string; 
      city: string; 
      members: number;
      latitude: number;
      longitude: number;
    }>();

    (groups as SupabaseGroup[]).forEach((group) => {
      const cityName = group.city_name || city;
      
      if (cityMap.has(cityName)) {
        const existing = cityMap.get(cityName)!;
        existing.members += group.member_count || 0;
      } else {
        cityMap.set(cityName, {
          id: `city-${cityName.replace(/\s/g, '-')}`,
          name: cityName,
          city: cityName,
          members: group.member_count || 0,
          latitude: group.center_latitude || 0,
          longitude: group.center_longitude || 0,
        });
      }
    });

    return Array.from(cityMap.values()).map((city) => ({
      id: city.id,
      name: city.name,
      city: city.city,
      state: 'Brasil',
      latitude: city.latitude,
      longitude: city.longitude,
      members: city.members,
    }));
  } catch (error) {
    console.error('Erro ao buscar grupos por cidade:', error);
    return [];
  }
}
