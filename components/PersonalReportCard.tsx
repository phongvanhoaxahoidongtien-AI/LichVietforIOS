import React, { useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock, Compass, Lightbulb, ArrowRight, ImageDown, ChevronDown, Home, BookOpen, Check, X } from 'lucide-react';
import { ACT_DEF, personInfo, type ActivityKey } from '../services/almanac';
import { getYearCanChi, getLunarDate } from '../services/lunarCalendar';
import { personalReport, nearGoodDays, borrowSuggestions, cungInfo, RITUALS, LEVEL_LABEL, type PersonView, type Level } from '../services/personal';
import { renderReportImage } from '../services/reportImage';
import { shareOrDownloadImage } from '../services/appShare';
import { loadFamily } from '../services/family';
import { useApp } from '../context';
import { Card, WEEKDAYS } from './ui';

const fmt = (d: Date) => `${WEEKDAYS[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
const LEVEL_STYLE: Record<Level, { text: string; ring: string; bg: string; Icon: typeof CheckCircle2 }> = {
  nen: { text: 'text-green-700', ring: '#1F7A3A', bg: 'bg-green-50 border-green-100', Icon: CheckCircle2 },
  'can-nhac': { text: 'text-kim-700', ring: '#C98A10', bg: 'bg-kim-50 border-amber-100', Icon: AlertTriangle },
  'khong-nen': { text: 'text-son-600', ring: '#B3261E', bg: 'bg-son-50 border-red-100', Icon: XCircle },
};
const HOUSE_BASES = new Set(['dong-tho', 'nhap-trach']);

export function levelSentence(level: Level, act: ActivityKey): string {
  const name = ACT_DEF[act].label.split(',')[0].toLowerCase();
  return level === 'nen' ? `Nên ${name} ngày này` : level === 'can-nhac' ? `Có thể ${name}, nhưng nên cân nhắc` : `Không nên ${name} ngày này`;
}

const Ring: React.FC<{ score: number; color: string }> = ({ score, color }) => {
  const r = 30, c = 2 * Math.PI * r;
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" role="img" aria-label={`Điểm phù hợp ${score} trên 100`} className="shrink-0">
      <circle cx="38" cy="38" r={r} fill="none" stroke="currentColor" className="text-giay-200" strokeWidth="7" />
      <circle cx="38" cy="38" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(c * score) / 100} ${c}`} transform="rotate(-90 38 38)" />
      <text x="38" y="40" textAnchor="middle" fontSize="20" fontWeight="700" fill={color}>{score}</text>
      <text x="38" y="55" textAnchor="middle" fontSize="10" fill="currentColor" className="text-gray-500">/100</text>
    </svg>
  );
};

