import React, { useState, useMemo } from 'react';
import { getLunarDate, convertLunar2Solar, getYearCanChi, getMonthCanChi, getDayCanChi, getSolarTerm, getLeapMonth, lunarMonthLength } from '../services/lunarCalendar';
import { Sun, Moon, ArrowRight, AlertTriangle } from 'lucide-react';
import { Card, Segmented, WEEKDAYS, lunarDayLabel } from './ui';
import { todayISO, parseISODate } from '../services/storage';

const DateConverter: React.FC<{ onOpenDay?: (d: Date) => void }> = ({ onOpenDay }) => {
  const [mode, setMode] = useState<'s2l' | 'l2s'>('s2l');
  const [solarStr, setSolarStr] = useState<string>(todayISO());
  const t = getLunarDate(new Date());
  const [lDay, setLDay] = useState(t.day);
  const [lMonth, setLMonth] = useState(t.month);
  const [lYear, setLYear] = useState(t.year);
  const [lLeap, setLLeap] = useState(t.leap);

  const solar = parseISODate(solarStr);
  const s2l = useMemo(() => {
    if (!solar) return null;
    const lunar = getLunarDate(solar);
    return { lunar, year: getYearCanChi(lunar.year), month: getMonthCanChi(lunar.month, lunar.year), day: getDayCanChi(solar), term: getSolarTerm(solar), len: lunarMonthLength(lunar.month, lunar.year, lunar.leap) };
  }, [solarStr]);

  const yearOk = lYear >= 1900 && lYear <= 2099;
  const leapMonth = yearOk ? getLeapMonth(lYear) : 0;
  const monthLen = yearOk && (!lLeap || leapMonth === lMonth) ? lunarMonthLength(lMonth, lYear, lLeap) : 0;

  const l2s = useMemo(() => {
    if (!yearOk) return { error: 'Năm âm lịch cần trong khoảng 1900–2099.' };
    if (lLeap && leapMonth !== lMonth) return { error: leapMonth ? `Năm ${lYear} chỉ nhuận tháng ${leapMonth}.` : `Năm ${lYear} không có tháng nhuận.` };
    if (lDay > monthLen) return { error: `Tháng ${lMonth}${lLeap ? ' nhuận' : ''} năm ${lYear} là tháng thiếu (29 ngày), không có ngày 30.` };
    const [d, m, y] = convertLunar2Solar(lDay, lMonth, lYear, lLeap);
    if (!d) return { error: 'Ngày âm lịch không hợp lệ.' };
    const date = new Date(y, m - 1, d);
    return { date, year: getYearCanChi(lYear), month: getMonthCanChi(lMonth, lYear), day: getDayCanChi(date), term: getSolarTerm(date) };
  }, [lDay, lMonth, lYear, lLeap, leapMonth, monthLen, yearOk]);

  const field = 'w-full bg-giay border border-giay-200 rounded-2xl p-3 font-semibold text-muc focus:outline-none focus:ring-2 focus:ring-son-200';

  return (
    <div className="space-y-4">
      <Segmented<"s2l" | "l2s"> value={mode} onChange={setMode} options={[{ value: 's2l', label: 'Dương → Âm', icon: <Sun size={16} /> }, { value: 'l2s', label: 'Âm → Dương', icon: <Moon size={16} /> }]} />

      {mode === 's2l' ? (
        <>
          <Card>
            <label htmlFor="solar-in" className="text-xs font-bold uppercase tracking-wider text-kim-700 flex items-center gap-1.5 mb-2"><Sun size={14} /> Ngày dương lịch</label>
            <input id="solar-in" type="date" value={solarStr} onChange={(e) => setSolarStr(e.target.value)} className={`${field} text-lg`} />
          </Card>
          {s2l && solar && (
            <div className="bg-gradient-to-br from-son-600 to-son-800 rounded-3xl p-6 shadow-xl text-white animate-slide-up">
              <div className="text-xs font-bold uppercase tracking-wider text-son-100 flex items-center gap-1.5 mb-2"><Moon size={14} /> Âm lịch</div>
              <div className="font-serif text-3xl font-bold">{lunarDayLabel(s2l.lunar.day) === String(s2l.lunar.day) ? `Ngày ${s2l.lunar.day}` : lunarDayLabel(s2l.lunar.day)} tháng {s2l.lunar.month}{s2l.lunar.leap ? ' nhuận' : ''}</div>
              <div className="text-son-100 font-medium mt-1">Năm {s2l.year} ({s2l.lunar.year}) · Tháng {s2l.len === 30 ? 'đủ' : 'thiếu'}</div>
              <div className="pt-4 mt-4 border-t border-white/20 grid grid-cols-3 gap-2 text-center">
                {[['Tháng', s2l.month], ['Ngày', s2l.day], ['Tiết khí', s2l.term]].map(([k, v]) => (
                  <div key={k} className="bg-white/10 p-2.5 rounded-2xl"><span className="text-[0.6875rem] text-white/70 block uppercase font-bold">{k}</span><span className="text-sm font-semibold">{v}</span></div>
                ))}
              </div>
              {onOpenDay && <button onClick={() => onOpenDay(solar)} className="mt-4 w-full py-2.5 rounded-2xl bg-white/15 font-bold flex items-center justify-center gap-1.5">Xem ngày tốt xấu <ArrowRight size={16} /></button>}
            </div>
          )}
        </>
      ) : (
        <>
          <Card className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-son-600 flex items-center gap-1.5"><Moon size={14} /> Ngày âm lịch</div>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-xs font-semibold text-gray-500">Ngày
                <select value={lDay} onChange={(e) => setLDay(+e.target.value)} className={`${field} mt-1`}>
                  {Array.from({ length: 30 }, (_, i) => <option key={i} value={i + 1}>{i + 1 <= 10 ? `Mùng ${i + 1}` : i + 1}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-gray-500">Tháng
                <select value={lMonth} onChange={(e) => setLMonth(+e.target.value)} className={`${field} mt-1`}>
                  {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>Tháng {i + 1}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-gray-500">Năm
                <input type="number" inputMode="numeric" value={lYear} min={1900} max={2099} onChange={(e) => setLYear(parseInt(e.target.value, 10) || 0)} className={`${field} mt-1`} />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input type="checkbox" checked={lLeap} onChange={(e) => setLLeap(e.target.checked)} className="w-5 h-5 accent-son-600" />
              Tháng nhuận {yearOk && <span className="text-gray-500 font-normal">({leapMonth ? `năm ${lYear} nhuận tháng ${leapMonth}` : `năm ${lYear} không nhuận`})</span>}
            </label>
          </Card>
          {'error' in l2s ? (
            <div className="p-4 rounded-3xl bg-son-50 border border-red-100 text-son-700 font-semibold text-sm flex gap-2" role="alert"><AlertTriangle size={18} className="shrink-0" />{l2s.error}</div>
          ) : (
            <div className="bg-gradient-to-br from-kim-500 to-kim-700 rounded-3xl p-6 shadow-xl text-white animate-slide-up">
              <div className="text-xs font-bold uppercase tracking-wider text-kim-100 flex items-center gap-1.5 mb-2"><Sun size={14} /> Dương lịch</div>
              <div className="font-serif text-3xl font-bold">{WEEKDAYS[l2s.date.getDay()]}, {l2s.date.toLocaleDateString('vi-VN')}</div>
              <div className="text-kim-100 font-medium mt-1">Âm lịch: {lunarDayLabel(lDay) === String(lDay) ? `ngày ${lDay}` : lunarDayLabel(lDay).toLowerCase()} tháng {lMonth}{lLeap ? ' nhuận' : ''} năm {l2s.year}</div>
              <div className="pt-4 mt-4 border-t border-white/20 grid grid-cols-3 gap-2 text-center">
                {[['Tháng', l2s.month], ['Ngày', l2s.day], ['Tiết khí', l2s.term]].map(([k, v]) => (
                  <div key={k} className="bg-white/10 p-2.5 rounded-2xl"><span className="text-[0.6875rem] text-white/75 block uppercase font-bold">{k}</span><span className="text-sm font-semibold">{v}</span></div>
                ))}
              </div>
              {onOpenDay && <button onClick={() => onOpenDay(l2s.date)} className="mt-4 w-full py-2.5 rounded-2xl bg-white/15 font-bold flex items-center justify-center gap-1.5">Xem ngày tốt xấu <ArrowRight size={16} /></button>}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DateConverter;
