import { LunarDate } from '../types';

export const STEMS = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
export const BRANCHES = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

export const BRANCH_HOURS: Record<string, string> = {
  "Tý": "23h - 01h",
  "Sửu": "01h - 03h",
  "Dần": "03h - 05h",
  "Mão": "05h - 07h",
  "Thìn": "07h - 09h",
  "Tỵ": "09h - 11h",
  "Ngọ": "11h - 13h",
  "Mùi": "13h - 15h",
  "Thân": "15h - 17h",
  "Dậu": "17h - 19h",
  "Tuất": "19h - 21h",
  "Hợi": "21h - 23h"
};

const ACTIVITY_MAP: Record<number, { good: string[], bad: string[] }> = {
  0: { good: ["Ký kết", "Giao dịch", "Cúng bái"], bad: ["Cưới hỏi", "Kiện tụng"] }, // Tý
  1: { good: ["Xây dựng", "Sửa nhà", "Nhập trạch"], bad: ["Xuất hành", "An táng"] }, // Sửu
  2: { good: ["Khai trương", "Cầu tài", "Gặp gỡ"], bad: ["Tranh chấp", "Phẫu thuật"] }, // Dần
  3: { good: ["Tế tự", "Sửa cửa", "Làm vườn"], bad: ["Đổi việc", "Di chuyển xa"] }, // Mão
  4: { good: ["Động thổ", "Cưới hỏi", "Mọi việc"], bad: ["Kiện cáo", "Tranh chấp"] }, // Thìn
  5: { good: ["Khám bệnh", "Hội họp", "Đính hôn"], bad: ["Xây nhà", "Đào đất"] }, // Tỵ
  6: { good: ["Xuất hành", "Mở cửa hàng", "Nhậm chức"], bad: ["Ký hợp đồng", "An táng"] }, // Ngọ
  7: { good: ["An táng", "Cải táng", "Nghỉ ngơi"], bad: ["Cưới hỏi", "Động thổ"] }, // Mùi
  8: { good: ["Học hành", "Nghiên cứu", "Giao dịch"], bad: ["Phẫu thuật", "Kiện tụng"] }, // Thân
  9: { good: ["Dọn dẹp", "Sắp xếp", "Tế tự"], bad: ["Chuyển nhà", "Đi xa"] }, // Dậu
  10: { good: ["Bảo vệ", "Xây tường", "Cầu tự"], bad: ["Khai trương", "Xuất hành"] }, // Tuất
  11: { good: ["Tiệc tùng", "Hội họp", "Cầu tài"], bad: ["Sửa chữa", "Động thổ"] }, // Hợi
};

const DIRECTION_MAP: Record<number, { hy: string, tai: string }> = {
  0: { hy: "Đông Bắc", tai: "Đông Nam" }, // Giáp
  5: { hy: "Đông Bắc", tai: "Đông Nam" }, // Kỷ
  1: { hy: "Tây Bắc", tai: "Chính Đông" }, // Ất
  6: { hy: "Tây Bắc", tai: "Chính Đông" }, // Canh
  2: { hy: "Tây Nam", tai: "Chính Đông" }, // Bính
  7: { hy: "Tây Nam", tai: "Chính Đông" }, // Tân
  3: { hy: "Chính Nam", tai: "Tây Bắc" }, // Đinh
  8: { hy: "Chính Nam", tai: "Tây Bắc" }, // Nhâm
  4: { hy: "Đông Nam", tai: "Chính Bắc" }, // Mậu
  9: { hy: "Đông Nam", tai: "Chính Bắc" }, // Quý
};

const CLASH_MAP: Record<number, number> = {
  0: 6, 1: 7, 2: 8, 3: 9, 4: 10, 5: 11, 6: 0, 7: 1, 8: 2, 9: 3, 10: 4, 11: 5
};

