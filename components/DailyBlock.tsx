import React, { useMemo, useState, useRef, useEffect } from 'react';
import { VIETNAMESE_PROVERBS, VIETNAM_WALLPAPERS, WALLPAPER_CATEGORIES } from '../constants';
import { lunarMonthLength } from '../services/lunarCalendar';
import { getDayInfo, DISCLAIMER } from '../services/almanac';
import TodayForAge from './TodayForAge';
import { rememberAct } from './PersonalSection';
import { compressImage } from '../services/image';
import { KEYS, loadString, saveString, remove } from '../services/storage';
import { itemsOnDay } from '../services/reminders';
import type { Reminder } from '../types';
import { useApp } from '../context';
import { Card, SectionTitle, ScoreRing, VerdictBadge, Sheet, WEEKDAYS, lunarDayLabel, TrucBadge, TRUC_STYLE } from './ui';
import TrucGuide from './TrucGuide';
import { Sparkles, Navigation, Image as ImageIcon, Upload, Check, X, Camera, ChevronLeft, ChevronRight, MapPin, Share2, CalendarCheck, ArrowRight, Bell, Clock, MessageCircleQuestion, Layers } from 'lucide-react';
import { shareDayImage } from '../services/shareImage';

interface DailyBlockProps {
  date: Date;
  onNextDay: () => void;
  onPrevDay: () => void;
  onToday: () => void;
  onOpenDetail: () => void;
  onAsk: () => void;
  reminders: Reminder[];
}

