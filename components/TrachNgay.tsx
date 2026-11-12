import React, { useMemo, useState } from 'react';
import { Search, CalendarHeart, AlertTriangle, CheckCircle2, ChevronDown, ArrowRight, Users } from 'lucide-react';
import { ACT_DEF, findGoodDays, evaluateActivity, yearChecks, personInfo, DISCLAIMER, type ActivityKey, type Person, type PickResult } from '../services/almanac';
import { getLunarDate, getYearCanChi } from '../services/lunarCalendar';
import { useApp } from '../context';
import { Card, SectionTitle, VerdictBadge, WEEKDAYS } from './ui';
import PersonForm from './PersonForm';
import { ActivityPicker } from './Pickers';
import { todayISO, parseISODate } from '../services/storage';

type WeekendMode = 'all' | 'weekend' | 'weekday';

const TrachNgay: React.FC<{ onOpenDay: (d: Date) => void }> = ({ onOpenDay }) => {
  const { person, setPerson } = useApp();
  const today = new Date();
  const [act, setAct] = useState<ActivityKey>('cuoi-hoi');
  const [p2, setP2] = useState<Person | null>(null);
  const [from, setFrom] = useState(todayISO(today));
  const [to, setTo] = useState(todayISO(new Date(today.getFullYear(), today.getMonth() + 3, today.getDate())));
  const [weekend, setWeekend] = useState<WeekendMode>('all');
  const [results, setResults] = useState<PickResult[] | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actLabel = ACT_DEF[act].label;
  const fromD = parseISODate(from), toD = parseISODate(to);

  const years = useMemo(() => {
    if (!fromD || !toD) return [];
    const a = getLunarDate(fromD).year, b = getLunarDate(toD).year;
    const out: number[] = [];
    for (let y = a; y <= b && out.length < 3; y++) out.push(y);
    return out;
  }, [from, to]);

  const setRange = (months: number) => {
    const f = fromD || today;
    setTo(todayISO(new Date(f.getFullYear(), f.getMonth() + months, f.getDate())));
  };

  const run = () => {
    setError(null);
    if (!fromD || !toD) return setError('Vui lòng chọn khoảng ngày hợp lệ.');
    if (toD < fromD) return setError('Ngày kết thúc phải sau ngày bắt đầu.');
    if ((toD.getTime() - fromD.getTime()) / 86400000 > 366) return setError('Khoảng tìm tối đa 12 tháng.');
    let list = findGoodDays({ from: fromD, to: toD, act, person: person || undefined, minScore: 60, limit: 400 });
    if (weekend !== 'all') list = list.filter((x) => { const we = x.date.getDay() === 0 || x.date.getDay() === 6; return weekend === 'weekend' ? we : !we; });
    if (p2) {
      list = list
        .map((x) => {
          const r2 = evaluateActivity(x.info, act, p2);
          return r2.blocked ? null : { ...x, result: { ...x.result, score: Math.min(x.result.score, r2.score), reasons: [...x.result.reasons, ...r2.reasons.filter((r) => r.text.includes('tuổi')).map((r) => ({ ...r, text: `${r.text} (người thứ hai)` }))] } };
        })
        .filter((x): x is PickResult => !!x && x.result.score >= 60)
        .sort((a, b) => b.result.score - a.result.score);
    }
    setResults(list.slice(0, 40));
    setOpen(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle icon={<CalendarHeart size={18} />} title="Chọn ngày tốt (trạch nhật)" />
        <div className="space-y-4">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Việc cần làm</div>
            <ActivityPicker value={act} onChange={(k) => { setAct(k); setResults(null); }} />
          </div>

          <PersonForm value={person} onChange={(p) => { setPerson(p); setResults(null); }} label={ACT_DEF[act].base === 'cuoi-hoi' ? 'Năm sinh âm lịch (cô dâu)' : 'Năm sinh âm lịch (gia chủ / người làm)'} />
          {ACT_DEF[act].base === 'cuoi-hoi' && (
            <PersonForm value={p2} onChange={(p) => { setP2(p); setResults(null); }} label="Năm sinh chú rể (không bắt buộc)" />
          )}

          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Khoảng thời gian</div>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setResults(null); }} aria-label="Từ ngày" className="bg-giay border border-giay-200 rounded-2xl px-3 py-2.5 font-semibold text-muc" />
              <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setResults(null); }} aria-label="Đến ngày" className="bg-giay border border-giay-200 rounded-2xl px-3 py-2.5 font-semibold text-muc" />
            </div>
            <div className="flex gap-2 mt-2">
              {[1, 3, 6, 12].map((m) => <button key={m} onClick={() => { setRange(m); setResults(null); }} className="flex-1 py-1.5 rounded-xl bg-giay-100 text-sm font-bold text-gray-600">{m} tháng</button>)}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ngày trong tuần</div>
            <div className="flex gap-2">
              {([['all', 'Tất cả'], ['weekend', 'Thứ Bảy, CN'], ['weekday', 'Ngày thường']] as [WeekendMode, string][]).map(([v, l]) => (
                <button key={v} onClick={() => { setWeekend(v); setResults(null); }} aria-pressed={weekend === v} className={`flex-1 py-2 rounded-xl text-sm font-bold border ${weekend === v ? 'bg-son-50 border-son-200 text-son-700' : 'bg-white border-giay-200 text-gray-600'}`}>{l}</button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm font-semibold text-son-600" role="alert">{error}</p>}
          <button onClick={run} className="w-full py-3.5 rounded-2xl bg-son-600 text-white font-bold flex items-center justify-center gap-2 active:scale-[.98] transition-transform shadow-md">
            <Search size={18} /> Tìm ngày tốt
          </button>
        </div>
      </Card>

      {/* Xét tuổi theo năm */}
      {person && years.length > 0 && ACT_DEF[act].years.length > 0 && (
        <Card>
          <SectionTitle icon={<Users size={18} />} tone="kim" title={`Xét tuổi ${personInfo(person).canChi} theo năm`} />
          <div className="space-y-3">
            {years.map((y) => {
              const checks = yearChecks(person, y, act);
              const bad = checks.filter((c) => c.bad);
              return (
                <div key={y} className={`p-3 rounded-2xl border ${bad.length ? 'bg-son-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                  <div className="font-bold text-sm text-muc flex items-center gap-1.5 mb-1">
                    {bad.length ? <AlertTriangle size={14} className="text-son-600" /> : <CheckCircle2 size={14} className="text-green-700" />}
                    Năm âm lịch {y} ({getYearCanChi(y)})
                  </div>
                  <ul className="space-y-0.5">
                    {checks.map((c) => <li key={c.name} className={`text-sm ${c.bad ? 'text-son-700 font-semibold' : 'text-gray-700'}`}><b>{c.name}:</b> {c.note}</li>)}
                  </ul>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {results && (
        <Card>
          <SectionTitle icon={<CheckCircle2 size={18} />} tone="green" title={`${results.length ? results.length : 'Không có'} ngày tốt cho ${actLabel.toLowerCase()}`} />
          {results.length === 0 && <p className="text-sm text-gray-600">Không tìm thấy ngày đạt từ mức "Tốt" trở lên. Hãy mở rộng khoảng thời gian hoặc chọn "Tất cả" các ngày trong tuần.</p>}
          <ul className="space-y-2">
            {results.map((x, i) => {
              const isOpen = open === i;
              const pos = x.result.reasons.filter((r) => r.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 3);
              return (
                <li key={x.info.jd} className="rounded-2xl border border-giay-200 bg-giay overflow-hidden">
                  <button className="w-full p-3 flex items-center gap-3 text-left" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}>
                    <div className="w-14 text-center shrink-0">
                      <div className="font-serif text-2xl font-bold text-son-600 leading-none">{x.date.getDate()}</div>
                      <div className="text-[0.6875rem] font-bold text-gray-500">Th {x.date.getMonth() + 1}/{String(x.date.getFullYear()).slice(2)}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-muc">{WEEKDAYS[x.date.getDay()]} · âm {x.info.lunar.day}/{x.info.lunar.month}{x.info.lunar.leap ? 'N' : ''}</div>
                      <div className="text-xs text-gray-500 truncate">{x.info.canChi.day} · {x.info.than.name} · Trực {x.info.truc.name}</div>
                      <div className="mt-1"><VerdictBadge verdict={x.result.verdict} score={x.result.score} size="sm" /></div>
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {!isOpen && pos.length > 0 && <div className="px-3 pb-3 -mt-1 text-xs text-green-700 font-semibold truncate">{pos.map((r) => r.text).join(' · ')}</div>}
                  {isOpen && (
                    <div className="px-3 pb-3 space-y-2 animate-fade-in">
                      <ul className="space-y-1">
                        {x.result.reasons.map((r, k) => (
                          <li key={k} className="flex justify-between text-sm gap-3"><span className="text-gray-700">{r.text}</span><span className={`font-bold tabular-nums ${r.delta > 0 ? 'text-green-700' : 'text-son-600'}`}>{r.delta > 0 ? '+' : ''}{r.delta}</span></li>
                        ))}
                      </ul>
                      <p className="text-sm"><b className="text-kim-700">Giờ tốt:</b> <span className="text-gray-700">{x.result.goodHours.map((h) => `${h.branch} (${h.range})`).join(', ')}</span></p>
                      <button onClick={() => onOpenDay(x.date)} className="text-sm font-bold text-son-600 flex items-center gap-1">Xem chi tiết ngày <ArrowRight size={14} /></button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <p className="text-xs text-center text-gray-500 px-4 leading-relaxed">
        Cách chấm: Hoàng đạo/Hắc đạo, 12 Trực, 28 sao, các sao Ngọc Hạp; loại ngày Tam Nương, Nguyệt Kỵ, Dương Công, Sát Chủ, Thọ Tử và ngày xung khắc mạnh với tuổi. {DISCLAIMER}
      </p>
    </div>
  );
};

export default TrachNgay;
