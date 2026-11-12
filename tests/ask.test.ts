import { describe, it, expect } from 'vitest';
import { parseQuestion, fold } from '../services/askParser';
import { convertLunar2Solar } from '../services/lunarCalendar';
import { coupleMatch, evaluateForPeople, getDayInfo, ACTIVITY_DEFS, evaluateActivity, findGoodDays, yearChecks } from '../services/almanac';

const NOW = new Date(2026, 10, 2, 22, 0); // Thứ Hai 2/11/2026
const P = (q: string) => parseQuestion(q, NOW);
const iso = (d: Date | null) => d ? `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}` : null;

describe('Hiểu câu hỏi ngắn', () => {
  it('Ví dụ 1 của anh: về nhà mới ngày mai', () => {
    const q = P('Tôi sinh năm 1980, ngày mai tôi muốn dọn vào nhà mới thì có tốt không?');
    expect(q.mode).toBe('check');
    expect(q.act).toBe('nhap-trach');
    expect(q.people).toEqual([{ role: 'tôi', birthYear: 1980, gender: undefined }]);
    expect(iso(q.date)).toBe('3/11/2026');
    expect(q.missing).toEqual([]);
  });

  it('Ví dụ 2 của anh: cưới tháng 11, hai người', () => {
    const q = P('tôi sinh năm 1980, vợ tôi sinh năm 1982, tôi nên tổ chức đám cưới vào ngày nào của tháng 11');
    expect(q.mode).toBe('pick');
    expect(q.act).toBe('cuoi-hoi');
    expect(q.people).toEqual([{ role: 'tôi', birthYear: 1980, gender: 'nam' }, { role: 'vợ', birthYear: 1982, gender: 'nu' }]);
    expect(iso(q.range!.from)).toBe('2/11/2026');
    expect(iso(q.range!.to)).toBe('30/11/2026');
  });

  it('Không dấu, viết tắt', () => {
    const q = P('toi sn 1975 mai khai truong cua hang duoc khong');
    expect(q.act).toBe('khai-truong'); expect(q.people[0].birthYear).toBe(1975); expect(iso(q.date)).toBe('3/11/2026'); expect(q.mode).toBe('check');
  });

  it('Năm 2 chữ số, tuổi can chi, tuổi theo số', () => {
    expect(P('em sinh năm 95 muốn mua xe hôm nay').people).toEqual([{ role: 'tôi', birthYear: 1995, gender: undefined }]);
    expect(P('tuổi Canh Thân xây nhà tháng sau').people[0].birthYear).toBe(1980);
    expect(P('tôi tuổi 47 muốn sửa bếp tuần sau').people[0].birthYear).toBe(1980);
  });

  it('Ngày cụ thể dương lịch, âm lịch, thứ trong tuần', () => {
    expect(iso(P('ngày 15/11 động thổ có tốt không, tôi 1980').date)).toBe('15/11/2026');
    expect(iso(P('ngày 20 tháng 12 năm 2026 ký hợp đồng được không').date)).toBe('20/12/2026');
    expect(iso(P('mùng 6 tháng 10 âm lịch nhập trạch được không').date)).toBe('14/11/2026'); // 15/11 là mùng 7 (xemlicham)
    expect(iso(P('thứ bảy này đi du lịch có tốt không').date)).toBe('7/11/2026');
    expect(iso(P('chủ nhật tuần sau cúng giỗ được không').date)).toBe('15/11/2026');
    expect(iso(P('ngày kia đi xa được không').date)).toBe('4/11/2026');
    expect(iso(P('5/1 khai trương').date)).toBe('5/1/2027'); // đã qua → năm sau
  });

  it('Khoảng thời gian', () => {
    expect(P('chọn ngày ăn hỏi trong 3 tháng tới, con gái tôi sinh 2000').range!.label).toBe('3 tháng tới');
    expect(P('nên động thổ ngày nào trong ba tháng tới').range!.label).toBe('3 tháng tới');
    const t = P('tháng 2 năm sau cưới ngày nào đẹp'); expect(t.range!.label).toBe('tháng 2/2027');
    const lu = P('cưới vào tháng 10 âm lịch ngày nào tốt'); expect(lu.range!.label).toBe('tháng 10 âm lịch năm 2026'); expect(iso(lu.range!.from)).toBe('9/11/2026');
    expect(P('cuối tuần này nhập trạch ngày nào tốt').range!.label).toBe('cuối tuần này');
    const ct = P('cưới vào cuối tuần tháng 12'); expect(ct.weekendOnly).toBe(true); expect(ct.range!.label).toBe('tháng 12/2026');
  });

  it('Phân biệt từ trùng khi bỏ dấu (cũng/cúng, mai/mai táng, một/mốt)', () => {
    expect(P('tôi cũng muốn biết ngày mai thế nào').act).toBe(null);
    const mt = P('mai táng ông vào tháng 12 ngày nào tốt'); expect(mt.act).toBe('an-tang'); expect(mt.date).toBe(null); expect(mt.mode).toBe('pick');
    expect(P('một ngày đẹp để cưới').date).toBe(null);
    expect(P('cúng giỗ ngày mai được không').act).toBe('cung-te');
  });

  it('Đủ 19 việc nhận ra được', () => {
    const qs: [string, string][] = [
      ['dạm ngõ', 'an-hoi'], ['lấy vợ', 'cuoi-hoi'], ['về nhà mới', 'nhap-trach'], ['khởi công xây nhà', 'dong-tho'], ['đổ mái', 'do-mai'],
      ['sửa bếp', 'sua-nha'], ['mua đất', 'mua-nha'], ['mở quán', 'khai-truong'], ['ký hợp đồng', 'ky-ket'], ['nhận việc mới', 'nham-chuc'],
      ['đòi nợ', 'cau-tai'], ['mua xe máy', 'mua-xe'], ['đi công tác', 'xuat-hanh'], ['nhập học', 'nhap-hoc'], ['giải hạn', 'cung-te'],
      ['lập bàn thờ', 'dat-ban-tho'], ['cải táng', 'an-tang'], ['phẫu thuật', 'chua-benh'], ['trồng cây', 'trong-trot'],
    ];
    for (const [t, k] of qs) expect(P(`${t} ngày mai có tốt không`).act, t).toBe(k);
    expect(new Set(qs.map((x) => x[1])).size).toBe(ACTIVITY_DEFS.length);
  });

  it('Vai trò sở hữu: con gái tôi, chồng tôi, mẹ mình', () => {
    expect(P('con gái tôi sinh năm 2000 ăn hỏi tháng 12').people).toEqual([{ role: 'con', birthYear: 2000, gender: 'nu' }]);
    const q = P('tôi sinh 1992, chồng tôi sinh 1990 nên cưới ngày nào tháng 1 năm 2027');
    expect(q.people.map((p) => [p.role, p.birthYear, p.gender])).toEqual([['tôi', 1992, 'nu'], ['chồng', 1990, 'nam']]);
    expect(q.range!.label).toBe('tháng 1/2027');
    expect(P('mẹ mình tuổi Đinh Dậu muốn cúng giải hạn ngày mai').people[0]).toMatchObject({ role: 'mẹ', birthYear: 1957 });
  });

  it('Từ dễ nhầm khi có dấu: cuối/cưới, mái/mai; cách nói dân gian', () => {
    const a = P('sửa bếp cuối tuần này được không, vợ chồng tôi 1984 và 1987');
    expect(a.act).toBe('sua-nha');
    expect(a.people.map((p) => p.role)).toEqual(['chồng', 'vợ']);
    const b = P('đổ mái nhà tháng 12 âm lịch ngày nào tốt tôi sinh 1986');
    expect(b.act).toBe('do-mai'); expect(b.date).toBe(null); expect(b.range!.label).toBe('tháng 12 âm lịch năm 2026');
    { const [d, m, y] = convertLunar2Solar(15, 1, 2027); expect(iso(P('cúng giải hạn cho mẹ sinh 1962 ngày rằm tháng giêng').date)).toBe(`${d}/${m}/${y}`); }
    expect(P('năm nay 2026 tôi 45 tuổi có làm nhà được không').people[0].birthYear).toBe(1982);
    expect(P('cuoi vao thang 1 nam sau ngay nao dep, vo 1995 chong 1993').act).toBe('cuoi-hoi');
    expect(P('tháng này cuối tháng có ngày nào tốt để khai trương').act).toBe('khai-truong');
    expect(P('lop mai nha ngay nao tot').date).toBe(null);
  });

  it('Báo thiếu thông tin', () => {
    expect(P('ngày mai có tốt không').missing).toEqual(['việc cần làm', 'năm sinh']);
    expect(P('tôi 1980 muốn cưới').missing).toEqual(['ngày hoặc khoảng thời gian']);
  });

  it('Không đọc nhầm năm hiện tại, ngày tháng là năm sinh', () => {
    expect(P('ngày 15/11/2026 cưới, tôi sinh 1990').people.map((p) => p.birthYear)).toEqual([1990]);
    expect(P('tháng 11 năm 2026 tôi 1985 cưới ngày nào').people.map((p) => p.birthYear)).toEqual([1985]);
    expect(fold('Đồng Ý Cưới')).toBe('dong y cuoi');
  });
});

