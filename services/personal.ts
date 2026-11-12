/**
 * Phiếu đánh giá ngày theo tuổi người xem.
 * Điểm phù hợp 100 = Chất lượng ngày (40) + Ngày kỵ (15) + Hợp tuổi (30) + Hạn năm cho việc (15).
 * Nội dung mang tính tham khảo văn hóa, tín ngưỡng dân gian.
 */
import { STEMS, BRANCHES, getYearCanChi } from './lunarCalendar';
import {
  ACT_DEF, getDayInfo, evaluateActivity, personInfo, elementRelation, yearChecks, tuoiMu,
  LUC_HOP, tamHop, type ActivityKey, type DayInfo, type Person, type HourInfo, type YearCheck,
} from './almanac';

export type Level = 'nen' | 'can-nhac' | 'khong-nen';
export const LEVEL_LABEL: Record<Level, string> = { nen: 'Nên làm', 'can-nhac': 'Cân nhắc', 'khong-nen': 'Không nên' };

export interface Item { text: string; good: boolean }
export interface Group { key: 'ngay' | 'ky' | 'tuoi' | 'nam'; title: string; points: number; max: number; items: Item[] }

export interface PersonView extends Person { name?: string }

/* ------------------------------------------------------------------ */
/* Cung mệnh (Bát trạch)                                               */
/* ------------------------------------------------------------------ */

export type Cung = 'Khảm' | 'Khôn' | 'Chấn' | 'Tốn' | 'Càn' | 'Đoài' | 'Cấn' | 'Ly';
const CUNG_BY_NUM: Record<number, Cung> = { 1: 'Khảm', 2: 'Khôn', 3: 'Chấn', 4: 'Tốn', 6: 'Càn', 7: 'Đoài', 8: 'Cấn', 9: 'Ly' };
const CUNG_ELEMENT: Record<Cung, string> = { Khảm: 'Thủy', Khôn: 'Thổ', Chấn: 'Mộc', Tốn: 'Mộc', Càn: 'Kim', Đoài: 'Kim', Cấn: 'Thổ', Ly: 'Hỏa' };
const DONG: Cung[] = ['Khảm', 'Ly', 'Chấn', 'Tốn'];
/** Thứ tự: Sinh Khí, Thiên Y, Diên Niên, Phục Vị | Họa Hại, Lục Sát, Ngũ Quỷ, Tuyệt Mệnh */
const BAT_TRACH: Record<Cung, [string, string, string, string, string, string, string, string]> = {
  Khảm: ['Đông Nam', 'Đông', 'Nam', 'Bắc', 'Tây', 'Tây Bắc', 'Đông Bắc', 'Tây Nam'],
  Ly: ['Đông', 'Đông Nam', 'Bắc', 'Nam', 'Đông Bắc', 'Tây Nam', 'Tây', 'Tây Bắc'],
  Chấn: ['Nam', 'Bắc', 'Đông Nam', 'Đông', 'Tây Nam', 'Đông Bắc', 'Tây Bắc', 'Tây'],
  Tốn: ['Bắc', 'Nam', 'Đông', 'Đông Nam', 'Tây Bắc', 'Tây', 'Tây Nam', 'Đông Bắc'],
  Càn: ['Tây', 'Đông Bắc', 'Tây Nam', 'Tây Bắc', 'Đông Nam', 'Bắc', 'Đông', 'Nam'],
  Khôn: ['Đông Bắc', 'Tây', 'Tây Bắc', 'Tây Nam', 'Đông', 'Nam', 'Đông Nam', 'Bắc'],
  Cấn: ['Tây Nam', 'Tây Bắc', 'Tây', 'Đông Bắc', 'Nam', 'Đông', 'Bắc', 'Đông Nam'],
  Đoài: ['Tây Bắc', 'Tây Nam', 'Đông Bắc', 'Tây', 'Bắc', 'Đông Nam', 'Nam', 'Đông'],
};
const GOOD_NAMES = ['Sinh Khí', 'Thiên Y', 'Diên Niên', 'Phục Vị'];
const GOOD_NOTES = ['tài lộc, thăng tiến', 'sức khỏe, quý nhân', 'gia đạo hòa thuận', 'bình yên, vững bền'];
const BAD_NAMES = ['Họa Hại', 'Lục Sát', 'Ngũ Quỷ', 'Tuyệt Mệnh'];

