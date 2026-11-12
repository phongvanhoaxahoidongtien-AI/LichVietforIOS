import React, { useMemo, useState } from 'react';
import { ThumbsUp, ThumbsDown, ChevronRight, UserRound } from 'lucide-react';
import { ACTIVITIES, activitiesForDay, personInfo, type ActivityKey, type DayInfo } from '../services/almanac';
import { personalReport, LEVEL_LABEL } from '../services/personal';
import { loadFamily } from '../services/family';
import { useApp } from '../context';
import { Card, SectionTitle } from './ui';
import PersonForm from './PersonForm';
import { candidates } from './PersonalSection';

/** Thẻ trang Hôm nay: việc nên làm / nên tránh, tính theo tuổi người dùng nếu đã có năm sinh. */
const TodayForAge: React.FC<{ date: Date; info: DayInfo; onOpen: (a: ActivityKey) => void }> = ({ date, info, onOpen }) => {
  const { person, setPerson } = useApp();
  const [asking, setAsking] = useState(false);
  const who = useMemo(() => candidates(person, loadFamily())[0] ?? null, [person]);

  const rows = useMemo(() => (who ? ACTIVITIES.map((a) => ({ a, r: personalReport(date, a.key, [who.p], info) })) : []), [who, date, info]);
  const generic = useMemo(() => (who ? null : activitiesForDay(info)), [who, info]);

  if (!who) {
    return (
      <Card testId="today-generic">
        <SectionTitle icon={<ThumbsUp size={18} />} tone="green" title="Việc nên làm và nên tránh" />
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {generic && generic.good.length ? generic.good.map((a) => (
              <button key={a.key} type="button" onClick={() => onOpen(a.key)} className="px-3 py-1.5 bg-green-50 text-green-700 text-sm font-semibold rounded-xl border border-green-100">{a.label}</button>
            )) : <span className="text-sm text-gray-500 italic">Không có việc lớn nào thật sự thuận lợi.</span>}
          </div>
          <div className="text-xs font-bold text-son-600 uppercase tracking-wider flex items-center gap-1"><ThumbsDown size={12} /> Nên tránh</div>
          <div className="flex flex-wrap gap-2">
            {generic && generic.bad.length ? generic.bad.map((a) => (
              <button key={a.key} type="button" onClick={() => onOpen(a.key)} className="px-3 py-1.5 bg-son-50 text-son-700 text-sm font-semibold rounded-xl border border-red-100">{a.label}</button>
            )) : <span className="text-sm text-gray-500 italic">Không có.</span>}
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-giay-200">
          {!asking ? (
            <button type="button" onClick={() => setAsking(true)} className="w-full py-2.5 rounded-2xl bg-giay border border-giay-200 font-bold text-son-600 flex items-center justify-center gap-1.5" data-testid="today-enter-age">
              <UserRound size={16} /> Nhập năm sinh để xem riêng cho tuổi bạn
            </button>
          ) : <PersonForm value={person} onChange={(p) => setPerson(p)} showGender label="Năm sinh âm lịch của bạn" />}
        </div>
      </Card>
    );
  }

  const order = { nen: 0, 'can-nhac': 1, 'khong-nen': 2 } as const;
  const sorted = [...rows].sort((x, y) => order[x.r.level] - order[y.r.level] || y.r.score - x.r.score);
  return (
    <Card testId="today-for-age">
      <SectionTitle icon={<UserRound size={18} />} tone="green" title={`Hôm nay với tuổi ${personInfo(who.p).canChi}`}
        right={<span className="text-xs font-bold text-gray-500">{who.p.name ? `${who.p.name} · ` : ''}{who.p.birthYear}</span>} />
      <ul className="divide-y divide-giay-200">
        {sorted.map(({ a, r }) => (
          <li key={a.key}>
            <button type="button" onClick={() => onOpen(a.key)} className="w-full py-2.5 flex items-center gap-3 text-left" data-testid={`today-act-${a.key}`}>
              <span className={`w-11 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${r.level === 'nen' ? 'bg-green-50 text-green-700' : r.level === 'can-nhac' ? 'bg-kim-50 text-kim-700' : 'bg-son-50 text-son-600'}`}>{r.score}</span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold text-muc">{a.short}</span>
                <span className="block text-xs text-gray-500 truncate">{r.mainReasons.slice(0, 2).join('; ') || ' '}</span>
              </span>
              <span className={`text-xs font-bold shrink-0 ${r.level === 'nen' ? 'text-green-700' : r.level === 'can-nhac' ? 'text-kim-700' : 'text-son-600'}`}>{LEVEL_LABEL[r.level]}</span>
              <ChevronRight size={16} className="text-gray-400 shrink-0" />
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-500 mt-2">Bấm vào từng việc để xem phiếu đánh giá chi tiết: lý do, giờ tốt, lời khuyên.</p>
    </Card>
  );
};

export default TodayForAge;
