
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Heart, Truck, Store } from 'lucide-react';
import { getLunarDate, getAuspiciousActivities } from '../services/lunarCalendar';

interface MonthCalendarProps {
  date: Date;
  onDateSelect: (d: Date) => void;
}

const MonthCalendar: React.FC<MonthCalendarProps> = ({ date, onDateSelect }) => {
  const [currentView, setCurrentView] = useState(new Date(date.getFullYear(), date.getMonth(), 1));

  // Swipe gesture state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const daysInMonth = new Date(currentView.getFullYear(), currentView.getMonth() + 1, 0).getDate();
  const startDay = new Date(currentView.getFullYear(), currentView.getMonth(), 1).getDay();

  const changeMonth = (offset: number) => {
    setCurrentView(new Date(currentView.getFullYear(), currentView.getMonth() + offset, 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 70;
    const isRightSwipe = distance < -70;

    if (isLeftSwipe) changeMonth(1);
    if (isRightSwipe) changeMonth(-1);

    setTouchStart(null);
    setTouchEnd(null);
  };

  const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <div 
      className="p-6 overflow-x-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 animate-in fade-in slide-in-from-left-4 duration-300">
          Tháng {currentView.getMonth() + 1}, {currentView.getFullYear()}
        </h2>
        <div className="flex gap-2">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekdays.map((wd, i) => (
          <div key={wd} className={`text-center py-2 text-xs font-bold ${i === 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {wd}
          </div>
        ))}
        
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="p-2"></div>
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const d = new Date(currentView.getFullYear(), currentView.getMonth(), day);
          const lunar = getLunarDate(d);
          const auspicious = getAuspiciousActivities(d);
          
          const isWedding = auspicious.good.includes("Cưới hỏi");
          const isMoving = auspicious.good.includes("Chuyển nhà");
          const isOpening = auspicious.good.includes("Khai trương");

          const isToday = d.toDateString() === new Date().toDateString();
          const isSelected = d.toDateString() === date.toDateString();

          return (
            <button 
              key={`${currentView.getMonth()}-${day}`} 
              onClick={() => onDateSelect(d)}
              className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all h-16 animate-in fade-in duration-300 ${
                isSelected ? 'bg-red-600 text-white shadow-lg scale-105 z-10' : 
                isToday ? 'bg-red-50 text-red-600 border border-red-100' : 'hover:bg-gray-50'
              }`}
            >
              <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>{day}</span>
              <span className={`text-[9px] font-medium leading-tight ${isSelected ? 'text-white/80' : (lunar.day === 1 || lunar.day === 15) ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                {(lunar.day === 1 || lunar.day === 15) ? `${lunar.day}/${lunar.month}` : lunar.day}
              </span>
              
              {/* Activity Indicators */}
              <div className="flex gap-0.5 mt-1">
                {isWedding && <Heart size={7} className={`${isSelected ? 'text-white' : 'text-pink-500'} fill-current`} />}
                {isOpening && <Store size={7} className={`${isSelected ? 'text-white' : 'text-green-500'} fill-current`} />}
                {isMoving && <Truck size={7} className={`${isSelected ? 'text-white' : 'text-blue-500'} fill-current`} />}
              </div>

              {(lunar.day === 1 || lunar.day === 15) && (
                <div className={`absolute top-1.5 right-1.5 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-amber-400'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-8 space-y-4">
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4 items-start">
          <div className="bg-amber-100 p-2 rounded-lg text-amber-700">
            <ChevronRight size={16} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-800">Chú thích ngày âm</h4>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              Vào ngày <span className="font-bold">Mùng 1</span> và <span className="font-bold">Rằm</span>, lịch sẽ hiển thị rõ tháng âm (ví dụ 1/1, 15/1) và có dấu chấm vàng đánh dấu.
            </p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 grid grid-cols-3 gap-2">
          <div className="flex items-center gap-1.5">
            <Heart size={12} className="text-pink-500 fill-current" />
            <span className="text-[10px] font-bold text-gray-600">Cưới hỏi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Store size={12} className="text-green-500 fill-current" />
            <span className="text-[10px] font-bold text-gray-600">Khai trương</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Truck size={12} className="text-blue-500 fill-current" />
            <span className="text-[10px] font-bold text-gray-600">Chuyển nhà</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthCalendar;
