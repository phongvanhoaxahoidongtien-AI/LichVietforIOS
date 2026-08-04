
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { VIETNAMESE_PROVERBS, FOLK_IMAGES, VIETNAM_WALLPAPERS, WALLPAPER_CATEGORIES } from '../constants';
import { WallpaperItem } from '../types';
import { 
  getLunarDate, 
  isRitualDay, 
  getAuspiciousHours, 
  getDayBranchIndex, 
  getDayStemIndex,
  getDirections,
  getClashingSigns,
  getAuspiciousActivities,
  BRANCHES, 
  STEMS 
} from '../services/lunarCalendar';
import { Sparkles, Navigation, Image as ImageIcon, Upload, Check, X, CheckCircle2, Settings2, Eye, EyeOff, Camera, ChevronLeft, ChevronRight, MapPin, Compass, RefreshCw } from 'lucide-react';

interface DailyBlockProps {
  date: Date;
  onNextDay?: () => void;
  onPrevDay?: () => void;
}

const FILTERABLE_ACTIVITIES = [
  "Cưới hỏi", "Chuyển nhà", "Di chuyển xa", "Xuất hành", "Động thổ", 
  "Khai trương", "Xây dựng", "Sửa nhà", "Giao dịch", "Ký kết", 
  "Cúng bái", "Tế tự", "An táng", "Cầu tài", "Nhập trạch"
];

