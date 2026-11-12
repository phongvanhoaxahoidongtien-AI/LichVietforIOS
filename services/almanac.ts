/**
 * Mô-đun Xem ngày tốt xấu – Trạch nhật.
 * Tính toán hoàn toàn trên máy, theo các phép phổ biến trong lịch vạn niên Việt Nam
 * (12 Trực theo tiết khí, Hoàng đạo/Hắc đạo, Nhị thập bát tú, Ngọc Hạp Thông Thư, Lý Thuần Phong…).
 * Nội dung mang tính tham khảo văn hóa, tín ngưỡng dân gian.
 */
import {
  STEMS, BRANCHES, BRANCH_HOURS, jdFromDate, convertSolar2Lunar, getLunarDate,
  getYearCanChi, getMonthCanChi, sunLongitudeEndOfDay, sunLongitudeDeg, SOLAR_TERMS,
} from './lunarCalendar';
import type { LunarDate } from '../types';

/* ------------------------------------------------------------------ */
/* Ngũ hành, nạp âm                                                    */
/* ------------------------------------------------------------------ */

export type Element = 'Kim' | 'Mộc' | 'Thủy' | 'Hỏa' | 'Thổ';

const NAP_AM: [string, Element][] = [
  ['Hải Trung Kim', 'Kim'], ['Lô Trung Hỏa', 'Hỏa'], ['Đại Lâm Mộc', 'Mộc'], ['Lộ Bàng Thổ', 'Thổ'],
  ['Kiếm Phong Kim', 'Kim'], ['Sơn Đầu Hỏa', 'Hỏa'], ['Giản Hạ Thủy', 'Thủy'], ['Thành Đầu Thổ', 'Thổ'],
  ['Bạch Lạp Kim', 'Kim'], ['Dương Liễu Mộc', 'Mộc'], ['Tuyền Trung Thủy', 'Thủy'], ['Ốc Thượng Thổ', 'Thổ'],
  ['Tích Lịch Hỏa', 'Hỏa'], ['Tùng Bách Mộc', 'Mộc'], ['Trường Lưu Thủy', 'Thủy'], ['Sa Trung Kim', 'Kim'],
  ['Sơn Hạ Hỏa', 'Hỏa'], ['Bình Địa Mộc', 'Mộc'], ['Bích Thượng Thổ', 'Thổ'], ['Kim Bạch Kim', 'Kim'],
  ['Phú Đăng Hỏa', 'Hỏa'], ['Thiên Hà Thủy', 'Thủy'], ['Đại Trạch Thổ', 'Thổ'], ['Thoa Xuyến Kim', 'Kim'],
  ['Tang Đố Mộc', 'Mộc'], ['Đại Khê Thủy', 'Thủy'], ['Sa Trung Thổ', 'Thổ'], ['Thiên Thượng Hỏa', 'Hỏa'],
  ['Thạch Lựu Mộc', 'Mộc'], ['Đại Hải Thủy', 'Thủy'],
];

const SINH: Record<Element, Element> = { Kim: 'Thủy', Thủy: 'Mộc', Mộc: 'Hỏa', Hỏa: 'Thổ', Thổ: 'Kim' };
const KHAC: Record<Element, Element> = { Kim: 'Mộc', Mộc: 'Thổ', Thổ: 'Thủy', Thủy: 'Hỏa', Hỏa: 'Kim' };

/** Quan hệ ngũ hành của a đối với b. */
export function elementRelation(a: Element, b: Element): 'hòa' | 'sinh' | 'được sinh' | 'khắc' | 'bị khắc' {
  if (a === b) return 'hòa';
  if (SINH[a] === b) return 'sinh';
  if (SINH[b] === a) return 'được sinh';
  if (KHAC[a] === b) return 'khắc';
  return 'bị khắc';
}

/** Chỉ số lục thập hoa giáp (0 = Giáp Tý) từ can, chi. */
export function sexagenaryIndex(stem: number, branch: number): number {
  return (((6 * stem - 5 * branch) % 60) + 60) % 60;
}
export function sexagenaryName(n: number): string {
  return `${STEMS[n % 10]} ${BRANCHES[n % 12]}`;
}
export function napAm(n: number): { name: string; element: Element } {
  const [name, element] = NAP_AM[Math.floor(n / 2)];
  return { name, element };
}

/* ------------------------------------------------------------------ */
/* Bảng tra                                                            */
/* ------------------------------------------------------------------ */

export const THAN_12 = [
  { name: 'Thanh Long', hoangDao: true, note: 'Ngày/giờ Hoàng đạo, mọi việc hanh thông.' },
  { name: 'Minh Đường', hoangDao: true, note: 'Hoàng đạo, có quý nhân giúp đỡ.' },
  { name: 'Thiên Hình', hoangDao: false, note: 'Hắc đạo, kỵ kiện tụng, tranh chấp.' },
  { name: 'Chu Tước', hoangDao: false, note: 'Hắc đạo, dễ thị phi, khẩu thiệt.' },
  { name: 'Kim Quỹ', hoangDao: true, note: 'Hoàng đạo, tốt cho cầu tài, cưới hỏi.' },
  { name: 'Kim Đường', hoangDao: true, note: 'Hoàng đạo (Bảo Quang), làm việc dễ thành.' },
  { name: 'Bạch Hổ', hoangDao: false, note: 'Hắc đạo, kỵ an táng, đi xa.' },
  { name: 'Ngọc Đường', hoangDao: true, note: 'Hoàng đạo, tốt cho cầu danh, học hành.' },
  { name: 'Thiên Lao', hoangDao: false, note: 'Hắc đạo, việc dễ bị trói buộc, trì trệ.' },
  { name: 'Huyền Vũ', hoangDao: false, note: 'Hắc đạo, đề phòng mất mát, thị phi.' },
  { name: 'Tư Mệnh', hoangDao: true, note: 'Hoàng đạo, tốt cho việc làm ban ngày.' },
  { name: 'Câu Trần', hoangDao: false, note: 'Hắc đạo, kỵ khởi công, đất đai.' },
];

export type TrucTone = 'tot' | 'binh' | 'xau';
export interface TrucDef {
  name: string;
  /** Nhãn phổ biến trong lịch Việt hiện nay. */
  tone: TrucTone;
  /** Ý nghĩa ngắn. */
  meaning: string;
  nen: string[];
  kieng: string[];
  /** Cách xếp theo câu thơ gốc "Kiến Mãn Bình Thu hắc, Trừ Nguy Định Chấp hoàng, Thành Khai giai khả dụng, Bế Phá bất tương đương". */
  classic: 'tốt' | 'xấu';
  note: string;
}

const truc = (name: string, tone: TrucTone, meaning: string, nen: string[], kieng: string[], classic: 'tốt' | 'xấu'): TrucDef => ({
  name, tone, meaning, nen, kieng, classic,
  note: `${meaning}. Nên: ${nen.join(', ')}. Kiêng: ${kieng.join(', ')}.`,
});

