/**
 * Thước Lỗ Ban – tra cung tốt/xấu theo kích thước.
 * Ba loại thước phổ biến ở Việt Nam:
 *  - 52,2 cm: đo khoảng thông thủy (lọt lòng) cửa, cửa sổ, ô thoáng.
 *  - 42,9 cm: Dương trạch, đo khối xây dựng (bếp, bệ, bậc, chiều cao nhà, tủ bếp…).
 *  - 38,8 cm: Âm phần, đo đồ thờ cúng, bàn thờ, mộ phần.
 * Nội dung mang tính tham khảo văn hóa dân gian.
 */

export type RulerId = '522' | '429' | '388';

export interface Cung { name: string; good: boolean; subs: string[]; meaning: string }
export interface Ruler { id: RulerId; name: string; short: string; length: number; group: 'duong' | 'am'; use: string; cung: Cung[] }

const c = (name: string, good: boolean, meaning: string, subs: string[]): Cung => ({ name, good, meaning, subs });

export const RULERS: Record<RulerId, Ruler> = {
  '522': {
    id: '522', name: 'Thước 52,2 cm – Thông thủy', short: '52,2 cm', length: 522, group: 'duong',
    use: 'Đo khoảng thông thủy (lọt lòng): cửa đi, cửa sổ, ô thoáng, giếng trời.',
    cung: [
      c('Quý Nhân', true, 'Gặp quý nhân phù trợ, làm ăn khấm khá', ['Quyền lộc', 'Trung tín', 'Tác quan', 'Phát đạt', 'Thông minh']),
      c('Hiểm Họa', false, 'Gặp tai họa, hao tán tiền của', ['Án thành', 'Hỗn nhân', 'Thất hiếu', 'Tai họa', 'Trường bệnh']),
      c('Thiên Tai', false, 'Gặp tai ương, bệnh tật, mất mát', ['Hoàn tử', 'Quan tài', 'Thân tàn', 'Thất tài', 'Hệ quả']),
      c('Thiên Tài', true, 'Được trời ban tài lộc, con cháu hiếu thảo', ['Thi thơ', 'Văn học', 'Thanh quý', 'Tác lộc', 'Thiên lộc']),
      c('Nhân Lộc', true, 'Gia đạo yên vui, sung túc', ['Trí tôn', 'Phú quý', 'Tiến bửu', 'Thập thiện', 'Văn chương']),
      c('Cô Độc', false, 'Hao người, hao của, chia ly', ['Bạc nghịch', 'Vô vọng', 'Ly tán', 'Tửu thục', 'Dâm dục']),
      c('Thiên Tặc', false, 'Đề phòng tai bay vạ gió, bệnh tật', ['Phong bệnh', 'Chiêu ôn', 'Ôn tài', 'Ngục tù', 'Quan tài']),
      c('Tể Tướng', true, 'Hanh thông mọi mặt, có quý tử', ['Đại tài', 'Thi thơ', 'Hoạnh tài', 'Hiếu tử', 'Quý nhân']),
    ],
  },
  '429': {
    id: '429', name: 'Thước 42,9 cm – Dương trạch', short: '42,9 cm', length: 429, group: 'duong',
    use: 'Đo khối xây dựng, đồ nội thất: bếp, bệ, bậc, chiều cao tầng, tủ, giường, bàn.',
    cung: [
      c('Tài', true, 'Tiền tài, của cải dồi dào', ['Tài đức', 'Bảo khố', 'Lục hợp', 'Nghênh phúc']),
      c('Bệnh', false, 'Bệnh tật, ốm đau, hao tổn', ['Thoái tài', 'Công sự', 'Lao chấp', 'Cô quả']),
      c('Ly', false, 'Chia lìa, ly tán', ['Trường khố', 'Kiếp tài', 'Quan quỷ', 'Thất thoát']),
      c('Nghĩa', true, 'Thêm người, có nghĩa có lộc', ['Thêm đinh', 'Ích lợi', 'Quý tử', 'Đại cát']),
      c('Quan', true, 'Thăng quan tiến chức, công danh', ['Thuận khoa', 'Hoạnh tài', 'Tiến ích', 'Phú quý']),
      c('Kiếp', false, 'Mất mát, cướp đoạt', ['Tử biệt', 'Thoái khẩu', 'Ly hương', 'Tài thất']),
      c('Hại', false, 'Tai họa, thị phi', ['Tai chí', 'Tử tuyệt', 'Bệnh lâm', 'Khẩu thiệt']),
      c('Bản', true, 'Vững gốc, hưng vượng', ['Tài chí', 'Đăng khoa', 'Tiến bảo', 'Hưng vượng']),
    ],
  },
  '388': {
    id: '388', name: 'Thước 38,8 cm – Âm phần', short: '38,8 cm', length: 388, group: 'am',
    use: 'Đo đồ thờ cúng và âm phần: bàn thờ, tủ thờ, khám thờ, bài vị, mộ phần.',
    cung: [
      c('Đinh', true, 'Thêm người, con cái đỗ đạt', ['Phúc tinh', 'Đỗ đạt', 'Tài vượng', 'Đăng khoa']),
      c('Hại', false, 'Tai họa, bệnh tật', ['Khẩu thiệt', 'Lâm bệnh', 'Tử tuyệt', 'Họa chí']),
      c('Vượng', true, 'Hưng vượng, nhiều may mắn', ['Thiên đức', 'Hỷ sự', 'Tiến bảo', 'Thêm phúc']),
      c('Khổ', false, 'Khó khăn, hao tán', ['Thất thoát', 'Quan quỷ', 'Kiếp tài', 'Vô tự']),
      c('Nghĩa', true, 'Đại cát, có lợi', ['Đại cát', 'Tài vượng', 'Lợi ích', 'Thiên khố']),
      c('Quan', true, 'Phú quý, công danh', ['Phú quý', 'Tiến bảo', 'Tài lộc', 'Thuận khoa']),
      c('Tử', false, 'Ly biệt, mất mát', ['Ly hương', 'Tử biệt', 'Thoát đinh', 'Thất tài']),
      c('Hưng', true, 'Hưng thịnh, con cháu thành đạt', ['Đăng khoa', 'Quý tử', 'Thêm đinh', 'Hưng vượng']),
      c('Thất', false, 'Thất bại, cô quả', ['Cô quả', 'Lao chấp', 'Công sự', 'Thoái tài']),
      c('Tài', true, 'Tài lộc, phúc đức', ['Nghênh phúc', 'Lục hợp', 'Tiến bảo', 'Tài đức']),
    ],
  },
};

