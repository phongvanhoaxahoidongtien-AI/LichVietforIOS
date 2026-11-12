import React, { useState, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, CalendarDays } from 'lucide-react';
import { getDayInfo, evaluateActivity, ACTIVITIES, type ActivityKey, verdictOf } from '../services/almanac';
import { getYearCanChi, getLunarDate } from '../services/lunarCalendar';
import { useApp } from '../context';
import { Card, VerdictBadge, VERDICT_STYLE, WEEKDAYS, TRUC_STYLE, TrucBadge, Sheet } from './ui';
import TrucGuide from './TrucGuide';

interface MonthCalendarProps {
  date: Date;
  onDateSelect: (d: Date) => void;
  onOpenDetail: (d: Date) => void;
}

const HOLIDAYS_SOLAR: Record<string, string> = {
  '1-1': 'Tết Dương lịch', '3-2': 'Thành lập Đảng', '8-3': 'Quốc tế Phụ nữ', '30-4': 'Giải phóng miền Nam',
  '1-5': 'Quốc tế Lao động', '19-5': 'Sinh nhật Bác', '1-6': 'Quốc tế Thiếu nhi', '27-7': 'Thương binh Liệt sĩ',
  '2-9': 'Quốc khánh', '20-10': 'Phụ nữ Việt Nam', '20-11': 'Nhà giáo Việt Nam', '22-12': 'Quân đội Nhân dân',
};
const HOLIDAYS_LUNAR: Record<string, string> = {
  '1-1': 'Tết Nguyên đán', '15-1': 'Rằm tháng Giêng', '3-3': 'Tết Hàn thực', '10-3': 'Giỗ Tổ Hùng Vương',
  '15-4': 'Lễ Phật đản', '5-5': 'Tết Đoan ngọ', '15-7': 'Vu Lan', '15-8': 'Tết Trung thu', '23-12': 'Ông Công Ông Táo',
};

export function holidayOf(d: Date): string | null {
  const l = getLunarDate(d);
  return HOLIDAYS_SOLAR[`${d.getDate()}-${d.getMonth() + 1}`] || (!l.leap && HOLIDAYS_LUNAR[`${l.day}-${l.month}`]) || null;
}

