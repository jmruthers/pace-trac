import { createContext, useContext, type ReactNode } from 'react';
import { useGoogleMapsRuntime } from '@/features/planning/hooks/useGoogleMapsRuntime';

interface GoogleMapsPlanningContextValue {
  apiKey: string | null;
  isLoaded: boolean;
  isError: boolean;
  getTimezone: (lat: number, lng: number) => Promise<string | null>;
}

const GoogleMapsPlanningContext = createContext<GoogleMapsPlanningContextValue | null>(null);

export function GoogleMapsPlanningProvider({ children }: { children: ReactNode }) {
  const runtime = useGoogleMapsRuntime();
  return (
    <GoogleMapsPlanningContext.Provider value={runtime}>{children}</GoogleMapsPlanningContext.Provider>
  );
}

export function useGoogleMapsPlanning(): GoogleMapsPlanningContextValue {
  const value = useContext(GoogleMapsPlanningContext);
  if (value == null) {
    throw new Error('useGoogleMapsPlanning must be used within GoogleMapsPlanningProvider');
  }
  return value;
}