describe('Xem tuổi vợ chồng, nhiều người', () => {
  it('1980 Canh Thân – 1982 Nhâm Tuất', () => {
    const r = coupleMatch({ birthYear: 1980 }, { birthYear: 1982 });
    expect(r.criteria.map((c) => c.result)).toEqual(['tốt', 'tốt', 'bình thường']); // Mộc–Thủy sinh; Canh(Kim)–Nhâm(Thủy) sinh; Thân–Tuất
    expect(r.verdict).toBe('Hợp');
  });
  it('Tý – Ngọ lục xung, Giáp – Kỷ hợp', () => {
    const r = coupleMatch({ birthYear: 1984 }, { birthYear: 1990 }); // Giáp Tý – Canh Ngọ
    expect(r.criteria[2].note).toContain('lục xung');
    expect(coupleMatch({ birthYear: 1984 }, { birthYear: 1989 }).criteria[1].note).toContain('tương hợp'); // Giáp – Kỷ
    expect(coupleMatch({ birthYear: 1988 }, { birthYear: 1993 }).criteria[2].note).toContain('lục hợp'); // Mậu Thìn – Quý Dậu
    expect(coupleMatch({ birthYear: 1988 }, { birthYear: 1985 }).criteria[2].note).toContain('tứ hành xung'); // Thìn – Sửu
  });
  it('Nhiều người: ngày xung tuổi người nào cũng bị loại', () => {
    const info = getDayInfo(new Date(2026, 10, 2)); // xung Giáp Tuất (1994)
    expect(evaluateForPeople(info, 'cuoi-hoi', [{ birthYear: 1980 }, { birthYear: 1994 }]).blocked).toBe(true);
    const ok = evaluateForPeople(info, 'cung-te', [{ birthYear: 1980 }, { birthYear: 1982 }]);
    expect(ok.score).toBe(Math.min(...ok.perPerson.map((p) => p.score)));
  });
  it('Tất cả 19 việc chấm điểm ổn định suốt 1 năm, có ngày tốt', () => {
    for (const d of ACTIVITY_DEFS) {
      let good = 0;
      for (let k = 0; k < 365; k++) {
        const r = evaluateActivity(getDayInfo(new Date(2026, 0, 1 + k)), d.key, { birthYear: 1980 });
        expect(r.score).toBeGreaterThanOrEqual(0); expect(r.score).toBeLessThanOrEqual(100);
        if (!r.blocked && r.score >= 60) good++;
      }
      expect(good, d.label).toBeGreaterThan(20);
      expect(good, d.label).toBeLessThan(250);
      expect(findGoodDays({ from: new Date(2026, 10, 1), to: new Date(2026, 11, 31), act: d.key }).length, d.label).toBeGreaterThan(0);
      expect(Array.isArray(yearChecks({ birthYear: 1980 }, 2026, d.key))).toBe(true);
    }
  });
  it('Kết quả thật cho 2 ví dụ', () => {
    const r = evaluateForPeople(getDayInfo(new Date(2026, 10, 3)), 'nhap-trach', [{ birthYear: 1980 }]);
    expect(r.blocked).toBe(true);
    expect(r.reasons.some((x) => x.text.includes('Dương Công'))).toBe(true);
    expect(yearChecks({ birthYear: 1980 }, 2026, 'nhap-trach').find((y) => y.name === 'Hoang Ốc')!.bad).toBe(true);
  });
});
