import React, { useState } from 'react';
import { Flame, CalendarHeart, Quote, Sparkles, ChevronRight, ChevronDown, Compass, ShieldCheck, Heart, Scroll, Search, CheckCircle2 } from 'lucide-react';

interface CustomSection {
  id: string;
  categoryNumber: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  badge: string;
  colorTheme: {
    bg: string;
    border: string;
    accent: string;
    badgeBg: string;
    badgeText: string;
  };
  summary: string;
  subsections: {
    title: string;
    content: string;
    highlights?: string[];
  }[];
  quotes?: {
    text: string;
    explanation: string;
  }[];
}

const CUSTOMS_DATA: CustomSection[] = [
  {
    id: 'ancestor-worship',
    categoryNumber: 1,
    title: 'Đạo Lý Uống Nước Nhớ Nguồn: Tục Thờ Cúng Tổ Tiên',
    subtitle: 'Nền tảng tâm linh & Bố trí bàn thờ gia tiên chuẩn phong thủy',
    icon: Scroll,
    badge: 'ĐẠO LÝ NỀN TẢNG',
    colorTheme: {
      bg: 'bg-amber-900/10',
      border: 'border-amber-700/30',
      accent: 'text-amber-700',
      badgeBg: 'bg-amber-800',
      badgeText: 'text-amber-100'
    },
    summary: 'Thờ cúng tổ tiên là tâm thức văn hóa thiêng liêng nhất của người Việt, thể hiện lòng hiếu thảo, sự tri ân cội nguồn và cầu mong bình an cho con cháu.',
    subsections: [
      {
        title: '1. Ý nghĩa sâu xa của tục thờ cúng',
        content: 'Bàn thờ gia tiên là không gian kết nối giữa quá khứ và hiện tại. Người Việt tin rằng ông bà tổ tiên tuy đã khuất nhưng linh hồn vẫn luôn đồng hành, che chở và chứng giám cho lòng thành của con cháu.'
      },
      {
        title: '2. Bố trí không gian thờ cúng chuẩn phong thủy',
        content: 'Bàn thờ phải đặt ở vị trí trang trọng, cao ráo, "tọa cát hướng cát" (đặt vị trí tốt và hướng về phía tốt). Tránh đặt đối diện nhà vệ sinh, dưới cầu thang hoặc thẳng cửa phòng ngủ.',
        highlights: [
          'Bàn thờ Gia tiên: Bát hương đặt chính giữa, phía sau là bài vị hoặc ảnh thờ. Đèn dầu/nến đặt hai bên đại diện cho Âm - Dương.',
          'Bàn thờ Thần Tài - Thổ Địa: Đặt dưới mặt đất hướng ra cửa chính để đón tài lộc, giữ đất đai yên lành. Luôn giữ sạch sẽ, có hũ gạo, hũ muối, hũ nước đầy.'
        ]
      },
      {
        title: '3. Lễ vật dâng cúng & Ý nghĩa',
        content: 'Lễ vật không cần quá mâm cao mỗ đầy mà coi trọng lòng thành kính và sự tinh sạch.',
        highlights: [
          'Mâm ngũ quả: Biểu tượng cho Ngũ hành (Kim - Mộc - Thủy - Hỏa - Thổ), cầu mong Phúc - Lộc - Thọ - Khang - Ninh.',
          'Hương & Hoa tươi: Hoa cúc vàng, hoa sen, hoa huệ tượng trưng cho sự thanh cao, trang nghiêm.',
          'Trầu cau & Trà nước: "Miếng trầu là đầu câu chuyện" kết nối âm dương. Nước sạch thể hiện sự thanh thuần.',
          'Mâm cỗ cúng: Món ăn truyền thống (bánh chưng, gà luộc, xôi nghệ, canh bóng) thể hiện sự no đủ.'
        ]
      },
      {
        title: '4. Quy tắc & Thời điểm cúng bái',
        content: 'Thứ tự thắp hương từ bàn thờ Phật, bàn thờ Gia tiên đến Thần Tài - Thổ Địa.',
        highlights: [
          'Số nén hương: Thắp số lẻ (1, 3, 5 nén) đại diện cho tính Dương. 1 nén cúng bình an, 3 nén cúng cầu điều lớn.',
          'Số lạy: Khi vái lạy gia tiên thắp 3 lạy (hoặc 4 lạy tùy địa phương), giữ tâm tịnh, trang phục lịch sự.',
          'Thời điểm thích hợp: Mùng 1 (ngày Sóc), Rằm (ngày Vọng), giỗ chạp và dịp Lễ Tết.'
        ]
      }
    ]
  },
  {
    id: 'incense-ritual',
    categoryNumber: 2,
    title: 'Nghi Thức Và Nghệ Thuật Thắp Hương (Nhang Khói)',
    subtitle: 'Nhịp cầu nối giữa cõi âm & cõi dương',
    icon: Flame,
    badge: 'NGHI THỨC TÂM LINH',
    colorTheme: {
      bg: 'bg-red-950/10',
      border: 'border-red-800/30',
      accent: 'text-red-700',
      badgeBg: 'bg-red-800',
      badgeText: 'text-red-100'
    },
    summary: 'Nàn khói hương thơm quyện tỏa là ngôn ngữ thầm lặng nhưng sâu sắc, mang theo lời nguyện cầu, nỗi nhớ thương gửi gắm tới tổ tiên thần linh.',
    subsections: [
      {
        title: '1. Ý nghĩa tâm linh của khói hương',
        content: 'Làn khói hương bay lên cao là biểu tượng cho sự thăng hoa của lời cầu nguyện. Mùi hương tự nhiên giúp thư thái tâm trí, xua tan tà khí, đưa không gian trở nên ấm cúng thiêng liêng.'
      },
      {
        title: '2. Phân loại hương & Cách lựa chọn an toàn',
        content: 'Nên chọn các loại hương thảo mộc tự nhiên để đảm bảo sức khỏe cho gia đình và giữ không gian thanh sạch.',
        highlights: [
          'Hương Trầm: Mùi hương ấm áp, thanh nhã, quý giá, giúp định tâm và mang lại may mắn.',
          'Hương Vòng: Cháy lâu trong nhiều giờ, thường dùng trong dịp Tết, giỗ lớn hoặc canh đêm Giao thừa.',
          'Hương Bài: Mùi hương đặc trưng mùa Tết miền Bắc làm từ rễ cây bài tự nhiên.',
          'Lưu ý chọn hương: Tránh dùng hương ngâm hóa chất cuộn tàn đậu tàn giả, nên chọn hương tự nhiên ít khói, mùi thơm dịu nhẹ.'
        ]
      },
      {
        title: '3. Điều kiêng kỵ quan trọng khi thắp hương',
        content: 'Giữ tâm tịnh, ăn mặc chỉnh tề và tuân thủ các nguyên tắc văn hóa truyền thống.',
        highlights: [
          'Không thắp hương số chẵn (2, 4, 6 nén) vì số chẵn thuộc tính Âm.',
          'Tránh dùng miệng thổi tắt lửa trên nén hương, hãy dùng tay vẩy nhẹ.',
          'Tuyệt đối không dùng hương bị ẩm mốc hoặc rơi vỡ dưới đất.',
          'Giữ tâm tịnh, không nói lời bất kính hoặc cãi nhau trước bàn thờ.'
        ]
      }
    ]
  },
  {
    id: 'spiritual-festivals',
    categoryNumber: 3,
    title: 'Nhịp Sống Tâm Linh: Các Ngày Tết & Lễ Hội Lớn',
    subtitle: 'Bức tranh lễ tiết gắn liền với nông nghiệp lúa nước',
    icon: CalendarHeart,
    badge: 'LỄ TIẾT TRUYỀN THỐNG',
    colorTheme: {
      bg: 'bg-amber-950/10',
      border: 'border-amber-800/30',
      accent: 'text-amber-800',
      badgeBg: 'bg-amber-900',
      badgeText: 'text-amber-100'
    },
    summary: 'Vòng quay thời gian trong năm của người Việt gắn liền với các kỳ Lễ Tết. Đây là dịp gia đình đoàn tụ, tri ân đất trời và cầu mong mưa thuận gió hòa.',
    subsections: [
      {
        title: '1. Tết Nguyên Đán & Mùa Xuân Đoàn Viên',
        content: 'Dịp lễ lớn nhất trong năm, kết tinh những giá trị văn hóa cao đẹp nhất.',
        highlights: [
          '23 tháng Chạp (Cúng Ông Công Ông Táo): Tiễn Táo Quân về trời báo cáo việc gia đình.',
          'Lễ Tất Niên (30 Tết): Mâm cỗ tiễn năm cũ, đón gia tiên về ăn Tết cùng con cháu.',
          'Đêm Giao Thừa: Lễ trừ tịnh, chuyển giao năm cũ - năm mới, cúng ngoài trời và trong nhà.',
          'Xông đất & Hóa vàng: Mời người hợp tuổi xông nhà mang may mắn; làm lễ hóa vàng tiễn ông bà sau Mùng 3.'
        ]
      },
      {
        title: '2. Các ngày Lễ Tết quan trọng trong năm',
        content: 'Mỗi dịp lễ mang một thông điệp nhân văn sâu sắc về tự nhiên và đạo hiếu.',
        highlights: [
          'Tết Nguyên Tiêu (Rằm tháng Giêng): "Cúng quanh năm không bằng Rằm tháng Giêng" - cầu bình an đầu năm.',
          'Tết Hàn Thực (Mùng 3 tháng 3): Ăn bánh trôi bánh chay, tưởng nhớ cội nguồn và lòng trong sạch.',
          'Tết Đoan Ngọ (Mùng 5 tháng 5): Tết diệt sâu bọ, thưởng thức hoa quả tươi, rượu nếp dâng cúng.',
          'Lễ Vu Lan / Rằm tháng Bảy (15/7 Âm lịch): Xá tội vong nhân, cài hoa hồng báo hiếu cha mẹ.',
          'Tết Trung Thu (Rằm tháng Tám): Tết đoàn viên, ngắm trăng, rước đèn và gắn kết tình thân.'
        ]
      }
    ]
  },
  {
    id: 'folk-wisdom',
    categoryNumber: 4,
    title: 'Văn Hóa Dân Gian Qua Ca Dao - Tục Ngữ',
    subtitle: 'Kho tàng tri thức & bài học làm người đúc kết ngàn đời',
    icon: Quote,
    badge: 'TRI THỨC DÂN GIAN',
    colorTheme: {
      bg: 'bg-stone-900/10',
      border: 'border-stone-700/30',
      accent: 'text-stone-800',
      badgeBg: 'bg-stone-800',
      badgeText: 'text-stone-100'
    },
    summary: 'Ca dao tục ngữ là lời ru tâm hồn người Việt, nhắn nhủ con cháu giữ trọn đạo hiếu, lòng biết ơn và cách đối nhân xử thế văn minh.',
    subsections: [
      {
        title: 'Tri thức dân gian đúc kết',
        content: 'Các câu ca dao ngắn gọn nhưng chứa đựng triết lý sống bền vững vượt thời gian.'
      }
    ],
    quotes: [
      {
        text: '“Dù ai buôn bán đâu xa,\nNgày giỗ tổ tiên thì về.”',
        explanation: 'Nhắc nhở dù bận rộn làm ăn sinh sống ở phương trời nào, ngày giỗ gia tiên vẫn là thời điểm thiêng liêng để con cháu thu xếp về thắp nén hương tưởng nhớ cội nguồn.'
      },
      {
        text: '“Ăn quả nhớ kẻ trồng cây.”',
        explanation: 'Bài học nền tảng về lòng biết ơn. Thưởng thức thành quả ngày nay phải luôn ghi nhớ công ơn người đi trước đã hy sinh, vất vả gầy dựng.'
      },
      {
        text: '“Học ăn, học nói, học gói, học mở.”',
        explanation: 'Lời khuyên về sự tinh tế, lịch sự trong giao tiếp và ứng xử hàng ngày. Từ cách ăn uống, ăn nói đến sắp xếp công việc đều cần sự khéo léo, lễ độ.'
      },
      {
        text: '“Mùng một đầu tháng, rằm cuối tháng.”',
        explanation: 'Đúc kết kinh nghiệm quan sát chu kỳ mặt trăng của cư dân nông nghiệp, đánh dấu những mốc thời gian chuyển giao năng lượng quan trọng trong tháng.'
      },
      {
        text: '“Tháng Giêng là tháng ăn chơi...”',
        explanation: 'Phản ánh nhịp sống nông nghiệp sau mùa thu hoạch bội thu, người dân dành tháng đầu năm để du xuân, hội hè và chiêm bái các danh thắng cầu may.'
      }
    ]
  },
  {
    id: 'modern-harmony',
    categoryNumber: 5,
    title: 'Giao Thoa Hiện Đại: Giữ Nét Đẹp Đời Sống Mới',
    subtitle: 'Nét đẹp văn minh, bảo vệ môi trường & Phân biệt phong tục - mê tín',
    icon: Compass,
    badge: 'NẾP SỐNG MỚI',
    colorTheme: {
      bg: 'bg-emerald-950/10',
      border: 'border-emerald-800/30',
      accent: 'text-emerald-800',
      badgeBg: 'bg-emerald-900',
      badgeText: 'text-emerald-100'
    },
    summary: 'Giữ gìn cái "Gốc" cốt lõi của tâm linh truyền thống bằng thái độ văn minh, tiết kiệm, phù hợp với nhịp sống đô thị và căn hộ chung cư hiện đại.',
    subsections: [
      {
        title: '1. Sự thay đổi phù hợp trong đời sống đô thị',
        content: 'Cúng bái văn minh coi trọng sự gọn gàng, thành tâm thay vì phô trương hình thức.',
        highlights: [
          'Hạn chế đốt vàng mã: Giảm bớt lượng đốt vàng mã phô trương để bảo vệ môi trường, giảm nguy cơ hỏa hoạn và tiết kiệm chi phí.',
          'Thắp ít hương ở chung cư: Chỉ cần thắp 1 nén hương thanh tịnh để đảm bảo an toàn PCCC và sức khỏe gia đình.',
          'Mâm cỗ tinh giản: Chuẩn bị mâm cỗ gọn gàng, tránh lãng phí thực phẩm, chú trọng sự ấm cúng gia đình.'
        ]
      },
      {
        title: '2. Phân biệt Phong tục văn hóa & Mê tín dị đoan',
        content: 'Giữ tâm sáng, tin vào nhân quả và đạo đức thay vì phó mặc vào bùa chú, bói toán tốn kém.',
        highlights: [
          'Phong tục tốt đẹp: Thờ cúng tri ân tổ tiên, chúc Tết người già, mừng tuổi con trẻ, hiếu thảo gia đình.',
          'Mê tín dị đoan: Dâng sao giải hạn tốn hàng chục triệu, cúng bái giải bùa mê, nghe lời phán bói toán vô căn cứ.',
          'Triết lý lõi: "Sống có đức thì mặc sức mà ăn". Lòng thành và việc thiện mới là cội nguồn của bình an và may mắn.'
        ]
      }
    ]
  }
];