export const TRUC_12: TrucDef[] = [
  truc('Kiến', 'tot', 'Khởi đầu, dựng lập', ['xuất hành', 'cúng tế', 'nhậm chức', 'khởi đầu việc nhỏ'], ['động thổ', 'an táng', 'đào giếng'], 'xấu'),
  truc('Trừ', 'tot', 'Loại bỏ, trừ khử cái cũ', ['chữa bệnh', 'giải hạn', 'dọn dẹp', 'cắt tóc'], ['cưới hỏi', 'khai trương', 'đi xa', 'ký kết'], 'tốt'),
  truc('Mãn', 'tot', 'Đầy đủ, viên mãn', ['cầu tài', 'khai trương', 'cúng tế', 'nhập kho'], ['an táng', 'nhậm chức', 'kiện tụng'], 'xấu'),
  truc('Bình', 'binh', 'Bình hòa, xấu nhẹ', ['việc thường ngày', 'sửa đường', 'trát tường'], ['cưới hỏi', 'khai trương', 'việc lớn quan trọng'], 'xấu'),
  truc('Định', 'tot', 'Ổn định, vững bền', ['cưới hỏi', 'ký kết', 'nhập trạch', 'mua bán'], ['kiện tụng', 'xuất hành', 'chữa bệnh'], 'tốt'),
  truc('Chấp', 'binh', 'Bình hòa, trung tính; giữ gìn', ['xây dựng', 'sửa chữa', 'trồng trọt', 'tuyển người'], ['xuất hành', 'dọn nhà', 'khai trương', 'xuất tiền lớn'], 'tốt'),
  truc('Phá', 'xau', 'Phá vỡ, đổ nát (Nhật Nguyệt tương xung)', ['phá dỡ nhà cũ', 'chữa bệnh'], ['cưới hỏi', 'khai trương', 'ký kết', 'xuất hành', 'động thổ'], 'xấu'),
  truc('Nguy', 'xau', 'Nguy hiểm, cần thận trọng', ['cúng tế', 'cầu an', 'việc nhỏ làm cẩn thận'], ['xuất hành', 'đi sông nước', 'leo cao', 'cưới hỏi', 'động thổ'], 'tốt'),
  truc('Thành', 'tot', 'Thành công, hoàn thành', ['cưới hỏi', 'khai trương', 'nhập trạch', 'động thổ', 'nhập học'], ['kiện tụng', 'tranh chấp'], 'tốt'),
  truc('Thu', 'xau', 'Thu nhận; bất lợi cho việc xuất tiền', ['thu hoạch', 'thu nợ', 'nhập kho', 'tích trữ'], ['khởi công', 'xuất hành', 'an táng', 'chi tiền lớn', 'cho vay'], 'xấu'),
  truc('Khai', 'tot', 'Mở mang, khai thông', ['khai trương', 'cưới hỏi', 'nhập trạch', 'xuất hành', 'nhập học'], ['an táng', 'động thổ'], 'tốt'),
  truc('Bế', 'xau', 'Đóng lại, bế tắc', ['đắp đê', 'lấp hố', 'xây tường rào'], ['khai trương', 'cưới hỏi', 'xuất hành', 'nhậm chức', 'chữa mắt'], 'xấu'),
];

export const TRUC_TONE_LABEL: Record<TrucTone, string> = { tot: 'Tốt', binh: 'Bình hòa', xau: 'Xấu' };

export const SAO_28: { name: string; full: string; good: boolean; note: string }[] = [
  { name: 'Giác', full: 'Giác Mộc Giao', good: true, note: 'Tốt cho cưới hỏi, xây dựng, thi cử. Kỵ an táng.' },
  { name: 'Cang', full: 'Cang Kim Long', good: false, note: 'Kỵ cưới hỏi, xây dựng, khai trương.' },
  { name: 'Đê', full: 'Đê Thổ Lạc', good: false, note: 'Kỵ khởi công, cưới hỏi, xuất hành đường thủy.' },
  { name: 'Phòng', full: 'Phòng Nhật Thố', good: true, note: 'Tốt cho mọi việc, nhất là mua bán nhà đất, cưới hỏi.' },
  { name: 'Tâm', full: 'Tâm Nguyệt Hồ', good: false, note: 'Kỵ khởi công, cưới hỏi, kiện tụng.' },
  { name: 'Vĩ', full: 'Vĩ Hỏa Hổ', good: true, note: 'Tốt cho cưới hỏi, xây dựng, khai trương.' },
  { name: 'Cơ', full: 'Cơ Thủy Báo', good: true, note: 'Tốt cho khai trương, xây dựng, an táng.' },
  { name: 'Đẩu', full: 'Đẩu Mộc Giải', good: true, note: 'Tốt cho xây dựng, sửa chữa, may mặc.' },
  { name: 'Ngưu', full: 'Ngưu Kim Ngưu', good: false, note: 'Kỵ cưới hỏi, xây dựng, mở cửa hàng.' },
  { name: 'Nữ', full: 'Nữ Thổ Bức', good: false, note: 'Kỵ cưới hỏi, an táng, kiện tụng.' },
  { name: 'Hư', full: 'Hư Nhật Thử', good: false, note: 'Kỵ khởi công, cưới hỏi, khai trương.' },
  { name: 'Nguy', full: 'Nguy Nguyệt Yến', good: false, note: 'Kỵ xây dựng, đi thuyền, an táng.' },
  { name: 'Thất', full: 'Thất Hỏa Trư', good: true, note: 'Tốt cho xây dựng, cưới hỏi, an táng.' },
  { name: 'Bích', full: 'Bích Thủy Du', good: true, note: 'Tốt cho cưới hỏi, xây dựng, khai trương.' },
  { name: 'Khuê', full: 'Khuê Mộc Lang', good: false, note: 'Kỵ khai trương, an táng, mở đường.' },
  { name: 'Lâu', full: 'Lâu Kim Cẩu', good: true, note: 'Tốt cho cưới hỏi, xây dựng, khai trương.' },
  { name: 'Vị', full: 'Vị Thổ Trĩ', good: true, note: 'Tốt cho xây dựng, cưới hỏi, an táng.' },
  { name: 'Mão', full: 'Mão Nhật Kê', good: false, note: 'Kỵ cưới hỏi, xây dựng, khai trương.' },
  { name: 'Tất', full: 'Tất Nguyệt Ô', good: true, note: 'Tốt cho cưới hỏi, xây dựng, khai trương, an táng.' },
  { name: 'Chủy', full: 'Chủy Hỏa Hầu', good: false, note: 'Kỵ khởi công, an táng, kiện tụng.' },
  { name: 'Sâm', full: 'Sâm Thủy Viên', good: true, note: 'Tốt cho xây dựng, khai trương, nhậm chức. Kỵ cưới hỏi.' },
  { name: 'Tỉnh', full: 'Tỉnh Mộc Hãn', good: true, note: 'Tốt cho xây dựng, thi cử, khai trương. Kỵ an táng.' },
  { name: 'Quỷ', full: 'Quỷ Kim Dương', good: false, note: 'Kỵ cưới hỏi, xây dựng, khai trương.' },
  { name: 'Liễu', full: 'Liễu Thổ Chương', good: false, note: 'Kỵ khởi công, cưới hỏi, an táng.' },
  { name: 'Tinh', full: 'Tinh Nhật Mã', good: false, note: 'Kỵ cưới hỏi, mở đường, an táng.' },
  { name: 'Trương', full: 'Trương Nguyệt Lộc', good: true, note: 'Tốt cho cưới hỏi, khai trương, xây dựng.' },
  { name: 'Dực', full: 'Dực Hỏa Xà', good: false, note: 'Kỵ cưới hỏi, xây dựng, an táng.' },
  { name: 'Chẩn', full: 'Chẩn Thủy Dẫn', good: true, note: 'Tốt cho cưới hỏi, xây dựng, khai trương, an táng.' },
];

/** Giờ xuất hành theo Lý Thuần Phong (thứ tự vòng tiểu độn). */
export const LY_THUAN_PHONG = [
  { name: 'Đại An', good: true, note: 'Mọi việc tốt lành, cầu tài đi hướng Tây Nam, nhà cửa yên ổn.' },
  { name: 'Lưu Niên', good: false, note: 'Mưu sự khó thành, việc quan nên hoãn, đề phòng tranh cãi.' },
  { name: 'Tốc Hỷ', good: true, note: 'Tin vui sắp tới, cầu tài đi hướng Nam, gặp gỡ may mắn.' },
  { name: 'Xích Khẩu', good: false, note: 'Dễ cãi cọ, thị phi; việc quan trọng nên hoãn lại.' },
  { name: 'Tiểu Cát', good: true, note: 'Rất tốt lành, buôn bán có lời, mọi việc hòa hợp.' },
  { name: 'Tuyệt Lộ', good: false, note: 'Cầu tài không lợi, dễ trái ý, đi đường đề phòng.' },
];

