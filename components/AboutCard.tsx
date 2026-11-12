import React from 'react';
import { Info, Mail, Phone, Coffee } from 'lucide-react';
import DonatePanel from './DonatePanel';
import { Card, SectionTitle } from './ui';
import { DISCLAIMER } from '../services/almanac';
import { AUTHOR } from '../services/vietqr';

export const APP_VERSION = '2.4';

const AboutCard: React.FC = () => {
  return (
    <Card>
      <SectionTitle icon={<Info size={18} />} tone="blue" title="Giới thiệu" />
      <p className="text-sm text-gray-700" data-testid="about-version"><b>Lịch Việt: Văn hóa &amp; Phong tục</b> – phiên bản {APP_VERSION} by Ltd</p>
      <p className="text-sm text-gray-700 mt-2">Âm lịch tính theo thuật toán thiên văn của Hồ Ngọc Đức, múi giờ Việt Nam (UTC+7), dùng cho các năm 1900–2099.</p>
      <p className="text-sm text-gray-700 mt-2">Phần xem ngày tốt xấu dựa trên các phép phổ biến trong lịch vạn niên: Hoàng đạo/Hắc đạo, 12 Trực, Nhị thập bát tú, Ngọc Hạp Thông Thư, giờ Lý Thuần Phong, Kim Lâu, Hoang Ốc, Tam Tai. Có thêm thước Lỗ Ban (52,2 · 42,9 · 38,8 cm).</p>
      <p className="text-xs text-gray-500 mt-3 italic">{DISCLAIMER}</p>

      <div className="mt-4 pt-4 border-t border-giay-200">
        <div className="text-sm font-bold text-muc">Góp ý cho tác giả</div>
        <div className="grid grid-cols-1 gap-2 mt-2">
          <a href={`mailto:${AUTHOR.email}?subject=${encodeURIComponent('Góp ý ứng dụng Lịch Việt')}`} className="flex items-center gap-2 p-3 rounded-2xl bg-giay border border-giay-200 text-sm font-semibold text-blue-700 break-all"><Mail size={18} className="shrink-0" />{AUTHOR.email}</a>
          <a href={`tel:${AUTHOR.phone}`} className="flex items-center gap-2 p-3 rounded-2xl bg-giay border border-giay-200 text-sm font-semibold text-blue-700"><Phone size={18} className="shrink-0" />SĐT: {AUTHOR.phoneDisplay}</a>
        </div>
      </div>

    </Card>
  );
};

/** Ủng hộ tác giả: STK, số tiền, mã VietQR, mở app ngân hàng. */
export const SupportCard: React.FC = () => (
  <Card testId="support-card">
    <SectionTitle icon={<Coffee size={18} />} tone="kim" title="Ủng hộ tác giả" />
    <p className="text-sm text-gray-700">Nếu thấy ứng dụng hữu ích, mời tác giả một ly cà phê để có thêm kinh phí phát triển ứng dụng.</p>
    <DonatePanel />
  </Card>
);

export default AboutCard;
