
import { WallpaperItem } from './types';

import tetWallpaper from './src/assets/images/tet_vietnam_wallpaper_1785831024589.webp';
import flagWallpaper from './src/assets/images/vietnam_flag_wallpaper_1785831040235.webp';
import halongWallpaper from './src/assets/images/vietnam_travel_wallpaper_1785831059844.webp';
import hanoiWallpaper from './src/assets/images/hanoi_hoankiem_wallpaper_1785831078843.webp';
import hoianWallpaper from './src/assets/images/hoian_old_town_1785948613228.webp';
import mucangchaiWallpaper from './src/assets/images/mucangchai_terraced_1785948627857.webp';
import lotusWallpaper from './src/assets/images/vietnam_lotus_flower_1785948641112.webp';

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
    title: 'Tết Sum Vầy & Bánh Chưng Xanh',
    category: 'tet',
    url: tetWallpaper,
    description: 'Bánh chưng xanh, câu đối đỏ và hoa đào rực rỡ đón xuân mới',
    location: 'Truyền thống Tết Việt Nam'
  },

  // Tự hào Việt Nam
  {
    id: 'pat-1',
    title: 'Cờ Đỏ Sao Vàng Thiêng Liêng',
    category: 'patriotic',
    url: flagWallpaper,
    description: 'Lá cờ Tổ quốc tung bay trên nền trống đồng Đông Sơn rạng rỡ',
    location: 'Việt Nam'
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
    url: hoianWallpaper,
    description: 'Di sản văn hóa thế giới bình yên rực rỡ sắc đèn lồng',
    location: 'Quảng Nam'
  },
  {
    id: 'trv-4',
    title: 'Ruộng Bậc Thang Mù Cang Chải',
    category: 'travel',
    url: mucangchaiWallpaper,
    description: 'Tuyệt tác ruộng bậc thang chín vàng giữa mây ngàn Tây Bắc',
    location: 'Yên Bái'
  },

  // Văn hóa & Đời sống
  {
    id: 'cul-1',
    title: 'Hoa Sen Hồng Quốc Hoa',
    category: 'culture',
    url: lotusWallpaper,
    description: 'Vẻ đẹp thanh cao, thuần khiết "gần bùn mà chẳng hôi tinh mùi bùn"',
    location: 'Đồng Tháp Mười'
  }
];



export const TRADITIONAL_CUSTOMS = [
  {
    id: '1',
    title: 'Tết Nguyên Đán',
    summary: 'Lễ hội lớn nhất trong năm của người Việt.',
    content: 'Tết Nguyên Đán là dịp gia đình sum họp, tưởng nhớ tổ tiên và cầu chúc cho một năm mới an khang thịnh vượng. Các phong tục đặc trưng bao gồm: gói bánh chưng, xông đất, mừng tuổi...',
    imageUrl: tetWallpaper
  },
  {
    id: '2',
    title: 'Phong tục Thờ cúng Tổ tiên',
    summary: 'Nét đẹp văn hóa tâm linh của người Việt.',
    content: 'Thờ cúng tổ tiên thể hiện đạo lý "Uống nước nhớ nguồn". Mỗi gia đình Việt đều có bàn thờ để thắp hương vào các ngày rằm, mùng một và các ngày giỗ chạp.',
    imageUrl: flagWallpaper
  },
  {
    id: '3',
    title: 'Danh Thắng Vịnh Hạ Long',
    summary: 'Kỳ quan thiên nhiên thế giới tại Quảng Ninh.',
    content: 'Vịnh Hạ Long là di sản thiên nhiên thế giới được UNESCO công nhận với hàng nghìn hòn đảo đá vôi kỳ vĩ trên biển xanh ngọc bích.',
    imageUrl: halongWallpaper
  },
  {
    id: '4',
    title: 'Thủ Đô Hà Nội - Hồ Gươm',
    summary: 'Trái tim văn hóa nghìn năm văn hiến.',
    content: 'Hồ Gươm và Tháp Rùa cổ kính là biểu tượng lịch sử, gắn liền với truyền thuyết trả gươm thần của Vua Lê Lợi.',
    imageUrl: hanoiWallpaper
  },
  {
    id: '5',
    title: 'Phố Cổ Hội An',
    summary: 'Di sản văn hóa thế giới lung linh đèn lồng.',
    content: 'Hội An giữ nguyên vẻ đẹp kiến trúc cổ kính với những mái nhà rêu phong, đèn lồng rực rỡ và dòng sông Hoài êm đềm.',
    imageUrl: hoianWallpaper
  },
  {
    id: '6',
    title: 'Ruộng Bậc Thang Mù Cang Chải',
    summary: 'Kiệt tác lao động của đồng bào vùng cao Tây Bắc.',
    content: 'Những sóng lúa vàng óng ả uốn lượn trên triền núi Mù Cang Chải tạo nên bức tranh thiên nhiên kỳ vĩ bậc nhất.',
    imageUrl: mucangchaiWallpaper
  }
];
