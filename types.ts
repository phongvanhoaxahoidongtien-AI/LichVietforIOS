
export interface Reminder {
  id: string;
  title: string;
  note: string;
  time: string; // ISO string
  date: string; // YYYY-MM-DD
  isRitual: boolean; // Is it a worship day reminder
}

export interface RitualSettings {
  remindFirst: boolean;    // Mùng Một
  remindFullMoon: boolean; // Rằm
  remindFourteenth: boolean; // Mười Bốn
  remindLastDay: boolean;   // Cuối tháng
  reminderTime: string;      // HH:mm
}

export interface Custom {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
}

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  leap: boolean;
}

export interface WallpaperItem {
  id: string;
  title: string;
  category: 'tet' | 'patriotic' | 'travel' | 'culture';
  url: string;
  description?: string;
  location?: string;
}

export interface BiorhythmProfile {
  fullName: string;
  birthDate: string; // YYYY-MM-DD
  birthTime?: string; // HH:mm
}

export interface BiorhythmCycle {
  name: string;
  key: 'physical' | 'emotional' | 'intellectual' | 'intuitive';
  period: number; // in days
  value: number; // -100 to +100
  status: 'critical' | 'high' | 'low' | 'neutral';
  color: string;
  description: string;
}

export enum TabType {
  DAILY = 'DAILY',
  MONTHLY = 'MONTHLY',
  CONVERTER = 'CONVERTER',
  REMINDERS = 'REMINDERS',
  CUSTOMS = 'CUSTOMS',
  BIORHYTHM = 'BIORHYTHM'
}
