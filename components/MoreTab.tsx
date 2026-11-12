import React, { useState } from 'react';
import { BookOpen, Activity, Settings, ChevronRight, ChevronLeft, Moon, Sun, Monitor, Type, ShieldCheck, Trash2, Smartphone, DatabaseBackup, Ruler, Layers, Share2, HeartHandshake } from 'lucide-react';
import CustomsInfo from './CustomsInfo';
import BackupPanel from './BackupPanel';
import AboutCard, { SupportCard } from './AboutCard';
import Biorhythm from './Biorhythm';
import LoBan from './LoBan';
import TrucGuide from './TrucGuide';
import { getDayInfo } from '../services/almanac';
import { useApp } from '../context';
import { Card, SectionTitle, Segmented } from './ui';
import { clearAll } from '../services/storage';
import type { AppSettings } from '../types';

type View = 'menu' | 'customs' | 'bio' | 'settings' | 'loban' | 'truc' | 'about';

const MoreTab: React.FC<{ onClearAll: () => void; onShareApp: () => void }> = ({ onClearAll, onShareApp }) => {
  const [view, setView] = useState<View>('menu');

  if (view !== 'menu') {
    const title = ({ customs: 'Phong tục', bio: 'Nhịp sinh học', settings: 'Cài đặt', loban: 'Thước Lỗ Ban', truc: '12 Trực', about: 'Giới thiệu, ủng hộ' } as Record<string, string>)[view];
    return (
      <div>
        <div className="px-4 pt-3">
          <button onClick={() => setView('menu')} className="flex items-center gap-1 text-son-600 font-bold py-2"><ChevronLeft size={20} /> Tiện ích</button>
          <span className="sr-only">{title}</span>
        </div>
        {view === 'customs' && <CustomsInfo />}
        {view === 'bio' && <Biorhythm />}
        {view === 'settings' && <SettingsView onClearAll={onClearAll} />}
        {view === 'loban' && <LoBan />}
        {view === 'about' && <div className="p-4 pb-8 space-y-4"><AboutCard /><SupportCard /></div>}
        {view === 'truc' && <div className="p-4 pb-8"><h2 className="font-serif text-2xl font-bold text-muc mb-3">12 Trực</h2><TrucGuide current={getDayInfo(new Date()).truc.index} /></div>}
      </div>
    );
  }

  const items: { id: View; title: string; desc: string; icon: React.ReactNode; tone: string }[] = [
    { id: 'loban', title: 'Thước Lỗ Ban', desc: 'Dương trạch 52,2 · 42,9 cm, Âm phần 38,8 cm', icon: <Ruler size={22} />, tone: 'bg-kim-50 text-kim-700' },
    { id: 'truc', title: '12 Trực', desc: 'Ý nghĩa Kiến, Trừ, Mãn, Bình… nên và kiêng', icon: <Layers size={22} />, tone: 'bg-green-50 text-green-700' },
    { id: 'customs', title: 'Phong tục, lễ tết', desc: 'Ý nghĩa và cách thực hành phong tục Việt', icon: <BookOpen size={22} />, tone: 'bg-son-50 text-son-600' },
    { id: 'bio', title: 'Nhịp sinh học', desc: 'Chu kỳ thể chất, cảm xúc, trí tuệ', icon: <Activity size={22} />, tone: 'bg-kim-50 text-kim-700' },
    { id: 'settings', title: 'Cài đặt, sao lưu', desc: 'Giao diện, cỡ chữ, sao lưu và khôi phục dữ liệu', icon: <Settings size={22} />, tone: 'bg-blue-50 text-blue-700' },
    { id: 'about', title: 'Giới thiệu, ủng hộ', desc: 'Thông tin ứng dụng, góp ý, ủng hộ tác giả', icon: <HeartHandshake size={22} />, tone: 'bg-son-50 text-son-600' },
  ];

  return (
    <div className="p-4 pb-8 space-y-3">
      <h2 className="font-serif text-2xl font-bold text-muc mb-1">Tiện ích</h2>
      {items.map((it) => (
        <button key={it.id} onClick={() => setView(it.id)} className="w-full bg-white border border-giay-200 rounded-3xl p-4 flex items-center gap-4 text-left shadow-sm active:scale-[.99] transition-transform">
          <span className={`p-3 rounded-2xl ${it.tone}`}>{it.icon}</span>
          <span className="flex-1"><span className="block font-bold text-muc">{it.title}</span><span className="block text-sm text-gray-500">{it.desc}</span></span>
          <ChevronRight size={20} className="text-gray-400" />
        </button>
      ))}
      <button onClick={onShareApp} data-testid="menu-share" className="w-full bg-white border border-giay-200 rounded-3xl p-4 flex items-center gap-4 text-left shadow-sm active:scale-[.99] transition-transform">
        <span className="p-3 rounded-2xl bg-son-50 text-son-600"><Share2 size={22} /></span>
        <span className="flex-1"><span className="block font-bold text-muc">Chia sẻ ứng dụng</span><span className="block text-sm text-gray-500">Gửi Lịch Việt cho người thân, bạn bè</span></span>
        <ChevronRight size={20} className="text-gray-400" />
      </button>
    </div>
  );
};

