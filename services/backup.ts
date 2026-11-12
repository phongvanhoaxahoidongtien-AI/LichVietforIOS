/**
 * Sao lưu / khôi phục dữ liệu người dùng.
 * Gồm: lịch hẹn – ngày giỗ, cài đặt nhắc thắp hương, người trong nhà, cài đặt giao diện.
 * Không gồm ảnh nền (nặng) và thông tin nhịp sinh học.
 */
import type { Reminder, RitualSettings, AppSettings, RepeatMode } from '../types';
import type { Member } from './family';
import { KEYS, loadJSON, saveJSON, isObject, todayISO } from './storage';

export const BACKUP_APP = 'lich-viet';
export const BACKUP_VERSION = 1;
const MAX_BYTES = 2 * 1024 * 1024;
/** Giá trị mặc định (giống App) khi người dùng chưa từng đổi cài đặt. */
const DEFAULT_RITUAL: RitualSettings = { remindFirst: true, remindFullMoon: true, remindFourteenth: false, remindLastDay: false, reminderTime: '08:00' };
const DEFAULT_SETTINGS: AppSettings = { theme: 'system', fontScale: 1, notifications: false };

export interface BackupData {
  reminders: Reminder[];
  ritual: RitualSettings | null;
  family: Member[];
  settings: Partial<AppSettings> | null;
}
export interface BackupFile { app: typeof BACKUP_APP; version: number; exportedAt: string; data: BackupData }

const REPEATS: RepeatMode[] = ['none', 'lunar-yearly', 'lunar-monthly', 'solar-yearly'];
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');
const isISO = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isHM = (v: unknown): v is string => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const intIn = (v: unknown, a: number, b: number) => typeof v === 'number' && Number.isInteger(v) && v >= a && v <= b;

function cleanReminder(r: unknown): Reminder | null {
  if (!isObject(r) || !isISO(r.date)) return null;
  const title = str(r.title, 120).trim();
  if (!title) return null;
  const repeat = REPEATS.includes(r.repeat as RepeatMode) ? (r.repeat as RepeatMode) : 'none';
  return {
    id: str(r.id, 60) || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title, note: str(r.note, 500), time: isHM(r.time) ? r.time : '', date: r.date, isRitual: r.isRitual === true, repeat,
    ...(intIn(r.lunarDay, 1, 30) ? { lunarDay: r.lunarDay as number } : {}),
    ...(intIn(r.lunarMonth, 1, 12) ? { lunarMonth: r.lunarMonth as number } : {}),
  };
}
function cleanMember(m: unknown): Member | null {
  if (!isObject(m) || !intIn(m.birthYear, 1900, 2100)) return null;
  const name = str(m.name, 30).trim();
  if (!name) return null;
  return { id: str(m.id, 60) || Math.random().toString(36).slice(2), name, birthYear: m.birthYear as number, ...(m.gender === 'nam' || m.gender === 'nu' ? { gender: m.gender } : {}) };
}
function cleanRitual(r: unknown): RitualSettings | null {
  if (!isObject(r)) return null;
  return { remindFirst: r.remindFirst === true, remindFullMoon: r.remindFullMoon === true, remindFourteenth: r.remindFourteenth === true, remindLastDay: r.remindLastDay === true, reminderTime: isHM(r.reminderTime) ? r.reminderTime : '08:00' };
}
function cleanSettings(s: unknown): Partial<AppSettings> | null {
  if (!isObject(s)) return null;
  const out: Partial<AppSettings> = {};
  if (s.theme === 'light' || s.theme === 'dark' || s.theme === 'system') out.theme = s.theme;
  if (s.fontScale === 1 || s.fontScale === 1.125 || s.fontScale === 1.25) out.fontScale = s.fontScale;
  if (typeof s.notifications === 'boolean') out.notifications = s.notifications;
  if (typeof s.showTruc === 'boolean') out.showTruc = s.showTruc;
  return out;
}

/** Đọc dữ liệu hiện có trên máy. */
export function collectBackup(now = new Date()): BackupFile {
  return {
    app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(),
    data: {
      reminders: loadJSON<unknown[]>(KEYS.reminders, []).map(cleanReminder).filter((x): x is Reminder => !!x),
      ritual: cleanRitual(loadJSON(KEYS.ritual, null)) ?? DEFAULT_RITUAL,
      family: loadJSON<unknown[]>(KEYS.family, []).map(cleanMember).filter((x): x is Member => !!x),
      settings: { ...DEFAULT_SETTINGS, ...(cleanSettings(loadJSON(KEYS.settings, null)) || {}) },
    },
  };
}