/** Cung phi theo năm sinh âm lịch và giới tính. */
export function cungPhi(birthYear: number, gender: 'nam' | 'nu'): Cung {
  const y = (((birthYear - 1900) % 9) + 9) % 9;
  let n = gender === 'nam' ? (10 - y) % 9 : (((y - 4) % 9) + 9) % 9;
  if (n === 0) n = 9;
  if (n === 5) return gender === 'nam' ? 'Khôn' : 'Cấn';
  return CUNG_BY_NUM[n];
}

export interface CungInfo { cung: Cung; element: string; group: 'Đông tứ mệnh' | 'Tây tứ mệnh'; good: { dir: string; name: string; note: string }[]; bad: { dir: string; name: string }[] }
export function cungInfo(birthYear: number, gender: 'nam' | 'nu'): CungInfo {
  const cung = cungPhi(birthYear, gender);
  const t = BAT_TRACH[cung];
  return {
    cung, element: CUNG_ELEMENT[cung], group: DONG.includes(cung) ? 'Đông tứ mệnh' : 'Tây tứ mệnh',
    good: t.slice(0, 4).map((dir, i) => ({ dir, name: GOOD_NAMES[i], note: GOOD_NOTES[i] })),
    bad: t.slice(4).map((dir, i) => ({ dir, name: BAD_NAMES[i] })),
  };
}

/* ------------------------------------------------------------------ */
/* Hợp tuổi                                                            */
/* ------------------------------------------------------------------ */

const LUC_HAI: Record<number, number> = { 0: 7, 7: 0, 1: 6, 6: 1, 2: 5, 5: 2, 3: 4, 4: 3, 8: 11, 11: 8, 9: 10, 10: 9 };
const CAN_HOP: Record<number, number> = { 0: 5, 5: 0, 1: 6, 6: 1, 2: 7, 7: 2, 3: 8, 8: 3, 4: 9, 9: 4 };
const CAN_XUNG: Record<number, number> = { 0: 6, 6: 0, 1: 7, 7: 1, 2: 8, 8: 2, 3: 9, 9: 3 };

