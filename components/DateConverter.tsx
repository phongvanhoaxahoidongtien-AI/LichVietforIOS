
import React, { useState } from 'react';
import { getLunarDate } from '../services/lunarCalendar';
import { ArrowRightLeft } from 'lucide-react';

const DateConverter: React.FC = () => {
  const [solarDate, setSolarDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const lunar = getLunarDate(new Date(solarDate));

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Đổi ngày Âm Dương</h2>
      
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm mb-6">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Ngày Dương Lịch</label>
        <input 
          type="date" 
          value={solarDate}
          onChange={(e) => setSolarDate(e.target.value)}
          className="w-full text-xl font-medium text-gray-800 bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-red-100 transition-all"
        />
      </div>

      <div className="flex justify-center mb-6">
        <div className="bg-red-50 p-3 rounded-full text-red-600">
          <ArrowRightLeft size={24} />
        </div>
      </div>

      <div className="bg-red-600 rounded-3xl p-6 shadow-lg text-white">
        <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3 block">Kết quả Âm Lịch</label>
        <div className="flex flex-col gap-1">
          <span className="text-3xl font-bold">Mùng {lunar.day} tháng {lunar.month}</span>
          <span className="text-lg text-white/80">Năm {lunar.year} (Giáp Thìn)</span>
        </div>
        
        <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] text-white/50 block uppercase font-bold">Tiết khí</span>
            <span className="text-sm font-medium">Lập Xuân</span>
          </div>
          <div>
            <span className="text-[10px] text-white/50 block uppercase font-bold">Ngày</span>
            <span className="text-sm font-medium">Canh Thân</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateConverter;