const AUSPICIOUS_MAP: Record<number, number[]> = {
  0: [0, 1, 3, 6, 8, 9],
  6: [0, 1, 3, 6, 8, 9],
  1: [2, 3, 5, 8, 10, 11],
  7: [2, 3, 5, 8, 10, 11],
  2: [0, 1, 4, 5, 7, 10],
  8: [0, 1, 4, 5, 7, 10],
  3: [0, 2, 3, 6, 7, 9],
  9: [0, 2, 3, 6, 7, 9],
  4: [2, 4, 5, 8, 9, 11],
  10: [2, 4, 5, 8, 9, 11],
  5: [1, 4, 6, 7, 10, 11],
  11: [1, 4, 6, 7, 10, 11],
};

/* --- Astronomical Vietnamese Lunar Calendar Algorithm (Ho Ngoc Duc, GMT+7) --- */

function INT(d: number): number {
  return Math.floor(d);
}

export function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = INT((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
  if (jd < 2299161) {
    jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
  }
  return jd;
}

export function jdToDate(jd: number): [number, number, number] {
  let a: number, b: number, c: number, d: number, e: number, m: number;
  if (jd > 2299160) {
    a = jd + 32044;
    b = INT((4 * a + 3) / 146097);
    c = a - INT((146097 * b) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  d = INT((4 * c + 3) / 1461);
  e = c - INT((1461 * d) / 4);
  m = INT((5 * e + 2) / 153);
  const day = e - INT((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * INT(m / 10);
  const year = 100 * b + d - 4800 + INT(m / 10);
  return [day, month, year];
}

function getNewMoonDay(k: number, timeZone = 7): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * M * dr);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(2 * Mpr * dr);
  C1 = C1 - 0.0004 * Math.sin(3 * Mpr * dr);
  C1 = C1 + 0.0104 * Math.sin(2 * F * dr) - 0.0051 * Math.sin((M + Mpr) * dr);
  C1 = C1 - 0.0004 * Math.sin((M - Mpr) * dr) + 0.0004 * Math.sin((2 * F + M) * dr);
  C1 = C1 - 0.0004 * Math.sin((2 * F - M) * dr) - 0.0006 * Math.sin((2 * F + Mpr) * dr);
  C1 = C1 + 0.0010 * Math.sin((2 * F - Mpr) * dr) + 0.0005 * Math.sin((M + 2 * Mpr) * dr);
  let deltaT: number;
  if (T < -11) {
    deltaT = 0.001 + 0.000839 * T;
  } else {
    deltaT = -0.00002 + 0.000297 * T + 0.000281 * T2;
  }
  const JdNew = Jd1 + C1 - deltaT;
  return INT(JdNew + 0.5 + timeZone / 24.0);
}

function getSunLongitude(jdn: number, timeZone = 7): number {
  const T = (jdn - 2451545.0 - timeZone / 24.0) / 36525.0;
  const T2 = T * T;
  const dr = Math.PI / 180;
  const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  const DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(M * dr)
         + (0.019993 - 0.000101 * T) * Math.sin(2 * M * dr)
         + 0.000290 * Math.sin(3 * M * dr);
  let L = L0 + DL;
  L = L - 360 * Math.floor(L / 360);
  return INT(L / 30);
}

function getLunarMonth11(yy: number, timeZone = 7): number {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = INT(off / 29.53058868);
  let nm = getNewMoonDay(k, timeZone);
  const sunLong = getSunLongitude(nm, timeZone);
  if (sunLong >= 9) {
    nm = getNewMoonDay(k - 1, timeZone);
  }
  return nm;
}

function getLeapMonthOffset(a11: number, timeZone = 7): number {
  const k = INT((a11 - 2415021.0769) / 29.53058868 + 0.5);
  let last = 0;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  while (i <= 14) {
    const current = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    if (current === last) {
      break;
    }
    last = current;
    i++;
  }
  if (i < 14) {
    return i;
  }
  return 0;
}

/**
 * Convert Solar Date (dd, mm, yyyy) to Vietnamese Lunar Date.
 * Timezone defaults to 7 (Vietnam UTC+7).
 */
export function convertSolar2Lunar(dd: number, mm: number, yyyy: number, timeZone = 7): [number, number, number, boolean] {
  const dayNumber = jdFromDate(dd, mm, yyyy);
  let k = INT((dayNumber - 2415021.0769) / 29.53058868);
  let monthStart = getNewMoonDay(k + 1, timeZone);

  if (monthStart > dayNumber) {
    monthStart = getNewMoonDay(k, timeZone);
  } else {
    k = k + 1;
  }

  let a11 = getLunarMonth11(yyyy, timeZone);
  let b11 = a11;
  let lunarYear = yyyy;

  if (a11 >= monthStart) {
    lunarYear = yyyy;
    a11 = getLunarMonth11(yyyy - 1, timeZone);
  } else {
    lunarYear = yyyy + 1;
    b11 = getLunarMonth11(yyyy + 1, timeZone);
  }

  const lunarDay = dayNumber - monthStart + 1;
  const diff = INT((monthStart - a11) / 29);

  let lunarLeap = false;
  let lunarMonth = diff + 11;

  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) {
        lunarLeap = true;
      }
    }
  }

  if (lunarMonth > 12) {
    lunarMonth = lunarMonth - 12;
  }
  if (lunarMonth >= 11 && diff < 4) {
    lunarYear = yyyy - 1;
  }

  return [lunarDay, lunarMonth, lunarYear, lunarLeap];
}