const DailyBlock: React.FC<DailyBlockProps> = ({ date, onNextDay, onPrevDay }) => {
  const [customBg, setCustomBg] = useState<string | null>(null);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [hiddenActivities, setHiddenActivities] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Swipe gesture state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    const savedBg = localStorage.getItem('viet-calendar-user-bg');
    if (savedBg) setCustomBg(savedBg);

    const savedFilters = localStorage.getItem('viet-calendar-hidden-activities');
    if (savedFilters) {
      setHiddenActivities(JSON.parse(savedFilters));
    }
  }, []);

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

    if (isLeftSwipe && onNextDay) onNextDay();
    if (isRightSwipe && onPrevDay) onPrevDay();

    setTouchStart(null);
    setTouchEnd(null);
  };

  const lunar = useMemo(() => getLunarDate(date), [date]);
  const proverb = useMemo(() => VIETNAMESE_PROVERBS[Math.floor(Math.random() * VIETNAMESE_PROVERBS.length)], [date]);
  
  // Choose default background based on day of year for variety across all Vietnam wallpapers
  const defaultBgObj = useMemo(() => {
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return VIETNAM_WALLPAPERS[dayOfYear % VIETNAM_WALLPAPERS.length];
  }, [date]);

  const currentBg = customBg || defaultBgObj.url;

  const currentWallpaperInfo = useMemo(() => {
    return VIETNAM_WALLPAPERS.find(w => w.url === currentBg) || null;
  }, [currentBg]);

  const filteredWallpapers = useMemo(() => {
    if (selectedCategory === 'all') return VIETNAM_WALLPAPERS;
    return VIETNAM_WALLPAPERS.filter(w => w.category === selectedCategory);
  }, [selectedCategory]);

  const auspiciousHours = useMemo(() => getAuspiciousHours(date), [date]);
  const dayBranch = useMemo(() => BRANCHES[getDayBranchIndex(date)], [date]);
  const dayStem = useMemo(() => STEMS[getDayStemIndex(date)], [date]);
  const directions = useMemo(() => getDirections(date), [date]);
  const clashingSigns = useMemo(() => getClashingSigns(date), [date]);
  
  const activities = useMemo(() => {
    const raw = getAuspiciousActivities(date);
    return {
      good: raw.good.filter(act => !hiddenActivities.includes(act)),
      bad: raw.bad.filter(act => !hiddenActivities.includes(act))
    };
  }, [date, hiddenActivities]);

  const toggleActivityFilter = (activity: string) => {
    setHiddenActivities(prev => {
      const next = prev.includes(activity) 
        ? prev.filter(a => a !== activity) 
        : [...prev, activity];
      localStorage.setItem('viet-calendar-hidden-activities', JSON.stringify(next));
      return next;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCustomBg(base64String);
        localStorage.setItem('viet-calendar-user-bg', base64String);
        setShowBgPicker(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectPredefinedBg = (url: string) => {
    setCustomBg(url);
    localStorage.setItem('viet-calendar-user-bg', url);
    setShowBgPicker(false);
  };

  const resetBg = () => {
    setCustomBg(null);
    localStorage.removeItem('viet-calendar-user-bg');
    setShowBgPicker(false);
  };

  return (
    <div 
      className="p-4 pb-8 flex flex-col items-center animate-in fade-in duration-500 overflow-x-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Calendar Card */}
      <div className="w-full relative rounded-[32px] overflow-hidden shadow-2xl aspect-[3/4] bg-gray-200 group">
        <img 
          key={date.toISOString()}
          src={currentBg} 
          alt={currentWallpaperInfo?.title || "Calendar Background"} 
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105 animate-in fade-in zoom-in-95"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/75" />
        
        {/* Current Wallpaper Location Badge */}
        {currentWallpaperInfo && (
          <div className="absolute top-4 left-4 z-10 max-w-[65%] px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/20 rounded-full text-white text-[11px] font-medium flex items-center gap-1.5 shadow-lg">
            <MapPin size={12} className="text-red-400 shrink-0" />
            <span className="truncate">{currentWallpaperInfo.title}</span>
          </div>
        )}

        {/* Navigation Arrows (Visible on large screen/hover) */}
        <div className="absolute inset-y-0 left-0 flex items-center p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
           <button onClick={onPrevDay} className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition-all"><ChevronLeft size={24}/></button>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
           <button onClick={onNextDay} className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition-all"><ChevronRight size={24}/></button>
        </div>

        {/* Change Wallpaper Button */}
        <button 
          onClick={() => setShowBgPicker(true)}
          className="absolute top-4 right-4 z-10 p-2.5 bg-white/25 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/40 active:scale-90 transition-all shadow-lg flex items-center gap-1.5"
          title="Đổi hình nền Việt Nam"
        >
          <ImageIcon size={18} />
          <span className="text-xs font-semibold pr-1 hidden sm:inline">Hình nền</span>
        </button>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-white pointer-events-none">
          <span className="text-2xl font-light mb-2 uppercase tracking-[0.2em] drop-shadow-lg">
            Tháng {date.getMonth() + 1}
          </span>
          <span key={`day-${date.getDate()}`} className="text-[140px] font-bold leading-none drop-shadow-2xl select-none tracking-tighter animate-in slide-in-from-bottom-4 duration-300">
            {date.getDate()}
          </span>
          <div className="mt-4 px-8 py-2 rounded-full bg-white/20 backdrop-blur-lg border border-white/30 text-xl font-semibold shadow-inner">
            Thứ {date.getDay() === 0 ? 'Chủ Nhật' : date.getDay() + 1}
          </div>
        </div>

        <div className="absolute bottom-8 left-8 right-8 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 text-white text-[11px] px-3 py-1 rounded-md font-bold uppercase shadow-md tracking-wider">Âm Lịch</div>
            <span className="text-white text-2xl font-bold drop-shadow-md">
              Mùng {lunar.day} <span className="text-white/80 font-medium text-lg">tháng {lunar.month}</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-white/90 text-sm font-medium drop-shadow-sm bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
              Năm {dayStem} {dayBranch}
            </span>
            {isRitualDay(lunar) && (
              <div className="bg-amber-500 text-white text-xs px-3 py-1 rounded-full font-bold animate-pulse shadow-lg flex items-center gap-1.5">
                <Sparkles size={14} />
                Ngày thắp hương
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Proverb Card */}
      <div className="mt-12 px-10 text-center relative">
        <span className="text-6xl text-red-100 absolute -top-8 -left-4 font-serif opacity-40">“</span>
        <p key={date.toISOString()} className="text-xl leading-relaxed relative z-10 font-medium text-gray-800 italic animate-in fade-in duration-1000">
          {proverb}
        </p>
        <span className="text-6xl text-red-100 absolute -bottom-12 -right-4 font-serif opacity-40">”</span>
      </div>

      {/* Auspicious Activities Section */}
      <div className="w-full mt-14 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Sparkles size={80} className="text-red-600" />
        </div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-50 rounded-xl text-green-600">
              <CheckCircle2 size={20} />
            </div>
            <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider">Việc nên làm & Kiêng kỵ</h3>
          </div>
          <button 
            onClick={() => setShowFilterModal(true)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
            title="Lọc hoạt động"
          >
            <Settings2 size={18} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest px-1">Nên làm</span>
            <div className="flex flex-wrap gap-2">
              {activities.good.length > 0 ? activities.good.map((act, idx) => (
                <span key={idx} className="px-4 py-2 bg-green-50 text-green-700 text-xs font-bold rounded-xl border border-green-100">
                  {act}
                </span>
              )) : <span className="text-xs text-gray-300 italic px-1">Không có hoặc đã bị ẩn</span>}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest px-1">Kiêng kỵ</span>
            <div className="flex flex-wrap gap-2">
              {activities.bad.length > 0 ? activities.bad.map((act, idx) => (
                <span key={idx} className="px-4 py-2 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100">
                  {act}
                </span>
              )) : <span className="text-xs text-gray-300 italic px-1">Không có hoặc đã bị ẩn</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Auspicious Hours Section */}
      <div className="w-full mt-4 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Sparkles size={20} />
            </div>
            <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider">Giờ Hoàng Đạo</h3>
          </div>
          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full uppercase">
            Ngày {dayBranch}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {auspiciousHours.map((hour, idx) => (
            <div key={idx} className="bg-amber-50/40 border border-amber-100/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-colors hover:bg-amber-50">
              <span className="text-sm font-bold text-amber-900">{hour.split(' ')[0]}</span>
              <span className="text-[11px] text-amber-600 font-semibold mt-1 opacity-80">{hour.split(' ').slice(1).join(' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Grid */}
      <div className="grid grid-cols-2 gap-4 w-full mt-4 mb-10">
        <div className="bg-gray-50 p-5 rounded-[24px] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
              <Navigation size={14} className="rotate-45" />
            </div>
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Hướng Xuất Hành</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 text-[10px]">Hỷ Thần:</span>
              <span className="font-bold text-gray-800">{directions.hy}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 text-[10px]">Tài Thần:</span>
              <span className="font-bold text-gray-800">{directions.tai}</span>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 p-5 rounded-[24px] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-red-100 rounded-lg text-red-600">
              <Sparkles size={14} />
            </div>
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Tuổi Xung</span>
          </div>
          <span className="text-xs font-bold text-red-600 leading-relaxed">
            {clashingSigns}
          </span>
          <p className="text-[9px] text-gray-400 mt-1 font-medium italic">Nên cẩn trọng mọi việc</p>
        </div>
      </div>

      {/* Activity Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-t-[40px] p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
            
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Lọc ngày đẹp</h3>
                <p className="text-xs text-gray-500 mt-1">Chọn các hoạt động bạn quan tâm để theo dõi</p>
              </div>
              <button onClick={() => setShowFilterModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-500">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto no-scrollbar py-2">
              {FILTERABLE_ACTIVITIES.map((activity, idx) => {
                const isHidden = hiddenActivities.includes(activity);
                return (
                  <button 
                    key={idx}
                    onClick={() => toggleActivityFilter(activity)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isHidden 
                        ? 'bg-gray-50 border-gray-100 text-gray-400 grayscale' 
                        : 'bg-red-50 border-red-100 text-red-700 shadow-sm'
                    }`}
                  >
                    <span className="text-xs font-bold">{activity}</span>
                    {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                );
              })}
            </div>
            
            <button 
              onClick={() => {
                setHiddenActivities([]);
                localStorage.removeItem('viet-calendar-hidden-activities');
              }}
              className="w-full mt-6 py-4 rounded-2xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors"
            >
              Hiện tất cả
            </button>
          </div>
        </div>
      )}

      {/* Background Picker Modal */}
      {showBgPicker && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-t-[40px] p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-500 max-h-[85vh] flex flex-col">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 shrink-0" />
            
            <div className="flex justify-between items-start mb-4 shrink-0">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Hình nền Việt Nam</h3>
                <p className="text-xs text-gray-500 mt-0.5">Tết & Xuân, Cờ đỏ sao vàng, Thắng cảnh & Văn hóa</p>
              </div>
              <button onClick={() => setShowBgPicker(false)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="grid grid-cols-4 gap-2 mb-4 shrink-0">
              <button 
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50/50 transition-all group"
              >
                <Camera size={18} className="text-gray-500 group-hover:text-red-600 mb-1" />
                <span className="text-[10px] font-bold text-gray-600 truncate">Chụp ảnh</span>
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
              </button>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50/50 transition-all group"
              >
                <Upload size={18} className="text-gray-500 group-hover:text-red-600 mb-1" />
                <span className="text-[10px] font-bold text-gray-600 truncate">Tải ảnh</span>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </button>

              <button 
                onClick={resetBg}
                className={`flex flex-col items-center justify-center p-2.5 border rounded-xl transition-all ${
                  !customBg ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <RefreshCw size={18} className="mb-1" />
                <span className="text-[10px] font-bold truncate">Đổi ngày</span>
              </button>

              <button 
                onClick={resetBg}
                className="flex flex-col items-center justify-center p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-100 transition-all"
              >
                <X size={18} className="mb-1" />
                <span className="text-[10px] font-bold truncate">Gỡ ảnh</span>
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-2 shrink-0">
              {WALLPAPER_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-red-600 text-white shadow-md scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Gallery Grid */}
            <div className="overflow-y-auto no-scrollbar flex-1 pr-1">
              <div className="grid grid-cols-2 gap-3 pb-4">
                {filteredWallpapers.map((item) => {
                  const isSelected = currentBg === item.url;
                  return (
                    <button 
                      key={item.id}
                      onClick={() => selectPredefinedBg(item.url)}
                      className={`group relative rounded-2xl overflow-hidden shadow-sm aspect-[3/4] text-left border-2 transition-all ${
                        isSelected 
                          ? 'border-red-600 ring-4 ring-red-100 scale-[0.98]' 
                          : 'border-transparent hover:border-gray-200 hover:shadow-md'
                      }`}
                    >
                      <img 
                        src={item.url} 
                        alt={item.title} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        loading="lazy" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* Selected Indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full shadow-md z-10 animate-in zoom-in-50">
                          <Check size={14} strokeWidth={3} />
                        </div>
                      )}

                      {/* Title & Location Overlay */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white z-10">
                        <span className="text-[10px] font-bold text-red-300 uppercase tracking-wider block mb-0.5 truncate">
                          {item.location || 'Việt Nam'}
                        </span>
                        <h4 className="text-xs font-bold leading-tight drop-shadow-sm line-clamp-2">
                          {item.title}
                        </h4>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyBlock;
