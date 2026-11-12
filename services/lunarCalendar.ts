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
  // Bản gốc Hồ Ngọc Đức: lấy thời điểm 0 giờ địa phương (jdn - 0.5 - timeZone/24). Bản cũ thiếu -0.5.
  const T = (jdn - 0.5 - timeZone / 24.0 - 2451545.0) / 36525.0;
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

/**
 * Vị trí (tính từ tháng 11 âm) của tháng nhuận: tháng đầu tiên không chứa trung khí.
 * Sửa lỗi bản cũ: vòng lặp trả về i thay vì i - 1 nên tháng nhuận bị lùi 1 tháng.
 * Theo thuật toán gốc của Hồ Ngọc Đức.
 */
function getLeapMonthOffset(a11: number, timeZone = 7): number {
  const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  } while (arc !== last && i < 14);
  return i - 1;
}

/** Kinh độ Mặt Trời (độ, 0–360) tại thời điểm 0 giờ (giờ địa phương) của ngày có số ngày Julius jdn. */
export function sunLongitudeDeg(jdn: number, timeZone = 7): number {
  const T = (jdn - 0.5 - timeZone / 24 - 2451545.0) / 36525.0;
  const T2 = T * T;
  const dr = Math.PI / 180;
  const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  const DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(M * dr)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * M * dr)
    + 0.000290 * Math.sin(3 * M * dr);
  // Hiệu chỉnh quang sai và chương động (gần đúng)
  const omega = 125.04 - 1934.136 * T;
  let L = L0 + DL - 0.00569 - 0.00478 * Math.sin(omega * dr);
  L = L - 360 * Math.floor(L / 360);
  return L;
}

/** Kinh độ Mặt Trời cuối ngày (= 0 giờ ngày hôm sau). Ngày có tiết khí bắt đầu được tính theo tiết mới. */
export function sunLongitudeEndOfDay(date: Date): number {
  return sunLongitudeDeg(jdFromDate(date.getDate(), date.getMonth() + 1, date.getFullYear()) + 1);
}

/**
 * Convert Solar Date (dd, mm, yyyy) to Vietnamese Lunar Date.
 * Timezone defaults to 7 (Vietnam UTC+7).
 */
export function convertSolar2Lunar(dd: number, mm: number, yyyy: number, timeZone = 7): [number, number, number, boolean] {
  const dayNumber = jdFromDate(dd, mm, yyyy);
  let k = INT((dayNumber - 2415021.076998695) / 29.530588853) + 1;
  let monthStart = getNewMoonDay(k, timeZone);
  // Lùi đến khi điểm sóc không vượt quá ngày cần đổi (tránh ngày âm = 0 ở các năm xa, vd 9/4/2062)
  while (monthStart > dayNumber) {
    k--;
    monthStart = getNewMoonDay(k, timeZone);
  }
  // Tiến nếu còn điểm sóc khác trước/bằng ngày cần đổi
  while (getNewMoonDay(k + 1, timeZone) <= dayNumber) {
    k++;
    monthStart = getNewMoonDay(k, timeZone);
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
    lunarYear -= 1; // bản cũ ghi lunarYear = yyyy - 1 làm tháng 11, 12 âm cuối năm dương bị lùi 1 năm
  }

  return [lunarDay, lunarMonth, lunarYear, lunarLeap];
}

/**
 * Đổi ngày âm lịch Việt Nam sang dương lịch [dd, mm, yyyy].
 * Viết lại theo đúng thuật toán Hồ Ngọc Đức (bản cũ thiếu nhánh tháng 11, 12 và xử lý tháng nhuận chưa đúng).
 * Trả về [0, 0, 0] nếu tháng nhuận không tồn tại trong năm đó.
 */
export function convertLunar2Solar(
  lunarDay: number,
  lunarMonth: number,
  lunarYear: number,
  lunarLeap: boolean = false,
  timeZone = 7
): [number, number, number] {
  let a11: number, b11: number;
  if (lunarMonth < 11) {
    a11 = getLunarMonth11(lunarYear - 1, timeZone);
    b11 = getLunarMonth11(lunarYear, timeZone);
  } else {
    a11 = getLunarMonth11(lunarYear, timeZone);
    b11 = getLunarMonth11(lunarYear + 1, timeZone);
  }
  const k = INT(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = lunarMonth - 11;
  if (off < 0) off += 12;
  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11, timeZone);
    let leapMonth = leapOff - 2;
    if (leapMonth < 0) leapMonth += 12;
    if (lunarLeap && lunarMonth !== leapMonth) return [0, 0, 0];
    if (lunarLeap || off >= leapOff) off += 1;
  } else if (lunarLeap) {
    return [0, 0, 0];
  }
  const monthStart = getNewMoonDay(k + off, timeZone);
  return jdToDate(monthStart + lunarDay - 1);
}

/** Tháng nhuận của năm âm lịch (0 nếu không nhuận). */
export function getLeapMonth(lunarYear: number, timeZone = 7): number {
  for (let m = 1; m <= 12; m++) {
    const [d, mm, y] = convertLunar2Solar(1, m, lunarYear, true, timeZone);
    if (!d) continue;
    const l = convertSolar2Lunar(d, mm, y, timeZone);
    if (l[1] === m && l[2] === lunarYear && l[3]) return m;
  }
  return 0;
}

/** Số ngày của tháng âm (29 hoặc 30). */
export function lunarMonthLength(lunarMonth: number, lunarYear: number, leap = false): number {
  const [d, m, y] = convertLunar2Solar(1, lunarMonth, lunarYear, leap);
  if (!d) return 0;
  const jd = jdFromDate(d, m, y);
  const [d2, m2, y2] = jdToDate(jd + 29);
  const l = convertSolar2Lunar(d2, m2, y2);
  return l[0] === 1 ? 29 : 30;
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
export const SOLAR_TERMS = [
  "Xuân phân", "Thanh minh", "Cốc vũ", "Lập hạ", "Tiểu mãn", "Mang chủng",
  "Hạ chí", "Tiểu thử", "Đại thử", "Lập thu", "Xử thử", "Bạch lộ",
  "Thu phân", "Hàn lộ", "Sương giáng", "Lập đông", "Tiểu tuyết", "Đại tuyết",
  "Đông chí", "Tiểu hàn", "Đại hàn", "Lập xuân", "Vũ thủy", "Kinh trập"
];

/** Tiết khí của ngày (ngày bắt đầu tiết được tính theo tiết mới). */
export function getSolarTerm(date: Date): string {
  return SOLAR_TERMS[Math.floor(sunLongitudeEndOfDay(date) / 15) % 24];
}

export function isRitualDay(lunar: LunarDate): boolean {
  return lunar.day === 1 || lunar.day === 15;
}
