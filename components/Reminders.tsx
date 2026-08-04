
import React, { useState } from 'react';
import { Plus, Trash2, Bell, Settings, Calendar as CalendarIcon, X, Check, Clock } from 'lucide-react';
import { Reminder, RitualSettings } from '../types';

interface RemindersProps {
  reminders: Reminder[];
  ritualSettings: RitualSettings;
  onAdd: (r: Reminder) => void;
  onDelete: (id: string) => void;
  onUpdateRitualSettings: (settings: RitualSettings) => void;
}

const Reminders: React.FC<RemindersProps> = ({ reminders, ritualSettings, onAdd, onDelete, onUpdateRitualSettings }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Add Reminder state
  const [newTitle, setNewTitle] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      id: Date.now().toString(),
      title: newTitle,
      note: newNote,
      time: newTime,
      date: newDate,
      isRitual: false
    });
    setNewTitle('');
    setNewNote('');
    setNewTime('');
    setShowAddModal(false);
  };

  const toggleRitualDay = (key: keyof Omit<RitualSettings, 'reminderTime'>) => {
    onUpdateRitualSettings({
      ...ritualSettings,
      [key]: !ritualSettings[key]
    });
  };

  const getActiveRitualsText = () => {
    const active = [];
    if (ritualSettings.remindFirst) active.push("Mùng Một");
    if (ritualSettings.remindFourteenth) active.push("Ngày 14");
    if (ritualSettings.remindFullMoon) active.push("Rằm (15)");
    if (ritualSettings.remindLastDay) active.push("Cuối tháng");
    
    if (active.length === 0) return "Đang tắt nhắc nhở tâm linh";
    return `Nhắc vào: ${active.join(", ")} lúc ${ritualSettings.reminderTime}`;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Nhắc nhở</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-red-600 text-white p-2 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Spiritual Ritual Settings Card */}
        <div 
          onClick={() => setShowSettingsModal(true)}
          className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-4 cursor-pointer hover:bg-amber-100/50 transition-colors group"
        >
          <div className="bg-amber-100 p-2 rounded-full text-amber-600 h-fit group-hover:scale-110 transition-transform">
            <Bell size={20} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-amber-800">Cấu hình nhắc thắp hương</h4>
              <Settings size={14} className="text-amber-400" />
            </div>
            <p className="text-xs text-amber-700 mt-1">{getActiveRitualsText()}</p>
          </div>
        </div>

        {/* User Reminders List */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Lịch hẹn của bạn</label>
          {reminders.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center gap-4 text-gray-400 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
              <CalendarIcon size={40} strokeWidth={1} />
              <p className="text-sm">Chưa có nhắc lịch cá nhân</p>
            </div>
          ) : (
            reminders.map(r => (
              <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex justify-between items-start animate-in fade-in slide-in-from-bottom-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-gray-800 leading-tight">{r.title}</h4>
                    <span className="text-[10px] bg-red-50 text-red-500 font-bold px-2 py-0.5 rounded-full">{r.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{r.note}</p>
                  <div className="mt-2 text-[10px] text-gray-400 font-medium flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(r.date).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(r.id);
                  }}
                  className="text-gray-300 hover:text-red-500 transition-colors p-2 -mr-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ritual Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-[32px] p-8 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Cài đặt nhắc thắp hương</h3>
              <button onClick={() => setShowSettingsModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-400"><X size={20}/></button>
            </div>
            
            <div className="space-y-3 mb-8">
              <p className="text-xs text-gray-500 mb-4">Chọn các ngày Âm lịch bạn muốn nhận thông báo nhắc thắp hương, cúng bái.</p>
              
              <RitualToggle 
                label="Mùng Một (Đầu tháng)" 
                active={ritualSettings.remindFirst} 
                onClick={() => toggleRitualDay('remindFirst')} 
              />
              <RitualToggle 
                label="Ngày 14 (Trước Rằm)" 
                active={ritualSettings.remindFourteenth} 
                onClick={() => toggleRitualDay('remindFourteenth')} 
              />
              <RitualToggle 
                label="Ngày Rằm (15 hàng tháng)" 
                active={ritualSettings.remindFullMoon} 
                onClick={() => toggleRitualDay('remindFullMoon')} 
              />
              <RitualToggle 
                label="Ngày cuối tháng" 
                active={ritualSettings.remindLastDay} 
                onClick={() => toggleRitualDay('remindLastDay')} 
              />

              <div className="pt-4">
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block tracking-widest">Thời gian nhắc nhở</label>
                <input 
                  type="time"
                  value={ritualSettings.reminderTime}
                  onChange={(e) => onUpdateRitualSettings({...ritualSettings, reminderTime: e.target.value})}
                  className="w-full bg-gray-50 border-none p-4 rounded-2xl text-lg font-bold text-red-600 focus:ring-2 focus:ring-red-100 transition-all"
                />
              </div>
            </div>

            <button 
              onClick={() => setShowSettingsModal(false)}
              className="w-full bg-red-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform"
            >
              Hoàn tất
            </button>
          </div>
        </div>
      )}

      {/* Add Custom Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-[32px] p-8 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Thêm nhắc nhở mới</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-400"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Tiêu đề</label>
                <input 
                  autoFocus
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-gray-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-red-100" 
                  placeholder="Ví dụ: Giỗ cụ nội..."
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Ghi chú</label>
                <textarea 
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  className="w-full bg-gray-50 border-none p-4 rounded-2xl h-24 focus:ring-2 focus:ring-red-100 resize-none" 
                  placeholder="Nội dung ghi chú..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Ngày</label>
                  <input 
                    type="date"
                    required
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full bg-gray-50 border-none p-4 rounded-2xl text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Giờ</label>
                  <input 
                    type="time"
                    required
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    className="w-full bg-gray-50 border-none p-4 rounded-2xl text-sm font-medium"
                  />
                </div>
              </div>
              <button className="w-full bg-red-600 text-white font-bold py-4 rounded-2xl mt-4 shadow-lg active:scale-95 transition-transform">
                Lưu nhắc nhở
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const RitualToggle: React.FC<{ label: string, active: boolean, onClick: () => void }> = ({ label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
      active ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'
    }`}
  >
    <span className={`text-sm font-semibold ${active ? 'text-amber-800' : 'text-gray-600'}`}>{label}</span>
    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
      active ? 'bg-amber-500 text-white' : 'border-2 border-gray-200'
    }`}>
      {active && <Check size={14} strokeWidth={4} />}
    </div>
  </button>
);

export default Reminders;
