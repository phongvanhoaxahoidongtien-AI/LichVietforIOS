import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Bell, Settings, Calendar as CalendarIcon, Check, Clock, Repeat, BellRing, Info, DatabaseBackup } from 'lucide-react';
import type { Reminder, RitualSettings, RepeatMode } from '../types';
import { getLunarDate, convertLunar2Solar } from '../services/lunarCalendar';
import { occursOn } from '../services/reminders';
import { todayISO, parseISODate } from '../services/storage';
import { useApp } from '../context';
import { Card, Sheet, SectionTitle, lunarDayLabel } from './ui';
import BackupPanel from './BackupPanel';

interface RemindersProps {
  reminders: Reminder[];
  ritualSettings: RitualSettings;
  onAdd: (r: Reminder) => void;
  onDelete: (id: string) => void;
  onUpdateRitualSettings: (settings: RitualSettings) => void;
}

const REPEAT_LABEL: Record<RepeatMode, string> = {
  none: 'Một lần',
  'lunar-yearly': 'Hằng năm theo âm lịch (ngày giỗ)',
  'lunar-monthly': 'Hằng tháng theo âm lịch',
  'solar-yearly': 'Hằng năm theo dương lịch',
};

/** Lần xảy ra tiếp theo trong vòng 400 ngày. */
function nextOccurrence(r: Reminder, from = new Date()): Date | null {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  for (let i = 0; i < 400; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    if (occursOn(r, d)) return d;
  }
  return null;
}