/** Kiểm tra và làm sạch nội dung tệp sao lưu. Ném lỗi tiếng Việt nếu tệp không hợp lệ. */
export function parseBackup(text: string): BackupFile {
  if (text.length > MAX_BYTES) throw new Error('Tệp quá lớn, không phải tệp sao lưu của Lịch Việt.');
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { throw new Error('Tệp bị hỏng hoặc không phải tệp sao lưu (.json) của Lịch Việt.'); }
  if (!isObject(raw) || raw.app !== BACKUP_APP || !isObject(raw.data)) throw new Error('Đây không phải tệp sao lưu của Lịch Việt.');
  if (typeof raw.version !== 'number' || raw.version > BACKUP_VERSION) throw new Error('Tệp sao lưu được tạo bởi phiên bản mới hơn. Vui lòng cập nhật ứng dụng.');
  const d = raw.data;
  const reminders = (Array.isArray(d.reminders) ? d.reminders : []).slice(0, 2000).map(cleanReminder).filter((x): x is Reminder => !!x);
  const family = (Array.isArray(d.family) ? d.family : []).slice(0, 30).map(cleanMember).filter((x): x is Member => !!x);
  return { app: BACKUP_APP, version: raw.version, exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '', data: { reminders, family, ritual: cleanRitual(d.ritual), settings: cleanSettings(d.settings) } };
}

const remKey = (r: Reminder) => [r.title.trim().toLowerCase(), r.date, r.time || '', r.repeat || 'none', r.lunarDay ?? '', r.lunarMonth ?? ''].join('|');
const famKey = (m: Member) => `${m.name.trim().toLowerCase()}|${m.birthYear}`;

export interface MergeResult { data: BackupData; added: { reminders: number; family: number }; skipped: { reminders: number; family: number } }

/** Gộp (bỏ mục trùng) hoặc thay thế toàn bộ. Cài đặt lấy theo bản sao lưu nếu có. */
export function mergeBackup(current: BackupData, incoming: BackupData, mode: 'merge' | 'replace'): MergeResult {
  if (mode === 'replace') {
    return { data: { reminders: incoming.reminders, family: incoming.family, ritual: incoming.ritual ?? current.ritual, settings: incoming.settings ?? current.settings }, added: { reminders: incoming.reminders.length, family: incoming.family.length }, skipped: { reminders: 0, family: 0 } };
  }
  const rk = new Set(current.reminders.map(remKey));
  const rid = new Set(current.reminders.map((r) => r.id));
  const reminders = [...current.reminders];
  let ar = 0, sr = 0;
  for (const r of incoming.reminders) {
    if (rk.has(remKey(r))) { sr++; continue; }
    reminders.push(rid.has(r.id) ? { ...r, id: `${r.id}-${Math.random().toString(36).slice(2, 6)}` } : r);
    rk.add(remKey(r)); rid.add(r.id); ar++;
  }
  const fk = new Set(current.family.map(famKey));
  const family = [...current.family];
  let af = 0, sf = 0;
  for (const m of incoming.family) {
    if (fk.has(famKey(m)) || family.length >= 30) { sf++; continue; }
    family.push(m); fk.add(famKey(m)); af++;
  }
  return { data: { reminders, family, ritual: incoming.ritual ?? current.ritual, settings: { ...(current.settings || {}), ...(incoming.settings || {}) } }, added: { reminders: ar, family: af }, skipped: { reminders: sr, family: sf } };
}

/** Ghi dữ liệu đã gộp vào máy. */
export function applyBackup(d: BackupData): boolean {
  let ok = saveJSON(KEYS.reminders, d.reminders) && saveJSON(KEYS.family, d.family);
  if (d.ritual) ok = saveJSON(KEYS.ritual, d.ritual) && ok;
  if (d.settings) ok = saveJSON(KEYS.settings, d.settings) && ok;
  return ok;
}

export const backupFileName = (d = new Date()) => `lich-viet-sao-luu-${todayISO(d)}.json`;
export const markBackedUp = (where: 'file' | 'drive') => saveJSON(KEYS.lastBackup, { at: new Date().toISOString(), where });
export const lastBackup = () => loadJSON<{ at: string; where: string } | null>(KEYS.lastBackup, null, (v): v is { at: string; where: string } => isObject(v) && typeof v.at === 'string');

/** Chia sẻ tệp (điện thoại: chọn Google Drive, Zalo…) hoặc tải về máy. */
export async function exportToFile(preferShare: boolean): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const b = collectBackup();
  const json = JSON.stringify(b, null, 2);
  const name = backupFileName();
  const blob = new Blob([json], { type: 'application/json' });
  const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
  if (preferShare) {
    const file = new File([blob], name, { type: 'application/json' });
    if (nav.share && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: 'Sao lưu Lịch Việt' });
        markBackedUp('file');
        return 'shared';
      } catch (e) {
        if ((e as Error).name === 'AbortError') return 'cancelled';
      }
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  markBackedUp('file');
  return 'downloaded';
}