const CustomsInfo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [expandedSection, setExpandedSection] = useState<string | null>('ancestor-worship');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredCustoms = CUSTOMS_DATA.filter(custom => {
    if (activeTab !== 'all' && custom.id !== activeTab) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      custom.title.toLowerCase().includes(q) ||
      custom.subtitle.toLowerCase().includes(q) ||
      custom.summary.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-5 pb-20 max-w-md mx-auto space-y-6 bg-gradient-to-b from-stone-50 via-amber-50/20 to-stone-100 min-h-screen">
      {/* Luxury Banner Header */}
      <div className="bg-gradient-to-r from-red-900 via-amber-900 to-red-950 text-amber-100 rounded-3xl p-6 shadow-xl border border-amber-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 bg-amber-400/20 text-amber-200 text-[0.625rem] font-extrabold uppercase tracking-widest rounded-full border border-amber-400/30">
              Sổ Tay Văn Hóa
            </span>
          </div>
          <h2 className="text-2xl font-black text-amber-50 tracking-tight leading-tight">
            Phong Tục & Đạo Lý Việt
          </h2>
          <p className="text-xs text-amber-200/90 mt-1.5 leading-relaxed font-normal">
            Cội nguồn tâm linh, nghi thức thờ cúng & Nếp sống văn minh hiện đại
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-between text-[0.6875rem] text-amber-300/80">
          <span className="flex items-center gap-1">
            <Heart size={13} className="text-red-400" /> Uống nước nhớ nguồn
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck size={13} className="text-emerald-400" /> Đời sống mới
          </span>
        </div>
      </div>

      {/* Search & Category Selector */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm tục lệ, cúng bái, ca dao..."
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-stone-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-800 text-stone-800 shadow-xs"
          />
        </div>

        {/* Category Horizontal Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeTab === 'all'
                ? 'bg-red-800 text-amber-100 border-red-900 shadow-md scale-102'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
            }`}
          >
            Tất cả chủ đề (5)
          </button>
          {CUSTOMS_DATA.map(c => (
            <button
              key={c.id}
              onClick={() => {
                setActiveTab(c.id);
                setExpandedSection(c.id);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                activeTab === c.id
                  ? 'bg-red-800 text-amber-100 border-red-900 shadow-md scale-102'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              Mục {c.categoryNumber}: {c.title.split(':')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion / Content Cards */}
      <div className="space-y-5">
        {filteredCustoms.map((section) => {
          const IconComp = section.icon;
          const isExpanded = expandedSection === section.id || activeTab !== 'all';

          return (
            <div
              key={section.id}
              className={`bg-white rounded-3xl border ${section.colorTheme.border} shadow-sm overflow-hidden transition-all duration-300`}
            >
              {/* Card Header Toggle */}
              <button
                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                className={`w-full p-5 text-left flex items-start justify-between gap-3 transition-colors ${
                  isExpanded ? 'bg-amber-50/40' : 'hover:bg-stone-50'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-3 rounded-2xl ${section.colorTheme.bg} ${section.colorTheme.accent} shrink-0 mt-0.5`}>
                    <IconComp size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-[0.5625rem] font-extrabold rounded-md ${section.colorTheme.badgeBg} ${section.colorTheme.badgeText}`}>
                        {section.badge}
                      </span>
                      <span className="text-[0.6875rem] font-bold text-stone-400">
                        Mục {section.categoryNumber}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-stone-900 leading-snug">
                      {section.title}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 line-clamp-1 font-medium">
                      {section.subtitle}
                    </p>
                  </div>
                </div>

                <div className="p-1.5 bg-stone-100 text-stone-500 rounded-full shrink-0 mt-1">
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </button>

              {/* Expanded Card Body */}
              {isExpanded && (
                <div className="p-5 pt-2 border-t border-stone-100 space-y-5 animate-in fade-in duration-300">
                  {/* Summary Callout */}
                  <div className="bg-amber-50/80 border-l-4 border-amber-600 p-3.5 rounded-r-2xl text-stone-800 text-xs leading-relaxed font-medium">
                    {section.summary}
                  </div>

                  {/* Subsections */}
                  <div className="space-y-4">
                    {section.subsections.map((sub, idx) => (
                      <div key={idx} className="space-y-2">
                        <h4 className="text-sm font-bold text-red-900 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-700 shrink-0" />
                          {sub.title}
                        </h4>
                        <p className="text-xs text-stone-700 leading-relaxed font-normal pl-3.5">
                          {sub.content}
                        </p>

                        {/* Bullet Highlights if available */}
                        {sub.highlights && (
                          <div className="pl-3.5 space-y-1.5 mt-2">
                            {sub.highlights.map((h, hIdx) => (
                              <div key={hIdx} className="flex items-start gap-2 text-xs text-stone-800 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                                <span className="leading-normal">{h}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Quotes / Ca dao Tục ngữ section */}
                  {section.quotes && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Quote size={14} className="text-amber-700" /> Ca dao - Tục ngữ & Ý nghĩa sâu sắc
                      </h4>
                      <div className="space-y-3">
                        {section.quotes.map((q, qIdx) => (
                          <div key={qIdx} className="bg-gradient-to-br from-amber-900/5 to-red-900/5 border border-amber-200 p-4 rounded-2xl text-stone-800 space-y-2">
                            <p className="text-sm font-black text-red-900 whitespace-pre-line italic font-serif leading-relaxed">
                              {q.text}
                            </p>
                            <p className="text-xs text-stone-600 leading-relaxed pt-1 border-t border-amber-200/50">
                              <strong className="text-stone-800">Ý nghĩa:</strong> {q.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Cultural Creed */}
      <div className="bg-stone-900 text-stone-200 rounded-3xl p-6 text-center space-y-2 shadow-lg border border-stone-800">
        <Sparkles size={24} className="text-amber-400 mx-auto" />
        <h4 className="text-sm font-bold text-amber-200">Gốc Rễ Tốt Đẹp - Tương Lai Sáng Lạn</h4>
        <p className="text-xs text-stone-400 leading-relaxed font-normal">
          "Giữ gìn truyền thống không phải là giữ gìn hũ tro tàn, mà là truyền đi ngọn lửa thiêng của đạo hiếu và tình yêu thương."
        </p>
      </div>
    </div>
  );
};

export default CustomsInfo;