/** 8 việc gốc: các sao, ngày kỵ trong Ngọc Hạp gắn với các việc này. */
export type BaseKey =
  | 'cuoi-hoi' | 'dong-tho' | 'nhap-trach' | 'khai-truong'
  | 'xuat-hanh' | 'ky-ket' | 'an-tang' | 'cung-te';

export type ActivityKey = BaseKey
  | 'an-hoi' | 'sua-nha' | 'do-mai' | 'mua-nha' | 'mua-xe' | 'nhap-hoc'
  | 'nham-chuc' | 'dat-ban-tho' | 'chua-benh' | 'cau-tai' | 'trong-trot';

type YearRule = 'kimlau' | 'hoangoc' | 'tamtai';

export interface ActivityDef {
  key: ActivityKey;
  label: string;
  short: string;
  group: 'Gia đình' | 'Nhà cửa' | 'Công việc, tài lộc' | 'Đi lại' | 'Tâm linh' | 'Sức khỏe, đời sống';
  /** việc gốc dùng để xét sao tốt xấu, ngày kỵ */
  base: BaseKey;
  /** điểm 12 Trực riêng (Kiến → Bế); bỏ trống thì dùng của việc gốc */
  truc?: number[];
  years: YearRule[];
  main?: boolean;
}

const TRUC_HOC = [10, 0, 5, 5, 8, 0, -15, -10, 12, -5, 12, -12];
export const ACTIVITY_DEFS: ActivityDef[] = [
  { key: 'cuoi-hoi', label: 'Cưới hỏi, tổ chức đám cưới', short: 'Cưới hỏi', group: 'Gia đình', base: 'cuoi-hoi', years: ['kimlau', 'tamtai'], main: true },
  { key: 'an-hoi', label: 'Dạm ngõ, ăn hỏi, đính hôn', short: 'Ăn hỏi', group: 'Gia đình', base: 'cuoi-hoi', years: [] },
  { key: 'nhap-trach', label: 'Về nhà mới, nhập trạch', short: 'Về nhà mới', group: 'Nhà cửa', base: 'nhap-trach', years: ['kimlau', 'hoangoc', 'tamtai'], main: true },
  { key: 'dong-tho', label: 'Động thổ, khởi công xây nhà', short: 'Động thổ', group: 'Nhà cửa', base: 'dong-tho', years: ['kimlau', 'hoangoc', 'tamtai'], main: true },
  { key: 'do-mai', label: 'Đổ mái, cất nóc, lợp nhà', short: 'Đổ mái', group: 'Nhà cửa', base: 'dong-tho', truc: [0, 0, 10, 5, 10, 8, -15, -15, 12, 5, 8, -10], years: ['kimlau', 'hoangoc'] },
  { key: 'sua-nha', label: 'Sửa nhà, sửa bếp, cải tạo', short: 'Sửa nhà', group: 'Nhà cửa', base: 'dong-tho', truc: [-10, 5, 5, 8, 8, 10, -10, -12, 12, 0, 8, -8], years: ['tamtai'] },
  { key: 'mua-nha', label: 'Mua nhà, mua đất', short: 'Mua nhà đất', group: 'Nhà cửa', base: 'ky-ket', years: [] },
  { key: 'khai-truong', label: 'Khai trương, mở cửa hàng', short: 'Khai trương', group: 'Công việc, tài lộc', base: 'khai-truong', years: ['tamtai'], main: true },
  { key: 'ky-ket', label: 'Ký hợp đồng, giao dịch', short: 'Ký kết', group: 'Công việc, tài lộc', base: 'ky-ket', years: [], main: true },
  { key: 'nham-chuc', label: 'Nhậm chức, nhận việc mới', short: 'Nhậm chức', group: 'Công việc, tài lộc', base: 'ky-ket', truc: TRUC_HOC, years: [] },
  { key: 'cau-tai', label: 'Cầu tài, thu nợ, vay vốn', short: 'Cầu tài', group: 'Công việc, tài lộc', base: 'khai-truong', truc: [0, -5, 12, 5, 5, 5, -15, -10, 12, 10, 10, -10], years: [] },
  { key: 'mua-xe', label: 'Mua xe, nhận xe mới', short: 'Mua xe', group: 'Công việc, tài lộc', base: 'ky-ket', years: [] },
  { key: 'xuat-hanh', label: 'Xuất hành, đi xa, du lịch', short: 'Xuất hành', group: 'Đi lại', base: 'xuat-hanh', years: [], main: true },
  { key: 'nhap-hoc', label: 'Nhập học, thi cử', short: 'Nhập học', group: 'Đi lại', base: 'xuat-hanh', truc: TRUC_HOC, years: [] },
  { key: 'cung-te', label: 'Cúng lễ, cầu an, giải hạn', short: 'Cúng lễ', group: 'Tâm linh', base: 'cung-te', years: [], main: true },
  { key: 'dat-ban-tho', label: 'Lập bàn thờ, an vị bàn thờ', short: 'Đặt bàn thờ', group: 'Tâm linh', base: 'nhap-trach', truc: [0, 5, 10, 8, 10, 5, -15, -12, 12, 0, 10, -10], years: [] },
  { key: 'an-tang', label: 'An táng, cải táng, sửa mộ', short: 'An táng', group: 'Tâm linh', base: 'an-tang', years: [], main: true },
  { key: 'chua-benh', label: 'Khám chữa bệnh, phẫu thuật', short: 'Chữa bệnh', group: 'Sức khỏe, đời sống', base: 'cung-te', truc: [-5, 15, -5, 5, 0, 0, 8, -5, 5, -5, 5, -10], years: [] },
  { key: 'trong-trot', label: 'Trồng cây, chăn nuôi', short: 'Trồng trọt', group: 'Sức khỏe, đời sống', base: 'cung-te', truc: [-5, 0, 5, 5, 8, 12, -12, -5, 10, 5, 10, -5], years: [] },
];
export const ACT_DEF: Record<ActivityKey, ActivityDef> = Object.fromEntries(ACTIVITY_DEFS.map((d) => [d.key, d])) as Record<ActivityKey, ActivityDef>;

/** Danh sách việc chính (giữ tương thích các màn hình cũ). */
export const ACTIVITIES = ACTIVITY_DEFS.filter((d) => d.main);

const ACT_INDEX: Record<BaseKey, number> = {
  'cuoi-hoi': 0, 'dong-tho': 1, 'nhap-trach': 2, 'khai-truong': 3,
  'xuat-hanh': 4, 'ky-ket': 5, 'an-tang': 6, 'cung-te': 7,
};

/** Điểm Trực theo từng việc: [cưới, động thổ, nhập trạch, khai trương, xuất hành, ký kết, an táng, cúng tế] */
const TRUC_SCORE: number[][] = [
  [5, -15, 0, 5, 12, 5, -15, 5],      // Kiến
  [-10, 0, 0, -10, -10, -5, 5, 10],   // Trừ
  [5, 0, 5, 12, 0, 10, -10, 10],      // Mãn
  [8, 5, 5, 5, 5, 5, 0, 5],           // Bình
  [12, 8, 10, 8, -10, 10, 0, 5],      // Định
  [5, 10, -5, -10, -12, 0, 0, 5],     // Chấp
  [-15, -15, -15, -15, -15, -15, -10, -5], // Phá
  [-15, -15, -10, -10, -15, -10, -10, 0],  // Nguy
  [15, 12, 12, 15, 10, 12, -5, 10],   // Thành
  [0, -12, 5, 5, -12, 5, -15, 0],     // Thu
  [12, 10, 12, 15, 12, 10, -15, 5],   // Khai
  [-12, -12, -10, -12, -10, -10, 0, -5],   // Bế
];

/* ---- Sao tốt, sao xấu (Ngọc Hạp Thông Thư – phần phổ biến) ---- */

