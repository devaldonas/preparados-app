// hooks/useUserLocation.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface UserLocation {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  isLoading: boolean;
  error: string | null;
}

export function useUserLocation(): UserLocation & { refreshLocation: () => Promise<void> } {
  const [latitude, setLatitude] = useState<number>(0);
  const [longitude, setLongitude] = useState<number>(0);
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Buscar usuário atual diretamente
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      // 🔥 CORRIGIDO: buscar perfil com as any
      const { data, error: supabaseError } = await (supabase
        .from('profiles') as any)
        .select('latitude, longitude, city, state')
        .eq('id', user.id)
        .maybeSingle();

      if (supabaseError) throw supabaseError;

      if (data) {
        setLatitude(data.latitude || 0);
        setLongitude(data.longitude || 0);
        setCity(data.city || '');
        setState(data.state || '');
      }

      // Se não tiver localização no banco, tenta pegar do navegador
      if (!data?.latitude || !data?.longitude) {
        await getBrowserLocation();
      }
    } catch (err) {
      console.error('Erro ao buscar localização:', err);
      setError('Erro ao buscar localização');
      // Fallback: tenta pegar do navegador
      await getBrowserLocation();
    } finally {
      setIsLoading(false);
    }
  };

  const getBrowserLocation = (): Promise<void> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('Geolocalização não disponível no navegador');
        resolve();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          resolve();
        },
        (error) => {
          console.warn('Erro ao obter localização do navegador:', error.message);
          resolve();
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  return {
    latitude,
    longitude,
    city,
    state,
    isLoading,
    error,
    refreshLocation: fetchLocation,
  };
}