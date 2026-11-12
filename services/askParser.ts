/**
 * Hiểu câu hỏi ngắn bằng tiếng Việt (có dấu hoặc không dấu), chạy hoàn toàn trên máy.
 * Ví dụ: "tôi sinh năm 1980, ngày mai tôi muốn dọn vào nhà mới thì có tốt không"
 *        "tôi sinh 1980 vợ 1982 nên cưới ngày nào tháng 11"
 * Kết quả dùng để điền sẵn các ô chọn; người dùng vẫn sửa lại được.
 */
import type { ActivityKey } from './almanac';
import { STEMS, BRANCHES, convertLunar2Solar, getLunarDate } from './lunarCalendar';

export type Role = 'tôi' | 'vợ' | 'chồng' | 'cô dâu' | 'chú rể' | 'bố' | 'mẹ' | 'con' | 'anh' | 'chị' | 'em' | 'ông' | 'bà' | 'người';

export interface ParsedPerson { role: Role; birthYear: number; gender?: 'nam' | 'nu' }

export interface ParsedQuestion {
  mode: 'check' | 'pick' | null;
  act: ActivityKey | null;
  people: ParsedPerson[];
  date: Date | null;               // ngày cần hỏi (check)
  range: { from: Date; to: Date; label: string } | null; // khoảng cần chọn (pick)
  weekendOnly: boolean;
  understood: string[];
  missing: string[];
}

/** Bỏ dấu tiếng Việt, chữ thường, gộp khoảng trắng. */
export function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Từ khóa → việc. Cụm dài, cụ thể đặt trước. Viết không dấu. */
const ACT_KEYWORDS: [ActivityKey, string[]][] = [
  ['an-hoi', ['dam ngo', 'an hoi', 'dinh hon', 'le hoi', 'chạm ngo', 'cham ngo']],
  ['cuoi-hoi', ['dam cuoi', 'to chuc cuoi', 'cuoi vo', 'cuoi chong', 'lay vo', 'lay chong', 'ket hon', 'ruoc dau', 'don dau', 'cuoi hoi', 'cuoi xin', 'le cuoi', 'tiec cuoi', 'cuoi vao', 'nen cuoi', 'muon cuoi', 'dinh cuoi', 'cuoi ngay nao', 'cuoi duoc']],
  ['dat-ban-tho', ['ban tho', 'an vi', 'lap tho', 'thinh phat', 'boc bat huong']],
  ['an-tang', ['an tang', 'cai tang', 'mai tang', 'chon cat', 'boc mo', 'sang cat', 'xay mo', 'sua mo', 'dua tang', 'phat tang']],
  ['mua-nha', ['mua nha', 'mua dat', 'mua can ho', 'mua chung cu', 'sang ten nha', 'dat coc nha']],
  ['nhap-trach', ['ve nha moi', 'vao nha moi', 'don nha', 'chuyen nha', 'nhap trach', 'nha moi', 'don ve', 'don vao', 'chuyen den', 'chuyen ve']],
  ['do-mai', ['do mai', 'cat noc', 'lop mai', 'do tran', 'len noc']],
  ['sua-nha', ['sua nha', 'sua bep', 'cai tao', 'sua chua nha', 'xay them', 'sua sang', 'lam bep', 'sua cong', 'sua cua']],
  ['dong-tho', ['dong tho', 'khoi cong', 'xay nha', 'lam nha', 'lam mong', 'dao mong', 'xay dung', 'pha dong']],
  ['khai-truong', ['khai truong', 'mo hang', 'mo cua hang', 'mo quan', 'mo shop', 'mo cong ty', 'khai thi', 'mo tiem', 'khai ban']],
  ['mua-xe', ['mua xe', 'nhan xe', 'lay xe', 'mua oto', 'mua o to', 'mua xe may']],
  ['ky-ket', ['ky hop dong', 'ky ket', 'giao dich', 'ky giay', 'cong chung', 'mua ban', 'ban hang', 'ban nha', 'ban dat']],
  ['nham-chuc', ['nham chuc', 'nhan chuc', 'nhan viec', 'di lam', 'xin viec', 'nhan cong tac', 'bo nhiem', 'phong van']],
  ['nhap-hoc', ['nhap hoc', 'di hoc', 'khai giang', 'di thi', 'thi cu', 'thi dai hoc', 'du thi', 'thi tuyen', 'bao ve luan']],
  ['cau-tai', ['cau tai', 'doi no', 'thu no', 'vay von', 'vay tien', 'cho vay', 'cau loc']],
  ['chua-benh', ['chua benh', 'phau thuat', 'kham benh', 'di vien', 'nhap vien', 'nho rang', 'chua tri', 'dieu tri', 'chua rang', 'tiem phong']],
  ['trong-trot', ['trong cay', 'chan nuoi', 'gieo', 'cay lua', 'tha ca', 'mua giong']],
  ['xuat-hanh', ['xuat hanh', 'di xa', 'du lich', 'len duong', 'cong tac', 'di choi', 've que', 'di nuoc ngoai', 'xuat ngoai', 'di lam an xa']],
  ['cung-te', ['cung le', 'cung bai', 'cung gio', 'cung ram', 'cung mung', 'cung tat nien', 'cung tao quan', 'cung dat dai', 'cung khai truong', 'le chua', 'di chua', 'di le', 'giai han', 'cau an', 'dang sao', 'thap huong', 'le tat nien', 'sam le']],
];

