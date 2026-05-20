import { useCallback, useEffect, useRef, useState } from 'react';
import { useSecureSupabase } from '@solvera/pace-core/rbac';
import { asPlanningClient } from '@/features/planning/supabase-helpers';

const MAPS_SCRIPT_ID = 'trac-google-maps-script';

function loadMapsScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Maps script failed')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.id = MAPS_SCRIPT_ID;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error('Maps script failed'));
    document.head.appendChild(script);
  });
}

export function useGoogleMapsRuntime() {
  const secureSupabase = asPlanningClient(useSecureSupabase());
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!secureSupabase) return;

    let cancelled = false;

    async function bootstrap() {
      const client = secureSupabase;
      if (!client) return;
      try {
        const keyResult = await client.functions.invoke('google-api-key');
        if (cancelled || !mountedRef.current) return;
        const key =
          typeof keyResult.data === 'object' &&
          keyResult.data != null &&
          'key' in keyResult.data &&
          typeof (keyResult.data as { key?: string }).key === 'string'
            ? (keyResult.data as { key: string }).key
            : null;
        if (!key) {
          setIsError(true);
          return;
        }
        setApiKey(key);

        const scriptResult = await client.functions.invoke('google-maps-script');
        if (cancelled || !mountedRef.current) return;
        const scriptUrl =
          typeof scriptResult.data === 'string'
            ? scriptResult.data
            : typeof scriptResult.data === 'object' &&
                scriptResult.data != null &&
                'url' in scriptResult.data &&
                typeof (scriptResult.data as { url?: string }).url === 'string'
              ? (scriptResult.data as { url: string }).url
              : null;

        if (!scriptUrl) {
          await loadMapsScript(
            `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`
          );
        } else {
          await loadMapsScript(scriptUrl);
        }

        if (!cancelled && mountedRef.current) {
          setIsLoaded(true);
        }
      } catch {
        if (!cancelled && mountedRef.current) {
          setIsError(true);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [secureSupabase]);

  const getTimezone = useCallback(
    async (lat: number, lng: number): Promise<string | null> => {
      if (!secureSupabase) return null;
      const { data, error } = await secureSupabase.functions.invoke('google-timezone', {
        body: { lat, lng, timestamp: Math.floor(Date.now() / 1000) },
      });
      if (error || data == null || typeof data !== 'object') return null;
      const timeZoneId = (data as { timeZoneId?: string }).timeZoneId;
      return typeof timeZoneId === 'string' ? timeZoneId : null;
    },
    [secureSupabase]
  );

  return { apiKey, isLoaded, isError, getTimezone };
}