type StarRule = {
  name: string;
  good: boolean;
  note: string;
  /** việc chịu ảnh hưởng mạnh; trống = ảnh hưởng chung */
  affects?: BaseKey[];
  weight: number;
  test: (c: Ctx) => boolean;
};

interface Ctx {
  m: number;            // tháng âm (1–12)
  season: number;       // 0 xuân, 1 hạ, 2 thu, 3 đông (theo tháng âm)
  stem: number;
  branch: number;
  n: number;            // lục thập hoa giáp
}

const B = (name: string) => BRANCHES.indexOf(name);
const S = (name: string) => STEMS.indexOf(name);
const byMonthBranch = (arr: string[]) => (c: Ctx) => c.branch === B(arr[c.m - 1]);
const byMonthStem = (arr: string[]) => (c: Ctx) => c.stem === S(arr[c.m - 1]);
const byMonthAny = (arr: string[]) => (c: Ctx) => {
  const v = arr[c.m - 1];
  return STEMS.includes(v) ? c.stem === S(v) : c.branch === B(v);
};
const bySeasonBranches = (arr: string[][]) => (c: Ctx) => arr[c.season].map(B).includes(c.branch);
const bySeasonStems = (arr: string[][]) => (c: Ctx) => arr[c.season].map(S).includes(c.stem);
/** tháng 1,5,9 / 2,6,10 / 3,7,11 / 4,8,12 */
const byTriad = (arr: string[], useStem = false) => (c: Ctx) => {
  const v = arr[(c.m - 1) % 4];
  return useStem ? c.stem === S(v) : c.branch === B(v);
};

const STARS: StarRule[] = [
  // Sao tốt
  { name: 'Thiên Đức', good: true, weight: 6, note: 'Đại cát, tốt cho mọi việc.', test: byMonthAny(['Đinh', 'Thân', 'Nhâm', 'Tân', 'Hợi', 'Giáp', 'Quý', 'Dần', 'Bính', 'Ất', 'Tỵ', 'Canh']) },
  { name: 'Thiên Đức Hợp', good: true, weight: 5, note: 'Tốt cho mọi việc.', test: byMonthAny(['Nhâm', 'Tỵ', 'Đinh', 'Bính', 'Dần', 'Kỷ', 'Mậu', 'Hợi', 'Tân', 'Canh', 'Thân', 'Ất']) },
  { name: 'Nguyệt Đức', good: true, weight: 6, note: 'Đại cát, tốt cho mọi việc.', test: byTriad(['Bính', 'Giáp', 'Nhâm', 'Canh'], true) },
  { name: 'Nguyệt Đức Hợp', good: true, weight: 5, note: 'Tốt cho mọi việc, kỵ kiện tụng.', test: byTriad(['Tân', 'Kỷ', 'Đinh', 'Ất'], true) },
  { name: 'Thiên Hỷ', good: true, weight: 5, note: 'Tốt cho cưới hỏi, mọi việc vui mừng.', affects: ['cuoi-hoi'], test: byMonthBranch(['Tuất', 'Hợi', 'Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu']) },
  { name: 'Sinh Khí', good: true, weight: 4, note: 'Tốt cho mọi việc, nhất là làm nhà, trồng trọt.', affects: ['dong-tho', 'nhap-trach'], test: byMonthBranch(['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi']) },
  { name: 'Thiên Quý', good: true, weight: 4, note: 'Tốt cho mọi việc.', test: bySeasonStems([['Giáp', 'Ất'], ['Bính', 'Đinh'], ['Canh', 'Tân'], ['Nhâm', 'Quý']]) },
  { name: 'Nguyệt Ân', good: true, weight: 4, note: 'Tốt cho mọi việc.', test: byMonthStem(['Bính', 'Đinh', 'Canh', 'Kỷ', 'Mậu', 'Tân', 'Nhâm', 'Quý', 'Canh', 'Ất', 'Giáp', 'Tân']) },
  { name: 'Giải Thần', good: true, weight: 3, note: 'Tốt cho cúng tế, giải oan, kiện tụng.', affects: ['cung-te'], test: byMonthBranch(['Thân', 'Thân', 'Tuất', 'Tuất', 'Tý', 'Tý', 'Dần', 'Dần', 'Thìn', 'Thìn', 'Ngọ', 'Ngọ']) },
  { name: 'Ích Hậu', good: true, weight: 3, note: 'Tốt cho mọi việc, nhất là cưới hỏi.', affects: ['cuoi-hoi'], test: byMonthBranch(['Tý', 'Ngọ', 'Sửu', 'Mùi', 'Dần', 'Thân', 'Mão', 'Dậu', 'Thìn', 'Tuất', 'Tỵ', 'Hợi']) },
  { name: 'Mẫu Thương', good: true, weight: 3, note: 'Tốt cho cầu tài, khai trương.', affects: ['khai-truong', 'ky-ket'], test: bySeasonBranches([['Hợi', 'Tý'], ['Dần', 'Mão'], ['Thìn', 'Tuất', 'Sửu', 'Mùi'], ['Thân', 'Dậu']]) },
  { name: 'Thiên Mã', good: true, weight: 3, note: 'Tốt cho xuất hành, giao dịch, cầu tài.', affects: ['xuat-hanh', 'ky-ket'], test: byMonthBranch(['Ngọ', 'Thân', 'Tuất', 'Tý', 'Dần', 'Thìn', 'Ngọ', 'Thân', 'Tuất', 'Tý', 'Dần', 'Thìn']) },
  { name: 'Dịch Mã', good: true, weight: 3, note: 'Tốt cho xuất hành, di chuyển.', affects: ['xuat-hanh'], test: byTriad(['Thân', 'Tỵ', 'Dần', 'Hợi']) },
  { name: 'Kính Tâm', good: true, weight: 3, note: 'Tốt cho cúng tế, an táng.', affects: ['an-tang', 'cung-te'], test: byMonthBranch(['Mùi', 'Sửu', 'Thân', 'Dần', 'Dậu', 'Mão', 'Tuất', 'Thìn', 'Hợi', 'Tỵ', 'Tý', 'Ngọ']) },
  // Sao xấu
  { name: 'Nguyệt Phá', good: false, weight: 8, note: 'Xấu cho xây dựng, làm nhà và việc lớn.', affects: ['dong-tho', 'nhap-trach'], test: (c) => c.branch === (c.m + 7) % 12 },
  { name: 'Thiên Cương', good: false, weight: 6, note: 'Xấu cho mọi việc.', test: byMonthBranch(['Tỵ', 'Tý', 'Mùi', 'Dần', 'Dậu', 'Thìn', 'Hợi', 'Ngọ', 'Sửu', 'Thân', 'Mão', 'Tuất']) },
  { name: 'Hà Khôi', good: false, weight: 6, note: 'Xấu cho mọi việc, nhất là khởi công.', affects: ['dong-tho'], test: byMonthBranch(['Hợi', 'Ngọ', 'Sửu', 'Thân', 'Mão', 'Tuất', 'Tỵ', 'Tý', 'Mùi', 'Dần', 'Dậu', 'Thìn']) },
  { name: 'Thiên Hỏa', good: false, weight: 5, note: 'Xấu cho lợp nhà, làm mái, nhập trạch.', affects: ['dong-tho', 'nhap-trach'], test: byTriad(['Tý', 'Mão', 'Ngọ', 'Dậu']) },
  { name: 'Kiếp Sát', good: false, weight: 6, note: 'Kỵ xuất hành, cưới hỏi, xây dựng.', affects: ['xuat-hanh', 'cuoi-hoi', 'dong-tho'], test: byTriad(['Hợi', 'Thân', 'Tỵ', 'Dần']) },
  { name: 'Tai Sát', good: false, weight: 5, note: 'Xấu cho mọi việc, đề phòng tai nạn.', test: byTriad(['Tý', 'Dậu', 'Ngọ', 'Mão']) },
  { name: 'Lục Bất Thành', good: false, weight: 5, note: 'Xấu cho xây dựng, việc khó thành.', affects: ['dong-tho'], test: byMonthBranch(['Dần', 'Ngọ', 'Tuất', 'Tỵ', 'Dậu', 'Sửu', 'Thân', 'Tý', 'Thìn', 'Hợi', 'Mão', 'Mùi']) },
  { name: 'Vãng Vong', good: false, weight: 7, note: 'Thổ kỵ: kỵ xuất hành, cưới hỏi, cầu tài, động thổ.', affects: ['xuat-hanh', 'cuoi-hoi', 'dong-tho', 'khai-truong'], test: byMonthBranch(['Dần', 'Tỵ', 'Thân', 'Hợi', 'Mão', 'Ngọ', 'Dậu', 'Tý', 'Thìn', 'Mùi', 'Tuất', 'Sửu']) },
  { name: 'Tiểu Hồng Sa', good: false, weight: 5, note: 'Xấu cho mọi việc.', test: (c) => c.branch === B(['Tỵ', 'Dậu', 'Sửu'][(c.m - 1) % 3]) },
  { name: 'Hoang Vu', good: false, weight: 5, note: 'Xấu cho mọi việc.', test: bySeasonBranches([['Tỵ', 'Dậu', 'Sửu'], ['Thân', 'Tý', 'Thìn'], ['Hợi', 'Mão', 'Mùi'], ['Dần', 'Ngọ', 'Tuất']]) },
  { name: 'Trùng Tang', good: false, weight: 7, note: 'Kỵ cưới hỏi, an táng, làm nhà.', affects: ['cuoi-hoi', 'an-tang', 'dong-tho'], test: byMonthStem(['Giáp', 'Ất', 'Mậu', 'Bính', 'Đinh', 'Kỷ', 'Canh', 'Tân', 'Mậu', 'Nhâm', 'Quý', 'Kỷ']) },
  { name: 'Trùng Phục', good: false, weight: 6, note: 'Kỵ cưới hỏi, an táng.', affects: ['cuoi-hoi', 'an-tang'], test: byMonthStem(['Canh', 'Tân', 'Kỷ', 'Nhâm', 'Quý', 'Mậu', 'Giáp', 'Ất', 'Kỷ', 'Bính', 'Đinh', 'Mậu']) },
];