const SettingsView: React.FC<{ onClearAll: () => void }> = ({ onClearAll }) => {
  const { settings, updateSettings, toast } = useApp();
  const [confirm, setConfirm] = useState(false);
  const online = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;

  return (
    <div className="p-4 pb-8 space-y-4">
      <Card>
        <SectionTitle icon={<Moon size={18} />} title="Giao diện" />
        <Segmented<AppSettings['theme']> value={settings.theme} onChange={(v) => updateSettings({ theme: v })}
          options={[{ value: 'light', label: 'Sáng', icon: <Sun size={16} /> }, { value: 'dark', label: 'Tối', icon: <Moon size={16} /> }, { value: 'system', label: 'Theo máy', icon: <Monitor size={16} /> }]} />
        <div className="mt-5">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Type size={14} /> Cỡ chữ</div>
          <Segmented<string> value={String(settings.fontScale)} onChange={(v) => updateSettings({ fontScale: Number(v) as AppSettings['fontScale'] })}
            options={[{ value: '1', label: 'Vừa' }, { value: '1.125', label: 'Lớn' }, { value: '1.25', label: 'Rất lớn' }]} />
          <p className="text-xs text-gray-500 mt-2">Chữ lớn giúp người cao tuổi dễ đọc hơn. Có thể phóng to bằng hai ngón tay.</p>
        </div>
        <label className="mt-5 flex items-center justify-between gap-3 cursor-pointer">
          <span><span className="block text-sm font-bold text-muc">Hiện Trực trên lịch tháng</span><span className="block text-xs text-gray-500">Tên Trực tô màu: xanh tốt, vàng bình hòa, đỏ xấu</span></span>
          <input type="checkbox" className="w-6 h-6 accent-son-600" checked={settings.showTruc !== false} onChange={(e) => updateSettings({ showTruc: e.target.checked })} data-testid="setting-truc" />
        </label>
      </Card>

      <Card>
        <SectionTitle icon={<Smartphone size={18} />} tone="kim" title="Cài ra màn hình chính" />
        <ul className="text-sm text-gray-700 space-y-1.5 list-disc pl-5">
          <li><b>Android (Chrome):</b> bấm ⋮ → "Thêm vào màn hình chính" hoặc "Cài đặt ứng dụng".</li>
          <li><b>iPhone (Safari):</b> bấm nút Chia sẻ → "Thêm vào MH chính".</li>
          <li>Sau lần mở đầu tiên, ứng dụng dùng được khi không có mạng.</li>
        </ul>
      </Card>

      <Card>
        <SectionTitle icon={<ShieldCheck size={18} />} tone="green" title="Bảo mật và dữ liệu" />
        <ul className="text-sm text-gray-700 space-y-1.5 list-disc pl-5">
          <li>Mọi tính toán chạy ngay trên máy; ứng dụng không gửi dữ liệu ra ngoài. Kết nối duy nhất là tới Google, và chỉ khi bạn tự bấm "Kết nối Google Drive".</li>
          <li>Không dùng AI trực tuyến, không quảng cáo, không theo dõi.</li>
          <li>Nhắc lịch, năm sinh, ảnh nền, nhịp sinh học chỉ lưu trong trình duyệt của máy này. Hãy sao lưu trước khi đổi máy.</li>
          <li>Không xin quyền camera, micro, vị trí. {online ? 'Có chế độ dùng khi không có mạng.' : ''}</li>
        </ul>
        {!confirm ? (
          <button onClick={() => setConfirm(true)} className="mt-4 w-full py-3 rounded-2xl border border-red-100 bg-son-50 text-son-700 font-bold flex items-center justify-center gap-2"><Trash2 size={16} /> Xóa toàn bộ dữ liệu trên máy</button>
        ) : (
          <div className="mt-4 p-3 rounded-2xl bg-son-50 border border-red-100">
            <p className="text-sm font-semibold text-son-700">Xóa hết nhắc lịch, năm sinh, ảnh nền, nhịp sinh học và cài đặt? Không thể hoàn tác.</p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button onClick={() => setConfirm(false)} className="py-2.5 rounded-xl bg-white border border-giay-200 font-bold text-gray-700">Hủy</button>
              <button onClick={() => { clearAll(); onClearAll(); setConfirm(false); toast('Đã xóa toàn bộ dữ liệu.'); }} className="py-2.5 rounded-xl bg-son-600 text-white font-bold">Xóa</button>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle icon={<DatabaseBackup size={18} />} tone="kim" title="Sao lưu và khôi phục" />
        <BackupPanel />
      </Card>

    </div>
  );
};

export default MoreTab;