const Reminders: React.FC<RemindersProps> = ({ reminders, ritualSettings, onAdd, onDelete, onUpdateRitualSettings }) => {
  const { settings, updateSettings, toast } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [showRitual, setShowRitual] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [time, setTime] = useState('07:00');
  const [repeat, setRepeat] = useState<RepeatMode>('none');
  const [dateMode, setDateMode] = useState<'solar' | 'lunar'>('solar');
  const [date, setDate] = useState(todayISO());
  const tl = getLunarDate(new Date());
  const [lDay, setLDay] = useState(tl.day);
  const [lMonth, setLMonth] = useState(tl.month);

  const notifSupported = typeof Notification !== 'undefined';
  const notifPerm = notifSupported ? Notification.permission : 'denied';

  const enableNotifications = async () => {
    if (!notifSupported) return toast('Trình duyệt này không hỗ trợ thông báo.');
    const p = await Notification.requestPermission();
    if (p === 'granted') { updateSettings({ notifications: true }); toast('Đã bật thông báo nhắc lịch.'); }
    else toast('Chưa được cấp quyền thông báo. Có thể bật lại trong cài đặt trình duyệt.');
  };

  const sorted = useMemo(() => reminders
    .map((r) => ({ r, next: nextOccurrence(r) }))
    .sort((a, b) => (a.next?.getTime() ?? Infinity) - (b.next?.getTime() ?? Infinity)), [reminders]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let iso = date;
    let lunarDay: number | undefined, lunarMonth: number | undefined;
    if (dateMode === 'lunar') {
      // ngày gốc = lần gần nhất sắp tới của ngày âm đã chọn
      const now = new Date();
      let y = getLunarDate(now).year;
      let s = convertLunar2Solar(lDay, lMonth, y);
      let d = s[0] ? new Date(s[2], s[1] - 1, s[0]) : null;
      if (!d || d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        y += 1; s = convertLunar2Solar(lDay, lMonth, y); d = s[0] ? new Date(s[2], s[1] - 1, s[0]) : null;
      }
      if (!d) return toast('Ngày âm lịch không hợp lệ.');
      iso = todayISO(d);
      lunarDay = lDay; lunarMonth = lMonth;
    } else if (repeat.startsWith('lunar')) {
      const d = parseISODate(date);
      if (d) { const l = getLunarDate(d); lunarDay = l.day; lunarMonth = l.month; }
    }
    onAdd({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim().slice(0, 120),
      note: note.trim().slice(0, 500),
      time, date: iso, isRitual: false,
      repeat: dateMode === 'lunar' && repeat === 'none' ? 'none' : repeat,
      lunarDay, lunarMonth,
    });
    setTitle(''); setNote(''); setShowAdd(false);
    toast('Đã lưu nhắc lịch.');
  };

  const ritualText = (() => {
    const a: string[] = [];
    if (ritualSettings.remindFirst) a.push('mùng Một');
    if (ritualSettings.remindFourteenth) a.push('ngày 14');
    if (ritualSettings.remindFullMoon) a.push('Rằm');
    if (ritualSettings.remindLastDay) a.push('cuối tháng');
    return a.length ? `Nhắc vào ${a.join(', ')} lúc ${ritualSettings.reminderTime}` : 'Đang tắt nhắc thắp hương';
  })();

  const field = 'w-full bg-giay border border-giay-200 p-3.5 rounded-2xl focus:ring-2 focus:ring-son-200 outline-none text-muc';

  return (
    <div className="p-4 pb-8 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-serif text-2xl font-bold text-muc">Nhắc lịch</h2>
        <button onClick={() => setShowAdd(true)} className="bg-son-600 text-white pl-3 pr-4 py-2.5 rounded-2xl shadow-md flex items-center gap-1.5 font-bold active:scale-95 transition-transform"><Plus size={20} /> Thêm</button>
      </div>

      {!settings.notifications || notifPerm !== 'granted' ? (
        <Card className="!p-4 flex gap-3 items-start">
          <span className="p-2 rounded-xl bg-kim-50 text-kim-700 shrink-0"><BellRing size={18} /></span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-muc">Bật thông báo để được nhắc đúng giờ</p>
            <p className="text-xs text-gray-500 mt-0.5">Thông báo hiện khi ứng dụng đang mở hoặc chạy nền. Nên cài ứng dụng ra màn hình chính.</p>
            <button onClick={enableNotifications} className="mt-2 px-4 py-2 rounded-xl bg-son-600 text-white text-sm font-bold">Bật thông báo</button>
          </div>
        </Card>
      ) : null}

      <button onClick={() => setShowRitual(true)} className="w-full text-left bg-kim-50 border border-amber-100 rounded-3xl p-4 flex gap-3 items-center">
        <span className="bg-white p-2 rounded-xl text-kim-700"><Bell size={20} /></span>
        <span className="flex-1">
          <span className="block font-bold text-kim-700">Nhắc thắp hương</span>
          <span className="block text-sm text-gray-700">{ritualText}</span>
        </span>
        <Settings size={16} className="text-kim-600" />
      </button>

      <Card>
        <SectionTitle icon={<CalendarIcon size={18} />} title="Lịch hẹn, ngày giỗ của bạn" />
        {sorted.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center gap-3 text-gray-500">
            <CalendarIcon size={40} strokeWidth={1.2} />
            <p className="text-sm">Chưa có nhắc lịch. Bấm "Thêm" để tạo nhắc ngày giỗ, lịch họp…</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {sorted.map(({ r, next }) => (
              <li key={r.id} className="bg-giay border border-giay-200 rounded-2xl p-3.5 flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-muc">{r.title}</h4>
                    {r.time && <span className="text-xs bg-son-50 text-son-600 font-bold px-2 py-0.5 rounded-full">{r.time}</span>}
                  </div>
                  {r.note && <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">{r.note}</p>}
                  <div className="mt-1.5 text-xs text-gray-500 font-medium flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="flex items-center gap-1"><Clock size={12} />{next ? `Lần tới: ${next.toLocaleDateString('vi-VN')}` : 'Đã qua'}</span>
                    {r.repeat && r.repeat !== 'none' && <span className="flex items-center gap-1"><Repeat size={12} />{r.repeat.startsWith('lunar') && r.lunarDay ? `${lunarDayLabel(r.lunarDay)}${r.repeat === 'lunar-yearly' ? `/${r.lunarMonth}` : ''} âm` : REPEAT_LABEL[r.repeat]}</span>}
                  </div>
                </div>
                <button onClick={() => { if (window.confirm(`Xóa nhắc "${r.title}"?`)) onDelete(r.id); }} aria-label={`Xóa nhắc ${r.title}`} className="text-gray-400 hover:text-son-600 p-2 -mr-1"><Trash2 size={18} /></button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <button onClick={() => setShowBackup(true)} className="w-full text-left bg-white border border-giay-200 rounded-3xl p-4 flex gap-3 items-center shadow-sm">
        <span className="bg-kim-50 p-2 rounded-xl text-kim-700"><DatabaseBackup size={20} /></span>
        <span className="flex-1">
          <span className="block font-bold text-muc">Sao lưu, chuyển sang máy khác</span>
          <span className="block text-sm text-gray-600">Lưu ra tệp hoặc Google Drive để không mất ngày giỗ khi đổi máy</span>
        </span>
      </button>
      <p className="text-xs text-gray-500 px-2 flex gap-1.5"><Info size={14} className="shrink-0 mt-0.5" />Dữ liệu nhắc lịch chỉ lưu trên máy này cho đến khi bạn sao lưu.</p>

      <Sheet open={showBackup} onClose={() => setShowBackup(false)} title="Sao lưu và khôi phục" subtitle="Giữ lịch hẹn, ngày giỗ khi đổi máy">
        <BackupPanel />
      </Sheet>

      <Sheet open={showRitual} onClose={() => setShowRitual(false)} title="Nhắc thắp hương" subtitle="Chọn các ngày âm lịch muốn được nhắc">
        <div className="space-y-2.5 mb-6">
          {([['remindFirst', 'Mùng Một (đầu tháng)'], ['remindFourteenth', 'Ngày 14 (trước Rằm)'], ['remindFullMoon', 'Ngày Rằm (15)'], ['remindLastDay', 'Ngày cuối tháng']] as const).map(([k, label]) => (
            <RitualToggle key={k} label={label} active={ritualSettings[k]} onClick={() => onUpdateRitualSettings({ ...ritualSettings, [k]: !ritualSettings[k] })} />
          ))}
          <label className="block pt-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Giờ nhắc</span>
            <input type="time" value={ritualSettings.reminderTime} onChange={(e) => onUpdateRitualSettings({ ...ritualSettings, reminderTime: e.target.value || '08:00' })} className={`${field} mt-1 text-lg font-bold text-son-600`} />
          </label>
        </div>
        <button onClick={() => setShowRitual(false)} className="w-full bg-son-600 text-white font-bold py-3.5 rounded-2xl">Xong</button>
      </Sheet>

      <Sheet open={showAdd} onClose={() => setShowAdd(false)} title="Thêm nhắc lịch">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tiêu đề</span>
            <input required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} className={`${field} mt-1`} placeholder="VD: Giỗ cụ nội" />
          </label>
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chọn ngày theo</span>
            <div className="flex gap-2 mt-1">
              {(['solar', 'lunar'] as const).map((m) => (
                <button type="button" key={m} onClick={() => { setDateMode(m); if (m === 'lunar' && repeat === 'none') setRepeat('lunar-yearly'); }} aria-pressed={dateMode === m}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border ${dateMode === m ? 'bg-son-50 border-son-200 text-son-700' : 'bg-white border-giay-200 text-gray-600'}`}>{m === 'solar' ? 'Dương lịch' : 'Âm lịch'}</button>
              ))}
            </div>
          </div>
          {dateMode === 'solar' ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày</span>
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={`${field} mt-1`} /></label>
              <label className="block"><span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Giờ</span>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`${field} mt-1`} /></label>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <label className="block"><span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày âm</span>
                <select value={lDay} onChange={(e) => setLDay(+e.target.value)} className={`${field} mt-1`}>{Array.from({ length: 30 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label>
              <label className="block"><span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tháng âm</span>
                <select value={lMonth} onChange={(e) => setLMonth(+e.target.value)} className={`${field} mt-1`}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label>
              <label className="block"><span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Giờ</span>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`${field} mt-1`} /></label>
            </div>
          )}
          <label className="block">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lặp lại</span>
            <select value={repeat} onChange={(e) => setRepeat(e.target.value as RepeatMode)} className={`${field} mt-1`}>
              {(Object.keys(REPEAT_LABEL) as RepeatMode[]).filter((k) => dateMode === 'solar' || k !== 'solar-yearly').map((k) => <option key={k} value={k}>{REPEAT_LABEL[k]}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ghi chú</span>
            <textarea maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className={`${field} mt-1 h-20 resize-none`} placeholder="Nội dung ghi chú…" />
          </label>
          <button className="w-full bg-son-600 text-white font-bold py-3.5 rounded-2xl shadow-md active:scale-95 transition-transform">Lưu nhắc lịch</button>
        </form>
      </Sheet>
    </div>
  );
};

const RitualToggle: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button type="button" onClick={onClick} aria-pressed={active}
    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${active ? 'bg-kim-50 border-amber-200' : 'bg-gray-50 border-gray-100'}`}>
    <span className={`text-sm font-semibold ${active ? 'text-kim-700' : 'text-gray-600'}`}>{label}</span>
    <span className={`w-6 h-6 rounded-full flex items-center justify-center ${active ? 'bg-kim-500 text-white' : 'border-2 border-gray-200'}`}>{active && <Check size={14} strokeWidth={4} />}</span>
  </button>
);

export default Reminders;