/* ---- Ngày kỵ ---- */

export interface KyDay { name: string; note: string; severe: boolean; affects?: BaseKey[] }

const BIG: BaseKey[] = ['cuoi-hoi', 'dong-tho', 'nhap-trach', 'khai-truong', 'xuat-hanh', 'ky-ket'];
const DUONG_CONG: Record<number, number[]> = { 1: [13], 2: [11], 3: [9], 4: [7], 5: [5], 6: [3], 7: [8, 29], 8: [27], 9: [25], 10: [23], 11: [21], 12: [19] };
const SAT_CHU_AM = ['Tỵ', 'Tý', 'Mùi', 'Mão', 'Thân', 'Tuất', 'Hợi', 'Sửu', 'Ngọ', 'Dậu', 'Dần', 'Thìn'];
const SAT_CHU_DUONG = ['Tý', 'Sửu', 'Sửu', 'Tuất', 'Thìn', 'Thìn', 'Sửu', 'Thìn', 'Sửu', 'Thìn', 'Mùi', 'Thìn'];
const THO_TU = ['Bính Tuất', 'Nhâm Thìn', 'Tân Hợi', 'Đinh Tỵ', 'Mậu Tý', 'Bính Ngọ', 'Ất Sửu', 'Quý Mùi', 'Giáp Dần', 'Mậu Thân', 'Tân Mão', 'Tân Dậu'];

/* ------------------------------------------------------------------ */
/* Thông tin một ngày                                                  */
/* ------------------------------------------------------------------ */

export interface HourInfo {
  index: number;
  branch: string;
  range: string;
  canChi: string;
  than: string;
  hoangDao: boolean;
  ltp: { name: string; good: boolean; note: string };
}

export interface StarHit { name: string; good: boolean; note: string; affects?: BaseKey[]; weight: number }

export interface DayInfo {
  date: Date;
  jd: number;
  lunar: LunarDate;
  stem: number;
  branch: number;
  n: number;
  canChi: { day: string; month: string; year: string };
  napAm: { name: string; element: Element };
  solarTerm: string;
  than: { name: string; hoangDao: boolean; note: string };
  truc: TrucDef & { index: number };
  sao28: { index: number; name: string; full: string; good: boolean; note: string };
  goodStars: StarHit[];
  badStars: StarHit[];
  kyDays: KyDay[];
  hours: HourInfo[];
  directions: { hyThan: string; taiThan: string; hacThan: string | null };
  xungTuoi: string[];      // tuổi thiên khắc địa xung (nạp âm khắc)
  xungChi: string;         // chi lục xung với ngày
  hop: { lucHop: string; tamHop: string[] };
  /** Điểm chung của ngày 0–100 */
  score: number;
  verdict: Verdict;
}

export type Verdict = 'Rất tốt' | 'Tốt' | 'Bình thường' | 'Xấu' | 'Rất xấu';

const HY_THAN = ['Đông Bắc', 'Tây Bắc', 'Tây Nam', 'Chính Nam', 'Đông Nam', 'Đông Bắc', 'Tây Bắc', 'Tây Nam', 'Chính Nam', 'Đông Nam'];
const TAI_THAN = ['Đông Nam', 'Đông Nam', 'Chính Đông', 'Chính Đông', 'Chính Bắc', 'Chính Nam', 'Tây Nam', 'Tây Nam', 'Chính Tây', 'Chính Tây'];

/** Hạc thần: Kỷ Dậu → Giáp Dần Đông Bắc (6 ngày), 5 ngày Đông, 6 Đông Nam, 5 Nam, 6 Tây Nam, 5 Tây, 6 Tây Bắc, 5 Bắc; Quý Tỵ → Mậu Thân ở trên trời. */
export function hacThan(n: number): string | null {
  const seq: [string, number][] = [
    ['Đông Bắc', 6], ['Chính Đông', 5], ['Đông Nam', 6], ['Chính Nam', 5],
    ['Tây Nam', 6], ['Chính Tây', 5], ['Tây Bắc', 6], ['Chính Bắc', 5],
  ];
  let off = (n - 45 + 60) % 60;
  for (const [dir, len] of seq) {
    if (off < len) return dir;
    off -= len;
  }
  return null;
}

export const LUC_HOP = [1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2]; // Tý-Sửu, Dần-Hợi, Mão-Tuất, Thìn-Dậu, Tỵ-Thân, Ngọ-Mùi
export const tamHop = (b: number) => [(b + 4) % 12, (b + 8) % 12];

function seasonOf(m: number) { return Math.floor((m - 1) / 3); }

export function verdictOf(score: number): Verdict {
  if (score >= 75) return 'Rất tốt';
  if (score >= 60) return 'Tốt';
  if (score >= 45) return 'Bình thường';
  if (score >= 30) return 'Xấu';
  return 'Rất xấu';
}

/** Ngày tiết khí (Tứ ly, Tứ tuyệt): ngày liền trước ngày bắt đầu Xuân phân/Hạ chí/Thu phân/Đông chí, hoặc 4 tiết Lập. */
function tuLyTuyet(jd: number): 'ly' | 'tuyet' | null {
  const next = jd + 1;
  const a = sunLongitudeDeg(next);       // đầu ngày mai
  const b = sunLongitudeDeg(next + 1);   // cuối ngày mai
  for (const deg of [0, 90, 180, 270]) if (crosses(a, b, deg)) return 'ly';
  for (const deg of [45, 135, 225, 315]) if (crosses(a, b, deg)) return 'tuyet';
  return null;
}
function crosses(a: number, b: number, deg: number) {
  if (b < a) b += 360; // qua 0°
  const d = deg < a ? deg + 360 : deg;
  return d > a && d <= b;
}

const cache = new Map<number, DayInfo>();

