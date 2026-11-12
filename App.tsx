import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppContext, type AppCtx } from './context';
import { CalendarDays, CalendarRange, Compass, Bell, LayoutGrid, Share2 } from 'lucide-react';
import ShareApp from './components/ShareApp';
import { TabType, Reminder, RitualSettings, AppSettings } from './types';
import DailyBlock from './components/DailyBlock';
import MonthCalendar from './components/MonthCalendar';
import AlmanacTab, { type AlmanacSub } from './components/AlmanacTab';
import Reminders from './components/Reminders';
import MoreTab from './components/MoreTab';
import { Toast } from './components/ui';
import { KEYS, loadJSON, saveJSON, isObject } from './services/storage';
import { dueItems, showNotification } from './services/reminders';
import type { Person } from './services/almanac';

const DEFAULT_RITUAL_SETTINGS: RitualSettings = {
  remindFirst: true,
  remindFullMoon: true,
  remindFourteenth: false,
  remindLastDay: false,
  reminderTime: '08:00',
};

const DEFAULT_SETTINGS: AppSettings = { theme: 'system', fontScale: 1, notifications: false };


const isReminderList = (v: unknown): v is Reminder[] => Array.isArray(v) && v.every((r) => isObject(r) && typeof r.id === 'string' && typeof r.date === 'string');
const isRitual = (v: unknown): v is RitualSettings => isObject(v) && typeof v.reminderTime === 'string';
const isPerson = (v: unknown): v is Person => isObject(v) && typeof v.birthYear === 'number' && v.birthYear > 1900 && v.birthYear < 2100;

