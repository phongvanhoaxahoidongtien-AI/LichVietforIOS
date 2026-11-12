import { describe, it, expect } from 'vitest';
import { RULERS, lookup, nearestGood, parseSize, segments } from '../services/loban';
import { TRUC_12, getDayInfo } from '../services/almanac';
import { bankDeeplink, BANK_APPS, vietQrPayload, crc16, asciiNote } from '../services/vietqr';

describe('Thước Lỗ Ban', () => {
  it('chu kỳ và số cung đúng', () => {
    expect(RULERS['522'].cung.length).toBe(8);
    expect(RULERS['429'].cung.length).toBe(8);
    expect(RULERS['388'].cung.length).toBe(10);
    expect(RULERS['522'].cung.every((c) => c.subs.length === 5)).toBe(true);
    expect(RULERS['429'].cung.every((c) => c.subs.length === 4)).toBe(true);
    expect(RULERS['388'].cung.every((c) => c.subs.length === 4)).toBe(true);
  });
  it('kích thước bàn thờ phổ biến rơi vào cung tốt (thước 38,8)', () => {
    for (const cm of [61, 81, 107, 127, 153, 175, 197]) expect(lookup(RULERS['388'], cm * 10).good, `${cm} cm`).toBe(true);
    expect(lookup(RULERS['388'], 1270).cung.name).toBe('Vượng');
  });
  it('cửa thông thủy 81 cm trên thước 52,2 là Nhân Lộc', () => {
    const r = lookup(RULERS['522'], 810);
    expect(r.cung.name).toBe('Nhân Lộc');
    expect(r.good).toBe(true);
  });
  it('biên cung: 0 mm là cung đầu, đúng mép chuyển sang cung sau, lặp chu kỳ', () => {
    const r = RULERS['429'];
    expect(lookup(r, 0).cung.name).toBe('Tài');
    expect(lookup(r, 0).sub).toBe('Tài đức');
    expect(lookup(r, 53.625).cung.name).toBe('Bệnh');
    expect(lookup(r, 53.6).cung.name).toBe('Tài');
    expect(lookup(r, 429).cung.name).toBe('Tài');
    expect(lookup(r, 429 + 200).cung.name).toBe(lookup(r, 200).cung.name);
    expect(lookup(r, 428.9).cung.name).toBe('Bản');
    expect(lookup(r, 428.9).sub).toBe('Hưng vượng');
  });
  it('khoảng tốt gần nhất nằm trong cung tốt', () => {
    for (const r of Object.values(RULERS)) {
      for (let mm = 0; mm < 3000; mm += 37) {
        const n = nearestGood(r, mm);
        if (n.above) { expect(lookup(r, n.above[0]).good).toBe(true); expect(lookup(r, n.above[1]).good).toBe(true); expect(n.above[0]).toBeGreaterThan(mm - 1); }
        if (n.below) { expect(lookup(r, n.below[0]).good).toBe(true); expect(lookup(r, n.below[1]).good).toBe(true); expect(n.below[1]).toBeLessThan(mm + 1); }
        expect(n.above).not.toBeNull();
      }
    }
  });
  it('đọc số người dùng nhập', () => {
    expect(parseSize('81', 'cm')).toBe(810);
    expect(parseSize('81,5', 'cm')).toBe(815);
    expect(parseSize('1.27', 'm')).toBe(1270);
    expect(parseSize(' 810 ', 'mm')).toBe(810);
    expect(parseSize('abc', 'cm')).toBeNull();
    expect(parseSize('-5', 'cm')).toBeNull();
    expect(parseSize('', 'cm')).toBeNull();
  });
  it('segments phủ kín khoảng vẽ', () => {
    const s = segments(RULERS['522'], 100, 400);
    expect(s[0].start).toBeLessThanOrEqual(100);
    expect(s[s.length - 1].end).toBeGreaterThanOrEqual(400);
  });
});

describe('12 Trực', () => {
  it('nhãn theo danh sách phổ biến', () => {
    const m = Object.fromEntries(TRUC_12.map((t) => [t.name, t.tone]));
    expect(m).toEqual({ Kiến: 'tot', Trừ: 'tot', Mãn: 'tot', Bình: 'binh', Định: 'tot', Chấp: 'binh', Phá: 'xau', Nguy: 'xau', Thành: 'tot', Thu: 'xau', Khai: 'tot', Bế: 'xau' });
    expect(TRUC_12.every((t) => t.nen.length > 0 && t.kieng.length > 0 && t.meaning)).toBe(true);
  });
  it('getDayInfo trả đủ thông tin Trực', () => {
    const i = getDayInfo(new Date(2026, 10, 4));
    expect(i.truc.tone).toMatch(/tot|binh|xau/);
    expect(i.truc.nen.length).toBeGreaterThan(0);
    expect(TRUC_12[i.truc.index].name).toBe(i.truc.name);
  });
});

describe('Chuyển khoản nhanh', () => {
  it('deeplink đúng định dạng VietQR', () => {
    const u = new URL(bankDeeplink({ app: 'mb', account: '0781000409918', bankCode: 'vcb', amount: 50000, note: 'Ủng hộ Lịch Việt', name: 'Lê Thế Điệp', returnUrl: 'https://example.vn/' }));
    expect(u.origin + u.pathname).toBe('https://dl.vietqr.io/pay');
    expect(u.searchParams.get('app')).toBe('mb');
    expect(u.searchParams.get('ba')).toBe('0781000409918@vcb');
    expect(u.searchParams.get('am')).toBe('50000');
    expect(u.searchParams.get('tn')).toBe('Ung ho Lich Viet');
    expect(u.searchParams.get('bn')).toBe('LE THE DIEP');
    expect(u.searchParams.get('url')).toBe('https://example.vn/');
    expect(u.toString()).not.toContain('+');
  });
  it('không có số tiền thì am rỗng', () => {
    const u = new URL(bankDeeplink({ app: 'vcb', account: '1', bankCode: 'vcb' }));
    expect(u.searchParams.get('am')).toBe('');
    expect(u.searchParams.get('url')).toBe('https://vietqr.io');
  });
  it('danh sách app không trùng, có 5 app tự điền', () => {
    expect(new Set(BANK_APPS.map((b) => b.id)).size).toBe(BANK_APPS.length);
    expect(BANK_APPS.filter((b) => b.autofill).map((b) => b.id).sort()).toEqual(['acb', 'bidv', 'icb', 'mb', 'ocb']);
  });
  it('QR có số tiền dùng mã động (01=12) và thẻ 54', () => {
    const p = vietQrPayload({ bin: '970436', account: '0781000409918', amount: 50000, note: 'Ung ho Lich Viet' });
    expect(p).toContain('010212');
    expect(p).toContain('540550000');
    expect(p.slice(-4)).toBe(crc16(p.slice(0, -4)));
  });
  it('asciiNote bỏ dấu', () => { expect(asciiNote('Đồng ý – được!')).toBe('Dong y duoc'); });
});
