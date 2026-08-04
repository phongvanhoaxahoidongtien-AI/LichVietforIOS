
import { WallpaperItem } from './types';

import tetWallpaper from './src/assets/images/tet_vietnam_wallpaper_1785831024589.jpg';
import flagWallpaper from './src/assets/images/vietnam_flag_wallpaper_1785831040235.jpg';
import halongWallpaper from './src/assets/images/vietnam_travel_wallpaper_1785831059844.jpg';
import hanoiWallpaper from './src/assets/images/hanoi_hoankiem_wallpaper_1785831078843.jpg';

export const VIETNAMESE_PROVERBS = [
  "Có công mài sắt, có ngày nên kim.",
  "Ăn quả nhớ kẻ trồng cây.",
  "Một cây làm chẳng nên non, ba cây chụm lại nên hòn núi cao.",
  "Uống nước nhớ nguồn.",
  "Đi một ngày đàng, học một sàng khôn.",
  "Gần mực thì đen, gần đèn thì sáng.",
  "Lá lành đùm lá rách.",
  "Bầu ơi thương lấy bí cùng, tuy rằng khác giống nhưng chung một giàn.",
  "Thương người như thể thương thân.",
  "Công cha như núi Thái Sơn, nghĩa mẹ như nước trong nguồn chảy ra."
];

export const WALLPAPER_CATEGORIES = [
  { id: 'all', name: 'Tất cả' },
  { id: 'tet', name: 'Tết & Xuân' },
  { id: 'patriotic', name: 'Tự hào Việt Nam' },
  { id: 'travel', name: 'Danh lam Thắng cảnh' },
  { id: 'culture', name: 'Văn hóa & Đời sống' }
];

export const VIETNAM_WALLPAPERS: WallpaperItem[] = [
  // Tết & Xuân
  {
    id: 'tet-1',
    title: 'Tết Sum Vầy & Bánh Chưng',
    category: 'tet',
    url: tetWallpaper,
    description: 'Bánh chưng xanh, câu đối đỏ và hoa đào rực rỡ đón xuân mới',
    location: 'Truyền thống Tết Việt Nam'
  },
  {
    id: 'tet-2',
    title: 'Hoa Đào Xứ Bắc Rực Rỡ',
    category: 'tet',
    url: 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&q=80&w=1000',
    description: 'Sắc hồng tươi thắm của hoa đào đặc trưng mùa xuân miền Bắc',
    location: 'Hà Nội'
  },
  {
    id: 'tet-3',
    title: 'Sắc Đèn Lồng Đỏ Mùa Xuân',
    category: 'tet',
    url: 'https://images.unsplash.com/photo-1599708153386-62e2d062860e?auto=format&fit=crop&q=80&w=1000',
    description: 'Không khí lễ hội lung linh với hàng đèn lồng đỏ mang may mắn',
    location: 'Phố cổ Hội An'
  },
  {
    id: 'tet-4',
    title: 'Hoa Mai Vàng Nắng Phương Nam',
    category: 'tet',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1000',
    description: 'Sắc vàng rực rỡ của mai vàng mang đến tài lộc ngày xuân',
    location: 'Phương Nam'
  },

  // Tự hào Việt Nam
  {
    id: 'pat-1',
    title: 'Cờ Đỏ Sao Vàng Rạng Đông',
    category: 'patriotic',
    url: flagWallpaper,
    description: 'Lá cờ Tổ quốc tung bay trên nền trống đồng Đông Sơn thiêng liêng',
    location: 'Việt Nam'
  },
  {
    id: 'pat-2',
    title: 'Quảng Trường Ba Đình & Lăng Bác',
    category: 'patriotic',
    url: 'https://images.unsplash.com/photo-1509030450996-93997d76a742?auto=format&fit=crop&q=80&w=1000',
    description: 'Nơi Bác Hồ đọc Tuyên ngôn Độc lập khai sinh ra nước Việt Nam',
    location: 'Ba Đình, Hà Nội'
  },
  {
    id: 'pat-3',
    title: 'Mái Đình Cổ Kính Trầm Mặc',
    category: 'patriotic',
    url: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&q=80&w=1000',
    description: 'Nét chạm trổ điêu luyện mang đậm dấu ấn lịch sử dân tộc',
    location: 'Đình làng Việt Nam'
  },

  // Danh lam Thắng cảnh
  {
    id: 'trv-1',
    title: 'Vịnh Hạ Long Kỳ Vĩ',
    category: 'travel',
    url: halongWallpaper,
    description: 'Di sản thiên nhiên thế giới với hàng ngàn đảo đá vôi xanh ngọc',
    location: 'Quảng Ninh'
  },
  {
    id: 'trv-2',
    title: 'Tháp Rùa Hồ Gươm Hà Nội',
    category: 'travel',
    url: hanoiWallpaper,
    description: 'Biểu tượng văn hóa nghìn năm văn hiến giữa lòng thủ đô',
    location: 'Hà Nội'
  },
  {
    id: 'trv-3',
    title: 'Phố Cổ Hội An Lung Linh',
    category: 'travel',
    url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&q=80&w=1000',
    description: 'Di sản văn hóa thế giới bình yên bên dòng sông Hoài',
    location: 'Quảng Nam'
  },
  {
    id: 'trv-4',
    title: 'Ruộng Bậc Thang Mù Cang Chải',
    category: 'travel',
    url: 'https://images.unsplash.com/photo-1555932822-4a0088921df8?auto=format&fit=crop&q=80&w=1000',
    description: 'Tuyệt tác ruộng bậc thang chín vàng giữa mây ngàn Tây Bắc',
    location: 'Yên Bái'
  },
  {
    id: 'trv-5',
    title: 'Thác Nước Miền Vùng Cao',
    category: 'travel',
    url: 'https://images.unsplash.com/photo-1533910534207-90f31029a78e?auto=format&fit=crop&q=80&w=1000',
    description: 'Dòng nước tung bọt trắng xóa giữa đại ngàn xanh biếc',
    location: 'Cao Bằng'
  },

  // Văn hóa & Đời sống
  {
    id: 'cul-1',
    title: 'Hoa Sen Hồng Quốc Hoa',
    category: 'culture',
    url: 'https://images.unsplash.com/photo-1569614481026-641975e5330a?auto=format&fit=crop&q=80&w=1000',
    description: 'Vẻ đẹp thanh cao, thuần khiết "gần bùn mà chẳng hôi tinh mùi bùn"',
    location: 'Đồng Tháp Mười'
  },
  {
    id: 'cul-2',
    title: 'Thiếu Nữ Áo Dài & Nón Lá',
    category: 'culture',
    url: 'https://images.unsplash.com/photo-1543781531-97063d91786f?auto=format&fit=crop&q=80&w=1000',
    description: 'Tà áo dài duyên dáng tượng trưng cho vẻ đẹp tâm hồn người Việt',
    location: 'Việt Nam'
  },
  {
    id: 'cul-3',
    title: 'Chợ Phiên Vùng Cao Rực Rỡ',
    category: 'culture',
    url: 'https://images.unsplash.com/photo-1562601509-009181165440?auto=format&fit=crop&q=80&w=1000',
    description: 'Nét sinh hoạt đậm sắc màu văn hóa truyền thống của đồng bào',
    location: 'Tây Bắc'
  }
];

