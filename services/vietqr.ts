/** Tạo chuỗi VietQR (chuẩn EMVCo – NAPAS 247) cho chuyển khoản tới số tài khoản. Chạy hoàn toàn trên máy. */
const tlv = (id: string, value: string) => `${id}${String(value.length).padStart(2, '0')}${value}`;

/** CRC-16/CCITT-FALSE (đa thức 0x1021, khởi tạo 0xFFFF). */
export function crc16(s: string): string {
  let crc = 0xffff;
  for (let i = 0; i < s.length; i++) {
    crc ^= s.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function vietQrPayload(o: { bin: string; account: string; amount?: number; note?: string }): string {
  const beneficiary = tlv('00', o.bin) + tlv('01', o.account);
  const merchant = tlv('00', 'A000000727') + tlv('01', beneficiary) + tlv('02', 'QRIBFTTA');
  let p = tlv('00', '01') + tlv('01', o.amount ? '12' : '11') + tlv('38', merchant) + tlv('53', '704');
  if (o.amount) p += tlv('54', String(Math.round(o.amount)));
  p += tlv('58', 'VN');
  if (o.note) p += tlv('62', tlv('08', o.note.slice(0, 25)));
  p += '6304';
  return p + crc16(p);
}

/** Thông tin ủng hộ tác giả. */
export const AUTHOR = {
  email: 'dieplt.dongtien@gmail.com',
  phone: '0973884366',
  phoneDisplay: '0973 884 366',
  account: '0781000409918',
  accountName: 'Lê Thế Điệp',
  bank: 'Ngân hàng Vietcombank',
  bin: '970436', // mã NAPAS của Vietcombank
  note: 'Ung ho Lich Viet',
};

/** Ứng dụng ngân hàng hỗ trợ mở bằng deeplink của VietQR (dl.vietqr.io). autofill = tự điền STK, số tiền, nội dung. */
export interface BankApp { id: string; name: string; bank: string; autofill: boolean }
export const BANK_APPS: BankApp[] = [
  { id: 'vcb', name: 'VCB Digibank', bank: 'Vietcombank', autofill: false },
  { id: 'icb', name: 'VietinBank iPay', bank: 'VietinBank', autofill: true },
  { id: 'bidv', name: 'BIDV SmartBanking', bank: 'BIDV', autofill: true },
  { id: 'vba', name: 'Agribank Plus', bank: 'Agribank', autofill: false },
  { id: 'mb', name: 'MB Bank', bank: 'MB (Quân đội)', autofill: true },
  { id: 'tcb', name: 'Techcombank Mobile', bank: 'Techcombank', autofill: false },
  { id: 'acb', name: 'ACB ONE', bank: 'ACB', autofill: true },
  { id: 'vpb', name: 'VPBank NEO', bank: 'VPBank', autofill: false },
  { id: 'tpb', name: 'TPBank Mobile', bank: 'TPBank', autofill: false },
  { id: 'ocb', name: 'OCB OMNI', bank: 'OCB', autofill: true },
  { id: 'shb', name: 'SHB SAHA', bank: 'SHB', autofill: false },
  { id: 'hdb', name: 'HDBank', bank: 'HDBank', autofill: false },
  { id: 'lpb', name: 'LPBank', bank: 'LPBank (Lộc Phát)', autofill: false },
  { id: 'vib-2', name: 'MyVIB', bank: 'VIB', autofill: false },
  { id: 'seab', name: 'SeAMobile', bank: 'SeABank', autofill: false },
  { id: 'eib', name: 'Eximbank EDigi', bank: 'Eximbank', autofill: false },
  { id: 'scb', name: 'SCB Mobile Banking', bank: 'SCB (Sài Gòn)', autofill: false },
  { id: 'cake', name: 'Cake', bank: 'Cake by VPBank', autofill: false },
  { id: 'timo', name: 'Timo', bank: 'Timo (BVBank)', autofill: false },
  { id: 'nab', name: 'Nam A Bank', bank: 'Nam A Bank', autofill: false },
  { id: 'abb', name: 'ABBank', bank: 'ABBank', autofill: false },
  { id: 'shbvn', name: 'Shinhan SOL', bank: 'Shinhan Việt Nam', autofill: false },
  { id: 'wvn', name: 'Woori WON', bank: 'Woori Việt Nam', autofill: false },
  { id: 'klb', name: 'KienlongBank Plus', bank: 'KienlongBank', autofill: false },
  { id: 'bvb', name: 'BAOVIET Smart', bank: 'BaoViet Bank', autofill: false },
  { id: 'vab', name: 'Vietbank Digital', bank: 'VietABank', autofill: false },
  { id: 'ncb', name: 'NCB iziMobile', bank: 'NCB', autofill: false },
  { id: 'pvcb', name: 'PVConnect', bank: 'PVcomBank', autofill: false },
  { id: 'coopbank', name: 'Co-opBank', bank: 'Co-opBank', autofill: false },
  { id: 'sgicb', name: 'SAIGONBANK Smart', bank: 'Saigonbank', autofill: false },
  { id: 'cimb', name: 'Octo by CIMB', bank: 'CIMB Việt Nam', autofill: false },
  { id: 'pbvn', name: 'PB engage', bank: 'Public Bank VN', autofill: false },
  { id: 'oceanbank', name: 'Ocean Bank', bank: 'OceanBank', autofill: false },
];

/** Mã ngân hàng của tác giả dùng trong deeplink (Vietcombank = vcb). */
export const AUTHOR_BANK_CODE = 'vcb';

/** Bỏ dấu tiếng Việt và ký tự lạ – nhiều app ngân hàng không nhận nội dung có dấu. */
export function asciiNote(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 25);
}

/**
 * Đường dẫn mở thẳng ứng dụng ngân hàng (dịch vụ deeplink công khai của VietQR).
 * https://dl.vietqr.io/pay?app=&ba=STK@bank&am=&tn=&bn=&url=
 */
export function bankDeeplink(o: { app: string; account: string; bankCode: string; amount?: number; note?: string; name?: string; returnUrl?: string }): string {
  const q = new URLSearchParams();
  q.set('app', o.app);
  q.set('ba', `${o.account}@${o.bankCode}`);
  q.set('am', o.amount && o.amount > 0 ? String(Math.round(o.amount)) : '');
  q.set('tn', asciiNote(o.note || ''));
  if (o.name) q.set('bn', asciiNote(o.name).toUpperCase());
  q.set('url', o.returnUrl || 'https://vietqr.io');
  return `https://dl.vietqr.io/pay?${q.toString().replace(/\+/g, '%20')}`;
}

export function formatVnd(n: number): string {
  return `${Math.round(n).toLocaleString('vi-VN')} đ`;
}
