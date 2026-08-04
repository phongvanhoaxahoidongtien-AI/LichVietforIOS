import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Heart, Brain, Zap, User, Calendar, Info, ChevronLeft, ChevronRight, Sparkles, TrendingUp, AlertCircle, BarChart2 } from 'lucide-react';
import { BiorhythmProfile, BiorhythmCycle } from '../types';

const STORAGE_KEY = 'viet-calendar-biorhythm-profile';

const CYCLE_CONFIGS = [
  {
    key: 'physical' as const,
    name: 'Thể chất',
    period: 23,
    color: '#ef4444', // Red
    bgLight: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    icon: Activity,
    desc: 'Sức khỏe, sự dẻo dai, phản xạ và năng lượng thể chất.'
  },
  {
    key: 'emotional' as const,
    name: 'Cảm xúc',
    period: 28,
    color: '#ec4899', // Pink
    bgLight: 'bg-pink-50',
    borderColor: 'border-pink-200',
    textColor: 'text-pink-700',
    icon: Heart,
    desc: 'Tâm trạng, thái độ, sự nhạy cảm và mối quan hệ tình cảm.'
  },
  {
    key: 'intellectual' as const,
    name: 'Trí tuệ',
    period: 33,
    color: '#3b82f6', // Blue
    bgLight: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    icon: Brain,
    desc: 'Khả năng tư duy, trí nhớ, sự tập trung và xử lý công việc.'
  },
  {
    key: 'intuitive' as const,
    name: 'Trực giác',
    period: 38,
    color: '#8b5cf6', // Purple
    bgLight: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    icon: Zap,
    desc: 'Cảm nhận tâm linh, bản năng, sự sáng tạo và linh tính.'
  }
];

function calculateCycleValue(birthDate: Date, targetDate: Date, period: number): number {
  const diffTime = targetDate.getTime() - birthDate.getTime();
  const diffDays = diffTime / (1000 * 3600 * 24);
  const radians = (2 * Math.PI * diffDays) / period;
  return Math.round(Math.sin(radians) * 100);
}

function getCycleAdvice(key: string, value: number): string {
  if (value >= 50) {
    switch (key) {
      case 'physical': return 'Sức khỏe dồi dào, sinh lực tràn đầy! Thích hợp chơi thể thao, làm việc nặng hoặc du lịch.';
      case 'emotional': return 'Tinh thần phấn chấn, yêu đời. Rất tốt để gặp gỡ người thân, mở rộng mối quan hệ.';
      case 'intellectual': return 'Đầu óc minh mẫn, sáng tạo vượt trội. Thời điểm vàng để ra quyết định quan trọng, học tập hay ký kết.';
      case 'intuitive': return 'Linh cảm rất nhạy bén. Hãy tin vào bản năng và những ý tưởng bộc phát hôm nay.';
      default: return 'Trạng thái rất tích cực.';
    }
  } else if (value <= -50) {
    switch (key) {
      case 'physical': return 'Thể lực suy giảm, dễ mệt mỏi. Tránh vận động quá sức và chú ý nghỉ ngơi đầy đủ.';
      case 'emotional': return 'Tâm trạng dễ nhạy cảm, dễ cáu gắt. Hãy giữ bình tĩnh, tránh tranh cãi không cần thiết.';
      case 'intellectual': return 'Sự tập trung giảm sút. Nên kiểm tra kỹ hợp đồng, giấy tờ, tránh quyết định vội vã.';
      case 'intuitive': return 'Trực giác không ổn định. Nên dựa vào dữ liệu thực tế hơn là cảm tính.';
      default: return 'Cần thận trọng và nghỉ ngơi.';
    }
  } else if (Math.abs(value) <= 15) {
    return 'Ngày chuyển giao nhịp sinh học (Điểm критический). Tâm sinh lý có thể biến động nhanh, cần cẩn trọng nhẹ nhàng.';
  } else if (value > 0) {
    return 'Trạng thái ổn định theo chiều hướng tích cực. Tiếp tục duy trì nhịp sống điều độ.';
  } else {
    return 'Trạng thái hơi trầm. Hãy thả lỏng, bù đắp năng lượng bằng bữa ăn ngon và giấc ngủ sâu.';
  }
}