export function getDayInfo(date: Date): DayInfo {
  const jd = jdFromDate(date.getDate(), date.getMonth() + 1, date.getFullYear());
  const hit = cache.get(jd);
  if (hit) return hit;

  const lunar = getLunarDate(date);
  const stem = (jd + 9) % 10;
  const branch = (jd + 1) % 12;
  const n = sexagenaryIndex(stem, branch);
  const m = lunar.month;

  // Tiết khí và tháng tiết (cho Trực)
  const L = sunLongitudeEndOfDay(date);
  const solarTerm = SOLAR_TERMS[Math.floor(L / 15) % 24];
  const termMonthBranch = (Math.floor((((L - 315) % 360) + 360) % 360 / 30) + 2) % 12;

  const thanStart = (2 * ((m - 1) % 6)) % 12;
  const thanIdx = (branch - thanStart + 12) % 12;
  const trucIdx = (branch - termMonthBranch + 12) % 12;
  const saoIdx = (jd + 11) % 28;

  const ctx: Ctx = { m, season: seasonOf(m), stem, branch, n };
  const goodStars: StarHit[] = [];
  const badStars: StarHit[] = [];
  for (const s of STARS) {
    if (s.test(ctx)) (s.good ? goodStars : badStars).push({ name: s.name, good: s.good, note: s.note, affects: s.affects, weight: s.weight });
  }
  const than = THAN_12[thanIdx];
  if (than.hoangDao) goodStars.unshift({ name: `${than.name} Hoàng đạo`, good: true, note: than.note, weight: 0 });
  else badStars.unshift({ name: `${than.name} Hắc đạo`, good: false, note: than.note, weight: 0 });

  // Ngày kỵ
  const kyDays: KyDay[] = [];
  const d = lunar.day;
  if ([3, 7, 13, 18, 22, 27].includes(d)) kyDays.push({ name: 'Tam Nương', severe: true, affects: BIG, note: 'Kỵ khai trương, xuất hành, cưới hỏi, sửa chữa hay làm nhà.' });
  if ([5, 14, 23].includes(d)) kyDays.push({ name: 'Nguyệt Kỵ', severe: true, affects: BIG, note: '"Mùng năm, mười bốn, hai ba – đi chơi cũng lỗ, nữa là đi buôn": kỵ khởi sự việc lớn.' });
  if ((DUONG_CONG[m] || []).includes(d)) kyDays.push({ name: 'Dương Công Kỵ Nhật', severe: true, note: 'Trăm việc đều kỵ, không nên làm việc trọng đại.' });
  if (BRANCHES[branch] === SAT_CHU_DUONG[m - 1]) kyDays.push({ name: 'Sát Chủ Dương', severe: true, affects: ['cuoi-hoi', 'dong-tho', 'nhap-trach', 'khai-truong', 'ky-ket'], note: 'Kỵ làm nhà, cưới hỏi, nhập trạch, mua bán lớn.' });
  if (BRANCHES[branch] === SAT_CHU_AM[m - 1]) kyDays.push({ name: 'Sát Chủ Âm', severe: true, affects: ['an-tang'], note: 'Kỵ mai táng, tu sửa mộ phần.' });
  if (sexagenaryName(n) === THO_TU[m - 1]) kyDays.push({ name: 'Thọ Tử', severe: true, note: 'Trăm sự đều kỵ, chỉ nên làm việc nhỏ thường ngày.' });
  // Nguyệt tận: ngày cuối tháng âm
  {
    const t = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    const nl = convertSolar2Lunar(t.getDate(), t.getMonth() + 1, t.getFullYear());
    if (nl[0] === 1) kyDays.push({ name: 'Nguyệt Tận', severe: false, affects: ['cuoi-hoi', 'khai-truong', 'xuat-hanh'], note: 'Ngày cuối tháng âm, nên tránh khởi sự việc lớn.' });
  }
  const tl = tuLyTuyet(jd);
  if (tl === 'ly') kyDays.push({ name: 'Tứ Ly', severe: false, affects: ['xuat-hanh', 'cuoi-hoi', 'khai-truong'], note: 'Ngày trước Xuân phân, Hạ chí, Thu phân, Đông chí: kỵ xuất hành, cưới hỏi.' });
  if (tl === 'tuyet') kyDays.push({ name: 'Tứ Tuyệt', severe: false, affects: ['xuat-hanh', 'cuoi-hoi', 'khai-truong'], note: 'Ngày trước Lập xuân, Lập hạ, Lập thu, Lập đông: kỵ xuất hành, khởi sự.' });

  // Giờ trong ngày
  const hourThanStart = (8 + 2 * (branch % 6)) % 12;
  const hours: HourInfo[] = BRANCHES.map((b, i) => {
    const hs = ((stem % 5) * 2 + i) % 10;
    const t = THAN_12[(i - hourThanStart + 12) % 12];
    return {
      index: i, branch: b, range: BRANCH_HOURS[b], canChi: `${STEMS[hs]} ${b}`,
      than: t.name, hoangDao: t.hoangDao,
      ltp: LY_THUAN_PHONG[(m + d - 1 + i) % 6],
    };
  });

  // Tuổi xung: chi lục xung, nạp âm hai bên khắc nhau
  const xb = (branch + 6) % 12;
  const na = napAm(n);
  const xungTuoi: string[] = [];
  for (let s = xb % 2; s < 10; s += 2) {
    const k = sexagenaryIndex(s, xb);
    const rel = elementRelation(na.element, napAm(k).element);
    if (rel === 'khắc' || rel === 'bị khắc') xungTuoi.push(sexagenaryName(k));
  }

  const info: DayInfo = {
    date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
    jd, lunar, stem, branch, n,
    canChi: { day: sexagenaryName(n), month: getMonthCanChi(lunar.month, lunar.year), year: getYearCanChi(lunar.year) },
    napAm: na,
    solarTerm,
    than,
    truc: { index: trucIdx, ...TRUC_12[trucIdx] },
    sao28: { index: saoIdx, ...SAO_28[saoIdx] },
    goodStars, badStars, kyDays, hours,
    directions: { hyThan: HY_THAN[stem], taiThan: TAI_THAN[stem], hacThan: hacThan(n) },
    xungTuoi,
    xungChi: BRANCHES[xb],
    hop: { lucHop: BRANCHES[LUC_HOP[branch]], tamHop: tamHop(branch).map((x) => BRANCHES[x]) },
    score: 0,
    verdict: 'Bình thường',
  };
  info.score = generalScore(info);
  info.verdict = verdictOf(info.score);
  if (cache.size > 2000) cache.clear();
  cache.set(jd, info);
  return info;
}

/** Điểm chung (không theo việc cụ thể). */
function generalScore(i: DayInfo): number {
  let dev = 0;
  dev += i.than.hoangDao ? 10 : -10;
  dev += TRUC_SCORE[i.truc.index].reduce((a, b) => a + b, 0) / 8;
  dev += i.sao28.good ? 6 : -6;
  for (const g of i.goodStars) dev += g.weight * 0.7;
  for (const b of i.badStars) dev -= b.weight * 0.7;
  for (const k of i.kyDays) dev -= k.severe ? 12 : 5;
  // hiệu chỉnh để phân bố cân đối: khoảng 1/4 số ngày Tốt trở lên, 1/3 Xấu trở xuống
  return clamp(Math.round(58 + dev * 0.85));
}

const clamp = (v: number) => Math.max(0, Math.min(100, v));

/* ------------------------------------------------------------------ */
/* Tuổi người xem: Kim Lâu, Hoang Ốc, Tam Tai                          */
/* ------------------------------------------------------------------ */

export interface Person {
  birthYear: number;          // năm sinh âm lịch
  gender?: 'nam' | 'nu';
}

export function personInfo(p: Person) {
  const stem = (((p.birthYear + 6) % 10) + 10) % 10;
  const branch = (((p.birthYear + 8) % 12) + 12) % 12;
  const n = sexagenaryIndex(stem, branch);
  return { stem, branch, n, canChi: sexagenaryName(n), napAm: napAm(n) };
}

