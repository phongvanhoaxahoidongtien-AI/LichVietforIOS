import { describe, it, expect } from 'vitest';
import { getDayInfo, evaluateActivity, findGoodDays, kimLau, hoangOc, tamTai, yearChecks, personInfo, hacThan, ACTIVITIES, activitiesForDay } from '../services/almanac';

const names = (a: { name: string }[]) => a.map((x) => x.name);
const hd = (i: ReturnType<typeof getDayInfo>) => i.hours.filter((h) => h.hoangDao).map((h) => h.branch);

describe('Đối chiếu lịch vạn niên (xemlicham.com, ngaydep.com, mytour.vn, baohatinh.vn)', () => {
  it('2/11/2026 – Canh Thìn', () => {
    const i = getDayInfo(new Date(2026, 10, 2));
    expect(i.canChi.day).toBe('Canh Thìn');
    expect(i.canChi.month).toBe('Mậu Tuất');
    expect(i.napAm.name).toBe('Bạch Lạp Kim');
    expect(i.truc.name).toBe('Phá');
    expect(i.sao28.name).toBe('Tất');
    expect(i.than.name).toBe('Thanh Long');
    expect(i.than.hoangDao).toBe(true);
    expect(hd(i)).toEqual(['Dần', 'Thìn', 'Tỵ', 'Thân', 'Dậu', 'Hợi']);
    expect(i.directions).toEqual({ hyThan: 'Tây Bắc', taiThan: 'Tây Nam', hacThan: 'Chính Tây' });
    expect(i.xungTuoi).toEqual(['Giáp Tuất', 'Mậu Tuất']);
    for (const s of ['Thiên Quý', 'Nguyệt Ân', 'Giải Thần', 'Ích Hậu', 'Mẫu Thương']) expect(names(i.goodStars)).toContain(s);
    for (const s of ['Nguyệt Phá', 'Lục Bất Thành', 'Vãng Vong']) expect(names(i.badStars)).toContain(s);
    expect(i.hours.slice(0, 6).map((h) => h.ltp.name)).toEqual(['Tốc Hỷ', 'Xích Khẩu', 'Tiểu Cát', 'Tuyệt Lộ', 'Đại An', 'Lưu Niên']);
    expect(i.hours[6].ltp.name).toBe('Tốc Hỷ'); // Ngọ cùng Tý
    expect(names(i.kyDays)).not.toContain('Tam Nương');
    expect(names(i.kyDays)).not.toContain('Nguyệt Kỵ');
    expect(i.hours[0].canChi).toBe('Bính Tý');
  });

  it('15/11/2026 – Quý Tỵ, Tam Nương', () => {
    const i = getDayInfo(new Date(2026, 10, 15));
    expect(i.lunar.day).toBe(7);
    expect(i.canChi.day).toBe('Quý Tỵ');
    expect(i.truc.name).toBe('Phá');
    expect(i.sao28.name).toBe('Phòng');
    expect(names(i.kyDays)).toContain('Tam Nương');
    for (const s of ['Thiên Quý', 'Kính Tâm', 'Dịch Mã']) expect(names(i.goodStars)).toContain(s);
    for (const s of ['Tiểu Hồng Sa', 'Nguyệt Phá']) expect(names(i.badStars)).toContain(s);
    expect(i.directions.hyThan).toBe('Đông Nam');
    expect(i.directions.taiThan).toBe('Chính Tây');
    expect(hd(i)).toEqual(['Sửu', 'Thìn', 'Ngọ', 'Mùi', 'Tuất', 'Hợi']);
    expect(i.hours[0].ltp.name).toBe('Tiểu Cát');
    expect(i.xungTuoi.sort()).toEqual(['Đinh Hợi', 'Ất Hợi'].sort());
  });

  it('15/6/2026 – Canh Thân, Sát Chủ Âm', () => {
    const i = getDayInfo(new Date(2026, 5, 15));
    expect(i.lunar).toMatchObject({ day: 1, month: 5 });
    expect(i.truc.name).toBe('Mãn');
    expect(i.sao28.name).toBe('Tất');
    expect(names(i.kyDays)).toContain('Sát Chủ Âm');
    expect(hd(i)).toEqual(['Tý', 'Sửu', 'Thìn', 'Tỵ', 'Mùi', 'Tuất']);
    expect(i.directions).toEqual({ hyThan: 'Tây Bắc', taiThan: 'Tây Nam', hacThan: 'Đông Nam' });
  });

  it('11/2/2026 – Bính Thìn, Bạch Hổ, Thiên Mã', () => {
    const i = getDayInfo(new Date(2026, 1, 11));
    expect(i.canChi.day).toBe('Bính Thìn');
    expect(i.sao28.name).toBe('Cơ');
    expect(i.than.name).toBe('Bạch Hổ');
    expect(names(i.goodStars)).toContain('Thiên Mã');
    expect(i.directions).toEqual({ hyThan: 'Tây Nam', taiThan: 'Chính Đông', hacThan: 'Chính Đông' });
  });

  it('15/2/2026 – Canh Thân, Trực Phá (tiết Lập xuân), giờ Tý Xích Khẩu', () => {
    const i = getDayInfo(new Date(2026, 1, 15));
    expect(i.truc.name).toBe('Phá');
    expect(i.directions.hacThan).toBe('Đông Nam');
    expect(i.hours[0].ltp.name).toBe('Xích Khẩu');
  });

  it('11/8/2026 – Đinh Tỵ, Trực Thu, Ngọc Đường Hoàng đạo', () => {
    const i = getDayInfo(new Date(2026, 7, 11));
    expect(i.truc.name).toBe('Thu');
    expect(i.than.name).toBe('Ngọc Đường');
    expect(hd(i)).toEqual(['Sửu', 'Thìn', 'Ngọ', 'Mùi', 'Tuất', 'Hợi']);
  });

  it('15/8/2026 – Tân Dậu, Tam Nương, Vãng Vong, Huyền Vũ', () => {
    const i = getDayInfo(new Date(2026, 7, 15));
    expect(names(i.kyDays)).toContain('Tam Nương');
    expect(names(i.badStars)).toContain('Vãng Vong');
    expect(i.than.name).toBe('Huyền Vũ');
  });

  it('15/9/2026 – Nhâm Thìn, Trực Nguy, Thiên Hình', () => {
    const i = getDayInfo(new Date(2026, 8, 15));
    expect(i.truc.name).toBe('Nguy');
    expect(i.than.name).toBe('Thiên Hình');
    expect(i.directions).toEqual({ hyThan: 'Chính Nam', taiThan: 'Chính Tây', hacThan: 'Chính Bắc' });
  });
});

