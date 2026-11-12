import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import type { Verdict } from '../services/almanac';

export const Card: React.FC<{ className?: string; children: React.ReactNode; testId?: string }> = ({ className = '', children, testId }) => (
  <section data-testid={testId} className={`bg-white rounded-3xl border border-giay-200 shadow-sm p-5 ${className}`}>{children}</section>
);

export const SectionTitle: React.FC<{ icon?: React.ReactNode; title: string; right?: React.ReactNode; tone?: 'son' | 'kim' | 'green' | 'blue' }> = ({ icon, title, right, tone = 'son' }) => {
  const tones = { son: 'bg-son-50 text-son-600', kim: 'bg-kim-50 text-kim-700', green: 'bg-green-50 text-green-700', blue: 'bg-blue-50 text-blue-700' };
  return (
    <div className="flex items-center justify-between mb-4 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        {icon && <span className={`p-2 rounded-xl shrink-0 ${tones[tone]}`}>{icon}</span>}
        <h3 className="font-serif text-base font-bold text-muc truncate">{title}</h3>
      </div>
      {right}
    </div>
  );
};

export const VERDICT_STYLE: Record<Verdict, { bg: string; text: string; dot: string; ring: string }> = {
  'Rất tốt': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-600', ring: 'ring-green-200' },
  'Tốt': { bg: 'bg-emerald-50', text: 'text-green-700', dot: 'bg-emerald-500', ring: 'ring-emerald-200' },
  'Bình thường': { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-300', ring: 'ring-gray-200' },
  'Xấu': { bg: 'bg-son-50', text: 'text-son-600', dot: 'bg-son-400', ring: 'ring-son-200' },
  'Rất xấu': { bg: 'bg-son-50', text: 'text-son-700', dot: 'bg-son-700', ring: 'ring-son-200' },
};

export const VerdictBadge: React.FC<{ verdict: Verdict; score?: number; size?: 'sm' | 'md' }> = ({ verdict, score, size = 'md' }) => {
  const s = VERDICT_STYLE[verdict];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-bold ${s.bg} ${s.text} ${size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1'}`}>
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      {verdict}{score != null && <span className="opacity-70 font-semibold">· {score}</span>}
    </span>
  );
};

export const ScoreRing: React.FC<{ score: number; label?: string; size?: number }> = ({ score, label, size = 88 }) => {
  const r = 36, c = 2 * Math.PI * r;
  const color = score >= 75 ? '#15803D' : score >= 60 ? '#10B981' : score >= 45 ? '#A89A86' : score >= 30 ? '#DA5B4F' : '#921D17';
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Điểm ${score} trên 100`}>
      <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" stroke="currentColor" strokeOpacity=".1" strokeWidth="8" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-2xl font-bold leading-none" style={{ color }}>{score}</span>
        {label && <span className="text-[0.625rem] text-gray-500 font-semibold mt-0.5">{label}</span>}
      </div>
    </div>
  );
};

export const Segmented = <T extends string>({ value, options, onChange, className = '' }: { value: T; options: { value: T; label: string; icon?: React.ReactNode }[]; onChange: (v: T) => void; className?: string }) => (
  <div role="tablist" className={`flex p-1 bg-giay-100 rounded-2xl gap-1 ${className}`}>
    {options.map((o) => (
      <button
        key={o.value}
        role="tab"
        aria-selected={value === o.value}
        onClick={() => onChange(o.value)}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-sm font-bold transition-all ${value === o.value ? 'bg-white text-son-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
      >
        {o.icon}{o.label}
      </button>
    ))}
  </div>
);

export const Sheet: React.FC<{ open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode }> = ({ open, onClose, title, subtitle, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 animate-fade-in" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 pb-10 shadow-2xl animate-sheet-up max-h-[88vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 shrink-0" />
        <div className="flex justify-between items-start mb-4 shrink-0 gap-3">
          <div>
            <h3 className="font-serif text-xl font-bold text-muc">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Đóng" className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto no-scrollbar flex-1">{children}</div>
      </div>
    </div>
  );
};

export const Toast: React.FC<{ message: string | null; onDone: () => void }> = ({ message, onDone }) => {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [message, onDone]);
  if (!message) return null;
  return (
    <div className="fixed inset-x-0 bottom-24 z-[120] flex justify-center px-4 pointer-events-none">
      <div role="status" className="max-w-sm w-fit px-4 py-3 rounded-2xl bg-muc text-white text-sm font-semibold shadow-xl animate-slide-up text-center">
        {message}
      </div>
    </div>
  );
};

export const WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

export const lunarDayLabel = (d: number) => (d === 1 ? 'Mùng 1' : d <= 10 ? `Mùng ${d}` : d === 15 ? 'Rằm' : `${d}`);

/* ---- 12 Trực ---- */
export const TRUC_STYLE: Record<'tot' | 'binh' | 'xau', { chip: string; text: string; label: string }> = {
  tot: { chip: 'bg-green-50 text-green-700 border-green-100', text: 'text-green-700', label: 'Tốt' },
  binh: { chip: 'bg-kim-50 text-kim-700 border-amber-100', text: 'text-kim-700', label: 'Bình hòa' },
  xau: { chip: 'bg-son-50 text-son-700 border-red-100', text: 'text-son-600', label: 'Xấu' },
};

export const TrucBadge: React.FC<{ name: string; tone: 'tot' | 'binh' | 'xau'; onClick?: () => void; className?: string }> = ({ name, tone, onClick, className = '' }) => {
  const st = TRUC_STYLE[tone];
  const cls = `inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold ${st.chip} ${className}`;
  const body = <>Trực {name} · {st.label}</>;
  return onClick
    ? <button type="button" onClick={onClick} className={cls} data-testid="truc-badge">{body}</button>
    : <span className={cls} data-testid="truc-badge">{body}</span>;
};