/** Tuổi mụ (tuổi âm) trong năm âm lịch targetYear. */
export const tuoiMu = (birthYear: number, targetYear: number) => targetYear - birthYear + 1;

export function kimLau(age: number): string | null {
  const r = age % 9;
  if (r === 1) return 'Kim Lâu Thân (hại bản thân)';
  if (r === 3) return 'Kim Lâu Thê (hại vợ/chồng)';
  if (r === 6) return 'Kim Lâu Tử (hại con cái)';
  if (r === 8) return 'Kim Lâu Lục Súc (hại vật nuôi, tài sản)';
  return null;
}

export const HOANG_OC = ['Nhất Cát', 'Nhì Nghi', 'Tam Địa Sát', 'Tứ Tấn Tài', 'Ngũ Thọ Tử', 'Lục Hoang Ốc'];
export function hoangOc(age: number): { name: string; bad: boolean } {
  if (age < 10) return { name: HOANG_OC[0], bad: false };
  const p = (Math.floor(age / 10) - 1) % 6;
  const idx = (p + (age % 10)) % 6;
  return { name: HOANG_OC[idx], bad: idx === 2 || idx === 4 || idx === 5 };
}

/** Tam Tai: trả về true nếu năm âm targetYear là năm Tam Tai của người sinh năm birthYear. */
export function tamTai(birthYear: number, targetYear: number): boolean {
  const pb = (((birthYear + 8) % 12) + 12) % 12;
  const tb = (((targetYear + 8) % 12) + 12) % 12;
  // Thân Tý Thìn → Dần Mão Thìn; Dần Ngọ Tuất → Thân Dậu Tuất; Hợi Mão Mùi → Tỵ Ngọ Mùi; Tỵ Dậu Sửu → Hợi Tý Sửu
  const startByGroup: Record<number, number> = { 8: 2, 0: 2, 4: 2, 2: 8, 6: 8, 10: 8, 11: 5, 3: 5, 7: 5, 5: 11, 9: 11, 1: 11 };
  const s = startByGroup[pb];
  return [s, (s + 1) % 12, (s + 2) % 12].includes(tb);
}

export interface YearCheck { name: string; bad: boolean; note: string }

