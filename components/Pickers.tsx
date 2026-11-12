import React from 'react';
import { ACTIVITY_DEFS, ACTIVITIES, ACT_DEF, personInfo, type ActivityKey } from '../services/almanac';
import { YEAR_MIN, YEAR_MAX, type Member } from '../services/family';

/** Chọn việc: 8 việc hay dùng dạng nút, các việc khác trong danh sách. */
export const ActivityPicker: React.FC<{ value: ActivityKey; onChange: (k: ActivityKey) => void }> = ({ value, onChange }) => {
  const groups = Array.from(new Set(ACTIVITY_DEFS.map((d) => d.group)));
  const isMain = ACTIVITIES.some((a) => a.key === value);
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {ACTIVITIES.map((a) => (
          <button key={a.key} type="button" onClick={() => onChange(a.key)} aria-pressed={value === a.key}
            className={`px-3 py-2.5 rounded-2xl text-sm font-bold text-left border transition-all ${value === a.key ? 'bg-son-600 text-white border-son-600 shadow-sm' : 'bg-giay text-gray-700 border-giay-200'}`}>{a.short}</button>
        ))}
      </div>
      <select value={isMain ? '' : value} onChange={(e) => e.target.value && onChange(e.target.value as ActivityKey)} aria-label="Việc khác"
        className={`mt-2 w-full rounded-2xl px-3 py-3 font-semibold border ${!isMain ? 'bg-son-600 text-white border-son-600' : 'bg-giay text-gray-700 border-giay-200'}`}>
        <option value="">Việc khác… (mua xe, nhập học, đặt bàn thờ…)</option>
        {groups.map((g) => (
          <optgroup key={g} label={g}>
            {ACTIVITY_DEFS.filter((d) => d.group === g).map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
          </optgroup>
        ))}
      </select>
      {!isMain && <p className="text-xs text-gray-500 mt-1">Đang chọn: {ACT_DEF[value].label}</p>}
    </div>
  );
};

const YEARS = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => YEAR_MAX - i);

/** Chọn năm sinh trong danh sách (kèm can chi), có nhóm "Người trong nhà". */
export const YearSelect: React.FC<{ value: number | null; onChange: (y: number | null, member?: Member) => void; family: Member[]; label: string; id: string }> = ({ value, onChange, family, label, id }) => (
  <div className="flex-1 min-w-0">
    <label htmlFor={id} className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">{label}</label>
    <select id={id} value={value ?? ''} onChange={(e) => {
      const v = e.target.value;
      if (!v) return onChange(null);
      if (v.startsWith('m:')) { const m = family.find((x) => x.id === v.slice(2)); if (m) onChange(m.birthYear, m); return; }
      onChange(+v);
    }} className="w-full bg-giay border border-giay-200 rounded-2xl px-3 py-3 font-semibold text-muc">
      <option value="">Chọn năm sinh</option>
      {family.length > 0 && (
        <optgroup label="Người trong nhà">
          {family.map((m) => <option key={m.id} value={`m:${m.id}`}>{m.name} · {m.birthYear} · {personInfo({ birthYear: m.birthYear }).canChi}</option>)}
        </optgroup>
      )}
      <optgroup label="Năm sinh (âm lịch)">
        {value != null && (value < YEAR_MIN || value > YEAR_MAX) && <option value={value}>{value} · {personInfo({ birthYear: value }).canChi}</option>}
        {YEARS.map((y) => <option key={y} value={y}>{y} · {personInfo({ birthYear: y }).canChi}</option>)}
      </optgroup>
    </select>
  </div>
);
