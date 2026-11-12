
export type RepeatMode = 'none' | 'lunar-yearly' | 'lunar-monthly' | 'solar-yearly';

export interface Reminder {
  id: string;
  title: string;
  note: string;
  time: string; // HH:mm (có thể trống)
  date: string; // YYYY-MM-DD (dương lịch, ngày gốc)
  isRitual: boolean; // Is it a worship day reminder
  repeat?: RepeatMode;
  lunarDay?: number;   // dùng khi lặp theo âm lịch
  lunarMonth?: number;
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
  ALMANAC = 'ALMANAC',
  REMINDERS = 'REMINDERS',
  MORE = 'MORE',
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  fontScale: 1 | 1.125 | 1.25;
  notifications: boolean;
  /** Hiện tên Trực trên lịch tháng. */
  showTruc?: boolean;
}
