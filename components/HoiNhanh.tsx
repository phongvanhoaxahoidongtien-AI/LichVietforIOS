import React, { useMemo, useState, useEffect, useRef } from 'react';
import { MessageCircleQuestion, Sparkles, CalendarCheck, CalendarSearch, Plus, X, Users, Save, Heart, Trash2, Wand2, ArrowUpDown } from 'lucide-react';
import { ACT_DEF, getDayInfo, yearChecks, coupleMatch, personInfo, DISCLAIMER, type ActivityKey, type Person, type YearCheck } from '../services/almanac';
import { parseQuestion, type ParsedQuestion } from '../services/askParser';
import { getLunarDate } from '../services/lunarCalendar';
import { loadFamily, saveFamily, newId, type Member } from '../services/family';
import { todayISO, parseISODate } from '../services/storage';
import { useApp } from '../context';
import { Card, SectionTitle, Sheet, WEEKDAYS } from './ui';
import { ActivityPicker, YearSelect } from './Pickers';
import PersonalReportCard from './PersonalReportCard';
import { rememberAct } from './PersonalSection';
import { personalReport, type PersonView } from '../services/personal';

type Mode = 'check' | 'pick';
type DayChoice = 'today' | 'tomorrow' | 'after' | 'sat' | 'sun' | 'viewing' | 'custom';
type RangeChoice = 'this-month' | 'next-month' | '3m' | 'month' | 'custom';

interface Slot { key: string; label: string; year: number | null; gender?: 'nam' | 'nu'; memberName?: string }

