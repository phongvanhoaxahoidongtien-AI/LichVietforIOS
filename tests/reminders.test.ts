import { describe, it, expect } from 'vitest';
import { occursOn, dueItems } from '../services/reminders';
import { todayISO } from '../services/storage';

const ritual = { remindFirst: true, remindFullMoon: true, remindFourteenth: false, remindLastDay: false, reminderTime: '08:00' };

describe('Nhắc lịch', () => {
  it('todayISO dùng giờ máy, không lệch sang hôm qua', () => {
    expect(todayISO(new Date(2026, 10, 2, 6, 0))).toBe('2026-11-02');
  });
  it('Nhắc mùng Một, Rằm đúng giờ', () => {
    // 15/9 âm 2026 = 24/10/2026
    expect(dueItems(new Date(2026, 9, 24, 7, 59), [], ritual)).toHaveLength(0);
    const d = dueItems(new Date(2026, 9, 24, 8, 0), [], ritual);
    expect(d).toHaveLength(1);
    expect(d[0].title).toContain('Rằm tháng 9');
  });
  it('Giỗ theo âm lịch lặp hằng năm', () => {
    const r = { id: '1', title: 'Giỗ ông', note: '', time: '07:00', date: '2025-11-04', isRitual: false, repeat: 'lunar-yearly' as const, lunarDay: 15, lunarMonth: 9 };
    expect(occursOn(r, new Date(2026, 9, 24))).toBe(true);
    expect(occursOn(r, new Date(2026, 9, 25))).toBe(false);
  });
  it('Nhắc một lần', () => {
    const r = { id: '2', title: 'Họp', note: '', time: '14:00', date: '2026-11-05', isRitual: false };
    expect(occursOn(r, new Date(2026, 10, 5))).toBe(true);
    expect(dueItems(new Date(2026, 10, 5, 13, 0), [r], ritual)).toHaveLength(0);
    expect(dueItems(new Date(2026, 10, 5, 14, 1), [r], ritual)).toHaveLength(1);
  });
});