/** Phiếu đánh giá ngày cho riêng người xem. */
const PersonalReportCard: React.FC<{
  date: Date; act: ActivityKey; people: PersonView[];
  onOpenDay?: (d: Date) => void; onGender?: (g: 'nam' | 'nu') => void; extra?: React.ReactNode; showDetail?: boolean;
}> = ({ date, act, people, onOpenDay, onGender, extra, showDetail = true }) => {
  const { toast } = useApp();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const r = useMemo(() => personalReport(date, act, people), [date, act, people]);
  const near = useMemo(() => (r.level === 'nen' ? [] : nearGoodDays(date, act, people)), [r.level, date, act, people]);
  const def = ACT_DEF[act];
  const isHouse = HOUSE_BASES.has(def.base) || act === 'dat-ban-tho' || act === 'mua-nha';
  const owner = people[0];
  const borrow = useMemo(() => (owner && HOUSE_BASES.has(def.base) && r.yearBad.length ? borrowSuggestions(r.info, act, owner, loadFamily()) : null), [owner, def.base, r, act]);
  const cung = owner?.gender ? cungInfo(owner.birthYear, owner.gender) : null;
  const st = LEVEL_STYLE[r.level];

  const advice: string[] = [];
  if (r.level !== 'nen' && near.length) advice.push(`Ngày phù hợp gần nhất: ${near.map((n) => `${n.date.getDate()}/${n.date.getMonth() + 1} (${n.score} điểm)`).join(', ')}.`);
  if (r.yearBad.length && owner) {
    advice.push(r.nextClearYear && r.nextClearYear !== r.info.lunar.year
      ? `Năm ${getYearCanChi(r.info.lunar.year)} phạm ${r.yearBad.join(', ')}. Năm gần nhất không phạm: ${getYearCanChi(r.nextClearYear)} (${r.nextClearYear}).`
      : `Năm ${getYearCanChi(r.info.lunar.year)} phạm ${r.yearBad.join(', ')}.`);
    if (borrow) advice.push(`Nếu không chờ được: nhờ người hợp tuổi đứng lễ (mượn tuổi), ví dụ sinh ${borrow.examples.slice(0, 4).map((e) => `${e.birthYear} (${e.canChi})`).join(', ')}.`);
    if (def.base === 'cuoi-hoi') advice.push('Kim Lâu xét theo tuổi mụ cô dâu; nhiều gia đình chọn cưới trước Tết hoặc dời sang năm không phạm.');
  }
  if (!r.blocked && r.goodHours.length) advice.push(`Giờ tốt hợp tuổi: ${r.goodHours.slice(0, 4).map((h) => `${h.branch} (${h.range})`).join(', ')}.`);
  if (cung && isHouse) advice.push(`Hướng nhà, hướng bàn thờ hợp tuổi (${cung.cung}): ${cung.good.map((g) => g.dir).join(', ')}.`);

  const onSave = async () => {
    setSaving(true);
    try {
      const url = await renderReportImage(r, advice);
      const res = await shareOrDownloadImage(url, `xem-ngay-${r.date.getDate()}-${r.date.getMonth() + 1}-${r.date.getFullYear()}.png`, 'Phiếu xem ngày');
      if (res === 'downloaded') toast('Đã lưu ảnh phiếu xem ngày.');
    } catch { toast('Không tạo được ảnh phiếu.'); }
    setSaving(false);
  };

  return (
    <Card className="animate-slide-up" testId="personal-report">
      <div className="text-sm text-gray-500 font-semibold">{fmt(date)} · âm {r.info.lunar.day}/{r.info.lunar.month}{r.info.lunar.leap ? ' nhuận' : ''} · ngày {r.info.canChi.day}</div>
      <div className="text-sm text-gray-600 mt-0.5">
        <b className="text-muc">{def.short}</b>
        {people.length > 0 && <> · {people.map((p) => `${p.name ? p.name + ' ' : ''}${p.birthYear} ${personInfo(p).canChi}`).join(' · ')}{r.ownerAge ? `, tuổi mụ ${r.ownerAge}` : ''}</>}
      </div>

      <div className="flex items-center gap-3 mt-3">
        <span className={st.text}><Ring score={r.score} color={st.ring} /></span>
        <div className="min-w-0">
          <h3 className={`font-serif text-xl font-bold leading-snug flex items-start gap-1.5 ${st.text}`} data-testid="ask-verdict" data-level={r.level}>
            <st.Icon size={22} className="shrink-0 mt-0.5" />{levelSentence(r.level, act)}
          </h3>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full border text-xs font-bold ${st.bg} ${st.text}`} data-testid="report-level">{LEVEL_LABEL[r.level]} · {r.score}/100</span>
        </div>
      </div>
      {r.mainReasons.length > 0 && (
        <p className="mt-3 text-sm text-gray-800" data-testid="report-reasons"><b>{r.level === 'nen' ? 'Vì sao tốt:' : 'Lý do chính:'}</b> {r.mainReasons.join('; ')}.</p>
      )}

      <div className="mt-4 space-y-2" data-testid="report-groups">
        {r.groups.map((g) => {
          const ratio = g.points / g.max;
          const tone = ratio >= 0.65 ? 'green' : ratio >= 0.4 ? 'kim' : 'son';
          const open = openGroup === g.key;
          const shown = open ? g.items : g.items.slice(0, 3);
          return (
            <div key={g.key} className={`rounded-2xl border p-3 ${tone === 'green' ? 'bg-green-50 border-green-100' : tone === 'kim' ? 'bg-kim-50 border-amber-100' : 'bg-son-50 border-red-100'}`} data-testid={`group-${g.key}`}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-bold text-muc">{g.title}</span>
                <span className={`text-sm font-bold ${tone === 'green' ? 'text-green-700' : tone === 'kim' ? 'text-kim-700' : 'text-son-600'}`}>{g.points}/{g.max}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/80 mt-1.5 overflow-hidden" aria-hidden>
                <div className={`h-full rounded-full ${tone === 'green' ? 'bg-green-600' : tone === 'kim' ? 'bg-kim-500' : 'bg-son-500'}`} style={{ width: `${Math.round(ratio * 100)}%` }} />
              </div>
              <ul className="mt-2 space-y-0.5">
                {shown.map((it, i) => (
                  <li key={i} className={`text-sm flex gap-1.5 ${it.good ? 'text-green-800' : 'text-son-700'}`}>
                    {it.good ? <Check size={14} className="shrink-0 mt-0.5" /> : <X size={14} className="shrink-0 mt-0.5" />}<span>{it.text}</span>
                  </li>
                ))}
              </ul>
              {g.items.length > 3 && (
                <button type="button" onClick={() => setOpenGroup(open ? null : g.key)} className="mt-1 text-xs font-bold text-blue-700 flex items-center gap-0.5">
                  {open ? 'Thu gọn' : `Xem thêm ${g.items.length - 3} mục`}<ChevronDown size={14} className={open ? 'rotate-180' : ''} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {extra}

      {/* Lời khuyên */}
      <div className="mt-4 p-3 rounded-2xl bg-giay border border-giay-200" data-testid="report-advice">
        <div className="text-sm font-bold text-muc flex items-center gap-1.5"><Lightbulb size={16} className="text-kim-700" /> Lời khuyên{owner ? ` cho tuổi ${personInfo(owner).canChi}` : ''}</div>
        <ul className="mt-1 space-y-1">
          {advice.length ? advice.map((a, i) => <li key={i} className="text-sm text-gray-700">• {a}</li>) : <li className="text-sm text-gray-700">• Ngày phù hợp, có thể tiến hành theo kế hoạch.</li>}
        </ul>
        {borrow && borrow.family.length > 0 && (
          <p className="text-sm text-green-800 mt-1" data-testid="borrow-family">• Người trong nhà có thể đứng lễ: {borrow.family.map((m) => `${m.name} (${m.birthYear}, ${m.canChi})`).join(', ')}.</p>
        )}
        {near.length > 0 && onOpenDay && (
          <div className="flex flex-wrap gap-2 mt-2" data-testid="report-near">
            {near.map((n) => (
              <button key={n.date.getTime()} type="button" onClick={() => onOpenDay(n.date)} className="px-3 py-1.5 rounded-full bg-white border border-green-100 text-sm font-bold text-green-700 flex items-center gap-1">
                {fmt(n.date)} · âm {getLunarDate(n.date).day}/{getLunarDate(n.date).month} · {n.score}<ArrowRight size={13} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hướng xuất hành, cung mệnh */}
      <div className="mt-3 grid grid-cols-1 gap-2">
        {!r.blocked && r.goodHours.length > 0 && (
          <p className="text-sm"><Clock size={14} className="inline -mt-0.5 text-kim-700" /> <b className="text-kim-700">Giờ tốt hợp tuổi:</b> {r.goodHours.map((h) => `${h.branch} (${h.range})`).join(', ')}</p>
        )}
        <p className="text-sm"><Compass size={14} className="inline -mt-0.5 text-blue-700" /> <b className="text-blue-700">Hướng xuất hành:</b> Hỷ thần {r.info.directions.hyThan}, Tài thần {r.info.directions.taiThan}{r.info.directions.hacThan ? `; tránh ${r.info.directions.hacThan}` : ''}</p>
      </div>
      {isHouse && owner && (
        cung ? (
          <div className="mt-3 p-3 rounded-2xl border border-blue-100 bg-blue-50" data-testid="report-cung">
            <div className="text-sm font-bold text-blue-800 flex items-center gap-1.5"><Home size={15} /> Cung mệnh {owner.gender === 'nam' ? 'nam' : 'nữ'} {owner.birthYear}: {cung.cung} ({cung.element}) · {cung.group}</div>
            <p className="text-sm text-gray-700 mt-1"><b className="text-green-700">Hướng tốt:</b> {cung.good.map((g) => `${g.dir} (${g.name} – ${g.note})`).join('; ')}.</p>
            <p className="text-sm text-gray-700 mt-0.5"><b className="text-son-600">Hướng xấu:</b> {cung.bad.map((g) => `${g.dir} (${g.name})`).join('; ')}.</p>
            {onGender && <button type="button" onClick={() => onGender(owner.gender === 'nam' ? 'nu' : 'nam')} className="mt-1 text-xs font-bold text-blue-700 underline">Đổi sang {owner.gender === 'nam' ? 'nữ' : 'nam'}</button>}
          </div>
        ) : onGender ? (
          <div className="mt-3 p-3 rounded-2xl border border-blue-100 bg-blue-50" data-testid="report-cung-ask">
            <div className="text-sm font-bold text-blue-800 flex items-center gap-1.5"><Home size={15} /> Xem hướng nhà hợp tuổi (cung mệnh)</div>
            <p className="text-sm text-gray-700 mt-0.5">Cung mệnh nam và nữ cùng năm sinh khác nhau. Gia chủ {owner.birthYear} là:</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button type="button" onClick={() => onGender('nam')} className="py-2 rounded-xl bg-white border border-blue-100 font-bold text-blue-800">Nam</button>
              <button type="button" onClick={() => onGender('nu')} className="py-2 rounded-xl bg-white border border-blue-100 font-bold text-blue-800">Nữ</button>
            </div>
          </div>
        ) : null
      )}

      {RITUALS[def.base] && (
        <details className="mt-3 rounded-2xl border border-giay-200 p-3 group" data-testid="report-ritual">
          <summary className="text-sm font-bold text-muc cursor-pointer flex items-center gap-1.5 list-none"><BookOpen size={15} className="text-son-600" /> {RITUALS[def.base].title}<ChevronDown size={15} className="ml-auto group-open:rotate-180 transition-transform" /></summary>
          <ol className="mt-2 space-y-1 list-decimal pl-5">
            {RITUALS[def.base].steps.map((s, i) => <li key={i} className="text-sm text-gray-700">{s}</li>)}
          </ol>
          <p className="text-xs text-gray-500 italic mt-2">Phong tục mỗi vùng có khác nhau, tham khảo thêm người cao tuổi trong gia đình.</p>
        </details>
      )}

      <div className={`grid gap-2 mt-4 ${onOpenDay && showDetail ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <button type="button" onClick={onSave} disabled={saving} className="py-2.5 rounded-2xl border border-giay-200 font-bold text-gray-700 flex items-center justify-center gap-1.5" data-testid="report-save">
          <ImageDown size={16} /> {saving ? 'Đang tạo…' : 'Lưu ảnh phiếu'}
        </button>
        {onOpenDay && showDetail ? (
          <button type="button" onClick={() => onOpenDay(date)} className="py-2.5 rounded-2xl bg-son-600 text-white font-bold flex items-center justify-center gap-1.5">Chi tiết ngày <ArrowRight size={16} /></button>
        ) : null}
      </div>
      <p className="text-xs text-gray-500 mt-3 italic">Điểm phù hợp = chất lượng ngày (40) + ngày kỵ (15) + hợp tuổi (30) + hạn năm cho việc (15). Mang tính tham khảo văn hóa dân gian.</p>
    </Card>
  );
};

export default PersonalReportCard;