/**
 * Convert Vietnamese Lunar Date to Solar Date [dd, mm, yyyy].
 */
export function convertLunar2Solar(
  lunarDay: number,
  lunarMonth: number,
  lunarYear: number,
  lunarLeap: boolean = false,
  timeZone = 7
): [number, number, number] {
  let a11 = getLunarMonth11(lunarYear - 1, timeZone);
  let b11 = getLunarMonth11(lunarYear, timeZone);
  let leapOff = 0;
  let leapMonth = 0;

  if (b11 - a11 > 365) {
    leapOff = getLeapMonthOffset(a11, timeZone);
    leapMonth = leapOff - 2;
    if (leapMonth <= 0) {
      leapMonth += 12;
    }
  }

  let off = lunarMonth - 11;
  if (off < 0) {
    off += 12;
  }

  if (leapOff > 0 && (lunarMonth > leapMonth || (lunarLeap && lunarMonth === leapMonth))) {
    off += 1;
  }

  const k = INT((a11 - 2415021.0769) / 29.53058868 + 0.5) + off;
  const monthStart = getNewMoonDay(k, timeZone);
  const solarJd = monthStart + lunarDay - 1;

  return jdToDate(solarJd);
}

/**
 * Get LunarDate object for a JS Date object.
 */
export function getLunarDate(date: Date): LunarDate {
  const dd = date.getDate();
  const mm = date.getMonth() + 1;
  const yyyy = date.getFullYear();

  const [day, month, year, leap] = convertSolar2Lunar(dd, mm, yyyy, 7);

  return {
    day,
    month,
    year,
    leap
  };
}

/**
 * Can Chi of Year
 */
export function getYearCanChi(lunarYear: number): string {
  const stemIdx = (lunarYear + 6) % 10;
  const branchIdx = (lunarYear + 8) % 12;
  return `${STEMS[(stemIdx + 10) % 10]} ${BRANCHES[(branchIdx + 12) % 12]}`;
}

/**
 * Can Chi of Month
 */
export function getMonthCanChi(lunarMonth: number, lunarYear: number): string {
  const yearStemIdx = ((lunarYear + 6) % 10 + 10) % 10;
  const monthStemIdx = (yearStemIdx * 2 + 2 + (lunarMonth - 1)) % 10;
  const monthBranchIdx = (lunarMonth + 1) % 12;
  return `${STEMS[monthStemIdx]} ${BRANCHES[monthBranchIdx]}`;
}

/**
 * Can Chi of Day
 */
