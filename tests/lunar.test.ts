import { describe, it, expect } from 'vitest';
import { convertSolar2Lunar, convertLunar2Solar, jdFromDate, jdToDate, getDayCanChi, getYearCanChi, getMonthCanChi, getSolarTerm } from '../services/lunarCalendar';

const TET: string[] = [
  '1985-01-21','1990-01-27','1991-02-15','1992-02-04','1993-01-23','1994-02-10','1995-01-31','1996-02-19',
  '1997-02-07','1998-01-28','1999-02-16','2000-02-05','2001-01-24','2002-02-12','2003-02-01','2004-01-22',
  '2005-02-09','2006-01-29','2007-02-17','2008-02-07','2009-01-26','2010-02-14','2011-02-03','2012-01-23',
  '2013-02-10','2014-01-31','2015-02-19','2016-02-08','2017-01-28','2018-02-16','2019-02-05','2020-01-25',
  '2021-02-12','2022-02-01','2023-01-22','2024-02-10','2025-01-29','2026-02-17','2027-02-06','2028-01-26',
  '2029-02-13','2030-02-02',
];
const LEAP: Record<number, number> = { 2001: 4, 2004: 2, 2006: 7, 2009: 5, 2012: 4, 2014: 9, 2017: 6, 2020: 4, 2023: 2, 2025: 6, 2028: 5, 2031: 3, 2033: 11, 2036: 6 };

describe('Âm lịch Việt Nam (UTC+7)', () => {
  it('Ngày Tết Nguyên đán 1985–2030 đúng (kể cả 1985, 2007, 2030 khác Trung Quốc)', () => {
    for (const s of TET) {
      const [y, m, d] = s.split('-').map(Number);
      expect(convertSolar2Lunar(d, m, y), s).toEqual([1, 1, y, false]);
    }
  });

  it('Tháng nhuận đúng các năm 2001–2036', () => {
    const found: Record<number, number[]> = {};
    for (let jd = jdFromDate(1, 1, 2000); jd <= jdFromDate(31, 12, 2037); jd++) {
      const [d, m, y] = jdToDate(jd);
      const [ld, lm, ly, leap] = convertSolar2Lunar(d, m, y);
      if (leap && ld === 1) (found[ly] ||= []).push(lm);
    }
    for (const [y, m] of Object.entries(LEAP)) expect(found[+y], `năm ${y}`).toEqual([m]);
    for (const y of Object.keys(found)) expect(LEAP[+y], `năm ${y} không được nhuận`).toBeDefined();
  });

  it('Các ví dụ lỗi cũ nay đúng', () => {
    expect(convertSolar2Lunar(22, 3, 2023)).toEqual([1, 2, 2023, true]);
    expect(convertSolar2Lunar(20, 4, 2023)).toEqual([1, 3, 2023, false]);
    expect(convertSolar2Lunar(25, 7, 2025)).toEqual([1, 6, 2025, true]);
    expect(convertSolar2Lunar(23, 8, 2025)).toEqual([1, 7, 2025, false]);
    expect(convertSolar2Lunar(23, 5, 2020)).toEqual([1, 4, 2020, true]);
    expect(convertSolar2Lunar(2, 11, 2026)).toEqual([24, 9, 2026, false]);
    expect(convertLunar2Solar(1, 6, 2025, true)).toEqual([25, 7, 2025]);
    expect(convertLunar2Solar(1, 6, 2025, false)).toEqual([25, 6, 2025]);
  });

  it('Khứ hồi dương → âm → dương mọi ngày 1900–2100, tháng âm liên tục', () => {
    let prev: number[] | null = null;
    for (let jd = jdFromDate(1, 1, 1900); jd <= jdFromDate(31, 12, 2100); jd++) {
      const [d, m, y] = jdToDate(jd);
      const [ld, lm, ly, leap] = convertSolar2Lunar(d, m, y);
      if (!(ld >= 1 && ld <= 30)) throw new Error(`Ngày âm sai ${d}/${m}/${y}: ${ld}`);
      const back = convertLunar2Solar(ld, lm, ly, leap);
      if (back[0] !== d || back[1] !== m || back[2] !== y) throw new Error(`Lệch ${d}/${m}/${y} -> ${ld}/${lm}/${ly}${leap ? 'N' : ''} -> ${back}`);
      if (prev && ld !== 1 && ld !== prev[0] + 1) throw new Error(`Nhảy ngày ${d}/${m}/${y}`);
      if (prev && ld === 1 && !(prev[0] === 29 || prev[0] === 30)) throw new Error(`Tháng âm ${prev[0]} ngày trước ${d}/${m}/${y}`);
      prev = [ld];
    }
  });

  it('Can chi đúng', () => {
    expect(getDayCanChi(new Date(2026, 10, 2))).toBe('Canh Thìn');
    expect(getDayCanChi(new Date(2026, 1, 11))).toBe('Bính Thìn');
    expect(getDayCanChi(new Date(2026, 5, 15))).toBe('Canh Thân');
    expect(getYearCanChi(2026)).toBe('Bính Ngọ');
    expect(getMonthCanChi(9, 2026)).toBe('Mậu Tuất');
    expect(getMonthCanChi(12, 2025)).toBe('Kỷ Sửu');
    expect(getMonthCanChi(6, 2026)).toBe('Ất Mùi');
  });

  it('Tiết khí', () => {
    expect(getSolarTerm(new Date(2026, 10, 2))).toBe('Sương giáng');
    expect(getSolarTerm(new Date(2026, 7, 11))).toBe('Lập thu');
    expect(getSolarTerm(new Date(2026, 7, 6))).toBe('Đại thử');
    expect(getSolarTerm(new Date(2026, 5, 15))).toBe('Mang chủng');
    expect(getSolarTerm(new Date(2026, 1, 11))).toBe('Lập xuân');
  });
});

describe('Đổi âm → dương và tháng nhuận', () => {
  it('Tháng nhuận không tồn tại trả về 0', () => {
    expect(convertLunar2Solar(1, 5, 2025, true)).toEqual([0, 0, 0]);
    expect(convertLunar2Solar(1, 3, 2026, true)).toEqual([0, 0, 0]);
  });
});

import { getLeapMonth, lunarMonthLength } from '../services/lunarCalendar';
describe('Tiện ích', () => {
  it('getLeapMonth', () => {
    expect(getLeapMonth(2025)).toBe(6); expect(getLeapMonth(2023)).toBe(2);
    expect(getLeapMonth(2033)).toBe(11); expect(getLeapMonth(2026)).toBe(0); expect(getLeapMonth(2028)).toBe(5);
  });
  it('lunarMonthLength', () => {
    const l = lunarMonthLength(9, 2026); expect(l === 29 || l === 30).toBe(true);
  });
});
