/**
 * Lưu trữ an toàn trên máy (localStorage).
 * - Dữ liệu hỏng không làm ứng dụng trắng màn hình.
 * - Hết dung lượng thì báo lỗi rõ ràng thay vì dừng ứng dụng.
 * - Có hàm kiểm tra kiểu dữ liệu khi đọc lại.
 */
export const KEYS = {
  reminders: 'viet-calendar-reminders',
  ritual: 'viet-calendar-ritual-settings',
  userBg: 'viet-calendar-user-bg',
  hiddenActivities: 'viet-calendar-hidden-activities',
  biorhythm: 'viet-calendar-biorhythm-profile',
  settings: 'viet-calendar-settings',
  person: 'viet-calendar-person',
  notified: 'viet-calendar-notified',
  family: 'viet-calendar-family',
  lastBackup: 'viet-calendar-last-backup',
  bankApp: 'viet-calendar-bank-app',
  loban: 'viet-calendar-loban',
} as const;

export function loadJSON<T>(key: string, fallback: T, validate?: (v: unknown) => v is T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const v = JSON.parse(raw);
    if (validate && !validate(v)) return fallback;
    return v as T;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadString(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function saveString(key: string, value: string): boolean {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}

export function remove(key: string) {
  try { localStorage.removeItem(key); } catch { /* bỏ qua */ }
}

/** Xóa toàn bộ dữ liệu của ứng dụng trên máy này. */
export function clearAll() {
  for (const k of Object.values(KEYS)) remove(k);
}

export const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
export const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

/** Ngày hôm nay theo giờ máy (YYYY-MM-DD), không dùng toISOString (giờ quốc tế). */
export function todayISO(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function parseISODate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return isNaN(d.getTime()) ? null : d;
}
