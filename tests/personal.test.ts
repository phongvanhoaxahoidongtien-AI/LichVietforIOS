import { describe, it, expect } from 'vitest';
import { personalReport, cungPhi, cungInfo, nextClearYear, borrowSuggestions, nearGoodDays, levelOf } from '../services/personal';
import { getDayInfo, ACTIVITY_DEFS } from '../services/almanac';

describe('Cung phi Bát trạch', () => {
  it('khớp bảng tra phổ biến', () => {
    const cases: [number, 'nam' | 'nu', string][] = [
      [1989, 'nam', 'Khôn'], [1989, 'nu', 'Tốn'], [1990, 'nam', 'Khảm'], [1990, 'nu', 'Cấn'],
      [1986, 'nam', 'Khôn'], [1984, 'nam', 'Đoài'], [1985, 'nam', 'Càn'], [1991, 'nam', 'Ly'],
      [2000, 'nam', 'Ly'], [2000, 'nu', 'Càn'], [1980, 'nam', 'Khôn'], [1982, 'nu', 'Càn'], [1982, 'nam', 'Ly'],
    ];
    for (const [y, g, c] of cases) expect(cungPhi(y, g), `${y} ${g}`).toBe(c);
  });
  it('hướng tốt nam 1989 (Khôn): Đông Bắc, Tây, Tây Bắc, Tây Nam', () => {
    const c = cungInfo(1989, 'nam');
    expect(c.group).toBe('Tây tứ mệnh');
    expect(c.good.map((g) => g.dir)).toEqual(['Đông Bắc', 'Tây', 'Tây Bắc', 'Tây Nam']);
    expect(c.bad.map((g) => g.dir).sort()).toEqual(['Bắc', 'Nam', 'Đông', 'Đông Nam'].sort());
    expect(cungInfo(1989, 'nu').good.map((g) => g.dir)).toEqual(['Bắc', 'Nam', 'Đông', 'Đông Nam']);
  });
});

describe('Phiếu đánh giá theo tuổi', () => {
  const p = [{ birthYear: 1989 }];
  it('ví dụ 1989 về nhà mới 15/11/2026: không nên, đủ 4 nhóm', () => {
    const r = personalReport(new Date(2026, 10, 15), 'nhap-trach', p);
    expect(r.level).toBe('khong-nen');
    expect(r.blocked).toBe(true);
    expect(r.score).toBeLessThanOrEqual(29);
    expect(r.groups.map((g) => g.max)).toEqual([40, 15, 30, 15]);
    expect(r.groups[1].points).toBe(0);
    expect(r.yearBad).toContain('Hoang Ốc');
    expect(r.ownerAge).toBe(38);
    expect(r.mainReasons.join(' ')).toMatch(/Tam Nương/);
    expect(r.groups.reduce((a, g) => a + g.points, 0)).toBeGreaterThanOrEqual(r.score);
  });
  it('hạn năm trừ điểm nhưng không chặn', () => {
    const d = new Date(2026, 10, 17);
    const r89 = personalReport(d, 'nhap-trach', p);
    expect(r89.blocked).toBe(false);
    expect(r89.groups[3].points).toBe(7);
    const rNoYear = personalReport(d, 'ky-ket', p);
    expect(rNoYear.groups[3].points).toBe(15);
  });
  it('năm hết hạn gần nhất của tuổi 1989 cho nhập trạch là 2028', () => {
    expect(nextClearYear(p, 2026, 'nhap-trach')).toBe(2028);
  });
  it('gợi ý mượn tuổi không phạm hạn, không xung ngày', () => {
    const info = getDayInfo(new Date(2026, 10, 17));
    const b = borrowSuggestions(info, 'nhap-trach', p[0], [{ name: 'Bố', birthYear: 1960 }, { name: 'Tôi', birthYear: 1989 }]);
    expect(b.examples.length).toBeGreaterThan(0);
    expect(b.family.every((m) => m.birthYear !== 1989)).toBe(true);
    for (const e of b.examples) expect(personalReport(info.date, 'nhap-trach', [{ birthYear: e.birthYear }]).yearBad).toEqual([]);
  });
  it('ngày gợi ý gần nhất đều ở mức Nên', () => {
    const near = nearGoodDays(new Date(2026, 10, 15), 'nhap-trach', p);
    expect(near.length).toBeGreaterThan(0);
    for (const n of near) expect(n.score).toBeGreaterThanOrEqual(68);
  });
  it('mọi việc, cả năm: điểm 0–100, không lỗi, có đủ 3 mức', () => {
    const seen = new Set<string>();
    for (const a of ACTIVITY_DEFS) for (let i = 0; i < 365; i += 3) {
      const r = personalReport(new Date(2026, 0, 1 + i), a.key, [{ birthYear: 1975, gender: 'nam' }, { birthYear: 1978, gender: 'nu' }]);
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
      seen.add(r.level);
    }
    expect(seen.size).toBe(3);
    expect(levelOf(80, true)).toBe('khong-nen');
  });
});