const ROLE_WORDS: [Role, string[], 'nam' | 'nu' | undefined][] = [
  ['cô dâu', ['co dau'], 'nu'],
  ['chú rể', ['chu re'], 'nam'],
  ['vợ', ['vo toi', 'vo minh', 'vo em', 'vo anh', 'ba xa', 'vo'], 'nu'],
  ['chồng', ['chong toi', 'chong minh', 'chong em', 'ong xa', 'chong'], 'nam'],
  ['bố', ['bo toi', 'bo em', 'bo', 'ba toi', 'cha toi', 'cha'], 'nam'],
  ['mẹ', ['me toi', 'me em', 'me', 'ma toi'], 'nu'],
  ['con', ['con gai', 'con trai', 'con toi', 'chau', 'con'], undefined],
  ['ông', ['ong noi', 'ong ngoai', 'ong'], 'nam'],
  ['bà', ['ba noi', 'ba ngoai', 'ba'], 'nu'],
  ['anh', ['anh trai', 'anh toi', 'anh'], 'nam'],
  ['chị', ['chi gai', 'chi toi', 'chi'], 'nu'],
  ['em', ['em gai', 'em trai', 'em toi', 'em'], undefined],
  ['tôi', ['toi', 'minh', 'tui', 'tao'], undefined],
];

/** Thêm dạng sở hữu: "vợ tôi", "con gái mình"… */
const ROLE_WORDS_EXT: [Role, string[], 'nam' | 'nu' | undefined][] = ROLE_WORDS.map(([r, words, g]) =>
  [r, r === 'tôi' ? words : [...words, ...words.flatMap((w) => (/ (toi|minh|em|anh)$/.test(w) ? [] : [`${w} toi`, `${w} minh`]))], g]);

const WEEKDAY_WORDS: [number, string[]][] = [
  [0, ['chu nhat', 'cn']], [1, ['thu hai', 'thu 2', 't2']], [2, ['thu ba', 'thu 3', 't3']],
  [3, ['thu tu', 'thu 4', 't4']], [4, ['thu nam', 'thu 5', 't5']], [5, ['thu sau', 'thu 6', 't6']], [6, ['thu bay', 'thu 7', 't7']],
];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const hasWord = (text: string, w: string) => new RegExp(`(^|[^a-z0-9])${w.replace(/ /g, '\\s+')}($|[^a-z0-9])`).test(text);

/** Năm từ "1980", "năm 80", "8x"… trong khoảng 1930–2015. */
function normalizeYear(raw: string, now: Date): number | null {
  const n = parseInt(raw, 10);
  if (raw.length === 4) return n >= 1900 && n <= now.getFullYear() ? n : null;
  if (raw.length === 2) {
    const full = n <= (now.getFullYear() % 100) - 10 ? 2000 + n : 1900 + n;
    return full >= 1930 && full <= now.getFullYear() ? full : null;
  }
  return null;
}

