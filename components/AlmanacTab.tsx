import React from 'react';
import { CalendarSearch, ScrollText, ArrowRightLeft, MessageCircleQuestion } from 'lucide-react';
import { Segmented } from './ui';
import DayDetail from './DayDetail';
import TrachNgay from './TrachNgay';
import DateConverter from './DateConverter';
import HoiNhanh from './HoiNhanh';

export type AlmanacSub = 'ask' | 'detail' | 'pick' | 'convert';

const AlmanacTab: React.FC<{ date: Date; onDateChange: (d: Date) => void; sub: AlmanacSub; onSubChange: (s: AlmanacSub) => void }> = ({ date, onDateChange, sub, onSubChange }) => {
  const openDay = (d: Date) => { onDateChange(d); onSubChange('detail'); document.getElementById('main')?.scrollTo({ top: 0 }); };
  return (
    <div className="p-4 pb-8 space-y-4">
      <Segmented<AlmanacSub>
        value={sub}
        onChange={onSubChange}
        className="!gap-0.5"
        options={[
          { value: 'ask', label: 'Hỏi nhanh', icon: <MessageCircleQuestion size={15} /> },
          { value: 'detail', label: 'Xem ngày', icon: <ScrollText size={15} /> },
          { value: 'pick', label: 'Chọn ngày', icon: <CalendarSearch size={15} /> },
          { value: 'convert', label: 'Đổi ngày', icon: <ArrowRightLeft size={15} /> },
        ]}
      />
      {sub === 'ask' && <HoiNhanh viewingDate={date} onOpenDay={openDay} />}
      {sub === 'detail' && <DayDetail date={date} onDateChange={onDateChange} />}
      {sub === 'pick' && <TrachNgay onOpenDay={openDay} />}
      {sub === 'convert' && <DateConverter onOpenDay={openDay} />}
    </div>
  );
};

export default AlmanacTab;
