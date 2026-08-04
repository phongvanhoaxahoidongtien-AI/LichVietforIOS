
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

/**
 * Auspicious directions based on the Celestial Stem (Can) of the day.
 */
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

export function getLunarDate(date: Date): LunarDate {
  const timeDiff = date.getTime() - new Date(2024, 0, 1).getTime();
  const dayOffset = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  
  const lunarDay = ((dayOffset + 20) % 30) + 1;
  const lunarMonth = ((Math.floor((dayOffset + 20) / 30) + 11) % 12) + 1;
  const lunarYear = date.getFullYear(); 
  
  return {
    day: lunarDay,
    month: lunarMonth,
    year: lunarYear,
    leap: false
  };
}

export function getDayBranchIndex(date: Date): number {
  const epoch = new Date(2024, 0, 1);
  const diffTime = date.getTime() - epoch.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return ((diffDays % 12) + 12) % 12;
}

export function getDayStemIndex(date: Date): number {
  const epoch = new Date(2024, 0, 1);
  const diffTime = date.getTime() - epoch.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return ((diffDays % 10) + 10) % 10;
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
