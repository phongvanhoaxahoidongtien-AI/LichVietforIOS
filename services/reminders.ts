import type { Reminder, RitualSettings } from '../types';
import { getLunarDate, convertSolar2Lunar } from './lunarCalendar';
import { parseISODate, todayISO } from './storage';

export interface DueItem { key: string; title: string; body: string; time: string }

const isLastLunarDay = (d: Date) => {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  return convertSolar2Lunar(t.getDate(), t.getMonth() + 1, t.getFullYear())[0] === 1;
};

/** Reminder có rơi vào ngày `day` không. */
export function occursOn(r: Reminder, day: Date): boolean {
  const base = parseISODate(r.date);
  if (!base) return false;
  if (day < new Date(base.getFullYear(), base.getMonth(), base.getDate())) return false;
  const mode = r.repeat || 'none';
  if (mode === 'none') return todayISO(day) === r.date;
  if (mode === 'solar-yearly') return day.getDate() === base.getDate() && day.getMonth() === base.getMonth();
  const l = getLunarDate(day);
  const ld = r.lunarDay ?? getLunarDate(base).day;
  const lm = r.lunarMonth ?? getLunarDate(base).month;
  if (l.leap) return false; // ngày giỗ, ngày lễ tính theo tháng thường
  // Tháng thiếu (29 ngày) mà ngày gốc là 30: nhắc vào ngày cuối tháng
  const dayMatch = l.day === ld || (ld === 30 && l.day === 29 && isLastLunarDay(day));
  if (mode === 'lunar-monthly') return dayMatch;
  return dayMatch && l.month === lm;
}

/** Các mục cần nhắc trong ngày `now` (đã đến giờ). */
export function dueItems(now: Date, reminders: Reminder[], ritual: RitualSettings): DueItem[] {
  const out: DueItem[] = [];
  const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const iso = todayISO(now);
  const l = getLunarDate(now);
  const rt = ritual.reminderTime || '08:00';
  const rituals: [boolean, string][] = [
    [ritual.remindFirst && l.day === 1, `Hôm nay mùng Một tháng ${l.month}${l.leap ? ' (nhuận)' : ''} âm lịch`],
    [ritual.remindFourteenth && l.day === 14, `Hôm nay 14 âm lịch, ngày mai là Rằm tháng ${l.month}`],
    [ritual.remindFullMoon && l.day === 15, `Hôm nay Rằm tháng ${l.month} âm lịch`],
    [ritual.remindLastDay && isLastLunarDay(now), `Hôm nay ngày cuối tháng ${l.month} âm lịch`],
  ];
  for (const [on, title] of rituals) {
    if (on && hm >= rt) out.push({ key: `ritual-${iso}-${title}`, title, body: 'Nhắc thắp hương, sửa lễ gia tiên.', time: rt });
  }
  for (const r of reminders) {
    if (!occursOn(r, now)) continue;
    const t = r.time || '07:00';
    if (hm >= t) out.push({ key: `rem-${r.id}-${iso}`, title: r.title || 'Nhắc lịch', body: r.note || '', time: t });
  }
  return out;
}

/** Danh sách các mục trong ngày (không xét giờ) để hiển thị. */
export function itemsOnDay(day: Date, reminders: Reminder[]): Reminder[] {
  return reminders.filter((r) => occursOn(r, day));
}

export async function showNotification(title: string, body: string) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (reg) await reg.showNotification(title, { body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', tag: title });
    else new Notification(title, { body, icon: '/icons/icon-192.png' });
    return true;
  } catch {
    return false;
  }
}
