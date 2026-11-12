import { createContext, useContext } from 'react';
import type { AppSettings } from './types';
import type { Person } from './services/almanac';

export interface AppCtx {
  settings: AppSettings;
  updateSettings: (p: Partial<AppSettings>) => void;
  person: Person | null;
  setPerson: (p: Person | null) => void;
  toast: (m: string) => void;
}
export const AppContext = createContext<AppCtx>(null as unknown as AppCtx);
export const useApp = () => useContext(AppContext);