const MonthCalendar: React.FC<MonthCalendarProps> = ({ date, onDateSelect, onOpenDetail }) => {
  const { person, settings, updateSettings } = useApp();
  const showTruc = settings.showTruc !== false;
  const [guide, setGuide] = useState(false);
  const [view, setView] = useState(new Date(date.getFullYear(), date.getMonth(), 1));
  const [picked, setPicked] = useState<Date>(date);
  const [act, setAct] = useState<ActivityKey | ''>('');
  const touch = useRef<number | null>(null);

  const year = view.getFullYear(), month = view.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = (new Date(year, month, 1).getDay() + 6) % 7; // tuần bắt đầu từ thứ Hai
  const changeMonth = (o: number) => setView(new Date(year, month + o, 1));

  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month, i + 1);
    const info = getDayInfo(d);
    const r = act ? evaluateActivity(info, act, person || undefined) : null;
    return { d, info, score: r ? (r.blocked ? Math.min(r.score, 29) : r.score) : info.score, blocked: r?.blocked ?? false, holiday: holidayOf(d) };
  }), [year, month, daysInMonth, act, person]);

  const lunarStart = getLunarDate(new Date(year, month, 1));
  const lunarEnd = getLunarDate(new Date(year, month, daysInMonth));
  const pickedInfo = getDayInfo(picked);
  const pickedEval = act ? evaluateActivity(pickedInfo, act, person || undefined) : null;
  const today = new Date().toDateString();

  return (
    <div className="p-4 pb-8 space-y-4"
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { if (touch.current == null) return; const dx = e.changedTouches[0].clientX - touch.current; touch.current = null; if (Math.abs(dx) > 80) changeMonth(dx < 0 ? 1 : -1); }}>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-serif text-2xl font-bold text-muc">Tháng {month + 1}, {year}</h2>
          <p className="text-xs text-gray-500 font-semibold">
            Âm lịch: tháng {lunarStart.month}{lunarStart.leap ? 'N' : ''}{lunarEnd.month !== lunarStart.month || lunarEnd.leap !== lunarStart.leap ? ` – ${lunarEnd.month}${lunarEnd.leap ? 'N' : ''}` : ''} năm {getYearCanChi(lunarEnd.year)}
          </p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => changeMonth(-1)} aria-label="Tháng trước" className="p-2.5 hover:bg-giay-100 rounded-full text-gray-600"><ChevronLeft size={20} /></button>
          <button onClick={() => { const n = new Date(); setView(new Date(n.getFullYear(), n.getMonth(), 1)); setPicked(new Date(n.getFullYear(), n.getMonth(), n.getDate())); }} className="px-3 text-sm font-bold text-son-600 hover:bg-son-50 rounded-full whitespace-nowrap">Hôm nay</button>
          <button onClick={() => changeMonth(1)} aria-label="Tháng sau" className="p-2.5 hover:bg-giay-100 rounded-full text-gray-600"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4" role="group" aria-label="Tô màu theo việc">
        <button onClick={() => setAct('')} className={`px-3.5 py-1.5 rounded-full text-sm font-bold whitespace-nowrap border ${act === '' ? 'bg-son-600 text-white border-son-600' : 'bg-white text-gray-600 border-giay-200'}`}>Chung</button>
        {ACTIVITIES.map((a) => (
          <button key={a.key} onClick={() => setAct(a.key)} className={`px-3.5 py-1.5 rounded-full text-sm font-bold whitespace-nowrap border ${act === a.key ? 'bg-son-600 text-white border-son-600' : 'bg-white text-gray-600 border-giay-200'}`}>{a.short}</button>
        ))}
      </div>

      <Card className="!p-3">
        <div className="grid grid-cols-7 gap-1" role="grid">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((wd, i) => (
            <div key={wd} className={`text-center py-1.5 text-xs font-bold ${i === 6 ? 'text-son-500' : 'text-gray-400'}`}>{wd}</div>
          ))}
          {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
          {days.map(({ d, info, score, blocked, holiday }) => {
            const v = verdictOf(score);
            const isPicked = d.toDateString() === picked.toDateString();
            const isToday = d.toDateString() === today;
            const l = info.lunar;
            const showMonth = l.day === 1;
            return (
              <button key={d.getDate()} onClick={() => setPicked(d)} onDoubleClick={() => onDateSelect(d)}
                aria-label={`${d.getDate()} tháng ${month + 1}, âm ${l.day}/${l.month}, Trực ${info.truc.name}, ${blocked ? 'phạm ngày kỵ' : v}${holiday ? ', ' + holiday : ''}`}
                aria-pressed={isPicked}
                className={`relative flex flex-col items-center justify-center rounded-xl ${showTruc ? 'h-[4.4rem]' : 'h-[3.6rem]'} transition-all ${isPicked ? 'bg-son-600 text-white shadow-md scale-105 z-10' : isToday ? 'bg-son-50 ring-1 ring-son-200' : 'hover:bg-giay-100'}`}>
                <span className={`text-base font-bold leading-none ${isPicked ? '' : d.getDay() === 0 || holiday ? 'text-son-600' : 'text-muc'}`}>{d.getDate()}</span>
                <span className={`text-[0.625rem] leading-tight mt-0.5 ${isPicked ? 'text-white/85' : showMonth || l.day === 15 ? 'text-son-600 font-bold' : 'text-gray-500'}`}>
                  {showMonth ? `1/${l.month}${l.leap ? 'N' : ''}` : l.day}
                </span>
                {showTruc && <span data-testid="cell-truc" className={`text-[0.5625rem] leading-none mt-0.5 font-bold ${isPicked ? 'text-white/90' : TRUC_STYLE[info.truc.tone].text}`}>{info.truc.name}</span>}
                <span className={`mt-1 w-1.5 h-1.5 rounded-full ${isPicked ? 'bg-white' : VERDICT_STYLE[v].dot} ${v === 'Bình thường' && !isPicked ? 'opacity-0' : ''}`} />
                {info.than.hoangDao && !isPicked && <span className="absolute top-1 right-1 w-1 h-1 rounded-full bg-kim-500" />}
                {holiday && !isPicked && <span className="absolute top-1 left-1 w-1 h-1 rounded-full bg-son-500" />}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 px-1 text-[0.6875rem] text-gray-500 font-semibold">
          <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-green-600" />Rất tốt</span>
          <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-emerald-500" />Tốt</span>
          <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-son-400" />Xấu</span>
          <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-son-700" />Rất xấu / kỵ</span>
          <span className="flex items-center gap-1"><i className="w-1.5 h-1.5 rounded-full bg-kim-500" />Hoàng đạo</span>
          <span className="flex items-center gap-1"><i className="w-1.5 h-1.5 rounded-full bg-son-500" />Ngày lễ</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-2 px-1 text-[0.6875rem] font-semibold">
          <span className="flex flex-wrap gap-x-2.5 text-gray-500">
            {showTruc && <><span>Trực:</span><b className={TRUC_STYLE.tot.text}>tốt</b><b className={TRUC_STYLE.binh.text}>bình hòa</b><b className={TRUC_STYLE.xau.text}>xấu</b></>}
            <button type="button" onClick={() => setGuide(true)} className="underline text-blue-700">12 Trực là gì?</button>
          </span>
          <button type="button" onClick={() => updateSettings({ showTruc: !showTruc })} data-testid="toggle-truc" aria-pressed={showTruc}
            className={`px-2.5 py-1 rounded-full border whitespace-nowrap ${showTruc ? 'bg-son-600 text-white border-son-600' : 'bg-white text-gray-600 border-giay-200'}`}>
            {showTruc ? 'Ẩn Trực' : 'Hiện Trực'}
          </button>
        </div>
      </Card>

      {/* Ngày đang chọn */}
      <Card className="animate-slide-up" key={picked.toDateString()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{WEEKDAYS[picked.getDay()]}</div>
            <div className="font-serif text-xl font-bold text-muc">{picked.toLocaleDateString('vi-VN')}</div>
            <div className="text-sm text-gray-600">Âm lịch {pickedInfo.lunar.day}/{pickedInfo.lunar.month}{pickedInfo.lunar.leap ? ' nhuận' : ''} · Ngày {pickedInfo.canChi.day}</div>
            {holidayOf(picked) && <div className="text-sm font-bold text-son-600 mt-0.5">{holidayOf(picked)}</div>}
          </div>
          <VerdictBadge verdict={pickedEval ? (pickedEval.blocked ? 'Rất xấu' : pickedEval.verdict) : pickedInfo.verdict} score={pickedEval ? pickedEval.score : pickedInfo.score} />
        </div>
        <p className="mt-3 text-sm text-gray-700">
          {pickedInfo.than.name} {pickedInfo.than.hoangDao ? 'Hoàng đạo' : 'Hắc đạo'} · Sao {pickedInfo.sao28.name}
          {pickedInfo.kyDays.length > 0 && <span className="text-son-600 font-semibold"> · Phạm {pickedInfo.kyDays.map((k) => k.name).join(', ')}</span>}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <TrucBadge name={pickedInfo.truc.name} tone={pickedInfo.truc.tone} onClick={() => setGuide(true)} />
          <span className="text-xs text-gray-600">{pickedInfo.truc.meaning}</span>
        </div>
        {pickedEval && (
          <p className="mt-1 text-sm font-semibold text-gray-700">
            {ACTIVITIES.find((a) => a.key === act)?.short}: {pickedEval.blocked ? <span className="text-son-600">nên tránh</span> : pickedEval.verdict.toLowerCase()}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button onClick={() => onDateSelect(picked)} className="py-2.5 rounded-2xl border border-giay-200 font-bold text-gray-700 flex items-center justify-center gap-1.5"><CalendarDays size={16} /> Tờ lịch</button>
          <button onClick={() => onOpenDetail(picked)} className="py-2.5 rounded-2xl bg-son-600 text-white font-bold flex items-center justify-center gap-1.5">Chi tiết <ArrowRight size={16} /></button>
        </div>
      </Card>
      <Sheet open={guide} onClose={() => setGuide(false)} title="12 Trực" subtitle="Ý nghĩa, việc nên làm và kiêng kỵ">
        <TrucGuide current={pickedInfo.truc.index} />
      </Sheet>
    </div>
  );
};

export default MonthCalendar;
