
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, RefreshCw, Bell, Activity, Home, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { TabType, Reminder, RitualSettings } from './types';
import DailyBlock from './components/DailyBlock';
import MonthCalendar from './components/MonthCalendar';
import DateConverter from './components/DateConverter';
import Reminders from './components/Reminders';
import CustomsInfo from './components/CustomsInfo';
import Biorhythm from './components/Biorhythm';

const DEFAULT_RITUAL_SETTINGS: RitualSettings = {
  remindFirst: true,
  remindFullMoon: true,
  remindFourteenth: false,
  remindLastDay: false,
  reminderTime: '08:00'
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.DAILY);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [ritualSettings, setRitualSettings] = useState<RitualSettings>(DEFAULT_RITUAL_SETTINGS);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Load reminders and settings from local storage
  useEffect(() => {
    const savedReminders = localStorage.getItem('viet-calendar-reminders');
    if (savedReminders) {
      setReminders(JSON.parse(savedReminders));
    }

    const savedSettings = localStorage.getItem('viet-calendar-ritual-settings');
    if (savedSettings) {
      setRitualSettings(JSON.parse(savedSettings));
    }
  }, []);

  const saveReminders = (updated: Reminder[]) => {
    setReminders(updated);
    localStorage.setItem('viet-calendar-reminders', JSON.stringify(updated));
  };

  const saveRitualSettings = (updated: RitualSettings) => {
    setRitualSettings(updated);
    localStorage.setItem('viet-calendar-ritual-settings', JSON.stringify(updated));
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(selectedDate.getDate() + 1);
    setSelectedDate(next);
  };

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(selectedDate.getDate() - 1);
    setSelectedDate(prev);
  };

  const renderContent = () => {
    switch (activeTab) {
      case TabType.DAILY:
        return <DailyBlock 
          date={selectedDate} 
          onNextDay={handleNextDay} 
          onPrevDay={handlePrevDay} 
        />;
      case TabType.MONTHLY:
        return <MonthCalendar date={selectedDate} onDateSelect={(d) => {
          setSelectedDate(d);
          setActiveTab(TabType.DAILY);
        }} />;
      case TabType.CONVERTER:
        return <DateConverter />;
      case TabType.REMINDERS:
        return <Reminders 
          reminders={reminders} 
          ritualSettings={ritualSettings}
          onAdd={(r) => saveReminders([...reminders, r])}
          onDelete={(id) => saveReminders(reminders.filter(r => r.id !== id))}
          onUpdateRitualSettings={saveRitualSettings}
        />;
      case TabType.CUSTOMS:
        return <CustomsInfo />;
      case TabType.BIORHYTHM:
        return <Biorhythm />;
      default:
        return <DailyBlock date={selectedDate} />;
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white overflow-hidden shadow-2xl">
      {/* Header */}
      <header className="px-6 py-4 pt-10 bg-white/80 backdrop-blur-md flex justify-between items-center border-b border-gray-100 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-red-700">Lịch Việt</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">
            {selectedDate.toLocaleDateString('vi-VN', { weekday: 'long' })}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
        {renderContent()}
      </main>

      {/* Navigation Tab Bar (iOS Style - 6 Tabs) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass-morphism safe-area-bottom flex justify-between items-center h-16 border-t border-gray-100 px-1 z-20">
        <NavButton 
          active={activeTab === TabType.DAILY} 
          icon={<Calendar size={20} />} 
          label="Hôm nay" 
          onClick={() => setActiveTab(TabType.DAILY)} 
        />
        <NavButton 
          active={activeTab === TabType.MONTHLY} 
          icon={<Clock size={20} />} 
          label="Tháng" 
          onClick={() => setActiveTab(TabType.MONTHLY)} 
        />
        <NavButton 
          active={activeTab === TabType.CONVERTER} 
          icon={<RefreshCw size={20} />} 
          label="Đổi ngày" 
          onClick={() => setActiveTab(TabType.CONVERTER)} 
        />
        <NavButton 
          active={activeTab === TabType.REMINDERS} 
          icon={<Bell size={20} />} 
          label="Nhắc lịch" 
          onClick={() => setActiveTab(TabType.REMINDERS)} 
        />
        <NavButton 
          active={activeTab === TabType.CUSTOMS} 
          icon={<BookOpen size={20} />} 
          label="Phong tục" 
          onClick={() => setActiveTab(TabType.CUSTOMS)} 
        />
        <NavButton 
          active={activeTab === TabType.BIORHYTHM} 
          icon={<Activity size={20} />} 
          label="Nhịp sinh học" 
          onClick={() => setActiveTab(TabType.BIORHYTHM)} 
        />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean, icon: React.ReactNode, label: string, onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all ${active ? 'text-red-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`}
  >
    {icon}
    <span className="text-[10px] font-medium leading-none">{label}</span>
  </button>
);

export default App;