/** Nhóm "Hợp tuổi" (tối đa 30) cho một người. */
export function ageGroup(info: DayInfo, p: Person): { points: number; items: Item[]; blocked: boolean } {
  const pi = personInfo(p);
  const items: Item[] = [];
  let pts = 20;
  let blocked = false;
  const tuoi = `tuổi ${pi.canChi}`;
  if (info.xungTuoi.includes(pi.canChi)) {
    blocked = true; pts = 0;
    items.push({ good: false, text: `Ngày ${info.canChi.day} xung khắc mạnh với ${tuoi} (thiên khắc địa xung)` });
  } else if ((info.branch + 6) % 12 === pi.branch) {
    pts -= 12; items.push({ good: false, text: `Ngày ${BRANCHES[info.branch]} lục xung ${tuoi}` });
  }
  if (!blocked) {
    if (LUC_HAI[info.branch] === pi.branch) { pts -= 4; items.push({ good: false, text: `Ngày ${BRANCHES[info.branch]} lục hại tuổi ${BRANCHES[pi.branch]}` }); }
    if (LUC_HOP[info.branch] === pi.branch) { pts += 6; items.push({ good: true, text: `Ngày ${BRANCHES[info.branch]} lục hợp tuổi ${BRANCHES[pi.branch]}` }); }
    if (tamHop(info.branch).includes(pi.branch)) { pts += 5; items.push({ good: true, text: `Ngày ${BRANCHES[info.branch]} tam hợp tuổi ${BRANCHES[pi.branch]}` }); }
    if (CAN_HOP[info.stem] === pi.stem) { pts += 3; items.push({ good: true, text: `Can ngày ${STEMS[info.stem]} hợp can tuổi ${STEMS[pi.stem]}` }); }
    if (CAN_XUNG[info.stem] === pi.stem) { pts -= 4; items.push({ good: false, text: `Can ngày ${STEMS[info.stem]} xung can tuổi ${STEMS[pi.stem]}` }); }
    const rel = elementRelation(info.napAm.element, pi.napAm.element);
    const m = `mệnh ngày ${info.napAm.element} (${info.napAm.name})`, mt = `mệnh tuổi ${pi.napAm.element}`;
    if (rel === 'sinh') { pts += 4; items.push({ good: true, text: `${cap(m)} sinh ${mt}` }); }
    else if (rel === 'hòa') { pts += 2; items.push({ good: true, text: `${cap(m)} cùng hành với ${mt}` }); }
    else if (rel === 'khắc') { pts -= 6; items.push({ good: false, text: `${cap(m)} khắc ${mt}` }); }
    else if (rel === 'bị khắc') { pts -= 2; items.push({ good: false, text: `${cap(mt)} khắc ${m} (hao sức)` }); }
    else items.push({ good: true, text: `${cap(mt)} sinh ${m} (bình hòa)` });
    if (!items.some((x) => !x.good) && pts >= 20) items.unshift({ good: true, text: `Ngày không xung tuổi ${pi.canChi}` });
  }
  return { points: Math.max(0, Math.min(30, pts)), items, blocked };
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ------------------------------------------------------------------ */
/* Hạn năm cho việc                                                    */
/* ------------------------------------------------------------------ */

const isWeddingAct = (act: ActivityKey) => ACT_DEF[act].base === 'cuoi-hoi';

/** Ai được xét hạn năm: cưới hỏi xét Kim Lâu theo cô dâu; việc khác xét gia chủ (người đầu tiên). */
export function yearChecksFor(people: PersonView[], lunarYear: number, act: ActivityKey): { who: PersonView; checks: YearCheck[]; counted: boolean }[] {
  if (!people.length || !ACT_DEF[act].years.length) return [];
  const out: { who: PersonView; checks: YearCheck[]; counted: boolean }[] = [];
  if (isWeddingAct(act) && people.length > 1) {
    const bride = people.find((p) => p.gender === 'nu') || people[1];
    const groom = people.find((p) => p !== bride) || people[0];
    out.push({ who: bride, checks: yearChecks(bride, lunarYear, act), counted: true });
    out.push({ who: groom, checks: yearChecks(groom, lunarYear, act).map((c) => (c.name === 'Kim Lâu' ? { ...c, bad: false, note: `${c.note.replace(/ Theo tục lệ.*$/, '')} (chỉ tham khảo, tục lệ xét Kim Lâu theo cô dâu)` } : c)), counted: true });
  } else {
    out.push({ who: people[0], checks: yearChecks(people[0], lunarYear, act), counted: true });
  }
  return out;
}

const YEAR_PENALTY: Record<string, number> = { 'Kim Lâu': 8, 'Hoang Ốc': 8, 'Tam Tai': 5 };

function yearGroup(people: PersonView[], lunarYear: number, act: ActivityKey): { points: number; items: Item[]; bad: string[] } {
  const rows = yearChecksFor(people, lunarYear, act);
  if (!rows.length) return { points: 15, items: [{ good: true, text: 'Việc này không cần xét Kim Lâu, Hoang Ốc, Tam Tai' }], bad: [] };
  let pen = 0;
  const items: Item[] = [];
  const bad: string[] = [];
  for (const r of rows) {
    const who = rows.length > 1 ? `${r.who.name || r.who.birthYear}: ` : '';
    for (const c of r.checks) {
      items.push({ good: !c.bad, text: `${who}${c.name}: ${c.note}` });
      if (c.bad && r.counted) { pen += YEAR_PENALTY[c.name] || 5; bad.push(c.name); }
    }
  }
  return { points: Math.max(0, 15 - pen), items, bad };
}

/** Năm âm lịch gần nhất (kể từ năm đang xét) mà gia chủ không phạm hạn nào cho việc này. */
export function nextClearYear(people: PersonView[], fromLunarYear: number, act: ActivityKey): number | null {
  if (!ACT_DEF[act].years.length) return fromLunarYear;
  for (let y = fromLunarYear; y <= fromLunarYear + 12; y++) {
    const rows = yearChecksFor(people, y, act);
    if (rows.every((r) => !r.counted || r.checks.every((c) => !c.bad))) return y;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Mượn tuổi                                                           */
/* ------------------------------------------------------------------ */

export interface BorrowSuggestion { family: { name: string; birthYear: number; canChi: string }[]; examples: { birthYear: number; canChi: string }[] }

/** Gợi ý người mượn tuổi (làm nhà, về nhà mới): không phạm hạn năm, không xung tuổi với ngày. */
export function borrowSuggestions(info: DayInfo, act: ActivityKey, owner: Person, family: { name: string; birthYear: number }[]): BorrowSuggestion {
  const ok = (y: number) => {
    const p = { birthYear: y };
    const age = tuoiMu(y, info.lunar.year);
    if (age < 20 || age > 75) return false;
    if (yearChecks(p, info.lunar.year, act).some((c) => c.bad)) return false;
    const pi = personInfo(p);
    if (info.xungTuoi.includes(pi.canChi) || (info.branch + 6) % 12 === pi.branch) return false;
    return true;
  };
  const fam = family.filter((m) => m.birthYear !== owner.birthYear && ok(m.birthYear)).map((m) => ({ name: m.name, birthYear: m.birthYear, canChi: personInfo(m).canChi }));
  const examples: { birthYear: number; canChi: string }[] = [];
  for (let d = 1; d <= 30 && examples.length < 6; d++) {
    for (const y of [owner.birthYear - d, owner.birthYear + d]) {
      if (examples.length < 6 && ok(y)) examples.push({ birthYear: y, canChi: personInfo({ birthYear: y }).canChi });
    }
  }
  examples.sort((a, b) => a.birthYear - b.birthYear);
  return { family: fam.slice(0, 4), examples };
}

/* ------------------------------------------------------------------ */
/* Phong tục kèm việc                                                  */
/* ------------------------------------------------------------------ */

export const RITUALS: Record<string, { title: string; steps: string[] }> = {
  'nhap-trach': { title: 'Phong tục về nhà mới (nhập trạch)', steps: [
    'Chọn giờ tốt hợp tuổi gia chủ; gia chủ là người bước vào nhà đầu tiên.',
    'Mang vào trước: bát hương, ảnh thờ, bếp (than hồng hoặc bếp điện), gạo, muối, nước, chổi mới.',
    'Mâm lễ: hương, hoa tươi, trầu cau, mâm ngũ quả, xôi, gà luộc, rượu, nước, vàng mã.',
    'Thắp hương khấn Thổ công, Thổ địa và gia tiên xin về ở; mở cửa, bật đèn sáng cả nhà.',
    'Đun nước pha trà, nấu bữa cơm đầu tiên tại nhà mới.',
  ] },
  'dong-tho': { title: 'Phong tục động thổ, làm nhà', steps: [
    'Chọn giờ tốt; mâm lễ khấn Thổ thần, Long mạch xin phép khởi công.',
    'Gia chủ cuốc nhát đầu tiên, đổ đất về hướng tốt.',
    'Nếu gia chủ phạm Kim Lâu, Hoang Ốc, Tam Tai: nhờ người hợp tuổi (mượn tuổi) đứng lễ và cuốc nhát đầu, gia chủ tránh mặt lúc làm lễ.',
    'Khi đổ mái, cất nóc nên chọn ngày giờ riêng.',
  ] },
  'cuoi-hoi': { title: 'Phong tục cưới hỏi', steps: [
    'Kim Lâu thường xét theo tuổi mụ của cô dâu; năm phạm thì nhiều nơi chọn cưới trước Tết hoặc dời năm.',
    'Chọn giờ đón dâu, giờ làm lễ gia tiên hợp tuổi hai bên.',
    'Chuẩn bị lễ gia tiên hai nhà, lễ vật theo phong tục địa phương.',
    'Nhiều nơi kiêng cưới tháng 7 âm lịch.',
  ] },
  'khai-truong': { title: 'Phong tục khai trương', steps: [
    'Cúng Thần Tài, Thổ địa vào giờ tốt trước khi mở cửa.',
    'Mời người hợp tuổi chủ cửa hàng "mở hàng" giao dịch đầu tiên.',
    'Mở cửa, treo biển, ghi lại khoản thu đầu tiên trong ngày.',
  ] },
  'xuat-hanh': { title: 'Phong tục xuất hành', steps: [
    'Chọn giờ Lý Thuần Phong tốt (Đại An, Tốc Hỷ, Tiểu Cát).',
    'Đi về hướng Hỷ thần hoặc Tài thần; tránh hướng Hạc thần.',
  ] },
  'ky-ket': { title: 'Lưu ý ký kết, giao dịch', steps: ['Chọn giờ Hoàng đạo hợp tuổi người ký.', 'Chuẩn bị đầy đủ giấy tờ; việc chính vẫn là nội dung hợp đồng rõ ràng, đúng pháp luật.'] },
  'cung-te': { title: 'Lưu ý cúng lễ', steps: ['Chọn giờ tốt, chuẩn bị lễ vật tươm tất, văn khấn phù hợp.', 'Thành tâm là chính, không cần mâm lễ quá cầu kỳ.'] },
  'an-tang': { title: 'Lưu ý an táng', steps: ['Xem giờ hạ huyệt; người tuổi xung với giờ hạ huyệt nên tạm tránh mặt.', 'Nghi lễ theo phong tục địa phương và gia đình.'] },
};

/* ------------------------------------------------------------------ */
/* Phiếu đánh giá                                                      */
/* ------------------------------------------------------------------ */

export interface PersonalReport {
  date: Date;
  act: ActivityKey;
  info: DayInfo;
  people: PersonView[];
  score: number;
  level: Level;
  blocked: boolean;
  groups: Group[];
  mainReasons: string[];
  goodHours: HourInfo[];
  yearBad: string[];
  ownerAge: number | null;
  nextClearYear: number | null;
}

export function levelOf(score: number, blocked: boolean): Level {
  if (blocked || score < 50) return 'khong-nen';
  return score >= 68 ? 'nen' : 'can-nhac';
}

export function personalReport(date: Date, act: ActivityKey, people: PersonView[], info: DayInfo = getDayInfo(date)): PersonalReport {
  const base = evaluateActivity(info, act); // phần ngày, không theo tuổi
  const dayReasons = base.reasons.filter((r) => r.kind === 'ngay');
  const kyReasons = base.reasons.filter((r) => r.kind === 'ky');
  const dayRaw = Math.max(0, Math.min(100, 50 + dayReasons.reduce((a, r) => a + r.delta, 0)));
  const gNgay: Group = {
    key: 'ngay', title: 'Chất lượng ngày', max: 40, points: Math.round(dayRaw * 0.4),
    items: [...dayReasons].sort((a, b) => a.delta - b.delta).map((r) => ({ good: r.delta > 0, text: r.text })),
  };

  const kySevere = kyReasons.some((r) => r.delta <= -25);
  const kyPts = kySevere ? 0 : Math.max(0, 15 - kyReasons.length * 8);
  const gKy: Group = {
    key: 'ky', title: 'Ngày kỵ', max: 15, points: kyPts,
    items: kyReasons.length
      ? info.kyDays.filter((k) => kyReasons.some((r) => r.text.endsWith(k.name))).map((k) => ({ good: false, text: `${k.name}: ${k.note}` }))
      : [{ good: true, text: 'Không phạm ngày kỵ cho việc này' }],
  };

  let gTuoi: Group = { key: 'tuoi', title: 'Hợp tuổi', max: 30, points: 18, items: [{ good: true, text: 'Chưa có năm sinh nên tính mức trung bình' }] };
  let ageBlocked = false;
  if (people.length) {
    const per = people.map((p) => ({ p, g: ageGroup(info, p) }));
    const worst = per.reduce((a, b) => (b.g.points < a.g.points ? b : a));
    ageBlocked = per.some((x) => x.g.blocked);
    const multi = people.length > 1;
    gTuoi = {
      key: 'tuoi', title: multi ? 'Hợp tuổi (tính người kém nhất)' : `Hợp tuổi ${personInfo(people[0]).canChi}`, max: 30, points: worst.g.points,
      items: per.flatMap((x) => x.g.items.map((it) => ({ ...it, text: multi ? `${x.p.name || x.p.birthYear}: ${it.text}` : it.text }))),
    };
  }

  const yg = yearGroup(people, info.lunar.year, act);
  const gNam: Group = { key: 'nam', title: `Hạn năm ${getYearCanChi(info.lunar.year)} cho việc này`, max: 15, points: people.length ? yg.points : 15, items: people.length ? yg.items : [{ good: true, text: 'Chưa có năm sinh' }] };

  const groups = [gNgay, gKy, gTuoi, gNam];
  let score = groups.reduce((a, g) => a + g.points, 0);
  const heavyBad = info.badStars.some((s) => s.weight >= 7 && s.affects?.includes(ACT_DEF[act].base));
  if (heavyBad) score = Math.min(score, 70);
  const blocked = base.blocked || ageBlocked;
  if (blocked) score = Math.min(score, 29);
  const level = levelOf(score, blocked);

  const negatives = [
    ...gKy.items.filter((i) => !i.good).map((i) => `phạm ${i.text.split(':')[0]}`),
    ...gTuoi.items.filter((i) => !i.good).map((i) => i.text.charAt(0).toLowerCase() + i.text.slice(1)),
    ...dayReasons.filter((r) => r.delta <= -8).sort((a, b) => a.delta - b.delta).slice(0, 3).map((r) => r.text),
    ...yg.bad.map((b) => `năm ${getYearCanChi(info.lunar.year)} phạm ${b}`),
  ];
  const positives = dayReasons.filter((r) => r.delta >= 6).sort((a, b) => b.delta - a.delta).map((r) => r.text)
    .concat(gTuoi.items.filter((i) => i.good && /hợp|sinh/.test(i.text)).map((i) => i.text.charAt(0).toLowerCase() + i.text.slice(1)));
  const mainReasons = (level === 'nen' ? positives.slice(0, 4) : negatives.slice(0, 5));

  const branches = people.map((p) => personInfo(p).branch);
  const goodHours = info.hours.filter((h) => h.hoangDao && branches.every((b) => (h.index + 6) % 12 !== b));
  const ownerAge = people.length ? tuoiMu(people[0].birthYear, info.lunar.year) : null;

  return {
    date, act, info, people, score, level, blocked, groups, mainReasons, goodHours,
    yearBad: yg.bad, ownerAge, nextClearYear: people.length ? nextClearYear(people, info.lunar.year, act) : null,
  };
}

/** Các ngày phù hợp gần nhất sau (và trước, nếu cần) ngày đang xem. */
export function nearGoodDays(date: Date, act: ActivityKey, people: PersonView[], count = 3, span = 45): { date: Date; score: number }[] {
  const out: { date: Date; score: number }[] = [];
  for (let k = 1; k <= span && out.length < count; k++) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + k);
    const r = personalReport(d, act, people);
    if (r.level === 'nen') out.push({ date: d, score: r.score });
  }
  return out;
}

