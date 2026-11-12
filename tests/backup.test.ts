import { describe, it, expect, beforeEach } from 'vitest';
import { parseBackup, mergeBackup, collectBackup, applyBackup, type BackupData } from '../services/backup';
import { vietQrPayload, crc16 } from '../services/vietqr';

const mem: Record<string, string> = {};
beforeEach(() => {
  for (const k of Object.keys(mem)) delete mem[k];
  (globalThis as any).localStorage = { getItem: (k: string) => mem[k] ?? null, setItem: (k: string, v: string) => { mem[k] = String(v); }, removeItem: (k: string) => { delete mem[k]; } };
});

const R = (id: string, title: string, extra: object = {}) => ({ id, title, note: '', time: '07:00', date: '2026-11-04', isRitual: false, repeat: 'lunar-yearly' as const, lunarDay: 15, lunarMonth: 9, ...extra });

describe('Sao lưu và khôi phục', () => {
  it('Tạo bản sao lưu từ dữ liệu trên máy, khôi phục lại đúng', () => {
    mem['viet-calendar-reminders'] = JSON.stringify([R('1', 'Giỗ ông'), R('2', 'Họp tổ', { repeat: 'none', lunarDay: undefined, lunarMonth: undefined })]);
    mem['viet-calendar-family'] = JSON.stringify([{ id: 'a', name: 'Tôi', birthYear: 1980, gender: 'nam' }]);
    mem['viet-calendar-ritual-settings'] = JSON.stringify({ remindFirst: true, remindFullMoon: true, remindFourteenth: false, remindLastDay: true, reminderTime: '06:30' });
    mem['viet-calendar-settings'] = JSON.stringify({ theme: 'dark', fontScale: 1.25, notifications: false });
    mem['viet-calendar-user-bg'] = 'data:image/jpeg;base64,AAAA';
    const b = collectBackup();
    const text = JSON.stringify(b);
    expect(text).not.toContain('base64'); // không gồm ảnh nền
    const p = parseBackup(text);
    expect(p.data.reminders).toHaveLength(2);
    expect(p.data.family[0]).toMatchObject({ name: 'Tôi', birthYear: 1980 });
    expect(p.data.ritual!.reminderTime).toBe('06:30');
    expect(p.data.settings).toEqual({ theme: 'dark', fontScale: 1.25, notifications: false });
    for (const k of Object.keys(mem)) delete mem[k];
    expect(applyBackup(p.data)).toBe(true);
    expect(JSON.parse(mem['viet-calendar-reminders'])).toHaveLength(2);
  });

  it('Chưa từng đổi cài đặt: vẫn sao lưu giá trị mặc định đang dùng', () => {
    const b = collectBackup();
    expect(b.data.ritual).toEqual({ remindFirst: true, remindFullMoon: true, remindFourteenth: false, remindLastDay: false, reminderTime: '08:00' });
    expect(b.data.settings).toEqual({ theme: 'system', fontScale: 1, notifications: false });
  });

  it('Gộp: bỏ mục trùng, giữ mục mới; thay thế: lấy toàn bộ bản sao lưu', () => {
    const cur: BackupData = { reminders: [R('1', 'Giỗ ông')], family: [{ id: 'a', name: 'Tôi', birthYear: 1980 }], ritual: null, settings: { theme: 'light' } };
    const inc: BackupData = { reminders: [R('9', 'giỗ ông '), R('1', 'Giỗ bà', { lunarDay: 3, lunarMonth: 3 })], family: [{ id: 'b', name: 'tôi', birthYear: 1980 }, { id: 'c', name: 'Vợ', birthYear: 1982 }], ritual: { remindFirst: true, remindFullMoon: true, remindFourteenth: false, remindLastDay: false, reminderTime: '08:00' }, settings: { theme: 'dark' } };
    const m = mergeBackup(cur, inc, 'merge');
    expect(m.data.reminders.map((r) => r.title)).toEqual(['Giỗ ông', 'Giỗ bà']);
    expect(new Set(m.data.reminders.map((r) => r.id)).size).toBe(2); // trùng id được đổi
    expect(m.added).toEqual({ reminders: 1, family: 1 });
    expect(m.skipped).toEqual({ reminders: 1, family: 1 });
    expect(m.data.settings!.theme).toBe('dark');
    const rp = mergeBackup(cur, inc, 'replace');
    expect(rp.data.reminders).toHaveLength(2);
    expect(rp.data.family.map((f) => f.name)).toEqual(['tôi', 'Vợ']);
  });

  it('Từ chối tệp lạ, tệp hỏng; làm sạch dữ liệu độc hại', () => {
    expect(() => parseBackup('xin chào')).toThrow(/hỏng/);
    expect(() => parseBackup('{"app":"khac","data":{}}')).toThrow(/không phải/);
    expect(() => parseBackup(JSON.stringify({ app: 'lich-viet', version: 99, data: {} }))).toThrow(/mới hơn/);
    expect(() => parseBackup('x'.repeat(3 * 1024 * 1024))).toThrow(/quá lớn/);
    const evil = JSON.stringify({ app: 'lich-viet', version: 1, data: {
      reminders: [{ id: 'x', title: '<img src=x onerror=alert(1)>'.repeat(20), date: '2026-11-04', time: '99:99', repeat: 'hack', lunarDay: 99, __proto__: { polluted: 1 } }, { title: 'thiếu ngày' }, 'rác'],
      family: [{ name: 'A', birthYear: 1800 }, { name: 'B', birthYear: 1990, gender: 'x' }],
      settings: { theme: 'neon', fontScale: 9, extra: 'x' }, ritual: { reminderTime: 'abc' },
    } });
    const p = parseBackup(evil);
    expect(p.data.reminders).toHaveLength(1);
    expect(p.data.reminders[0].title.length).toBe(120);
    expect(p.data.reminders[0]).toMatchObject({ time: '', repeat: 'none' });
    expect(p.data.reminders[0].lunarDay).toBeUndefined();
    expect(p.data.family).toEqual([{ id: expect.any(String), name: 'B', birthYear: 1990 }]);
    expect(p.data.settings).toEqual({});
    expect(p.data.ritual!.reminderTime).toBe('08:00');
    expect(({} as any).polluted).toBeUndefined();
  });
});

describe('VietQR', () => {
  it('CRC-16/CCITT-FALSE đúng chuẩn', () => {
    expect(crc16('123456789')).toBe('29B1');
  });
  it('Chuỗi VietQR đúng cấu trúc NAPAS 247', () => {
    const p = vietQrPayload({ bin: '970403', account: '0011012345678' });
    expect(p.startsWith('000201010211385700' + '10A000000727' + '0127' + '0006970403' + '0113' + '0011012345678' + '0208QRIBFTTA' + '5303704' + '5802VN')).toBe(true);
    expect(p.slice(-8, -4)).toBe('6304');
    expect(p.slice(-4)).toBe(crc16(p.slice(0, -4)));
    const v = vietQrPayload({ bin: '970436', account: '0781000409918', note: 'Ung ho Lich Viet' });
    expect(v).toContain('0006970436011307810004099180208QRIBFTTA');
    expect(v).toContain('62200816Ung ho Lich Viet');
  });
});