describe('Quy tắc', () => {
  it('Trực lặp lại vào ngày bắt đầu tiết (trùng trực) và có đủ 12 trực mỗi tháng tiết', () => {
    // Lập xuân 2026 vào 4/2: trực ngày 4/2 trùng ngày 3/2
    expect(getDayInfo(new Date(2026, 1, 4)).truc.name).toBe(getDayInfo(new Date(2026, 1, 3)).truc.name);
    expect(getDayInfo(new Date(2026, 1, 5)).truc.name).not.toBe(getDayInfo(new Date(2026, 1, 4)).truc.name);
  });

  it('Hạc thần 16 ngày trên trời', () => {
    let none = 0; for (let n = 0; n < 60; n++) if (hacThan(n) === null) none++;
    expect(none).toBe(16);
  });

  it('Mỗi ngày có đúng 6 giờ Hoàng đạo, 28 sao đi theo thứ trong tuần', () => {
    for (let k = 0; k < 400; k++) {
      const d = new Date(2026, 0, 1 + k);
      const i = getDayInfo(d);
      expect(i.hours.filter((h) => h.hoangDao).length).toBe(6);
      // Giác luôn rơi vào thứ Năm
      if (i.sao28.name === 'Giác') expect(d.getDay()).toBe(4);
      if (i.sao28.name === 'Phòng') expect(d.getDay()).toBe(0);
      expect(i.score).toBeGreaterThanOrEqual(0); expect(i.score).toBeLessThanOrEqual(100);
    }
  });

  it('Dương Công Kỵ Nhật 13/1 âm', () => {
    // 13/1 âm 2026 = 1/3/2026
    const i = getDayInfo(new Date(2026, 2, 1));
    expect(i.lunar).toMatchObject({ day: 13, month: 1 });
    expect(names(i.kyDays)).toContain('Dương Công Kỵ Nhật');
    expect(names(i.kyDays)).toContain('Tam Nương');
  });

  it('Tứ ly trước Đông chí 2026 (22/12) là 21/12', () => {
    expect(names(getDayInfo(new Date(2026, 11, 21)).kyDays)).toContain('Tứ Ly');
    expect(names(getDayInfo(new Date(2026, 11, 22)).kyDays)).not.toContain('Tứ Ly');
  });

  it('Kim Lâu, Hoang Ốc, Tam Tai', () => {
    expect([12, 15, 17, 19, 21, 24, 26, 28].every((a) => kimLau(a))).toBe(true);
    expect([13, 14, 16, 18, 20, 22, 23, 25].some((a) => kimLau(a))).toBe(false);
    const ho = [12, 14, 15, 18, 21, 23, 24, 27, 29, 30, 32, 33, 36, 38, 39, 41, 42, 45, 47, 48, 50, 51, 54, 56, 57, 60, 63, 65, 66, 69, 72, 74, 75];
    for (let a = 10; a <= 75; a++) expect(hoangOc(a).bad, `tuổi ${a}`).toBe(ho.includes(a));
    // Tuổi Ngọ: Tam Tai năm Thân, Dậu, Tuất
    expect(tamTai(1990, 2028)).toBe(true); expect(tamTai(1990, 2029)).toBe(true); expect(tamTai(1990, 2030)).toBe(true);
    expect(tamTai(1990, 2027)).toBe(false); expect(tamTai(1990, 2031)).toBe(false);
    // Tuổi Tý: Dần Mão Thìn
    expect(tamTai(1984, 2022)).toBe(true); expect(tamTai(1984, 2024)).toBe(true); expect(tamTai(1984, 2025)).toBe(false);
    expect(personInfo({ birthYear: 1984 }).canChi).toBe('Giáp Tý');
    expect(personInfo({ birthYear: 1984 }).napAm.name).toBe('Hải Trung Kim');
    expect(yearChecks({ birthYear: 1990 }, 2026, 'dong-tho').map((y) => y.name)).toEqual(['Kim Lâu', 'Hoang Ốc', 'Tam Tai']);
  });

  it('Chấm điểm: ngày phạm Tam Nương bị chặn cho cưới hỏi; xung tuổi bị chặn', () => {
    const tn = getDayInfo(new Date(2026, 10, 15));
    expect(evaluateActivity(tn, 'cuoi-hoi').blocked).toBe(true);
    const d = getDayInfo(new Date(2026, 10, 2)); // xung Giáp Tuất
    expect(evaluateActivity(d, 'cung-te', { birthYear: 1994 }).blocked).toBe(true); // 1994 Giáp Tuất
    const r = evaluateActivity(d, 'cung-te', { birthYear: 1980 }); // Canh Thân: tam hợp Thìn
    expect(r.reasons.some((x) => x.text.includes('tam hợp'))).toBe(true);
    expect(r.goodHours.every((h) => h.hoangDao)).toBe(true);
  });

  it('Trạch nhật trả về ngày hợp lệ, sắp xếp theo điểm', () => {
    for (const a of ACTIVITIES) {
      const res = findGoodDays({ from: new Date(2026, 10, 1), to: new Date(2027, 1, 28), act: a.key, person: { birthYear: 1985 } });
      expect(res.length, a.label).toBeGreaterThan(0);
      for (let k = 1; k < res.length; k++) expect(res[k - 1].result.score).toBeGreaterThanOrEqual(res[k].result.score);
      expect(res.every((x) => !x.result.blocked && x.result.score >= 60)).toBe(true);
    }
  });

  it('Phân bố điểm hợp lý trong năm (không quá dễ, không quá khó)', () => {
    const v: Record<string, number> = {};
    for (let k = 0; k < 365; k++) { const i = getDayInfo(new Date(2026, 0, 1 + k)); v[i.verdict] = (v[i.verdict] || 0) + 1; }
    expect((v['Rất tốt'] || 0) + (v['Tốt'] || 0)).toBeGreaterThan(40);
    expect((v['Rất tốt'] || 0) + (v['Tốt'] || 0)).toBeLessThan(200);
    console.log('Phân bố 2026:', v);
    const a = activitiesForDay(getDayInfo(new Date(2026, 10, 2)));
    expect(a.bad.length).toBeGreaterThan(0);
  });
});
