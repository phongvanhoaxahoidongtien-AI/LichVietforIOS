import React from 'react';
import { TRUC_12 } from '../services/almanac';
import { TRUC_STYLE } from './ui';

/** Bảng giải thích 12 Trực (Kiến Trừ thập nhị khách). */
const TrucGuide: React.FC<{ current?: number }> = ({ current }) => (
  <div className="space-y-3" data-testid="truc-guide">
    <p className="text-sm text-gray-700">
      12 Trực (còn gọi Kiến Trừ thập nhị khách) xoay vòng theo ngày và tiết khí. Mỗi ngày ứng với một Trực, cho biết tính chất chung của ngày.
      Trực chỉ là <b>một trong nhiều yếu tố</b>; điểm từng việc trong ứng dụng còn tính Hoàng đạo, Nhị thập bát tú, sao Ngọc Hạp, ngày kỵ và tuổi.
    </p>
    <ul className="space-y-2">
      {TRUC_12.map((t, i) => {
        const st = TRUC_STYLE[t.tone];
        return (
          <li key={t.name} className={`p-3 rounded-2xl border ${i === current ? 'ring-2 ring-son-400 ' : ''}${st.chip.replace(/text-\S+/, '')}`}>
            <div className="flex items-baseline justify-between gap-2">
              <span className={`font-serif font-bold text-base ${st.text}`}>{i + 1}. Trực {t.name}{i === current ? ' (hôm đang xem)' : ''}</span>
              <span className={`text-xs font-bold ${st.text}`}>{st.label}</span>
            </div>
            <div className="text-sm text-gray-700 mt-0.5">{t.meaning}.</div>
            <div className="text-sm mt-1"><b className="text-green-700">Nên:</b> <span className="text-gray-700">{t.nen.join(', ')}.</span></div>
            <div className="text-sm"><b className="text-son-600">Kiêng:</b> <span className="text-gray-700">{t.kieng.join(', ')}.</span></div>
          </li>
        );
      })}
    </ul>
    <p className="text-xs text-gray-500 italic">
      Ghi chú: nhãn tốt/xấu theo cách phổ biến trong lịch Việt hiện nay. Câu thơ gốc trong sách trạch nhật
      ("Kiến Mãn Bình Thu hắc, Trừ Nguy Định Chấp hoàng, Thành Khai giai khả dụng, Bế Phá bất tương đương") xếp khác ở các trực Kiến, Mãn (xấu), Nguy, Chấp (tốt).
    </p>
  </div>
);

export default TrucGuide;