const EXAMPLES = [
  'Tôi sinh năm 1980, ngày mai về nhà mới có tốt không?',
  'Tôi sinh 1980, vợ sinh 1982, nên cưới ngày nào tháng 11?',
  'Tuổi Ất Sửu, tháng này mua xe ngày nào tốt?',
  'Sinh 1972, động thổ xây nhà trong 3 tháng tới',
];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const fmt = (d: Date) => `${WEEKDAYS[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
const isWedding = (a: ActivityKey) => ACT_DEF[a].base === 'cuoi-hoi';

function nextWeekday(from: Date, wd: number) { return addDays(from, (wd - from.getDay() + 7) % 7); }

const HoiNhanh: React.FC<{ viewingDate: Date; onOpenDay: (d: Date) => void }> = ({ viewingDate, onOpenDay }) => {
  const { person, setPerson, toast } = useApp();
  const today = startOfDay(new Date());
  const [family, setFamily] = useState<Member[]>(() => loadFamily());
  const [text, setText] = useState('');
  const [understood, setUnderstood] = useState<ParsedQuestion | null>(null);
  const [mode, setMode] = useState<Mode>('check');
  const [act, setAct] = useState<ActivityKey>('nhap-trach');
  const [slots, setSlots] = useState<Slot[]>(() => [{ key: 'p1', label: 'Năm sinh người làm', year: family[0]?.birthYear ?? person?.birthYear ?? null, memberName: family[0]?.name }]);
  const [dayChoice, setDayChoice] = useState<DayChoice>(startOfDay(viewingDate).getTime() !== today.getTime() ? 'viewing' : 'tomorrow');
  const [customDay, setCustomDay] = useState(todayISO(addDays(today, 1)));
  const [rangeChoice, setRangeChoice] = useState<RangeChoice>('this-month');
  const [monthPick, setMonthPick] = useState(() => `${today.getFullYear()}-${today.getMonth() + 1}`);
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date; label: string } | null>(null);
  const [weekendOnly, setWeekendOnly] = useState(false);
  const [shown, setShown] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const [showFamily, setShowFamily] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Cưới hỏi: 2 ô chú rể, cô dâu; việc khác: người làm (+ thêm người)
  useEffect(() => {
    setSlots((prev) => {
      if (isWedding(act)) {
        if (prev.some((s) => s.key === 'groom')) return prev;
        const male = prev.find((s) => s.gender === 'nam') || prev[0];
        const female = prev.find((s) => s !== male && s.year != null);
        return [
          { key: 'groom', label: 'Chú rể sinh năm', year: male?.year ?? null, gender: 'nam', memberName: male?.memberName },
          { key: 'bride', label: 'Cô dâu sinh năm', year: female?.year ?? null, gender: 'nu', memberName: female?.memberName },
        ];
      }
      if (!prev.some((s) => s.key === 'groom')) return prev;
      return prev.filter((s) => s.year != null).map((s, i) => ({ ...s, key: `p${i + 1}`, label: i === 0 ? 'Năm sinh người làm' : 'Người thứ hai' }))
        .concat(prev.every((s) => s.year == null) ? [{ key: 'p1', label: 'Năm sinh người làm', year: null }] : []);
    });
  }, [act]);

  const people: Person[] = useMemo(() => slots.filter((s) => s.year != null).map((s) => ({ birthYear: s.year!, gender: s.gender })), [slots]);
  const peopleView: PersonView[] = useMemo(() => slots.filter((s) => s.year != null).map((s) => ({ birthYear: s.year!, gender: s.gender, name: s.memberName })), [slots]);
  const setOwnerGender = (g: 'nam' | 'nu') => {
    const first = slots.find((s) => s.year != null);
    if (!first) return;
    setSlots((p) => p.map((x) => (x.key === first.key ? { ...x, gender: g } : x)));
    if (first.memberName) { const f = family.map((m) => (m.name === first.memberName && m.birthYear === first.year ? { ...m, gender: g } : m)); setFamily(f); saveFamily(f); }
  };

  const checkDate: Date = useMemo(() => {
    switch (dayChoice) {
      case 'today': return today;
      case 'tomorrow': return addDays(today, 1);
      case 'after': return addDays(today, 2);
      case 'sat': return nextWeekday(today, 6);
      case 'sun': return nextWeekday(today, 0);
      case 'viewing': return startOfDay(viewingDate);
      default: return parseISODate(customDay) || today;
    }
  }, [dayChoice, customDay, viewingDate]);

  const monthOptions = useMemo(() => Array.from({ length: 13 }, (_, i) => { const d = new Date(today.getFullYear(), today.getMonth() + i, 1); return { v: `${d.getFullYear()}-${d.getMonth() + 1}`, l: `Tháng ${d.getMonth() + 1}/${d.getFullYear()}` }; }), []);

  const range = useMemo(() => {
    if (rangeChoice === 'custom' && customRange) return customRange;
    if (rangeChoice === 'this-month') return { from: today, to: new Date(today.getFullYear(), today.getMonth() + 1, 0), label: `tháng ${today.getMonth() + 1}/${today.getFullYear()}` };
    if (rangeChoice === 'next-month') { const f = new Date(today.getFullYear(), today.getMonth() + 1, 1); return { from: f, to: new Date(f.getFullYear(), f.getMonth() + 1, 0), label: `tháng ${f.getMonth() + 1}/${f.getFullYear()}` }; }
    if (rangeChoice === '3m') return { from: today, to: addDays(today, 90), label: '3 tháng tới' };
    const [y, m] = monthPick.split('-').map(Number);
    const f = new Date(y, m - 1, 1);
    return { from: f < today ? today : f, to: new Date(y, m, 0), label: `tháng ${m}/${y}` };
  }, [rangeChoice, monthPick, customRange]);

  /* ---------- Đọc câu hỏi gõ tay ---------- */
  const applyParsed = (q: ParsedQuestion) => {
    setUnderstood(q);
    if (q.act) setAct(q.act);
    if (q.mode) setMode(q.mode);
    const wedding = q.act ? isWedding(q.act) : isWedding(act);
    if (q.people.length) {
      const fromFamily = (y: number) => family.find((m) => m.birthYear === y)?.name;
      if (wedding) {
        const male = q.people.find((p) => p.gender === 'nam' || p.role === 'chú rể' || p.role === 'chồng');
        const female = q.people.find((p) => p !== male && (p.gender === 'nu' || p.role === 'cô dâu' || p.role === 'vợ')) || q.people.find((p) => p !== male);
        const m2 = male || q.people.find((p) => p !== female);
        setSlots([
          { key: 'groom', label: 'Chú rể sinh năm', year: m2?.birthYear ?? null, gender: 'nam', memberName: m2 ? fromFamily(m2.birthYear) : undefined },
          { key: 'bride', label: 'Cô dâu sinh năm', year: female?.birthYear ?? null, gender: 'nu', memberName: female ? fromFamily(female.birthYear) : undefined },
        ]);
      } else {
        setSlots(q.people.slice(0, 4).map((p, i) => ({ key: `p${i + 1}`, label: i === 0 ? 'Năm sinh người làm' : 'Người thứ ' + (i + 1), year: p.birthYear, gender: p.gender, memberName: fromFamily(p.birthYear) })));
      }
    }
    if (q.date) {
      const t = q.date.getTime();
      const map: [DayChoice, Date][] = [['today', today], ['tomorrow', addDays(today, 1)], ['after', addDays(today, 2)]];
      const hit = map.find(([, d]) => d.getTime() === t);
      if (hit) setDayChoice(hit[0]); else { setDayChoice('custom'); setCustomDay(todayISO(q.date)); }
    }
    if (q.range) { setRangeChoice('custom'); setCustomRange(q.range); }
    setWeekendOnly(q.weekendOnly);
    const miss = q.missing.filter((m) => !(m === 'năm sinh' && slots.some((s) => s.year != null)));
    setMissing(miss);
    setShown(miss.length === 0);
    if (miss.length === 0) setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const run = () => {
    const miss: string[] = [];
    if (!people.length) miss.push('năm sinh');
    if (mode === 'check' && dayChoice === 'custom' && !parseISODate(customDay)) miss.push('ngày cần xem');
    setMissing(miss);
    if (miss.length) { setShown(false); return; }
    setShown(true);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  /* ---------- Người trong nhà ---------- */
  const saveSlotToFamily = (s: Slot) => {
    if (s.year == null) return;
    const name = (window.prompt('Lưu vào người trong nhà với tên (VD: Tôi, Vợ, Con trai):', s.memberName || (s.key === 'bride' ? 'Cô dâu' : s.key === 'groom' ? 'Chú rể' : family.length ? 'Người nhà' : 'Tôi')) || '').trim();
    if (!name) return;
    const next = [...family.filter((m) => m.name !== name), { id: newId(), name, birthYear: s.year, gender: s.gender }];
    setFamily(next); saveFamily(next);
    setSlots((p) => p.map((x) => (x.key === s.key ? { ...x, memberName: name } : x)));
    toast(`Đã lưu "${name}" (${s.year}).`);
  };

  const setSlot = (key: string, year: number | null, m?: Member) => {
    setSlots((p) => p.map((x) => (x.key === key ? { ...x, year, memberName: m?.name, gender: x.key === 'groom' ? 'nam' : x.key === 'bride' ? 'nu' : m?.gender ?? x.gender } : x)));
    setShown(false);
  };

  const quickFill = (m: Member) => {
    setSlots((p) => {
      let idx = p.findIndex((x) => x.year == null && (!isWedding(act) || (x.key === 'groom' ? m.gender !== 'nu' : m.gender !== 'nam')));
      if (idx < 0) idx = p.findIndex((x) => x.year == null);
      if (idx < 0) {
        if (isWedding(act)) idx = m.gender === 'nu' ? 1 : 0;
        else if (p.length < 4) return [...p, { key: `p${p.length + 1}`, label: `Người thứ ${p.length + 1}`, year: m.birthYear, gender: m.gender, memberName: m.name }];
        else idx = 0;
      }
      return p.map((x, i) => (i === idx ? { ...x, year: m.birthYear, memberName: m.name, gender: x.key === 'groom' ? 'nam' : x.key === 'bride' ? 'nu' : m.gender } : x));
    });
    setShown(false);
  };

  /* ---------- Kết quả ---------- */
  const result = useMemo(() => {
    if (!shown || !people.length) return null;
    const def = ACT_DEF[act];
    const yearInfo = (lunarYear: number) => {
      const out: { who: string; checks: YearCheck[] }[] = [];
      const filled = slots.filter((s) => s.year != null);
      filled.forEach((s, i) => {
        let checks = yearChecks({ birthYear: s.year! }, lunarYear, act);
        if (isWedding(act) && s.key === 'groom') checks = checks.map((c) => (c.name === 'Kim Lâu' ? { ...c, bad: false, note: `${c.note.replace(/ Theo tục lệ.*$/, '')} (chỉ tham khảo – tục lệ xét Kim Lâu theo tuổi cô dâu)` } : c));
        if (checks.length && (i === 0 || isWedding(act) || def.years.includes('tamtai'))) out.push({ who: `${s.memberName || s.label.replace(' sinh năm', '').replace('Năm sinh ', '')} (${s.year}, ${personInfo({ birthYear: s.year! }).canChi})`, checks });
      });
      return out;
    };
    const couple = isWedding(act) && people.length >= 2 ? coupleMatch(people[0], people[1]) : null;

    if (mode === 'check') return { kind: 'check' as const, years: yearInfo(getLunarDate(checkDate).year), couple };
    const days: { d: Date; info: ReturnType<typeof getDayInfo>; r: { score: number; reasons: { text: string; delta: number }[]; goodHours: ReturnType<typeof getDayInfo>['hours'] } }[] = [];
    for (let d = new Date(range.from), n = 0; d <= range.to && n < 400; d = addDays(d, 1), n++) {
      if (weekendOnly && d.getDay() !== 0 && d.getDay() !== 6) continue;
      const info = getDayInfo(d);
      const rep = personalReport(d, act, peopleView, info);
      if (!rep.blocked && rep.score >= 60) days.push({ d, info, r: { score: rep.score, goodHours: rep.goodHours, reasons: (rep.level === 'nen' ? rep.mainReasons : []).map((text) => ({ text, delta: 1 })) } });
    }
    days.sort((a, b) => b.r.score - a.r.score || a.d.getTime() - b.d.getTime());
    const ly1 = getLunarDate(range.from).year, ly2 = getLunarDate(range.to).year;
    const years = [ly1, ...(ly2 !== ly1 ? [ly2] : [])].map((y) => ({ y, rows: yearInfo(y) }));
    return { kind: 'pick' as const, days, years, couple };
  }, [shown, act, slots, mode, checkDate, range, weekendOnly, people, peopleView]);

  const actName = ACT_DEF[act].label.split(',')[0].toLowerCase();

  return (
    <div className="space-y-4">
      {/* Gõ câu hỏi */}
      <Card>
        <SectionTitle icon={<MessageCircleQuestion size={18} />} title="Hỏi nhanh: việc này có tốt không?" />
        <label htmlFor="ask-text" className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Gõ câu hỏi ngắn (không bắt buộc)</label>
        <div className="flex gap-2">
          <textarea id="ask-text" value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={300}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (text.trim()) applyParsed(parseQuestion(text)); } }}
            placeholder="VD: Tôi sinh 1980, ngày mai về nhà mới có tốt không?"
            className="flex-1 bg-giay border border-giay-200 rounded-2xl px-3 py-2.5 text-muc resize-none focus:ring-2 focus:ring-son-200 outline-none" />
          <button type="button" onClick={() => text.trim() && applyParsed(parseQuestion(text))} aria-label="Hiểu câu hỏi"
            className="shrink-0 w-14 rounded-2xl bg-son-600 text-white flex flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-bold"><Wand2 size={18} />Hỏi</button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar mt-2 -mx-1 px-1">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" onClick={() => { setText(ex); applyParsed(parseQuestion(ex)); }} className="shrink-0 max-w-[16rem] truncate px-3 py-1.5 rounded-full bg-giay-100 text-xs font-semibold text-gray-600">{ex}</button>
          ))}
        </div>
        {understood && (
          <div className={`mt-3 p-3 rounded-2xl text-sm border ${missing.length ? 'bg-kim-50 border-amber-100' : 'bg-green-50 border-green-100'}`} role="status">
            {understood.understood.length > 0 && <p className="text-gray-700"><b>Đã hiểu:</b> {understood.understood.map((u) => u.replace(/^việc: .*/, `việc: ${understood.act ? ACT_DEF[understood.act].short.toLowerCase() : ''}`)).join(' · ')}</p>}
            {missing.length > 0 && <p className="text-kim-700 font-semibold mt-1">Còn thiếu: {missing.join(', ')}. Vui lòng chọn ở các ô bên dưới.</p>}
          </div>
        )}
      </Card>

      {/* Chọn theo danh sách */}
      <Card>
        <div className="space-y-4">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">1. Bạn muốn hỏi</div>
            <div className="grid grid-cols-2 gap-2">
              {([['check', 'Ngày này có tốt không?', <CalendarCheck size={18} key="a" />], ['pick', 'Nên chọn ngày nào?', <CalendarSearch size={18} key="b" />]] as [Mode, string, React.ReactNode][]).map(([v, l, ic]) => (
                <button key={v} type="button" onClick={() => { setMode(v); setShown(false); }} aria-pressed={mode === v}
                  className={`p-3 rounded-2xl border text-sm font-bold flex items-center gap-2 ${mode === v ? 'bg-son-50 border-son-200 text-son-700' : 'bg-white border-giay-200 text-gray-600'}`}>{ic}{l}</button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">2. Việc cần làm</div>
            <ActivityPicker value={act} onChange={(k) => { setAct(k); setShown(false); }} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">3. Năm sinh</span>
              <button type="button" onClick={() => setShowFamily(true)} className="text-xs font-bold text-son-600 flex items-center gap-1"><Users size={14} /> Người trong nhà ({family.length})</button>
            </div>
            {family.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-2">
                {family.map((m) => <button key={m.id} type="button" onClick={() => quickFill(m)} className="px-3 py-1.5 rounded-full border border-giay-200 bg-white text-sm font-semibold text-gray-700">{m.name} · {m.birthYear}</button>)}
              </div>
            )}
            <div className="space-y-2">
              {slots.map((s, i) => (
                <div key={s.key} className="flex items-end gap-2">
                  <YearSelect id={`slot-${s.key}`} label={s.label} value={s.year} family={family} onChange={(y, m) => setSlot(s.key, y, m)} />
                  {s.year != null && !s.memberName && (
                    <button type="button" onClick={() => saveSlotToFamily(s)} aria-label="Lưu vào người trong nhà" title="Lưu vào người trong nhà" className="p-3 rounded-2xl border border-giay-200 text-gray-500"><Save size={18} /></button>
                  )}
                  {!isWedding(act) && i > 0 && (
                    <button type="button" onClick={() => setSlots((p) => p.filter((x) => x.key !== s.key))} aria-label="Bỏ người này" className="p-3 rounded-2xl border border-giay-200 text-gray-500"><X size={18} /></button>
                  )}
                </div>
              ))}
              {isWedding(act) && (
                <button type="button" onClick={() => setSlots((p) => [{ ...p[0], year: p[1].year, memberName: p[1].memberName }, { ...p[1], year: p[0].year, memberName: p[0].memberName }])} className="text-xs font-bold text-gray-500 flex items-center gap-1"><ArrowUpDown size={14} /> Đổi chỗ chú rể và cô dâu</button>
              )}
              {!isWedding(act) && slots.length < 4 && (
                <button type="button" onClick={() => setSlots((p) => [...p, { key: `p${Date.now()}`, label: `Người thứ ${p.length + 1}`, year: null }])} className="text-sm font-bold text-son-600 flex items-center gap-1"><Plus size={16} /> Thêm người (vợ/chồng, người cùng làm)</button>
              )}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">4. {mode === 'check' ? 'Ngày cần xem' : 'Tìm trong khoảng'}</div>
            {mode === 'check' ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {([
                    ['today', `Hôm nay`], ['tomorrow', 'Ngày mai'], ['after', 'Ngày kia'], ['sat', 'Thứ Bảy tới'], ['sun', 'Chủ nhật tới'],
                    ...(startOfDay(viewingDate).getTime() !== today.getTime() ? [['viewing', `Ngày đang xem ${viewingDate.getDate()}/${viewingDate.getMonth() + 1}`]] : []),
                    ['custom', 'Chọn ngày'],
                  ] as [DayChoice, string][]).map(([v, l]) => (
                    <button key={v} type="button" onClick={() => { setDayChoice(v); setShown(false); }} aria-pressed={dayChoice === v}
                      className={`px-3.5 py-2 rounded-xl text-sm font-bold border ${dayChoice === v ? 'bg-son-600 text-white border-son-600' : 'bg-white border-giay-200 text-gray-600'}`}>{l}</button>
                  ))}
                </div>
                {dayChoice === 'custom' && <input type="date" value={customDay} onChange={(e) => { setCustomDay(e.target.value); setShown(false); }} aria-label="Chọn ngày cần xem" className="mt-2 w-full bg-giay border border-giay-200 rounded-2xl px-3 py-2.5 font-semibold text-muc" />}
                <p className="text-sm text-gray-600 mt-2">Ngày xem: <b className="text-muc">{fmt(checkDate)}</b> · âm {getLunarDate(checkDate).day}/{getLunarDate(checkDate).month}</p>
              </>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {([['this-month', 'Tháng này'], ['next-month', 'Tháng sau'], ['3m', '3 tháng tới'], ['month', 'Chọn tháng'], ...(customRange ? [['custom', customRange.label]] : [])] as [RangeChoice, string][]).map(([v, l]) => (
                    <button key={v} type="button" onClick={() => { setRangeChoice(v); setShown(false); }} aria-pressed={rangeChoice === v}
                      className={`px-3.5 py-2 rounded-xl text-sm font-bold border ${rangeChoice === v ? 'bg-son-600 text-white border-son-600' : 'bg-white border-giay-200 text-gray-600'}`}>{l}</button>
                  ))}
                </div>
                {rangeChoice === 'month' && (
                  <select value={monthPick} onChange={(e) => { setMonthPick(e.target.value); setShown(false); }} aria-label="Chọn tháng" className="mt-2 w-full bg-giay border border-giay-200 rounded-2xl px-3 py-3 font-semibold text-muc">
                    {monthOptions.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                )}
                <label className="flex items-center gap-2 mt-3 text-sm font-semibold text-gray-700">
                  <input type="checkbox" checked={weekendOnly} onChange={(e) => { setWeekendOnly(e.target.checked); setShown(false); }} className="w-5 h-5 accent-son-600" /> Chỉ Thứ Bảy, Chủ nhật
                </label>
                <p className="text-sm text-gray-600 mt-1">Từ {range.from.toLocaleDateString('vi-VN')} đến {range.to.toLocaleDateString('vi-VN')}</p>
              </>
            )}
          </div>

          {missing.length > 0 && !understood && <p className="text-sm font-semibold text-son-600" role="alert">Vui lòng chọn {missing.join(', ')}.</p>}
          <button type="button" onClick={run} className="w-full py-3.5 rounded-2xl bg-son-600 text-white font-bold flex items-center justify-center gap-2 shadow-md active:scale-[.98] transition-transform">
            <Sparkles size={18} /> Xem kết quả
          </button>
        </div>
      </Card>

      {/* Kết quả */}
      <div ref={resultRef} className="scroll-mt-20">
        {result?.kind === 'check' && (
          <PersonalReportCard date={checkDate} act={act} people={peopleView} onOpenDay={(d) => { rememberAct(act); if (!person && peopleView[0]) setPerson({ birthYear: peopleView[0].birthYear, gender: peopleView[0].gender }); onOpenDay(d); }} onGender={setOwnerGender}
            extra={result.couple ? <div className="mt-3"><CoupleBlock c={result.couple} /></div> : null} />
        )}
        {result?.kind === 'pick' && <PickResult res={result} actName={actName} rangeLabel={range.label} weekendOnly={weekendOnly} onOpenDay={onOpenDay} />}
      </div>

      <p className="text-xs text-center text-gray-500 px-4 leading-relaxed">{DISCLAIMER}</p>

      <FamilySheet open={showFamily} onClose={() => setShowFamily(false)} family={family} onChange={(f) => { setFamily(f); saveFamily(f); }} />
    </div>
  );
};

/* ------------------------------------------------------------------ */


const YearBlock: React.FC<{ rows: { who: string; checks: YearCheck[] }[]; title?: string }> = ({ rows, title }) => {
  if (!rows.length) return null;
  const anyBad = rows.some((r) => r.checks.some((c) => c.bad));
  return (
    <div className={`p-3 rounded-2xl border ${anyBad ? 'bg-son-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
      {title && <div className="text-sm font-bold text-muc mb-1">{title}</div>}
      {rows.map((r) => (
        <div key={r.who} className="text-sm mt-1">
          <div className="font-semibold text-muc">{r.who}</div>
          <ul className="pl-1">
            {r.checks.map((c) => <li key={c.name} className={c.bad ? 'text-son-700 font-semibold' : 'text-gray-700'}>{c.bad ? '⚠ ' : '✓ '}{c.name}: {c.note}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
};

const CoupleBlock: React.FC<{ c: ReturnType<typeof coupleMatch> }> = ({ c }) => (
  <div className="p-3 rounded-2xl border border-giay-200 bg-giay">
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm font-bold text-muc flex items-center gap-1.5"><Heart size={14} className="text-son-600" /> Tuổi vợ chồng</span>
      <span className={`text-sm font-bold ${c.points >= 4 ? 'text-green-700' : c.points >= 2 ? 'text-gray-600' : 'text-son-600'}`}>{c.verdict} · {c.points}/{c.max}</span>
    </div>
    <ul className="mt-1 space-y-0.5">
      {c.criteria.map((x) => <li key={x.name} className="text-sm text-gray-700"><b className={x.result === 'tốt' ? 'text-green-700' : x.result === 'xấu' ? 'text-son-600' : 'text-gray-600'}>{x.name}:</b> {x.note}</li>)}
    </ul>
  </div>
);

const PickResult: React.FC<{ res: any; actName: string; rangeLabel: string; weekendOnly: boolean; onOpenDay: (d: Date) => void }> = ({ res, actName, rangeLabel, weekendOnly, onOpenDay }) => {
  const [all, setAll] = useState(false);
  const { days, years, couple } = res;
  const top = days.slice(0, 3);
  const weekend = weekendOnly ? [] : days.filter((x: any) => (x.d.getDay() === 0 || x.d.getDay() === 6) && !top.includes(x)).slice(0, 3);
  const rest = days.slice(3);
  const Row = ({ x, rank }: { x: any; rank?: number }) => {
    const pos = x.r.reasons.filter((r: any) => r.delta > 0).sort((a: any, b: any) => b.delta - a.delta).slice(0, 2).map((r: any) => r.text);
    return (
      <li>
        <button type="button" onClick={() => onOpenDay(x.d)} className="w-full text-left p-3 rounded-2xl border border-giay-200 bg-giay flex items-center gap-3">
          {rank != null && <span className="w-7 h-7 rounded-full bg-son-600 text-white font-bold flex items-center justify-center text-sm shrink-0">{rank}</span>}
          <span className="flex-1 min-w-0">
            <span className="block font-bold text-muc">{fmt(x.d)}</span>
            <span className="block text-xs text-gray-500">âm {x.info.lunar.day}/{x.info.lunar.month}{x.info.lunar.leap ? 'N' : ''} · {x.info.canChi.day} · {x.info.than.name}</span>
            {pos.length > 0 && <span className="block text-xs text-green-700 font-semibold truncate">{pos.join(' · ')}</span>}
            <span className="block text-xs text-kim-700 truncate">Giờ tốt: {x.r.goodHours.slice(0, 4).map((h: any) => h.branch).join(', ')}</span>
          </span>
          <span className="text-sm font-bold text-green-700 shrink-0">{x.r.score}</span>
        </button>
      </li>
    );
  };
  return (
    <Card className="animate-slide-up">
      <h3 className="font-serif text-xl font-bold text-muc" data-testid="ask-pick-title">
        {days.length ? `${days.length} ngày tốt để ${actName} trong ${rangeLabel}${weekendOnly ? ' (cuối tuần)' : ''}` : `Chưa có ngày tốt để ${actName} trong ${rangeLabel}`}
      </h3>
      {days.length === 0 && <p className="text-sm text-gray-600 mt-2">Thử chọn khoảng dài hơn, hoặc bỏ "Chỉ Thứ Bảy, Chủ nhật".</p>}
      <div className="mt-3 space-y-3">
        {couple && <CoupleBlock c={couple} />}
        {years.map((y: any) => <YearBlock key={y.y} rows={y.rows} title={`Xét tuổi năm âm lịch ${y.y}`} />)}
      </div>
      {top.length > 0 && (
        <>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-4 mb-2">Ngày tốt nhất</div>
          <ul className="space-y-2">{top.map((x: any, i: number) => <Row key={x.d.getTime()} x={x} rank={i + 1} />)}</ul>
        </>
      )}
      {weekend.length > 0 && (
        <>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-4 mb-2">Nếu cần ngày Thứ Bảy, Chủ nhật</div>
          <ul className="space-y-2">{weekend.map((x: any) => <Row key={x.d.getTime()} x={x} />)}</ul>
        </>
      )}
      {rest.length > 0 && (
        <>
          <button type="button" onClick={() => setAll((v) => !v)} className="mt-4 text-sm font-bold text-son-600">{all ? 'Thu gọn' : `Xem tất cả ${days.length} ngày`}</button>
          {all && <ul className="space-y-2 mt-2">{rest.map((x: any) => <Row key={x.d.getTime()} x={x} />)}</ul>}
        </>
      )}
    </Card>
  );
};

const FamilySheet: React.FC<{ open: boolean; onClose: () => void; family: Member[]; onChange: (f: Member[]) => void }> = ({ open, onClose, family, onChange }) => {
  const [name, setName] = useState('');
  const [year, setYear] = useState<number | null>(null);
  const [gender, setGender] = useState<'' | 'nam' | 'nu'>('');
  return (
    <Sheet open={open} onClose={onClose} title="Người trong nhà" subtitle="Lưu năm sinh để chọn nhanh. Chỉ lưu trên máy này.">
      <ul className="space-y-2 mb-4">
        {family.length === 0 && <li className="text-sm text-gray-500">Chưa có ai. Thêm người ở dưới.</li>}
        {family.map((m) => (
          <li key={m.id} className="flex items-center gap-2 p-3 rounded-2xl bg-giay border border-giay-200">
            <span className="flex-1 min-w-0"><b className="text-muc">{m.name}</b> <span className="text-sm text-gray-600">· {m.birthYear} · {personInfo({ birthYear: m.birthYear }).canChi}{m.gender ? ` · ${m.gender === 'nam' ? 'Nam' : 'Nữ'}` : ''}</span></span>
            <button type="button" onClick={() => onChange(family.filter((x) => x.id !== m.id))} aria-label={`Xóa ${m.name}`} className="p-2 text-gray-400 hover:text-son-600"><Trash2 size={18} /></button>
          </li>
        ))}
      </ul>
      <div className="space-y-2 p-3 rounded-2xl border border-giay-200">
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} placeholder="Tên gọi: Tôi, Vợ, Con trai…" aria-label="Tên gọi" className="w-full bg-giay border border-giay-200 rounded-2xl px-3 py-3 font-semibold text-muc" />
        <div className="flex gap-2 items-end">
          <YearSelect id="fam-year" label="Năm sinh" value={year} family={[]} onChange={(y) => setYear(y)} />
          <select value={gender} onChange={(e) => setGender(e.target.value as '' | 'nam' | 'nu')} aria-label="Giới tính" className="bg-giay border border-giay-200 rounded-2xl px-3 py-3 font-semibold text-muc">
            <option value="">Giới tính</option><option value="nam">Nam</option><option value="nu">Nữ</option>
          </select>
        </div>
        <button type="button" disabled={!name.trim() || year == null} onClick={() => { onChange([...family, { id: newId(), name: name.trim(), birthYear: year!, gender: gender || undefined }]); setName(''); setYear(null); setGender(''); }}
          className="w-full py-3 rounded-2xl bg-son-600 text-white font-bold disabled:opacity-40 flex items-center justify-center gap-1.5"><Plus size={18} /> Thêm vào người trong nhà</button>
      </div>
    </Sheet>
  );
};

export default HoiNhanh;