const Biorhythm: React.FC = () => {
  const [profile, setProfile] = useState<BiorhythmProfile>({
    fullName: '',
    birthDate: '1995-01-01',
    birthTime: '08:00'
  });
  const [isEditing, setIsEditing] = useState<boolean>(true);
  const [targetDate, setTargetDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');

  // Load saved profile
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.fullName && parsed.birthDate) {
          setProfile(parsed);
          setIsEditing(false);
        }
      } catch (e) {
        console.error('Error loading biorhythm profile', e);
      }
    }
  }, []);

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.fullName.trim() || !profile.birthDate) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setIsEditing(false);
  };

  const birthDateObj = useMemo(() => new Date(profile.birthDate), [profile.birthDate]);

  // Calculate daily cycles
  const dailyCycles = useMemo(() => {
    if (!profile.birthDate) return [];
    return CYCLE_CONFIGS.map(cfg => {
      const val = calculateCycleValue(birthDateObj, targetDate, cfg.period);
      let status: BiorhythmCycle['status'] = 'neutral';
      if (Math.abs(val) <= 15) status = 'critical';
      else if (val > 15) status = 'high';
      else status = 'low';

      return {
        ...cfg,
        value: val,
        status,
        description: getCycleAdvice(cfg.key, val)
      };
    });
  }, [birthDateObj, targetDate, profile.birthDate]);

  // Average harmony index
  const harmonyScore = useMemo(() => {
    if (dailyCycles.length === 0) return 0;
    const sum = dailyCycles.reduce((acc, c) => acc + c.value, 0);
    return Math.round((sum / dailyCycles.length + 100) / 2); // Scale to 0 - 100%
  }, [dailyCycles]);

  // Weekly forecast calculation (7 days)
  const weekForecast = useMemo(() => {
    if (!profile.birthDate) return [];
    const result = [];
    const startOfWeek = new Date(targetDate);
    // 3 days before, target day, 3 days after
    startOfWeek.setDate(targetDate.getDate() - 3);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dayCycles = CYCLE_CONFIGS.map(cfg => ({
        key: cfg.key,
        color: cfg.color,
        val: calculateCycleValue(birthDateObj, d, cfg.period)
      }));
      result.push({
        date: d,
        dayLabel: d.toLocaleDateString('vi-VN', { weekday: 'short' }),
        dateNum: d.getDate(),
        monthNum: d.getMonth() + 1,
        isTarget: d.toDateString() === targetDate.toDateString(),
        cycles: dayCycles
      });
    }
    return result;
  }, [birthDateObj, targetDate, profile.birthDate]);

  // Monthly calendar dates (30 days)
  const monthForecast = useMemo(() => {
    if (!profile.birthDate) return [];
    const result = [];
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const phys = calculateCycleValue(birthDateObj, d, 23);
      const emo = calculateCycleValue(birthDateObj, d, 28);
      const intel = calculateCycleValue(birthDateObj, d, 33);
      const avg = Math.round((phys + emo + intel) / 3);

      result.push({
        day,
        date: d,
        isTarget: d.toDateString() === targetDate.toDateString(),
        avg,
        phys,
        emo,
        intel
      });
    }
    return result;
  }, [birthDateObj, targetDate, profile.birthDate]);

  const handlePrevDay = () => {
    const prev = new Date(targetDate);
    prev.setDate(targetDate.getDate() - 1);
    setTargetDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(targetDate);
    next.setDate(targetDate.getDate() + 1);
    setTargetDate(next);
  };

  return (
    <div className="p-5 pb-12 max-w-md mx-auto space-y-6">
      {/* Title Header */}
      <div className="bg-gradient-to-r from-red-800 via-amber-800 to-red-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <span className="text-[11px] font-bold tracking-widest text-amber-300 uppercase block mb-1">
              Thuyết Nhịp Sinh Học (Biorhythm)
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight">Nhịp Sinh Học Bản Mệnh</h2>
            <p className="text-xs text-amber-100/80 mt-1">
              Khám phá chu kỳ Thể chất, Cảm xúc & Trí tuệ cá nhân
            </p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1.5 bg-white/15 backdrop-blur-md hover:bg-white/25 rounded-full text-xs font-semibold border border-white/20 transition-all flex items-center gap-1.5"
          >
            <User size={14} />
            {isEditing ? 'Đóng' : 'Đổi thông tin'}
          </button>
        </div>

        {!isEditing && profile.fullName && (
          <div className="mt-4 pt-4 border-t border-white/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-200 font-bold text-sm">
                {profile.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">{profile.fullName}</p>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                  Sinh ngày: {new Date(profile.birthDate).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-amber-200/70 block uppercase">Chỉ số hài hòa</span>
              <span className="text-lg font-black text-amber-300">{harmonyScore}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Form Modal / Box */}
      {isEditing && (
        <form onSubmit={saveProfile} className="bg-white rounded-3xl p-6 shadow-lg border border-red-100 space-y-4 animate-in fade-in zoom-in-95">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <User className="text-red-600" size={18} />
            Nhập thông tin cá nhân
          </h3>
          <p className="text-xs text-gray-500">
            Ngày sinh chính xác giúp tính toán chu kỳ nhịp sinh học chuẩn xác nhất theo ngày, tuần, tháng.
          </p>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Họ và tên</label>
            <input
              type="text"
              required
              placeholder="Nguyễn Văn A"
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Ngày tháng năm sinh</label>
              <input
                type="date"
                required
                value={profile.birthDate}
                onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Giờ sinh (Tùy chọn)</label>
              <input
                type="time"
                value={profile.birthTime || '08:00'}
                onChange={(e) => setProfile({ ...profile, birthTime: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-98"
          >
            Lưu & Xem Nhịp Sinh Học
          </button>
        </form>
      )}

      {!isEditing && (
        <>
          {/* View Toggle & Date Navigator */}
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 space-y-3">
            {/* Date Picker Header */}
            <div className="flex justify-between items-center px-1">
              <button 
                onClick={handlePrevDay} 
                className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-center">
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider block">
                  {targetDate.toDateString() === new Date().toDateString() ? 'Hôm nay' : 'Ngày đang xem'}
                </span>
                <h4 className="text-base font-extrabold text-gray-900">
                  {targetDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                </h4>
              </div>
              <button 
                onClick={handleNextDay} 
                className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* View Mode Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('day')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'day' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Theo Ngày
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'week' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Theo Tuần
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'month' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Theo Tháng
              </button>
            </div>
          </div>

          {/* Mode 1: DAY VIEW */}
          {viewMode === 'day' && (
            <div className="space-y-4">
              {dailyCycles.map((cycle) => {
                const IconComponent = cycle.icon;
                const absVal = Math.abs(cycle.value);
                const isPositive = cycle.value >= 0;

                return (
                  <div
                    key={cycle.key}
                    className={`bg-white rounded-2xl p-4 shadow-sm border ${cycle.borderColor} transition-all hover:shadow-md`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${cycle.bgLight}`} style={{ color: cycle.color }}>
                          <IconComponent size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{cycle.name}</h4>
                          <span className="text-[10px] text-gray-400 font-medium">
                            Chu kỳ {cycle.period} ngày
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-black" style={{ color: cycle.color }}>
                          {cycle.value > 0 ? `+${cycle.value}%` : `${cycle.value}%`}
                        </span>
                        <span className={`block text-[10px] font-bold ${
                          cycle.status === 'critical' ? 'text-amber-600' : isPositive ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                          {cycle.status === 'critical' ? 'Điểm chuyển giao' : isPositive ? 'Năng lượng cao' : 'Năng lượng tái tạo'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Gauge */}
                    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden my-2">
                      {/* Zero center marker line */}
                      <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-300 z-10" />
                      {/* Bar fill */}
                      <div
                        className="absolute top-0 bottom-0 transition-all duration-500 rounded-full"
                        style={{
                          backgroundColor: cycle.color,
                          left: isPositive ? '50%' : `${50 - absVal / 2}%`,
                          width: `${absVal / 2}%`
                        }}
                      />
                    </div>

                    {/* Advice Message */}
                    <p className="text-xs text-gray-600 mt-2.5 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 leading-relaxed">
                      💡 {cycle.description}
                    </p>
                  </div>
                );
              })}

              {/* General Harmony Summary Card */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 text-amber-900 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={18} className="text-amber-600" />
                  <h4 className="font-bold text-sm text-amber-950">Lời Khuyên Tổng Quan Trong Ngày</h4>
                </div>
                <p className="text-xs text-amber-900/90 leading-relaxed">
                  {harmonyScore >= 70 && 'Hôm nay các chỉ số sinh học đang ở trạng thái đỉnh cao! Rất phù hợp để khởi công công việc mới, đi công tác xa hoặc đưa ra các quyết định quan trọng.'}
                  {harmonyScore >= 40 && harmonyScore < 70 && 'Chỉ số nhịp sinh học ở mức cân bằng tự nhiên. Bạn có thể sinh hoạt và làm việc bình thường, giữ tinh thần thư thái và lắng nghe cơ thể.'}
                  {harmonyScore < 40 && 'Năng lượng tổng thể ở mức thấp. Nên dành nhiều thời gian nghỉ ngơi, chăm sóc bản thân, tránh lao lực quá sức hoặc tranh luận không cần thiết.'}
                </p>
              </div>
            </div>
          )}

          {/* Mode 2: WEEK VIEW */}
          {viewMode === 'week' && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Biểu Đồ Xu Hướng 7 Ngày</h4>
                  <p className="text-xs text-gray-500">Xem diễn biến thể chất, cảm xúc & trí tuệ tuần này</p>
                </div>
                <BarChart2 className="text-red-600" size={20} />
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 text-[11px] font-bold pt-1">
                {CYCLE_CONFIGS.map(c => (
                  <div key={c.key} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-gray-700">{c.name}</span>
                  </div>
                ))}
              </div>

              {/* 7-Day Forecast Grid */}
              <div className="space-y-3 pt-2">
                {weekForecast.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl transition-all border ${
                      item.isTarget
                        ? 'bg-red-50/60 border-red-200 ring-2 ring-red-400/30'
                        : 'bg-gray-50/50 border-gray-100'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
                          item.isTarget ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {item.dayLabel}
                        </span>
                        <span className="text-xs font-bold text-gray-800">
                          {item.dateNum}/{item.monthNum}
                        </span>
                      </div>
                      {item.isTarget && (
                        <span className="text-[10px] font-extrabold text-red-600 uppercase tracking-wider">
                          • Ngày hiện tại
                        </span>
                      )}
                    </div>

                    {/* Cycle Bars for this day */}
                    <div className="grid grid-cols-4 gap-2">
                      {item.cycles.map((cyc) => {
                        const isPos = cyc.val >= 0;
                        return (
                          <div key={cyc.key} className="bg-white p-2 rounded-xl border border-gray-100 text-center shadow-2xs">
                            <span className="text-[9px] font-bold text-gray-400 uppercase block">
                              {CYCLE_CONFIGS.find(c => c.key === cyc.key)?.name}
                            </span>
                            <span className="text-xs font-black block mt-0.5" style={{ color: cyc.color }}>
                              {isPos ? `+${cyc.val}%` : `${cyc.val}%`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mode 3: MONTH VIEW */}
          {viewMode === 'month' && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Lịch Nhịp Sinh Học Tháng {targetDate.getMonth() + 1}/{targetDate.getFullYear()}</h4>
                <p className="text-xs text-gray-500">Màu xanh: Năng lượng tốt | Màu cam/đỏ: Điểm cần lưu ý</p>
              </div>

              {/* Monthly Day Grid */}
              <div className="grid grid-cols-7 gap-1.5 text-center">
                {monthForecast.map((d) => {
                  let bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                  if (d.avg < -20) bgClass = 'bg-red-50 text-red-800 border-red-200';
                  else if (Math.abs(d.avg) <= 15) bgClass = 'bg-amber-50 text-amber-800 border-amber-200';

                  return (
                    <button
                      key={d.day}
                      onClick={() => {
                        const newD = new Date(targetDate);
                        newD.setDate(d.day);
                        setTargetDate(newD);
                        setViewMode('day');
                      }}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${bgClass} ${
                        d.isTarget ? 'ring-2 ring-red-600 font-extrabold scale-105' : 'hover:scale-100'
                      }`}
                    >
                      <span className="text-xs font-bold">{d.day}</span>
                      <span className="text-[9px] opacity-80 mt-0.5 font-semibold">
                        {d.avg > 0 ? `+${d.avg}` : d.avg}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="text-[11px] text-gray-500 bg-gray-50 p-3 rounded-xl space-y-1">
                <p>• Bấm vào ngày bất kỳ trong tháng để xem chi tiết lời khuyên cụ thể.</p>
                <p>• Các ngày viền màu vàng nhạt là thời điểm chuyển giao nhịp sinh học.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Biorhythm;