function applyTheme(s: AppSettings) {
  const root = document.documentElement;
  const dark = s.theme === 'dark' || (s.theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', !!dark);
  root.setAttribute('data-font', String(s.fontScale));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#17120E' : '#B3261E');
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.DAILY);
  const [reminders, setReminders] = useState<Reminder[]>(() => loadJSON(KEYS.reminders, [], isReminderList));
  const [ritualSettings, setRitualSettings] = useState<RitualSettings>(() => ({ ...DEFAULT_RITUAL_SETTINGS, ...loadJSON(KEYS.ritual, DEFAULT_RITUAL_SETTINGS, isRitual) }));
  const [settings, setSettings] = useState<AppSettings>(() => ({ ...DEFAULT_SETTINGS, ...loadJSON<Partial<AppSettings>>(KEYS.settings, {}, isObject as never) }));
  const [person, setPersonState] = useState<Person | null>(() => loadJSON<Person | null>(KEYS.person, null, isPerson as never));
  const [selectedDate, setSelectedDate] = useState<Date>(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); });
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [almanacSub, setAlmanacSub] = useState<AlmanacSub>('ask');
  const [shareOpen, setShareOpen] = useState(false);
  const toast = useCallback((m: string) => setToastMsg(m), []);

  useEffect(() => { applyTheme(settings); }, [settings]);
  // thông báo sau khi khôi phục dữ liệu (trang được tải lại)
  useEffect(() => {
    try { const m = sessionStorage.getItem('lich-viet-toast'); if (m) { sessionStorage.removeItem('lich-viet-toast'); setToastMsg(m); } } catch { /* bỏ qua */ }
  }, []);
  useEffect(() => {
    if (settings.theme !== 'system') return;
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const fn = () => applyTheme(settings);
    mq?.addEventListener?.('change', fn);
    return () => mq?.removeEventListener?.('change', fn);
  }, [settings]);

  const updateSettings = useCallback((p: Partial<AppSettings>) => {
    setSettings((prev) => { const next = { ...prev, ...p }; saveJSON(KEYS.settings, next); return next; });
  }, []);

  const setPerson = useCallback((p: Person | null) => {
    setPersonState(p);
    if (p) saveJSON(KEYS.person, p); else saveJSON(KEYS.person, null);
  }, []);

  const saveReminders = (updated: Reminder[]) => {
    setReminders(updated);
    if (!saveJSON(KEYS.reminders, updated)) toast('Không lưu được: bộ nhớ trình duyệt đã đầy.');
  };

  const saveRitualSettings = (updated: RitualSettings) => {
    setRitualSettings(updated);
    saveJSON(KEYS.ritual, updated);
  };

  // Kiểm tra nhắc lịch mỗi 30 giây khi ứng dụng đang mở
  useEffect(() => {
    if (!settings.notifications) return;
    const check = () => {
      const notified = new Set(loadJSON<string[]>(KEYS.notified, []));
      const due = dueItems(new Date(), reminders, ritualSettings).filter((d) => !notified.has(d.key));
      if (!due.length) return;
      due.forEach((d) => { showNotification(d.title, d.body); notified.add(d.key); });
      saveJSON(KEYS.notified, Array.from(notified).slice(-300));
    };
    check();
    const t = setInterval(check, 30000);
    const vis = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', vis); };
  }, [settings.notifications, reminders, ritualSettings]);

  const shiftDay = (n: number) => setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));

  const ctx = useMemo<AppCtx>(() => ({ settings, updateSettings, person, setPerson, toast }), [settings, updateSettings, person, setPerson, toast]);

  const openDetail = (d: Date) => { setSelectedDate(d); setAlmanacSub('detail'); setActiveTab(TabType.ALMANAC); };

  const renderContent = () => {
    switch (activeTab) {
      case TabType.DAILY:
        return <DailyBlock date={selectedDate} onNextDay={() => shiftDay(1)} onPrevDay={() => shiftDay(-1)} onToday={() => { const n = new Date(); setSelectedDate(new Date(n.getFullYear(), n.getMonth(), n.getDate())); }} onOpenDetail={() => { setAlmanacSub('detail'); setActiveTab(TabType.ALMANAC); }} onAsk={() => { setAlmanacSub('ask'); setActiveTab(TabType.ALMANAC); }} reminders={reminders} />;
      case TabType.MONTHLY:
        return <MonthCalendar date={selectedDate} onDateSelect={(d) => { setSelectedDate(d); setActiveTab(TabType.DAILY); }} onOpenDetail={openDetail} />;
      case TabType.ALMANAC:
        return <AlmanacTab date={selectedDate} onDateChange={setSelectedDate} sub={almanacSub} onSubChange={setAlmanacSub} />;
      case TabType.REMINDERS:
        return <Reminders reminders={reminders} ritualSettings={ritualSettings}
          onAdd={(r) => saveReminders([...reminders, r])}
          onDelete={(id) => saveReminders(reminders.filter((r) => r.id !== id))}
          onUpdateRitualSettings={saveRitualSettings} />;
      case TabType.MORE:
        return <MoreTab onClearAll={() => { setReminders([]); setRitualSettings(DEFAULT_RITUAL_SETTINGS); setPersonState(null); setSettings(DEFAULT_SETTINGS); applyTheme(DEFAULT_SETTINGS); }} onShareApp={() => setShareOpen(true)} />;
      default:
        return null;
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode; center?: boolean }[] = [
    { id: TabType.DAILY, label: 'Hôm nay', icon: <CalendarDays size={22} /> },
    { id: TabType.MONTHLY, label: 'Tháng', icon: <CalendarRange size={22} /> },
    { id: TabType.ALMANAC, label: 'Xem ngày', icon: <Compass size={26} />, center: true },
    { id: TabType.REMINDERS, label: 'Nhắc lịch', icon: <Bell size={22} /> },
    { id: TabType.MORE, label: 'Tiện ích', icon: <LayoutGrid size={22} /> },
  ];

  return (
    <AppContext.Provider value={ctx}>
      <div className="app-shell paper-texture flex flex-col h-[100dvh] max-w-md mx-auto overflow-hidden shadow-2xl relative">
        <header className="safe-area-top px-5 pb-3 glass-morphism flex justify-between items-center border-b border-giay-200 sticky top-0 z-10">
          <button onClick={() => setActiveTab(TabType.DAILY)} className="flex items-center gap-2" aria-label="Về trang Hôm nay">
            <span className="w-8 h-8 rounded-xl bg-son-600 text-white font-serif font-bold flex items-center justify-center text-sm shadow-sm">LV</span>
            <span className="font-serif text-lg font-bold text-son-700 leading-none">Lịch Việt</span>
          </button>
          <span className="flex items-center gap-1">
            <span className="text-sm font-semibold text-gray-500 capitalize">
              {selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
            </span>
            <button type="button" onClick={() => setShareOpen(true)} aria-label="Chia sẻ ứng dụng" data-testid="header-share" className="p-2 -mr-2 rounded-full text-son-600 hover:bg-son-50"><Share2 size={19} /></button>
          </span>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar pb-24" id="main">
          <div key={activeTab} className="animate-fade-in">{renderContent()}</div>
        </main>

        <nav className="absolute bottom-0 left-0 right-0 glass-morphism safe-area-bottom border-t border-giay-200 z-20" aria-label="Điều hướng chính">
          <div className="flex justify-between items-end h-16 px-1">
            {tabs.map((t) => {
              const active = activeTab === t.id;
              if (t.center) return (
                <button key={t.id} onClick={() => setActiveTab(t.id)} aria-current={active ? 'page' : undefined}
                  className="flex flex-col items-center justify-end w-full h-full pb-1.5 -mt-4">
                  <span className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${active ? 'bg-son-600 text-white scale-105' : 'bg-gradient-to-b from-son-500 to-son-700 text-kim-100'}`}>{t.icon}</span>
                  <span className={`text-[0.6875rem] font-bold mt-1 ${active ? 'text-son-600' : 'text-gray-500'}`}>{t.label}</span>
                </button>
              );
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)} aria-current={active ? 'page' : undefined}
                  className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${active ? 'text-son-600' : 'text-gray-400 hover:text-gray-600'}`}>
                  {t.icon}
                  <span className="text-[0.6875rem] font-semibold leading-none">{t.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
        <ShareApp open={shareOpen} onClose={() => setShareOpen(false)} />
        <Toast message={toastMsg} onDone={() => setToastMsg(null)} />
      </div>
    </AppContext.Provider>
  );
};

export default App;
