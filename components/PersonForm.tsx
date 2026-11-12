import React, { useState, useEffect } from 'react';
import { personInfo, type Person } from '../services/almanac';

/** Ô nhập năm sinh âm lịch, hiển thị can chi và mệnh. */
const PersonForm: React.FC<{ value: Person | null; onChange: (p: Person | null) => void; label?: string; showGender?: boolean }> = ({ value, onChange, label = 'Năm sinh (âm lịch)', showGender = false }) => {
  const [text, setText] = useState(value ? String(value.birthYear) : '');
  useEffect(() => { setText(value ? String(value.birthYear) : ''); }, [value?.birthYear]);
  const y = parseInt(text, 10);
  const valid = y >= 1900 && y <= 2099;
  const pi = valid ? personInfo({ birthYear: y }) : null;

  return (
    <div>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">{label}</label>
      <div className="flex gap-2">
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          placeholder="VD: 1985"
          value={text}
          onChange={(e) => {
            const t = e.target.value.replace(/\D/g, '').slice(0, 4);
            setText(t);
            const n = parseInt(t, 10);
            if (n >= 1900 && n <= 2099) onChange({ birthYear: n, gender: value?.gender });
            else if (!t) onChange(null);
          }}
          className="w-28 bg-giay border border-giay-200 rounded-2xl px-4 py-3 text-lg font-bold text-muc focus:ring-2 focus:ring-son-200 outline-none"
          aria-describedby="person-hint"
        />
        {showGender && (
          <select
            value={value?.gender || ''}
            onChange={(e) => valid && onChange({ birthYear: y, gender: (e.target.value || undefined) as Person['gender'] })}
            className="bg-giay border border-giay-200 rounded-2xl px-3 py-3 font-semibold text-muc"
            aria-label="Giới tính"
          >
            <option value="">Giới tính</option>
            <option value="nam">Nam</option>
            <option value="nu">Nữ</option>
          </select>
        )}
        <div id="person-hint" className="flex-1 min-w-0 flex flex-col justify-center text-sm">
          {pi ? (
            <>
              <span className="font-bold text-son-600 truncate">Tuổi {pi.canChi}</span>
              <span className="text-xs text-gray-500 truncate">Mệnh {pi.napAm.name}</span>
            </>
          ) : text.length === 4 ? <span className="text-xs text-son-600">Nhập năm từ 1900 đến 2099</span> : <span className="text-xs text-gray-500">Năm sinh theo lịch âm (người sinh trước Tết lấy năm trước)</span>}
        </div>
      </div>
    </div>
  );
};

export default PersonForm;