const DailyBlock: React.FC<DailyBlockProps> = ({ date, onNextDay, onPrevDay, onToday, onOpenDetail, onAsk, reminders }) => {
  const { toast } = useApp();
  const [customBg, setCustomBg] = useState<string | null>(() => loadString(KEYS.userBg));
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sharing, setSharing] = useState(false);
  const [trucGuide, setTrucGuide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  // Bỏ ảnh nền đã lưu nếu không còn hợp lệ (chỉ nhận ảnh nhúng hoặc ảnh có sẵn)
  useEffect(() => {
    if (customBg && !customBg.startsWith('data:image/') && !VIETNAM_WALLPAPERS.some((w) => w.url === customBg)) {
      setCustomBg(null);
      remove(KEYS.userBg);
    }
  }, [customBg]);

  const info = useMemo(() => getDayInfo(date), [date]);
  const lunar = info.lunar;
  const monthLen = useMemo(() => lunarMonthLength(lunar.month, lunar.year, lunar.leap), [lunar.month, lunar.year, lunar.leap]);
  const todayItems = useMemo(() => itemsOnDay(date, reminders), [date, reminders]);
  const proverb = VIETNAMESE_PROVERBS[(info.jd * 7) % VIETNAMESE_PROVERBS.length];

  const isToday = date.toDateString() === new Date().toDateString();
  const isSunday = date.getDay() === 0;
  const isRitual = lunar.day === 1 || lunar.day === 15;

  const defaultBg = VIETNAM_WALLPAPERS[info.jd % VIETNAM_WALLPAPERS.length];
  const currentBg = customBg || defaultBg.url;
  const wallpaperInfo = VIETNAM_WALLPAPERS.find((w) => w.url === currentBg) || null;
  const filteredWallpapers = selectedCategory === 'all' ? VIETNAM_WALLPAPERS : VIETNAM_WALLPAPERS.filter((w) => w.category === selectedCategory);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      if (!saveString(KEYS.userBg, dataUrl)) {
        toast('Ảnh vẫn quá lớn để lưu. Ảnh chỉ dùng tạm cho lần mở này.');
      }
      setCustomBg(dataUrl);
      setShowBgPicker(false);
    } catch (err) {
      toast((err as Error).message || 'Không dùng được ảnh này.');
    }
  };

  const selectPredefinedBg = (url: string) => { setCustomBg(url); saveString(KEYS.userBg, url); setShowBgPicker(false); };
  const resetBg = () => { setCustomBg(null); remove(KEYS.userBg); setShowBgPicker(false); };

  const onShare = async () => {
    setSharing(true);
    try {
      const r = await shareDayImage(info, currentBg);
      if (r === 'downloaded') toast('Đã tải ảnh tờ lịch về máy.');
    } catch {
      toast('Không tạo được ảnh. Vui lòng thử lại.');
    } finally {
      setSharing(false);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? onNextDay : onPrevDay)();
  };

  const hoangDaoHours = info.hours.filter((h) => h.hoangDao);

  return (
    <div className="p-4 pb-8 flex flex-col gap-4">
      {/* Hỏi nhanh */}
      <button onClick={onAsk} className="w-full text-left rounded-3xl p-4 bg-gradient-to-r from-son-600 to-son-700 text-white shadow-lg flex items-center gap-3 active:scale-[.99] transition-transform" aria-label="Hỏi nhanh: việc của bạn làm ngày nào thì tốt">
        <span className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0"><MessageCircleQuestion size={26} /></span>
        <span className="flex-1 min-w-0">
          <span className="block font-serif text-lg font-bold leading-tight">Hỏi nhanh</span>
          <span className="block text-sm text-son-100">Cưới hỏi, về nhà mới, khai trương… ngày nào tốt cho tuổi bạn?</span>
        </span>
        <ArrowRight size={22} className="shrink-0" />
      </button>

      {/* Tờ lịch bloc */}
      <article className="w-full rounded-[28px] overflow-hidden shadow-xl bg-white border border-giay-200" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} aria-label={`Tờ lịch ngày ${date.toLocaleDateString('vi-VN')}`}>
        <div className="relative bloc-holes bg-son-600 text-kim-100 px-5 pt-7 pb-2.5 flex items-center justify-between">
          <span className="font-serif font-bold tracking-wide uppercase text-sm">Tháng {date.getMonth() + 1} · {date.getFullYear()}</span>
          <span className="text-xs font-semibold opacity-90">Năm {info.canChi.year}</span>
        </div>

        <div className="relative aspect-[4/3] bg-gray-200">
          <img key={currentBg} src={currentBg} alt={wallpaperInfo?.title || 'Ảnh nền tờ lịch'} className="absolute inset-0 w-full h-full object-cover animate-fade-in" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/65" />
          {wallpaperInfo && (
            <div className="absolute top-3 left-3 max-w-[60%] px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-white text-xs font-medium flex items-center gap-1.5">
              <MapPin size={12} className="text-son-200 shrink-0" />
              <span className="truncate">{wallpaperInfo.title}</span>
            </div>
          )}
          <div className="absolute top-3 right-3 flex gap-2">
            <button onClick={onShare} disabled={sharing} aria-label="Chia sẻ tờ lịch thành ảnh" className="p-2.5 bg-white/25 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/40 active:scale-90 transition-all disabled:opacity-50"><Share2 size={18} /></button>
            <button onClick={() => setShowBgPicker(true)} aria-label="Đổi ảnh nền" className="p-2.5 bg-white/25 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/40 active:scale-90 transition-all"><ImageIcon size={18} /></button>
          </div>
          <button onClick={onPrevDay} aria-label="Ngày trước" className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/25 backdrop-blur-md rounded-full text-white hover:bg-black/45"><ChevronLeft size={22} /></button>
          <button onClick={onNextDay} aria-label="Ngày sau" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/25 backdrop-blur-md rounded-full text-white hover:bg-black/45"><ChevronRight size={22} /></button>
          <div className="absolute inset-x-0 bottom-3 flex flex-col items-center text-white pointer-events-none">
            <span key={info.jd} className={`font-serif font-bold leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,.5)] animate-flip ${isSunday ? 'text-son-100' : ''}`} style={{ fontSize: 'clamp(5.5rem, 30vw, 8rem)' }}>{date.getDate()}</span>
            <span className="mt-1 px-5 py-1 rounded-full bg-white/20 backdrop-blur-lg border border-white/30 font-semibold">{WEEKDAYS[date.getDay()]}</span>
          </div>
        </div>

        {/* Phần âm lịch kiểu lịch bloc truyền thống */}
        <div className="grid grid-cols-3 items-center px-4 py-4 text-center bg-giay border-t border-giay-200">
          <div>
            <div className="text-[0.6875rem] uppercase tracking-wider text-gray-500 font-bold">Tháng</div>
            <div className="font-serif font-bold text-lg text-muc">{lunar.month}{lunar.leap ? ' nhuận' : ''}</div>
            <div className="text-xs text-gray-500">{monthLen === 30 ? 'Đủ' : 'Thiếu'} · {info.canChi.month}</div>
          </div>
          <div className="border-x border-giay-200">
            <div className="text-[0.6875rem] uppercase tracking-wider text-son-600 font-bold">Âm lịch</div>
            <div className="font-serif font-bold text-4xl text-son-600 leading-tight">{lunar.day}</div>
            <div className={`text-xs font-semibold ${info.than.hoangDao ? 'text-green-700' : 'text-gray-600'}`}>{lunarDayLabel(lunar.day) !== String(lunar.day) ? `${lunarDayLabel(lunar.day)} · ` : ''}{info.than.hoangDao ? 'Hoàng đạo' : 'Hắc đạo'}</div>
          </div>
          <div>
            <div className="text-[0.6875rem] uppercase tracking-wider text-gray-500 font-bold">Ngày</div>
            <div className="font-serif font-bold text-lg text-muc">{info.canChi.day}</div>
            <div className="text-xs text-gray-500">Tiết {info.solarTerm}</div>
          </div>
        </div>
        {(isRitual || !isToday) && (
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-kim-50 border-t border-giay-200">
            {isRitual ? <span className="text-sm font-bold text-kim-700 flex items-center gap-1.5"><Sparkles size={14} /> Ngày {lunar.day === 1 ? 'mùng Một' : 'Rằm'}, thắp hương gia tiên</span> : <span />}
            {!isToday && <button onClick={onToday} className="text-sm font-bold text-son-600 flex items-center gap-1 shrink-0"><CalendarCheck size={14} /> Về hôm nay</button>}
          </div>
        )}
      </article>

      {/* Tóm tắt xem ngày */}
      <Card className="!p-4">
        <div className="flex items-center gap-4">
          <ScoreRing score={info.score} label="điểm" />
          <div className="flex-1 min-w-0">
            <VerdictBadge verdict={info.verdict} />
            <p className="mt-2 text-sm text-gray-700 leading-snug">
              Ngày <b className={info.than.hoangDao ? 'text-green-700' : 'text-son-600'}>{info.than.name} {info.than.hoangDao ? 'Hoàng đạo' : 'Hắc đạo'}</b>, Sao <b>{info.sao28.name}</b>.
            </p>
            <div className="mt-1.5"><TrucBadge name={info.truc.name} tone={info.truc.tone} onClick={() => setTrucGuide(true)} /></div>
            {info.kyDays.length > 0 && <p className="mt-1 text-xs font-semibold text-son-600">Phạm: {info.kyDays.map((k) => k.name).join(', ')}</p>}
          </div>
        </div>
        <button onClick={onOpenDetail} className="mt-4 w-full py-3 rounded-2xl bg-son-600 text-white font-bold flex items-center justify-center gap-2 active:scale-[.98] transition-transform">
          Xem chi tiết ngày và chọn ngày tốt <ArrowRight size={18} />
        </button>
      </Card>

      {/* Trực của ngày */}
      <Card testId="truc-card">
        <SectionTitle icon={<Layers size={18} />} tone={info.truc.tone === 'tot' ? 'green' : info.truc.tone === 'binh' ? 'kim' : undefined}
          title={`Trực ${info.truc.name}${isToday ? ' hôm nay' : ''}`}
          right={<span className={`text-xs font-bold px-3 py-1 rounded-full border ${TRUC_STYLE[info.truc.tone].chip}`}>{TRUC_STYLE[info.truc.tone].label}</span>} />
        <p className="text-sm text-gray-700">{info.truc.meaning}.</p>
        <dl className="mt-2 space-y-1 text-sm">
          <div><dt className="inline font-bold text-green-700">Nên: </dt><dd className="inline text-gray-700">{info.truc.nen.join(', ')}.</dd></div>
          <div><dt className="inline font-bold text-son-600">Kiêng: </dt><dd className="inline text-gray-700">{info.truc.kieng.join(', ')}.</dd></div>
        </dl>
        <button type="button" onClick={() => setTrucGuide(true)} className="mt-3 text-sm font-bold text-blue-700 underline">Xem ý nghĩa cả 12 Trực</button>
      </Card>

      {/* Việc nên làm / nên tránh – theo tuổi nếu có năm sinh */}
      <TodayForAge date={date} info={info} onOpen={(a) => { rememberAct(a); onOpenDetail(); }} />

      {/* Giờ hoàng đạo */}
      <Card>
        <SectionTitle icon={<Clock size={18} />} tone="kim" title="Giờ Hoàng đạo" right={<span className="text-xs font-bold text-kim-700 bg-kim-50 px-3 py-1 rounded-full">Ngày {info.canChi.day}</span>} />
        <div className="grid grid-cols-3 gap-2">
          {hoangDaoHours.map((h) => (
            <div key={h.branch} className="bg-kim-50 border border-amber-100 rounded-2xl p-2.5 text-center">
              <div className="font-serif font-bold text-kim-700">{h.branch}</div>
              <div className="text-xs text-gray-600 font-semibold">{h.range}</div>
              <div className="text-[0.6875rem] text-gray-500 mt-0.5">{h.than}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Hướng xuất hành & tuổi xung */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="!p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1.5 bg-blue-50 rounded-lg text-blue-700"><Navigation size={14} className="rotate-45" /></span>
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Hướng tốt</span>
          </div>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between gap-2"><dt className="text-gray-500">Hỷ thần</dt><dd className="font-bold text-muc text-right">{info.directions.hyThan}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-gray-500">Tài thần</dt><dd className="font-bold text-muc text-right">{info.directions.taiThan}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-gray-500">Tránh</dt><dd className="font-bold text-son-600 text-right">{info.directions.hacThan || 'Không'}</dd></div>
          </dl>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1.5 bg-son-50 rounded-lg text-son-600"><Sparkles size={14} /></span>
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Tuổi xung</span>
          </div>
          <p className="text-sm font-bold text-son-600 leading-relaxed">{info.xungTuoi.join(', ') || `Tuổi ${info.xungChi}`}</p>
          <p className="text-xs text-gray-500 mt-1">Hợp: {info.hop.lucHop}, {info.hop.tamHop.join(', ')}</p>
        </Card>
      </div>

      {todayItems.length > 0 && (
        <Card>
          <SectionTitle icon={<Bell size={18} />} title="Nhắc lịch trong ngày" />
          <ul className="space-y-2">
            {todayItems.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-giay border border-giay-200">
                <span className="font-semibold text-muc">{r.title}</span>
                {r.time && <span className="text-xs font-bold text-son-600">{r.time}</span>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <figure className="px-6 py-4 text-center">
        <blockquote className="font-serif text-lg leading-relaxed text-gray-800 italic">“{proverb}”</blockquote>
      </figure>
      <p className="text-xs text-center text-gray-500 px-4 leading-relaxed">{DISCLAIMER}</p>

      <Sheet open={showBgPicker} onClose={() => setShowBgPicker(false)} title="Ảnh nền tờ lịch" subtitle="Tết & Xuân, Tự hào Việt Nam, Thắng cảnh, Văn hóa">
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button onClick={() => cameraInputRef.current?.click()} className="flex flex-col items-center p-3 bg-gray-50 border border-gray-200 rounded-2xl hover:border-son-200">
            <Camera size={20} className="text-gray-500 mb-1" /><span className="text-xs font-bold text-gray-600">Chụp ảnh</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center p-3 bg-gray-50 border border-gray-200 rounded-2xl hover:border-son-200">
            <Upload size={20} className="text-gray-500 mb-1" /><span className="text-xs font-bold text-gray-600">Ảnh trong máy</span>
          </button>
          <button onClick={resetBg} className={`flex flex-col items-center p-3 border rounded-2xl ${!customBg ? 'bg-son-50 border-son-200 text-son-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
            <X size={20} className="mb-1" /><span className="text-xs font-bold">Đổi theo ngày</span>
          </button>
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={handleFileUpload} className="hidden" />
        </div>
        <p className="text-xs text-gray-500 mb-3">Ảnh của bạn được thu nhỏ, bỏ thông tin vị trí và chỉ lưu trên máy này.</p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
          {WALLPAPER_CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${selectedCategory === cat.id ? 'bg-son-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{cat.name}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 pb-2">
          {filteredWallpapers.map((item) => {
            const sel = currentBg === item.url;
            return (
              <button key={item.id} onClick={() => selectPredefinedBg(item.url)} className={`relative rounded-2xl overflow-hidden aspect-[3/4] text-left border-2 ${sel ? 'border-son-600 ring-4 ring-son-100' : 'border-transparent'}`}>
                <img src={item.url} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                {sel && <span className="absolute top-2 right-2 bg-son-600 text-white p-1 rounded-full"><Check size={14} strokeWidth={3} /></span>}
                <div className="absolute bottom-2 left-2 right-2 text-white">
                  <span className="text-[0.625rem] font-bold text-son-200 uppercase block truncate">{item.location || 'Việt Nam'}</span>
                  <span className="text-xs font-bold leading-tight line-clamp-2">{item.title}</span>
                </div>
              </button>
            );
          })}
        </div>
      </Sheet>
      <Sheet open={trucGuide} onClose={() => setTrucGuide(false)} title="12 Trực" subtitle="Ý nghĩa, việc nên làm và kiêng kỵ">
        <TrucGuide current={info.truc.index} />
      </Sheet>
    </div>
  );
};

export default DailyBlock;
