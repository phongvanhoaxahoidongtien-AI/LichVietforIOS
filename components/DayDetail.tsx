import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Star, ShieldAlert, Clock, Navigation, ListChecks, ChevronDown, Moon } from 'lucide-react';
import { getDayInfo, evaluateActivity, ACTIVITIES, ACTIVITY_DEFS, DISCLAIMER, personInfo, type ActivityKey } from '../services/almanac';
import { useApp } from '../context';
import { Card, SectionTitle, ScoreRing, VerdictBadge, WEEKDAYS, TRUC_STYLE, Sheet } from './ui';
import TrucGuide from './TrucGuide';
import { todayISO, parseISODate } from '../services/storage';
import { holidayOf } from './MonthCalendar';
import PersonalSection from './PersonalSection';

const DayDetail: React.FC<{ date: Date; onDateChange: (d: Date) => void }> = ({ date, onDateChange }) => {
  const { person } = useApp();
  const info = useMemo(() => getDayInfo(date), [date]);
  const [openAct, setOpenAct] = useState<ActivityKey | null>(null);
  const [showAllHours, setShowAllHours] = useState(false);
  const [allActs, setAllActs] = useState(false);
  const [trucGuide, setTrucGuide] = useState(false);
  const pi = person ? personInfo(person) : null;
  const evals = useMemo(() => (allActs ? ACTIVITY_DEFS : ACTIVITIES).map((a) => ({ ...a, r: evaluateActivity(info, a.key, person || undefined) })), [info, person, allActs]);
  const shift = (n: number) => onDateChange(new Date(date.getFullYear(), date.getMonth(), date.getDate() + n));
  const holiday = holidayOf(date);


  return (
    <div className="space-y-4">
      {/* Chọn ngày */}
      <div className="flex items-center gap-2">
        <button onClick={() => shift(-1)} aria-label="Ngày trước" className="p-3 rounded-2xl bg-white border border-giay-200"><ChevronLeft size={18} /></button>
        <input type="date" value={todayISO(date)} onChange={(e) => { const d = parseISODate(e.target.value); if (d) onDateChange(d); }}
          className="flex-1 bg-white border border-giay-200 rounded-2xl px-4 py-2.5 font-bold text-muc text-center" aria-label="Chọn ngày dương lịch" />
        <button onClick={() => shift(1)} aria-label="Ngày sau" className="p-3 rounded-2xl bg-white border border-giay-200"><ChevronRight size={18} /></button>
      </div>

      {/* Tổng quan */}
      <Card>
        <div className="flex items-start gap-4">
          <ScoreRing score={info.score} label="điểm chung" size={96} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{WEEKDAYS[date.getDay()]}, {date.toLocaleDateString('vi-VN')}</div>
            <div className="font-serif text-xl font-bold text-muc mt-0.5 flex items-center gap-1.5"><Moon size={16} className="text-son-600" />{info.lunar.day}/{info.lunar.month}{info.lunar.leap ? ' nhuận' : ''} âm lịch</div>
            {holiday && <div className="text-sm font-bold text-son-600">{holiday}</div>}
            <div className="mt-2"><VerdictBadge verdict={info.verdict} size="sm" /></div>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-sm">
          <div><dt className="text-xs text-gray-500">Ngày</dt><dd className="font-bold text-muc">{info.canChi.day}</dd></div>
          <div><dt className="text-xs text-gray-500">Tháng / Năm</dt><dd className="font-bold text-muc">{info.canChi.month} / {info.canChi.year}</dd></div>
          <div><dt className="text-xs text-gray-500">Nạp âm (mệnh ngày)</dt><dd className="font-bold text-muc">{info.napAm.name}</dd></div>
          <div><dt className="text-xs text-gray-500">Tiết khí</dt><dd className="font-bold text-muc">{info.solarTerm}</dd></div>
        </dl>
      </Card>

      {/* Theo tuổi */}
      <PersonalSection date={date} onDateChange={onDateChange} />

      {/* Ba yếu tố chính */}
      <Card>
        <SectionTitle icon={<Star size={18} />} title="Hoàng đạo · Trực · Nhị thập bát tú" />
        <ul className="space-y-3">
          <li className="flex gap-3">
            <span className={`shrink-0 w-24 text-sm font-bold ${info.than.hoangDao ? 'text-green-700' : 'text-son-600'}`}>{info.than.name}</span>
            <span className="text-sm text-gray-700">{info.than.note}</span>
          </li>
          <li className="flex gap-3">
            <span className={`shrink-0 w-24 text-sm font-bold ${TRUC_STYLE[info.truc.tone].text}`}>Trực {info.truc.name}<span className="block text-xs">({TRUC_STYLE[info.truc.tone].label})</span></span>
            <span className="text-sm text-gray-700">{info.truc.meaning}. <b className="text-green-700">Nên:</b> {info.truc.nen.join(', ')}. <b className="text-son-600">Kiêng:</b> {info.truc.kieng.join(', ')}. <button type="button" onClick={() => setTrucGuide(true)} className="text-blue-700 font-semibold underline">12 Trực</button></span>
          </li>
          <li className="flex gap-3">
            <span className={`shrink-0 w-24 text-sm font-bold ${info.sao28.good ? 'text-green-700' : 'text-son-600'}`}>Sao {info.sao28.name}</span>
            <span className="text-sm text-gray-700"><i>{info.sao28.full}</i> ({info.sao28.good ? 'sao tốt' : 'sao xấu'}). {info.sao28.note}</span>
          </li>
        </ul>
      </Card>

      {/* Sao tốt xấu, ngày kỵ */}
      <Card>
        <SectionTitle icon={<ShieldAlert size={18} />} title="Sao tốt, sao xấu, ngày kỵ" right={<span className="text-[0.6875rem] text-gray-500">Ngọc Hạp Thông Thư</span>} />
        {info.kyDays.length > 0 && (
          <div className="mb-4 space-y-2">
            {info.kyDays.map((k) => (
              <div key={k.name} className="p-3 rounded-2xl bg-son-50 border border-red-100">
                <div className="text-sm font-bold text-son-700">{k.name}</div>
                <div className="text-sm text-gray-700">{k.note}</div>
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <div className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">Sao tốt ({info.goodStars.length})</div>
            <ul className="space-y-1.5">
              {info.goodStars.map((s) => <li key={s.name} className="text-sm"><b className="text-green-700">{s.name}</b><span className="text-gray-600">: {s.note}</span></li>)}
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold text-son-600 uppercase tracking-wider mb-2">Sao xấu ({info.badStars.length})</div>
            <ul className="space-y-1.5">
              {info.badStars.map((s) => <li key={s.name} className="text-sm"><b className="text-son-600">{s.name}</b><span className="text-gray-600">: {s.note}</span></li>)}
            </ul>
          </div>
        </div>
      </Card>

      {/* Đánh giá theo việc */}
      <Card>
        <SectionTitle icon={<ListChecks size={18} />} tone="green" title={pi ? `Đánh giá theo việc · tuổi ${pi.canChi}` : 'Đánh giá theo việc'} />
        <ul className="divide-y divide-giay-200">
          {evals.map(({ key, label, r }) => {
            const open = openAct === key;
            const color = r.blocked ? 'bg-son-700' : r.score >= 75 ? 'bg-green-600' : r.score >= 60 ? 'bg-emerald-500' : r.score >= 45 ? 'bg-gray-300' : 'bg-son-400';
            return (
              <li key={key} className="py-2.5">
                <button className="w-full flex items-center gap-3 text-left" onClick={() => setOpenAct(open ? null : key)} aria-expanded={open}>
                  <span className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-muc block">{label}</span>
                    <span className="mt-1 h-1.5 rounded-full bg-gray-100 block overflow-hidden"><span className={`h-full block rounded-full ${color}`} style={{ width: `${Math.max(4, r.score)}%` }} /></span>
                  </span>
                  <span className={`text-sm font-bold w-20 text-right ${r.blocked ? 'text-son-700' : r.score >= 60 ? 'text-green-700' : r.score >= 45 ? 'text-gray-600' : 'text-son-600'}`}>{r.blocked ? 'Nên tránh' : r.verdict}</span>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                  <ul className="mt-2 space-y-1 pl-1 animate-fade-in">
                    {r.reasons.map((x, i) => (
                      <li key={i} className="flex justify-between text-sm gap-3">
                        <span className="text-gray-700">{x.text}</span>
                        <span className={`font-bold tabular-nums ${x.delta > 0 ? 'text-green-700' : 'text-son-600'}`}>{x.delta > 0 ? '+' : ''}{x.delta}</span>
                      </li>
                    ))}
                    <li className="text-xs text-gray-500 pt-1">Điểm: {r.score}/100. Giờ tốt: {r.goodHours.map((h) => `${h.branch} (${h.range})`).join(', ')}</li>
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
        <button onClick={() => setAllActs((v) => !v)} className="mt-2 text-sm font-bold text-son-600">{allActs ? 'Chỉ việc chính' : `Xem thêm ${ACTIVITY_DEFS.length - ACTIVITIES.length} việc khác (mua xe, nhập học, đặt bàn thờ…)`}</button>
      </Card>

      {/* Giờ trong ngày */}
      <Card>
        <SectionTitle icon={<Clock size={18} />} tone="kim" title="Giờ trong ngày"
          right={<button onClick={() => setShowAllHours((v) => !v)} className="text-sm font-bold text-son-600">{showAllHours ? 'Chỉ giờ tốt' : 'Xem đủ 12 giờ'}</button>} />
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 text-left">
                <th className="font-semibold py-1.5 px-1">Giờ</th>
                <th className="font-semibold py-1.5 px-1">Hoàng/Hắc đạo</th>
                <th className="font-semibold py-1.5 px-1">Xuất hành</th>
              </tr>
            </thead>
            <tbody>
              {info.hours.filter((h) => showAllHours || h.hoangDao).map((h) => {
                const xung = pi && (h.index + 6) % 12 === pi.branch;
                return (
                  <tr key={h.branch} className="border-t border-giay-200 align-top">
                    <td className="py-2 px-1">
                      <div className="font-bold text-muc">{h.canChi}</div>
                      <div className="text-xs text-gray-500">{h.range}</div>
                    </td>
                    <td className="py-2 px-1">
                      <span className={`font-semibold ${h.hoangDao ? 'text-green-700' : 'text-son-600'}`}>{h.than}</span>
                      {xung && <div className="text-xs font-bold text-son-600">Xung tuổi</div>}
                    </td>
                    <td className="py-2 px-1">
                      <span className={`font-semibold ${h.ltp.good ? 'text-green-700' : 'text-son-600'}`}>{h.ltp.name}</span>
                      <div className="text-xs text-gray-500 leading-snug">{h.ltp.note}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">Cột "Xuất hành" tính theo Lý Thuần Phong.</p>
      </Card>

      {/* Hướng & tuổi */}
      <Card>
        <SectionTitle icon={<Navigation size={18} />} tone="blue" title="Hướng xuất hành và tuổi xung hợp" />
        <dl className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 rounded-2xl bg-green-50"><dt className="text-xs text-gray-500">Hỷ thần</dt><dd className="font-bold text-green-700">{info.directions.hyThan}</dd></div>
          <div className="p-3 rounded-2xl bg-kim-50"><dt className="text-xs text-gray-500">Tài thần</dt><dd className="font-bold text-kim-700">{info.directions.taiThan}</dd></div>
          <div className="p-3 rounded-2xl bg-son-50"><dt className="text-xs text-gray-500">Tránh Hạc thần</dt><dd className="font-bold text-son-600">{info.directions.hacThan || 'Trên trời'}</dd></div>
        </dl>
        <div className="mt-4 text-sm space-y-1">
          <p><span className="text-gray-500">Tuổi xung khắc mạnh: </span><b className="text-son-600">{info.xungTuoi.join(', ') || 'Không'}</b></p>
          <p><span className="text-gray-500">Lục xung: </span><b className="text-muc">tuổi {info.xungChi}</b></p>
          <p><span className="text-gray-500">Hợp: </span><b className="text-green-700">lục hợp {info.hop.lucHop}; tam hợp {info.hop.tamHop.join(', ')}</b></p>
        </div>
      </Card>

      <p className="text-xs text-center text-gray-500 px-4 leading-relaxed">{DISCLAIMER}</p>
      <Sheet open={trucGuide} onClose={() => setTrucGuide(false)} title="12 Trực" subtitle="Ý nghĩa, việc nên làm và kiêng kỵ">
        <TrucGuide current={info.truc.index} />
      </Sheet>
    </div>
  );
};

export default DayDetail;
