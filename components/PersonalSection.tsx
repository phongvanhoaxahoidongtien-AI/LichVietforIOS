import React, { useMemo, useState } from 'react';
import { UserRound } from 'lucide-react';
import { ACTIVITIES, ACTIVITY_DEFS, ACT_DEF, personInfo, type ActivityKey, type Person } from '../services/almanac';
import { loadFamily, saveFamily, type Member } from '../services/family';
import type { PersonView } from '../services/personal';
import { useApp } from '../context';
import { Card, SectionTitle } from './ui';
import PersonForm from './PersonForm';
import PersonalReportCard from './PersonalReportCard';

const ACT_KEY = 'lich-viet-act';
export const rememberAct = (a: ActivityKey) => { try { sessionStorage.setItem(ACT_KEY, a); } catch { /* bỏ qua */ } };
const recallAct = (): ActivityKey => {
  try { const v = sessionStorage.getItem(ACT_KEY) as ActivityKey | null; if (v && ACT_DEF[v]) return v; } catch { /* bỏ qua */ }
  return 'nhap-trach';
};

interface Who { id: string; label: string; p: PersonView; member?: Member }

/** Danh sách người có thể xem: người đã nhập năm sinh và người trong nhà. */
export function candidates(person: Person | null, family: Member[]): Who[] {
  const list: Who[] = family.map((m) => ({ id: m.id, label: `${m.name} (${m.birthYear})`, p: { birthYear: m.birthYear, gender: m.gender, name: m.name }, member: m }));
  if (person && !family.some((m) => m.birthYear === person.birthYear)) list.unshift({ id: 'me', label: `Bạn (${person.birthYear})`, p: { ...person } });
  return list;
}

/** Mục "Xem theo tuổi của bạn" trong Chi tiết ngày. */
const PersonalSection: React.FC<{ date: Date; onDateChange: (d: Date) => void }> = ({ date, onDateChange }) => {
  const { person, setPerson } = useApp();
  const [family, setFamily] = useState<Member[]>(() => loadFamily());
  const list = useMemo(() => candidates(person, family), [person, family]);
  const [whoId, setWhoId] = useState<string>(() => list[0]?.id ?? '');
  const [act, setAct] = useState<ActivityKey>(recallAct);
  const who = list.find((w) => w.id === whoId) || list[0];
  const people = useMemo(() => (who ? [who.p] : []), [who]);

  const pickAct = (a: ActivityKey) => { setAct(a); rememberAct(a); };
  const setGender = (g: 'nam' | 'nu') => {
    if (!who) return;
    if (who.member) { const f = family.map((m) => (m.id === who.member!.id ? { ...m, gender: g } : m)); setFamily(f); saveFamily(f); }
    else if (person) setPerson({ ...person, gender: g });
  };

  if (!who) {
    return (
      <Card testId="personal-empty">
        <SectionTitle icon={<UserRound size={18} />} title="Xem ngày theo tuổi của bạn" />
        <p className="text-sm text-gray-600 mb-3">Nhập năm sinh âm lịch để có điểm phù hợp, lý do nên hay không nên, giờ tốt và lời khuyên cho riêng bạn.</p>
        <PersonForm value={person} onChange={(p) => setPerson(p)} showGender label="Năm sinh âm lịch của bạn" />
      </Card>
    );
  }

  return (
    <div className="space-y-3" data-testid="personal-section">
      <Card className="!p-4">
        <SectionTitle icon={<UserRound size={18} />} title="Xem ngày theo tuổi" />
        <div className="grid grid-cols-1 gap-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider" htmlFor="ps-who">Người xem</label>
          <select id="ps-who" value={who.id} onChange={(e) => setWhoId(e.target.value)} className="bg-giay border border-giay-200 rounded-2xl px-3 py-2.5 font-semibold text-muc" data-testid="ps-who">
            {list.map((w) => <option key={w.id} value={w.id}>{w.label} · {personInfo(w.p).canChi}</option>)}
          </select>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1" htmlFor="ps-act">Việc cần xem</label>
          <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Việc chính">
            {ACTIVITIES.map((a) => (
              <button key={a.key} type="button" onClick={() => pickAct(a.key)} aria-pressed={act === a.key}
                className={`px-3 py-1.5 rounded-full text-sm font-bold border ${act === a.key ? 'bg-son-600 text-white border-son-600' : 'bg-white text-gray-600 border-giay-200'}`}>{a.short}</button>
            ))}
          </div>
          <select id="ps-act" value={act} onChange={(e) => pickAct(e.target.value as ActivityKey)} className="bg-giay border border-giay-200 rounded-2xl px-3 py-2.5 font-semibold text-muc" data-testid="ps-act">
            {ACTIVITY_DEFS.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
          </select>
        </div>
      </Card>
      <PersonalReportCard date={date} act={act} people={people} onOpenDay={(d) => { onDateChange(d); document.getElementById('main')?.scrollTo({ top: 0 }); }} onGender={setGender} showDetail={false} />
    </div>
  );
};

export default PersonalSection;