/** Năm sinh từ tuổi can chi ("tuổi Canh Thân"): chọn năm cho tuổi từ 16 đến 75. */
function yearFromCanChi(stem: number, branch: number, now: Date): number | null {
  for (let y = now.getFullYear() - 16; y >= now.getFullYear() - 75; y--) {
    if ((((y + 6) % 10) + 10) % 10 === stem && (((y + 8) % 12) + 12) % 12 === branch) return y;
  }
  return null;
}

export function parseQuestion(input: string, now: Date = new Date()): ParsedQuestion {
  const lower = ` ${input.normalize('NFC').toLowerCase().replace(/[,.;!?:()]/g, ' ').replace(/\s+/g, ' ')} `;
  const accented = /[à-ỹđ]/.test(lower);
  let text = ` ${fold(input).replace(/[,.;!?:()]/g, ' ').replace(/\s+/g, ' ')} `;
  // cách nói âm lịch dân gian
  text = text.replace(/thang gieng/g, 'thang 1 am').replace(/thang chap/g, 'thang 12 am').replace(/(^|\s)ram thang/g, '$1ngay 15 thang')
    .replace(/(^|\s)ram trung thu/g, '$1ngay 15 thang 8 am').replace(/(^|\s)tet nguyen dan/g, '$1mung 1 thang 1 am');
  // "45 tuổi" → "tuổi 45"
  text = text.replace(/(?<![\d/])(\d{2}) tuoi/g, 'tuoi $1');
  const today = startOfDay(now);
  const out: ParsedQuestion = { mode: null, act: null, people: [], date: null, range: null, weekendOnly: false, understood: [], missing: [] };

  // ---- Việc ----
  // bỏ các cụm chỉ ngày ("ngày mai", "mai") trước khi tìm "mai táng"
  for (const [key, words] of ACT_KEYWORDS) {
    const hit = words.some((w) => hasWord(text, w)) || (key === 'cuoi-hoi' && /(^|\s)cưới(\s|$)/.test(lower));
    if (hit) {
      // có gõ dấu: "cuối" không phải "cưới"
      if (key === 'cuoi-hoi' && accented && !/cưới|kết hôn|lấy vợ|lấy chồng|rước dâu|đón dâu/.test(lower)) continue;
      out.act = key;
      break;
    }
  }
  // "cưới" + "ăn hỏi" cùng lúc: ưu tiên cưới hỏi
  if (out.act === 'an-hoi' && /cuoi/.test(text) && !/dam ngo|dinh hon/.test(text)) out.act = 'cuoi-hoi';

  // ---- Người và năm sinh ----
  const yearRe = /(?<![\d/])(19\d{2}|20[01]\d|\d{2})(?![\d/])/g;
  let m: RegExpExecArray | null;
  const usedIdx: number[] = [];
  while ((m = yearRe.exec(text))) {
    const raw = m[1];
    const pre = text.slice(Math.max(0, m.index - 28), m.index + m[0].length - raw.length);
    // số 2 chữ số chỉ nhận khi có chữ "sinh", "năm", "tuổi" ngay trước
    if (raw.length === 2 && !/(sinh|nam|tuoi|sn)\s*(nam\s*)?$/.test(pre.trim() + ' ')) continue;
    if (raw.length === 2 && /(thang|ngay|mung)\s*$/.test(pre)) continue;
    // bỏ năm đi kèm ngày tháng (vd 15/11/2026) hoặc "tháng 11 năm 2026"
    if (/\d\/\s*$/.test(text.slice(0, m.index + m[0].length - raw.length))) continue;
    // "tuổi 46" là tuổi (tuổi mụ), không phải năm 1946
    const isAge = raw.length === 2 && /tuoi\s*$/.test(pre);
    const y = isAge ? getLunarDate(today).year - parseInt(raw, 10) + 1 : normalizeYear(raw, now);
    if (!y || y > now.getFullYear() - 1 || y < 1900) continue;
    if (/(thang \d{1,2} nam|nam nay|nam sau)\s*$/.test(pre)) continue;
    // vai trò: từ gần nhất phía trước
    let role: Role = 'người';
    let gender: 'nam' | 'nu' | undefined;
    // chọn cụm vai trò kết thúc gần năm sinh nhất; cùng vị trí thì cụm dài hơn ("vợ tôi" thắng "tôi")
    let bestEnd = -1, bestLen = 0;
    for (const [r, words, g] of ROLE_WORDS_EXT) {
      for (const w of words) {
        const re = new RegExp(`(?:^|\\s)(${w})(?=\\s|$)`, 'g');
        let k: RegExpExecArray | null;
        while ((k = re.exec(pre))) {
          const end = k.index + k[0].length;
          if (end > bestEnd || (end === bestEnd && w.length > bestLen)) { bestEnd = end; bestLen = w.length; role = r; gender = g; }
          re.lastIndex = k.index + 1;
        }
      }
    }
    if (role === 'người' && out.people.length === 0) role = 'tôi';
    usedIdx.push(m.index);
    if (!out.people.some((p) => p.birthYear === y && p.role === role)) out.people.push({ role, birthYear: y, gender });
  }
  // "tuổi Canh Thân"
  for (let si = 0; si < 10; si++) for (let bi = 0; bi < 12; bi++) {
    const w = fold(`${STEMS[si]} ${BRANCHES[bi]}`);
    if (hasWord(text, w)) {
      const y = yearFromCanChi(si, bi, now);
      if (y && !out.people.some((p) => p.birthYear === y)) {
        const idx = text.indexOf(w);
        const pre = text.slice(Math.max(0, idx - 20), idx);
        const r = ROLE_WORDS.find(([, words]) => words.some((x) => new RegExp(`(^|\\s)${x}(\\s|$)`).test(pre)));
        out.people.push({ role: r ? r[0] : out.people.length ? 'người' : 'tôi', birthYear: y, gender: r?.[2] });
      }
    }
  }
  // "vợ chồng tôi 1984 và 1987": người đầu là chồng, người sau là vợ (người dùng đổi lại được)
  if (/vo chong/.test(text) && out.people.length === 2 && out.people[0].role === out.people[1].role) {
    out.people[0].role = 'chồng'; out.people[0].gender = 'nam'; out.people[1].role = 'vợ'; out.people[1].gender = 'nu';
    out.understood.push('kiểm tra lại ai là vợ, ai là chồng');
  }
  // chỉ có 1 người tự xưng em/anh/chị/mình → là người hỏi
  if (out.people.length === 1 && ['em', 'anh', 'chị', 'người'].includes(out.people[0].role) && !/(cua|cho)\s+(em|anh|chi)\s/.test(text)) out.people[0].role = 'tôi';
  // giới tính của "tôi" suy ra từ người còn lại (vợ → tôi nam, chồng → tôi nữ)
  const me = out.people.find((p) => p.role === 'tôi');
  if (me && !me.gender) {
    if (out.people.some((p) => p.role === 'vợ' || p.role === 'cô dâu')) me.gender = 'nam';
    else if (out.people.some((p) => p.role === 'chồng' || p.role === 'chú rể')) me.gender = 'nu';
  }
  if (/(^|\s)(con gai|chi gai|em gai)(\s|$)/.test(text)) out.people.filter((p) => p.role === 'con' || p.role === 'chị' || p.role === 'em').forEach((p) => { if (!p.gender) p.gender = 'nu'; });
  if (/(^|\s)(con trai|anh trai|em trai)(\s|$)/.test(text)) out.people.filter((p) => p.role === 'con' || p.role === 'anh' || p.role === 'em').forEach((p) => { if (!p.gender) p.gender = 'nam'; });

  // ---- Ngày / khoảng ----
  const curY = now.getFullYear();
  // ngày âm lịch: "mùng 6 tháng 10 âm", "ngày 15/8 âm lịch"
  const lunarRe = /(?:(?:ngay)\s*(\d{1,2})\s*(?:thang\s*|\/)\s*(\d{1,2})(?:\s*(?:nam|\/)\s*(\d{4}))?\s*(?:am lich|am|al)\b|mung\s*(\d{1,2})\s*(?:thang\s*|\/)\s*(\d{1,2})(?:\s*(?:nam|\/)\s*(\d{4}))?)/;
  const solarRe = /(?<!\d)(\d{1,2})\s*(?:\/|-|thang\s+)\s*(\d{1,2})(?!\d)(?:\s*(?:\/|-|nam\s+)\s*(\d{4}))?(?!\s*(?:am|al)\b)/g;
  const lm = lunarRe.exec(text);
  if (lm) {
    const d = +(lm[1] || lm[4]), mo = +(lm[2] || lm[5]);
    const yy = lm[3] || lm[6];
    let ly = yy ? +yy : getLunarDate(today).year;
    let s = convertLunar2Solar(d, mo, ly);
    let dt = s[0] ? new Date(s[2], s[1] - 1, s[0]) : null;
    if (dt && dt < today && !yy) { ly += 1; s = convertLunar2Solar(d, mo, ly); dt = s[0] ? new Date(s[2], s[1] - 1, s[0]) : null; }
    if (dt) { out.date = dt; out.understood.push(`ngày ${d}/${mo} âm lịch (${dt.toLocaleDateString('vi-VN')})`); }
  }
  if (!out.date) {
    if (/(^|\s)(hom nay|bua nay|ngay hom nay)(\s|$)/.test(text)) out.date = today;
    else if (/(ngay kia|ngay mot|hom kia)(\s|$)/.test(text)) out.date = addDays(today, 2);
    else if (accented ? /(^|\s)mai(\s|$)/.test(lower.replace(/mai táng/g, ' ')) : /(^|\s)mai(\s|$)/.test(text.replace(/(do|lop|sua) mai|mai (tang|nha|ton|che)/g, ' '))) out.date = addDays(today, 1);
    else {
      for (const sm of text.matchAll(solarRe)) {
        if (!(+sm[1] >= 1 && +sm[1] <= 31 && +sm[2] >= 1 && +sm[2] <= 12)) continue;
        const y = sm[3] ? +sm[3] : curY;
        let dt = new Date(y, +sm[2] - 1, +sm[1]);
        if (!sm[3] && dt < today) dt = new Date(y + 1, +sm[2] - 1, +sm[1]);
        if (dt.getDate() === +sm[1]) { out.date = dt; break; }
      }
      if (!out.date) {
        for (const [wd, words] of WEEKDAY_WORDS) {
          if (words.some((w) => hasWord(text, w))) {
            const next = /tuan sau|tuan toi/.test(text);
            let diff = (wd - today.getDay() + 7) % 7;
            if (next) diff += diff === 0 ? 7 : 7;
            out.date = addDays(today, diff);
            break;
          }
        }
      }
    }
  }

  // khoảng thời gian (chọn ngày)
  const monthOnly = /(?:trong |vao |cua |o )?thang\s*(\d{1,2})(?:\s*(?:nam|\/)\s*(\d{4}))?(?!\s*(?:\/|am))/.exec(text);
  if (!out.date) {
    if (/thang nay/.test(text)) out.range = { from: today, to: new Date(curY, now.getMonth() + 1, 0), label: `tháng ${now.getMonth() + 1}/${curY}` };
    else if (/(\d+|mot|hai|ba|bon|nam|sau)\s*thang (toi|sap toi|nua|sap den)/.test(text)) {
      const w = /(\d+|mot|hai|ba|bon|nam|sau)\s*thang (toi|sap toi|nua|sap den)/.exec(text)![1];
      const n = Math.min(12, Math.max(1, ({ mot: 1, hai: 2, ba: 3, bon: 4, nam: 5, sau: 6 } as Record<string, number>)[w] ?? +w));
      out.range = { from: today, to: addDays(today, n * 30), label: `${n} tháng tới` };
    }
    else if (/thang sau|thang toi/.test(text)) out.range = { from: new Date(curY, now.getMonth() + 1, 1), to: new Date(curY, now.getMonth() + 2, 0), label: `tháng ${((now.getMonth() + 1) % 12) + 1}` };
    else if (/thang\s*(\d{1,2})\s*(am lich|am|al)(\s|$)/.test(text)) {
      const mo = +/thang\s*(\d{1,2})\s*(am lich|am|al)(\s|$)/.exec(text)![1];
      let ly = getLunarDate(today).year;
      const range = (yy: number) => { const a = convertLunar2Solar(1, mo, yy); const b = convertLunar2Solar(1, mo === 12 ? 1 : mo + 1, mo === 12 ? yy + 1 : yy); return a[0] && b[0] ? { from: new Date(a[2], a[1] - 1, a[0]), to: addDays(new Date(b[2], b[1] - 1, b[0]), -1) } : null; };
      let r = mo >= 1 && mo <= 12 ? range(ly) : null;
      if (r && r.to < today) { ly += 1; r = range(ly); }
      if (r) out.range = { from: r.from < today ? today : r.from, to: r.to, label: `tháng ${mo} âm lịch năm ${ly}` };
    }
    else if (/tuan nay/.test(text) && !/cuoi tuan nay/.test(text)) out.range = { from: today, to: addDays(today, (7 - today.getDay()) % 7), label: 'tuần này' };
    else if (/tuan sau|tuan toi/.test(text)) { const s0 = addDays(today, ((8 - today.getDay()) % 7) || 7); out.range = { from: s0, to: addDays(s0, 6), label: 'tuần sau' }; }
    else if (monthOnly && +monthOnly[1] >= 1 && +monthOnly[1] <= 12) {
      const mo = +monthOnly[1] - 1;
      let y = monthOnly[2] ? +monthOnly[2] : /thang\s*\d{1,2}\s*(nam sau|nam toi)/.test(text) ? curY + 1 : curY;
      if (!monthOnly[2] && new Date(y, mo + 1, 0) < today) y += 1;
      const from = new Date(y, mo, 1) < today ? today : new Date(y, mo, 1);
      out.range = { from, to: new Date(y, mo + 1, 0), label: `tháng ${mo + 1}/${y}` };
    }
    else if (/nam nay/.test(text)) out.range = { from: today, to: new Date(curY, 11, 31), label: `năm ${curY}` };
    else if (/nam sau|nam toi/.test(text)) out.range = { from: new Date(curY + 1, 0, 1), to: new Date(curY + 1, 11, 31), label: `năm ${curY + 1}` };
  }
  if (/cuoi tuan|thu bay hoac chu nhat|t7 cn|ngay nghi/.test(text) && !out.date) out.weekendOnly = true;
  if (/cuoi tuan nay/.test(text) && !out.range) { const sat = addDays(today, (6 - today.getDay() + 7) % 7); out.range = { from: sat, to: addDays(sat, 1), label: 'cuối tuần này' }; }

  // ---- Loại câu hỏi ----
  const askPick = /(ngay nao|hom nao|khi nao|luc nao|bao gio|chon ngay|xem ngay tot|ngay tot|ngay dep|nen .* vao ngay|nen chon)/.test(text);
  if (out.date && !/ngay nao|hom nao|khi nao/.test(text)) out.mode = 'check';
  else if (out.range || askPick) out.mode = 'pick';
  else if (/co tot|tot khong|duoc khong|nen khong|co nen|co duoc|xau khong/.test(text)) out.mode = 'check';
  if (out.mode === 'pick' && !out.range) out.range = { from: today, to: addDays(today, 90), label: '3 tháng tới' };

  // ---- Diễn giải ----
  if (out.people.length) out.understood.unshift(out.people.map((p) => `${p.role} sinh năm ${p.birthYear}`).join(', '));
  if (out.act) out.understood.push(`việc: ${out.act}`);
  if (out.date && !lm) out.understood.push(`ngày ${out.date.toLocaleDateString('vi-VN')}`);
  if (out.range) out.understood.push(`trong ${out.range.label}`);
  if (out.weekendOnly) out.understood.push('chỉ cuối tuần');
  if (!out.act) out.missing.push('việc cần làm');
  if (!out.people.length) out.missing.push('năm sinh');
  if (!out.mode) out.missing.push('ngày hoặc khoảng thời gian');
  return out;
}