export function getDayCanChi(date: Date): string {
  const dd = date.getDate();
  const mm = date.getMonth() + 1;
  const yyyy = date.getFullYear();
  const jd = jdFromDate(dd, mm, yyyy);

  const stemIdx = (jd + 9) % 10;
  const branchIdx = (jd + 1) % 12;

  return `${STEMS[stemIdx]} ${BRANCHES[branchIdx]}`;
}

export function getDayStemIndex(date: Date): number {
  const dd = date.getDate();
  const mm = date.getMonth() + 1;
  const yyyy = date.getFullYear();
  const jd = jdFromDate(dd, mm, yyyy);
  return (jd + 9) % 10;
}

export function getDayBranchIndex(date: Date): number {
  const dd = date.getDate();
  const mm = date.getMonth() + 1;
  const yyyy = date.getFullYear();
  const jd = jdFromDate(dd, mm, yyyy);
  return (jd + 1) % 12;
}

/**
 * Get 24 Solar Terms (Tiết khí)
 */
export function getSolarTerm(date: Date, timeZone = 7): string {
  const dd = date.getDate();
  const mm = date.getMonth() + 1;
  const yyyy = date.getFullYear();
  const jdn = jdFromDate(dd, mm, yyyy);

  const T = (jdn - 2451545.0 - timeZone / 24.0) / 36525.0;
  const dr = Math.PI / 180;
  const M = 357.52910 + 35999.05030 * T - 0.0001559 * T * T;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T * T;
  const DL = (1.914600 - 0.004817 * T) * Math.sin(M * dr)
           + (0.019993 - 0.000101 * T) * Math.sin(2 * M * dr)
           + 0.000290 * Math.sin(3 * M * dr);
  let L = L0 + DL;
  L = L - 360 * Math.floor(L / 360);

  const index = Math.floor(L / 15);
  const SOLAR_TERMS = [
    "Xuân Phân",
    "Thanh Minh",
    "Cốc Vũ",
    "Lập Hạ",
    "Tiểu Mãn",
    "Mang Chủng",
    "Hạ Chí",
    "Tiểu Thử",
    "Đại Thử",
    "Lập Thu",
    "Xử Thử",
    "Bạch Lộ",
    "Thu Phân",
    "Hàn Lộ",
    "Sương Giáng",
    "Lập Đông",
    "Tiểu Tuyết",
    "Đại Tuyết",
    "Đông Chí",
    "Tiểu Hàn",
    "Đại Hàn",
    "Lập Xuân",
    "Vũ Thủy",
    "Kinh Trập"
  ];
  return SOLAR_TERMS[index] || "Lập Xuân";
}

export function getDirections(date: Date) {
  const stemIndex = getDayStemIndex(date);
  return DIRECTION_MAP[stemIndex] || { hy: "Tây Nam", tai: "Chính Đông" };
}

export function getClashingSigns(date: Date): string {
  const branchIndex = getDayBranchIndex(date);
  const clashWithIndex = CLASH_MAP[branchIndex];
  const clashBranch = BRANCHES[clashWithIndex];
  const stemIdx = getDayStemIndex(date);
  const stems = [STEMS[(stemIdx + 2) % 10], STEMS[(stemIdx + 6) % 10]];
  return `${stems[0]} ${clashBranch}, ${stems[1]} ${clashBranch}`;
}

export function getAuspiciousHours(date: Date): string[] {
  const branchIndex = getDayBranchIndex(date);
  const auspiciousIndices = AUSPICIOUS_MAP[branchIndex] || [];
  return auspiciousIndices.map(idx => `${BRANCHES[idx]} (${BRANCH_HOURS[BRANCHES[idx]]})`);
}

export function getAuspiciousActivities(date: Date): { good: string[], bad: string[] } {
  const branchIndex = getDayBranchIndex(date);
  return ACTIVITY_MAP[branchIndex] || { good: ["Mọi việc"], bad: ["Không có"] };
}

export function isRitualDay(lunar: LunarDate): boolean {
  return lunar.day === 1 || lunar.day === 15;
}