export const FOLK_IMAGES = VIETNAM_WALLPAPERS.map(w => w.url);

export const TRADITIONAL_CUSTOMS = [
  {
    id: '1',
    title: 'Tết Nguyên Đán',
    summary: 'Lễ hội lớn nhất trong năm của người Việt.',
    content: 'Tết Nguyên Đán là dịp gia đình sum họp, tưởng nhớ tổ tiên và cầu chúc cho một năm mới an khang thịnh vượng. Các phong tục đặc trưng bao gồm: gói bánh chưng, xông đất, mừng tuổi...',
    imageUrl: 'https://images.unsplash.com/photo-1611082260271-be9f7e8a93bc?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: '2',
    title: 'Phong tục Thờ cúng Tổ tiên',
    summary: 'Nét đẹp văn hóa tâm linh của người Việt.',
    content: 'Thờ cúng tổ tiên thể hiện đạo lý "Uống nước nhớ nguồn". Mỗi gia đình Việt đều có bàn thờ để thắp hương vào các ngày rằm, mùng một và các ngày giỗ chạp.',
    imageUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: '3',
    title: 'Lễ hội Đền Hùng',
    summary: 'Ngày Quốc giỗ của dân tộc Việt Nam.',
    content: 'Dù ai đi ngược về xuôi, nhớ ngày Giỗ Tổ mùng mười tháng ba. Lễ hội được tổ chức tại Phú Thọ để tưởng nhớ công lao các vua Hùng đã có công dựng nước.',
    imageUrl: 'https://images.unsplash.com/photo-1533910534207-90f31029a78e?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: '4',
    title: 'Tết Trung Thu',
    summary: 'Lễ hội trăng rằm dành cho thiếu nhi.',
    content: 'Tết Trung Thu diễn ra vào ngày rằm tháng Tám Âm lịch. Đây là dịp trẻ em rước đèn ông sao, xem múa lân và phá cỗ trông trăng cùng gia đình.',
    imageUrl: 'https://images.unsplash.com/photo-1569614481026-641975e5330a?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: '5',
    title: 'Lễ hội Chùa Hương',
    summary: 'Hành trình tâm linh về miền đất Phật.',
    content: 'Lễ hội Chùa Hương kéo dài từ tháng Giêng đến tháng Ba Âm lịch. Khách thập phương về đây để vãn cảnh sơn thủy hữu tình và cầu mong những điều tốt lành.',
    imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: '6',
    title: 'Phong tục Gói Bánh Chưng',
    summary: 'Biểu tượng của lòng biết ơn và sự sum vầy.',
    content: 'Bánh chưng hình vuông tượng trưng cho đất, được làm từ gạo nếp, đậu xanh và thịt lợn. Việc gói bánh chưng ngày Tết là truyền thống nhắc nhở con cháu về cội nguồn.',
    imageUrl: 'https://images.unsplash.com/photo-1643163155160-b88eb3e9cc72?auto=format&fit=crop&q=80&w=600'
  }
];