export const RULER_LIST: Ruler[] = [RULERS['522'], RULERS['429'], RULERS['388']];

export interface LoBanResult {
  mm: number;
  cungIndex: number;
  cung: Cung;
  sub: string;
  subIndex: number;
  good: boolean;
  /** Khoảng [từ, đến) mm của cung đang rơi vào (cùng chu kỳ). */
  range: [number, number];
}

const EPS = 1e-9;
const round1 = (x: number) => Math.round(x * 10) / 10;

export function cungLength(r: Ruler): number { return r.length / r.cung.length; }

/** Tra kích thước (mm). Kích thước âm hoặc không hợp lệ sẽ ném lỗi. */
export function lookup(r: Ruler, mm: number): LoBanResult {
  if (!Number.isFinite(mm) || mm < 0) throw new Error('Kích thước không hợp lệ');
  const cl = cungLength(r);
  const pos = ((mm % r.length) + r.length) % r.length;
  const cungIndex = Math.min(r.cung.length - 1, Math.floor(pos / cl + EPS));
  const cung = r.cung[cungIndex];
  const within = pos - cungIndex * cl;
  const subIndex = Math.max(0, Math.min(cung.subs.length - 1, Math.floor(within / (cl / cung.subs.length) + EPS)));
  const cycleStart = mm - pos;
  return {
    mm, cungIndex, cung, sub: cung.subs[subIndex], subIndex, good: cung.good,
    range: [round1(cycleStart + cungIndex * cl), round1(cycleStart + (cungIndex + 1) * cl)],
  };
}

/** Các đoạn cung trong khoảng [from, to] (mm) để vẽ thước. */
export function segments(r: Ruler, from: number, to: number): { start: number; end: number; cung: Cung; index: number }[] {
  const cl = cungLength(r);
  const out: { start: number; end: number; cung: Cung; index: number }[] = [];
  let k = Math.floor(from / cl);
  for (; k * cl < to; k++) {
    const idx = ((k % r.cung.length) + r.cung.length) % r.cung.length;
    out.push({ start: k * cl, end: (k + 1) * cl, cung: r.cung[idx], index: idx });
  }
  return out;
}

/**
 * Khoảng tốt gần nhất phía dưới và phía trên kích thước mm.
 * Trả về khoảng cung tốt [từ, đến] (mm, làm tròn vào trong 1 mm để chắc chắn nằm trong cung).
 */
export function nearestGood(r: Ruler, mm: number): { below: [number, number] | null; above: [number, number] | null } {
  const cl = cungLength(r);
  const k0 = Math.floor(mm / cl + EPS);
  const inner = (k: number): [number, number] => [Math.ceil(k * cl + 0.5), Math.floor((k + 1) * cl - 0.5)];
  const idx = (k: number) => ((k % r.cung.length) + r.cung.length) % r.cung.length;
  let below: [number, number] | null = null;
  for (let k = k0 - 1; k >= 0 && k >= k0 - r.cung.length; k--) if (r.cung[idx(k)].good) { below = inner(k); break; }
  let above: [number, number] | null = null;
  for (let k = k0 + 1; k <= k0 + r.cung.length; k++) if (r.cung[idx(k)].good) { above = inner(k); break; }
  return { below, above };
}

/** Đổi chuỗi người dùng nhập (cho phép dấu phẩy) sang mm. */
export function parseSize(text: string, unit: 'mm' | 'cm' | 'm'): number | null {
  const t = text.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const v = Number(t) * (unit === 'cm' ? 10 : unit === 'm' ? 1000 : 1);
  if (!Number.isFinite(v) || v < 0 || v > 100000) return null;
  return round1(v);
}

export function fmtMm(mm: number): string {
  const cm = mm / 10;
  return `${String(round1(mm)).replace('.', ',')} mm (${String(Math.round(cm * 100) / 100).replace('.', ',')} cm)`;
}
