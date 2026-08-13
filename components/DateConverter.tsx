import React, { useState, useMemo } from 'react';
import { 
  getLunarDate, 
  convertLunar2Solar, 
  getYearCanChi, 
  getMonthCanChi, 
  getDayCanChi, 
  getSolarTerm 
} from '../services/lunarCalendar';
import { ArrowRightLeft, Calendar, Sun, Moon } from 'lucide-react';

const DateConverter: React.FC = () => {
  const [mode, setMode] = useState<'solarToLunar' | 'lunarToSolar'>('solarToLunar');

  // Solar to Lunar state
  const [solarDateStr, setSolarDateStr] = useState<string>(new Date().toISOString().split('T')[0]);

  // Lunar to Solar state
  const todayLunar = getLunarDate(new Date());
  const [lunarDay, setLunarDay] = useState<number>(todayLunar.day);
  const [lunarMonth, setLunarMonth] = useState<number>(todayLunar.month);
  const [lunarYear, setLunarYear] = useState<number>(todayLunar.year);
  const [lunarLeap, setLunarLeap] = useState<boolean>(todayLunar.leap);

  // Computed results for Solar -> Lunar
  const currentSolarObj = useMemo(() => {
    const parts = solarDateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return new Date(y, m, d);
    }
    return new Date();
  }, [solarDateStr]);

  const solarToLunarResult = useMemo(() => {
    const lunar = getLunarDate(currentSolarObj);
    const yearCanChi = getYearCanChi(lunar.year);
    const monthCanChi = getMonthCanChi(lunar.month, lunar.year);
    const dayCanChi = getDayCanChi(currentSolarObj);
    const solarTerm = getSolarTerm(currentSolarObj);

    return {
      lunar,
      yearCanChi,
      monthCanChi,
      dayCanChi,
      solarTerm
    };
  }, [currentSolarObj]);

  // Computed results for Lunar -> Solar
  const lunarToSolarResult = useMemo(() => {
    try {
      const [sDay, sMonth, sYear] = convertLunar2Solar(lunarDay, lunarMonth, lunarYear, lunarLeap);
      const solarObj = new Date(sYear, sMonth - 1, sDay);
      
      const yearCanChi = getYearCanChi(lunarYear);
      const monthCanChi = getMonthCanChi(lunarMonth, lunarYear);
      const dayCanChi = getDayCanChi(solarObj);
      const solarTerm = getSolarTerm(solarObj);

      const dayOfWeekStr = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][solarObj.getDay()];

      return {
        sDay,
        sMonth,
        sYear,
        solarObj,
        dayOfWeekStr,
        yearCanChi,
        monthCanChi,
        dayCanChi,
        solarTerm
      };
    } catch {
      return null;
    }
  }, [lunarDay, lunarMonth, lunarYear, lunarLeap]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Đổi Ngày Âm Dương</h2>
        
        {/* Mode Selector */}
        <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
          <button
            onClick={() => setMode('solarToLunar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'solarToLunar' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Sun size={14} />
            Dương → Âm
          </button>
          <button
            onClick={() => setMode('lunarToSolar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'lunarToSolar' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Moon size={14} />
            Âm → Dương
          </button>
        </div>
      </div>

      {mode === 'solarToLunar' ? (
        <>
          {/* Input Box: Solar Date */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-3 text-amber-600">
              <Sun size={18} />
              <label className="text-xs font-bold uppercase tracking-widest">Ngày Dương Lịch</label>
            </div>
            <input 
              type="date" 
              value={solarDateStr}
              onChange={(e) => setSolarDateStr(e.target.value)}
              className="w-full text-xl font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
            />
          </div>

          <div className="flex justify-center mb-6">
            <div className="bg-red-50 p-3 rounded-full text-red-600 shadow-sm">
              <ArrowRightLeft size={24} />
            </div>
          </div>

          {/* Result Box: Lunar Date */}
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-3xl p-6 shadow-xl text-white">
            <div className="flex items-center gap-2 mb-3 text-red-100">
              <Moon size={18} />
              <label className="text-xs font-bold uppercase tracking-widest">Kết Quả Âm Lịch</label>
            </div>

            <div className="flex flex-col gap-1 mb-4">
              <span className="text-3xl font-extrabold">
                {solarToLunarResult.lunar.day <= 10 
                  ? `Mùng ${solarToLunarResult.lunar.day}` 
                  : solarToLunarResult.lunar.day === 15 
                  ? `Rằm (15)` 
                  : `Ngày ${solarToLunarResult.lunar.day}`} tháng {solarToLunarResult.lunar.month} {solarToLunarResult.lunar.leap ? '(Nhuận)' : ''}
              </span>
              <span className="text-lg text-red-100 font-medium">
                Năm {solarToLunarResult.yearCanChi} ({solarToLunarResult.lunar.year})
              </span>
            </div>

            <div className="pt-4 border-t border-white/20 grid grid-cols-3 gap-3 text-center">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl">
                <span className="text-[10px] text-white/60 block uppercase font-bold">Tháng Âm</span>
                <span className="text-sm font-semibold">{solarToLunarResult.monthCanChi}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl">
                <span className="text-[10px] text-white/60 block uppercase font-bold">Ngày Can Chi</span>
                <span className="text-sm font-semibold">{solarToLunarResult.dayCanChi}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl">
                <span className="text-[10px] text-white/60 block uppercase font-bold">Tiết Khí</span>
                <span className="text-sm font-semibold">{solarToLunarResult.solarTerm}</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Input Box: Lunar Date */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm mb-6 space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <Moon size={18} />
              <label className="text-xs font-bold uppercase tracking-widest">Chọn Ngày Âm Lịch</label>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Ngày (1 - 30)</label>
                <select 
                  value={lunarDay} 
                  onChange={(e) => setLunarDay(parseInt(e.target.value, 10))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {Array.from({ length: 30 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1 <= 10 ? `Mùng ${i + 1}` : `Ngày ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Tháng (1 - 12)</label>
                <select 
                  value={lunarMonth} 
                  onChange={(e) => setLunarMonth(parseInt(e.target.value, 10))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Tháng {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Năm</label>
                <input 
                  type="number"
                  value={lunarYear}
                  min={1900}
                  max={2100}
                  onChange={(e) => setLunarYear(parseInt(e.target.value, 10) || 2026)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input 
                type="checkbox"
                id="lunarLeapCheck"
                checked={lunarLeap}
                onChange={(e) => setLunarLeap(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
              />
              <label htmlFor="lunarLeapCheck" className="text-xs font-semibold text-gray-700 cursor-pointer">
                Là tháng nhuận (nếu có)
              </label>
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <div className="bg-red-50 p-3 rounded-full text-red-600 shadow-sm">
              <ArrowRightLeft size={24} />
            </div>
          </div>

          {/* Result Box: Solar Date */}
          {lunarToSolarResult && (
            <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-3xl p-6 shadow-xl text-white">
              <div className="flex items-center gap-2 mb-3 text-amber-100">
                <Sun size={18} />
                <label className="text-xs font-bold uppercase tracking-widest">Kết Quả Dương Lịch</label>
              </div>

              <div className="flex flex-col gap-1 mb-4">
                <span className="text-3xl font-extrabold">
                  {lunarToSolarResult.dayOfWeekStr}, {lunarToSolarResult.sDay}/{lunarToSolarResult.sMonth}/{lunarToSolarResult.sYear}
                </span>
                <span className="text-lg text-amber-100 font-medium">
                  Âm lịch: Mùng {lunarDay} tháng {lunarMonth} năm {lunarToSolarResult.yearCanChi}
                </span>
              </div>

              <div className="pt-4 border-t border-white/20 grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl">
                  <span className="text-[10px] text-white/70 block uppercase font-bold">Tháng Âm</span>
                  <span className="text-sm font-semibold">{lunarToSolarResult.monthCanChi}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl">
                  <span className="text-[10px] text-white/70 block uppercase font-bold">Ngày Can Chi</span>
                  <span className="text-sm font-semibold">{lunarToSolarResult.dayCanChi}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl">
                  <span className="text-[10px] text-white/70 block uppercase font-bold">Tiết Khí</span>
                  <span className="text-sm font-semibold">{lunarToSolarResult.solarTerm}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DateConverter;