/** Kiểm tra tuổi theo năm (Kim Lâu, Hoang Ốc, Tam Tai) cho một việc. */
export function yearChecks(p: Person, targetLunarYear: number, act: ActivityKey): YearCheck[] {
  const def = ACT_DEF[act];
  const age = tuoiMu(p.birthYear, targetLunarYear);
  const out: YearCheck[] = [];
  const isWedding = def.base === 'cuoi-hoi';
  if (def.years.includes('kimlau')) {
    const kl = kimLau(age);
    out.push(kl
      ? { name: 'Kim Lâu', bad: true, note: `Tuổi mụ ${age}: phạm ${kl}. ${isWedding ? 'Theo tục lệ thường xét tuổi người nữ.' : 'Dân gian thường mượn tuổi người khác làm thay.'}` }
      : { name: 'Kim Lâu', bad: false, note: `Tuổi mụ ${age}: không phạm Kim Lâu.` });
  }
  if (def.years.includes('hoangoc')) {
    const h = hoangOc(age);
    out.push({ name: 'Hoang Ốc', bad: h.bad, note: `Tuổi mụ ${age}: ${h.name}${h.bad ? ' – xấu, nên cân nhắc hoặc mượn tuổi.' : ' – tốt.'}` });
  }
  if (def.years.includes('tamtai')) {
    const tt = tamTai(p.birthYear, targetLunarYear);
    out.push({ name: 'Tam Tai', bad: tt, note: tt ? `Năm ${getYearCanChi(targetLunarYear)} là năm Tam Tai của tuổi ${personInfo(p).canChi}.` : 'Không phạm Tam Tai.' });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Chấm điểm một ngày cho một việc                                     */
/* ------------------------------------------------------------------ */

export interface Reason { text: string; delta: number; kind?: 'ngay' | 'ky' | 'tuoi' }
export interface ActivityResult {
  score: number;
  verdict: Verdict;
  blocked: boolean;      // phạm ngày kỵ nặng hoặc xung tuổi nặng
  reasons: Reason[];
  goodHours: HourInfo[]; // giờ Hoàng đạo không xung tuổi
}

export function evaluateActivity(info: DayInfo, act: ActivityKey, person?: Person): ActivityResult {
  const reasons: Reason[] = [];
  let kind: Reason['kind'] = 'ngay';
  const add = (text: string, delta: number) => { if (delta !== 0) reasons.push({ text, delta, kind }); };
  const def = ACT_DEF[act];
  const base = def.base;
  const ai = ACT_INDEX[base];
  let blocked = false;

  add(`${info.than.name} ${info.than.hoangDao ? 'Hoàng đạo' : 'Hắc đạo'}`, info.than.hoangDao ? 10 : -10);
  add(`Trực ${info.truc.name}`, def.truc ? def.truc[info.truc.index] : TRUC_SCORE[info.truc.index][ai]);
  add(`Sao ${info.sao28.name} (${info.sao28.good ? 'tốt' : 'xấu'})`, info.sao28.good ? 8 : -8);
  for (const s of [...info.goodStars, ...info.badStars]) {
    if (!s.weight) continue;
    const strong = s.affects?.includes(base);
    const w = strong ? s.weight * 1.6 : s.affects ? s.weight * 0.5 : s.weight;
    add(`${s.good ? 'Sao tốt' : 'Sao xấu'} ${s.name}`, Math.round(s.good ? w : -w));
  }
  kind = 'ky';
  for (const k of info.kyDays) {
    const hits = !k.affects || k.affects.includes(base);
    if (!hits) continue;
    if (k.severe) {
      blocked = true;
      add(`Phạm ${k.name}`, -25);
    } else add(`Phạm ${k.name}`, -10);
  }

  kind = 'tuoi';
  if (person) {
    const pi = personInfo(person);
    const dayName = info.canChi.day;
    if (info.xungTuoi.includes(pi.canChi)) {
      blocked = true;
      add(`Ngày ${dayName} xung khắc mạnh với tuổi ${pi.canChi}`, -30);
    } else if ((info.branch + 6) % 12 === pi.branch) {
      add(`Ngày ${BRANCHES[info.branch]} lục xung tuổi ${BRANCHES[pi.branch]}`, -15);
    }
    if (LUC_HOP[info.branch] === pi.branch) add(`Ngày lục hợp tuổi ${BRANCHES[pi.branch]}`, 6);
    if (tamHop(info.branch).includes(pi.branch)) add(`Ngày tam hợp tuổi ${BRANCHES[pi.branch]}`, 5);
    const rel = elementRelation(info.napAm.element, pi.napAm.element);
    if (rel === 'sinh') add(`Mệnh ngày (${info.napAm.element}) sinh mệnh tuổi (${pi.napAm.element})`, 5);
    if (rel === 'khắc') add(`Mệnh ngày (${info.napAm.element}) khắc mệnh tuổi (${pi.napAm.element})`, -6);
  }

  const raw = 50 + reasons.reduce((a, r) => a + r.delta, 0);
  let score = clamp(Math.round(raw));
  // Phạm sao xấu nặng của đúng việc này (Vãng Vong, Trùng Tang, Nguyệt Phá…) thì tối đa chỉ ở mức "Tốt"
  const heavyBad = info.badStars.some((s) => s.weight >= 7 && s.affects?.includes(base));
  if (heavyBad) score = Math.min(score, 70);
  if (blocked) score = Math.min(score, 29);

  const pb = person ? personInfo(person).branch : -1;
  const goodHours = info.hours.filter((h) => h.hoangDao && (pb < 0 || (h.index + 6) % 12 !== pb));

  return { score, verdict: verdictOf(score), blocked, reasons, goodHours };
}

/* ------------------------------------------------------------------ */
/* Trạch nhật: tìm ngày tốt trong khoảng                               */
/* ------------------------------------------------------------------ */

export interface PickResult { date: Date; info: DayInfo; result: ActivityResult }

export function findGoodDays(opts: {
  from: Date; to: Date; act: ActivityKey; person?: Person;
  minScore?: number; includeWeekends?: boolean; limit?: number;
}): PickResult[] {
  const { from, to, act, person, minScore = 60, includeWeekends = true, limit = 60 } = opts;
  const out: PickResult[] = [];
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  let guard = 0;
  for (let d = new Date(start); d <= end && guard < 800; d.setDate(d.getDate() + 1), guard++) {
    if (!includeWeekends && (d.getDay() === 0 || d.getDay() === 6)) continue;
    const info = getDayInfo(d);
    const result = evaluateActivity(info, act, person);
    if (!result.blocked && result.score >= minScore) out.push({ date: new Date(d), info, result });
  }
  out.sort((a, b) => b.result.score - a.result.score || a.date.getTime() - b.date.getTime());
  return out.slice(0, limit);
}

/** Việc nên làm / nên tránh trong ngày (dùng cho trang Hôm nay). */
export function activitiesForDay(info: DayInfo, person?: Person) {
  const good: { key: ActivityKey; label: string; score: number }[] = [];
  const bad: { key: ActivityKey; label: string; score: number }[] = [];
  for (const a of ACTIVITIES) {
    const r = evaluateActivity(info, a.key, person);
    if (!r.blocked && r.score >= 60) good.push({ key: a.key, label: a.short, score: r.score });
    else if (r.blocked || r.score < 45) bad.push({ key: a.key, label: a.short, score: r.score });
  }
  good.sort((a, b) => b.score - a.score);
  bad.sort((a, b) => a.score - b.score);
  return { good, bad };
}

export const DISCLAIMER = 'Nội dung xem ngày, giờ mang tính tham khảo văn hóa, tín ngưỡng dân gian, không phải căn cứ khoa học. Mỗi sách lịch có thể khác nhau đôi chút.';

/* ------------------------------------------------------------------ */
/* Xem tuổi vợ chồng: mệnh (nạp âm), thiên can, địa chi                */
/* ------------------------------------------------------------------ */

const STEM_ELEMENT: Element[] = ['Mộc', 'Mộc', 'Hỏa', 'Hỏa', 'Thổ', 'Thổ', 'Kim', 'Kim', 'Thủy', 'Thủy'];
const CAN_HOP = [[0, 5], [1, 6], [2, 7], [3, 8], [4, 9]]; // Giáp-Kỷ, Ất-Canh, Bính-Tân, Đinh-Nhâm, Mậu-Quý
const LUC_HAI = [[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]]; // Tý-Mùi, Sửu-Ngọ, Dần-Tỵ, Mão-Thìn, Thân-Hợi, Dậu-Tuất
const pairIn = (list: number[][], a: number, b: number) => list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

export interface CoupleCriterion { name: string; result: 'tốt' | 'bình thường' | 'xấu'; note: string; points: number }
export interface CoupleResult { points: number; max: number; verdict: 'Rất hợp' | 'Hợp' | 'Bình thường' | 'Không hợp'; criteria: CoupleCriterion[] }

export function coupleMatch(a: Person, b: Person): CoupleResult {
  const A = personInfo(a), B = personInfo(b);
  const criteria: CoupleCriterion[] = [];
  // Mệnh
  const rel = elementRelation(A.napAm.element, B.napAm.element);
  if (rel === 'sinh' || rel === 'được sinh') criteria.push({ name: 'Mệnh', result: 'tốt', points: 2, note: `${A.napAm.name} (${A.napAm.element}) và ${B.napAm.name} (${B.napAm.element}): tương sinh.` });
  else if (rel === 'hòa') criteria.push({ name: 'Mệnh', result: 'bình thường', points: 1, note: `Cùng mệnh ${A.napAm.element}: bình hòa.` });
  else criteria.push({ name: 'Mệnh', result: 'xấu', points: 0, note: `${A.napAm.element} và ${B.napAm.element}: tương khắc.` });
  // Thiên can
  const sa = STEM_ELEMENT[A.stem], sb = STEM_ELEMENT[B.stem];
  const canA = STEMS[A.stem], canB = STEMS[B.stem];
  if (pairIn(CAN_HOP, A.stem, B.stem)) criteria.push({ name: 'Thiên can', result: 'tốt', points: 2, note: `${canA} – ${canB}: tương hợp.` });
  else {
    const r = elementRelation(sa, sb);
    if (r === 'sinh' || r === 'được sinh') criteria.push({ name: 'Thiên can', result: 'tốt', points: 2, note: `${canA} (${sa}) – ${canB} (${sb}): tương sinh.` });
    else if (r === 'hòa') criteria.push({ name: 'Thiên can', result: 'bình thường', points: 1, note: `${canA} – ${canB}: bình hòa.` });
    else criteria.push({ name: 'Thiên can', result: 'xấu', points: 0, note: `${canA} (${sa}) – ${canB} (${sb}): tương khắc.` });
  }
  // Địa chi
  const ca = BRANCHES[A.branch], cb = BRANCHES[B.branch];
  if (LUC_HOP[A.branch] === B.branch) criteria.push({ name: 'Địa chi', result: 'tốt', points: 2, note: `${ca} – ${cb}: lục hợp.` });
  else if (A.branch !== B.branch && tamHop(A.branch).includes(B.branch)) criteria.push({ name: 'Địa chi', result: 'tốt', points: 2, note: `${ca} – ${cb}: tam hợp.` });
  else if ((A.branch + 6) % 12 === B.branch) criteria.push({ name: 'Địa chi', result: 'xấu', points: 0, note: `${ca} – ${cb}: lục xung.` });
  else if (pairIn(LUC_HAI, A.branch, B.branch)) criteria.push({ name: 'Địa chi', result: 'xấu', points: 0, note: `${ca} – ${cb}: lục hại.` });
  else if (A.branch % 3 === B.branch % 3 && A.branch !== B.branch) criteria.push({ name: 'Địa chi', result: 'xấu', points: 0, note: `${ca} – ${cb}: tứ hành xung.` });
  else criteria.push({ name: 'Địa chi', result: 'bình thường', points: 1, note: `${ca} – ${cb}: không xung, không hợp.` });
  const points = criteria.reduce((x, c) => x + c.points, 0);
  const verdict = points >= 6 ? 'Rất hợp' : points >= 4 ? 'Hợp' : points >= 2 ? 'Bình thường' : 'Không hợp';
  return { points, max: 6, verdict, criteria };
}

/** Trạch nhật cho nhiều người: loại ngày xung tuổi bất kỳ ai, điểm = điểm thấp nhất. */
export function evaluateForPeople(info: DayInfo, act: ActivityKey, people: Person[]): ActivityResult & { perPerson: ActivityResult[] } {
  if (!people.length) { const r = evaluateActivity(info, act); return { ...r, perPerson: [] }; }
  const per = people.map((p) => evaluateActivity(info, act, p));
  const main = per.reduce((a, b) => (b.score < a.score ? b : a));
  const blocked = per.some((r) => r.blocked);
  const seen = new Set<string>();
  const reasons: Reason[] = [];
  per.forEach((r, i) => r.reasons.forEach((x) => {
    const personal = /tuổi|Mệnh ngày/.test(x.text);
    const text = personal && people.length > 1 ? `${x.text} (người ${i + 1})` : x.text;
    if (!seen.has(text)) { seen.add(text); reasons.push({ ...x, text }); }
  }));
  const branches = people.map((p) => personInfo(p).branch);
  const goodHours = info.hours.filter((h) => h.hoangDao && branches.every((b) => (h.index + 6) % 12 !== b));
  const score = blocked ? Math.min(main.score, 29) : main.score;
  return { score, verdict: verdictOf(score), blocked, reasons, goodHours, perPerson: per };
}
