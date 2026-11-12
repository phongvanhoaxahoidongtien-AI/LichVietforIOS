import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Check, Landmark, ExternalLink, ImageDown, Info } from 'lucide-react';
import QRCode from 'qrcode';
import { useApp } from '../context';
import { AUTHOR, AUTHOR_BANK_CODE, BANK_APPS, bankDeeplink, formatVnd, vietQrPayload } from '../services/vietqr';
import { appUrl, copyText, isMobile, shareOrDownloadImage } from '../services/appShare';
import { KEYS, loadString, saveString } from '../services/storage';

const QUICK = [100000, 200000, 500000];
const MAX_AMOUNT = 500_000_000;

/** Vẽ ảnh QR kèm thông tin để lưu vào thư viện ảnh hoặc gửi cho người khác. */
async function renderQrCard(qrDataUrl: string, amount: number): Promise<string> {
  const W = 600, H = 820;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  if (!g) return qrDataUrl;
  g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#B3261E'; g.fillRect(0, 0, W, 96);
  g.fillStyle = '#FFFFFF'; g.textAlign = 'center';
  g.font = 'bold 32px "Noto Serif", serif'; g.fillText('Ủng hộ Lịch Việt', W / 2, 60);
  const img = new Image();
  await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('qr')); img.src = qrDataUrl; });
  g.drawImage(img, 80, 120, 440, 440);
  g.fillStyle = '#1F1A14';
  g.font = 'bold 30px "Be Vietnam Pro", sans-serif'; g.fillText(AUTHOR.account, W / 2, 610);
  g.font = '26px "Be Vietnam Pro", sans-serif'; g.fillText(`${AUTHOR.accountName} · ${AUTHOR.bank}`, W / 2, 652);
  if (amount > 0) { g.fillStyle = '#B3261E'; g.font = 'bold 30px "Be Vietnam Pro", sans-serif'; g.fillText(formatVnd(amount), W / 2, 700); }
  g.fillStyle = '#6B6257'; g.font = '22px "Be Vietnam Pro", sans-serif';
  g.fillText('Mở app ngân hàng → Quét mã QR → chọn ảnh này', W / 2, 760);
  g.fillText('Cảm ơn bạn đã ủng hộ!', W / 2, 792);
  return cv.toDataURL('image/png');
}

const DonatePanel: React.FC = () => {
  const { toast } = useApp();
  const [amountText, setAmountText] = useState('');
  const [bank, setBank] = useState<string>(() => loadString(KEYS.bankApp) || '');
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const mobile = isMobile();
  const amountRef = useRef<HTMLInputElement>(null);

  const amount = useMemo(() => {
    const n = Number(amountText.replace(/\D/g, ''));
    return Number.isFinite(n) ? Math.min(n, MAX_AMOUNT) : 0;
  }, [amountText]);
  const app = BANK_APPS.find((b) => b.id === bank) || null;

  useEffect(() => {
    // Mã QR tạo ngay trên máy, không gửi dữ liệu đi đâu
    QRCode.toDataURL(vietQrPayload({ bin: AUTHOR.bin, account: AUTHOR.account, amount: amount || undefined, note: AUTHOR.note }), { errorCorrectionLevel: 'M', margin: 4, width: 520, color: { dark: '#1F1A14', light: '#FFFFFF' } })
      .then(setQr).catch(() => setQr(null));
  }, [amount]);

  const onAmount = (v: string) => {
    const digits = v.replace(/\D/g, '').replace(/^0+/, '').slice(0, 9);
    setAmountText(digits ? Number(digits).toLocaleString('vi-VN') : '');
  };
  const pickBank = (id: string) => { setBank(id); saveString(KEYS.bankApp, id); };

  const onCopy = async () => {
    const ok = await copyText(AUTHOR.account);
    if (ok) { setCopied(true); toast('Đã sao chép số tài khoản.'); setTimeout(() => setCopied(false), 2500); }
    else toast(`Không sao chép được. Số tài khoản: ${AUTHOR.account}`);
  };

  const link = app ? bankDeeplink({ app: app.id, account: AUTHOR.account, bankCode: AUTHOR_BANK_CODE, amount, note: AUTHOR.note, name: AUTHOR.accountName, returnUrl: appUrl() || undefined }) : '';

  const onOpenBank = async (e: React.MouseEvent) => {
    if (!app) { e.preventDefault(); toast('Hãy chọn ngân hàng bạn đang dùng.'); return; }
    // App không tự điền: chép sẵn STK để dán vào ô người nhận
    if (!app.autofill) {
      await copyText(AUTHOR.account);
      toast(`Đã chép STK ${AUTHOR.account}. Trong app chọn "Chuyển tiền" → ${AUTHOR.bank}, dán số tài khoản.`);
    }
  };

  const onSaveQr = async () => {
    if (!qr) return;
    try {
      const card = await renderQrCard(qr, amount);
      const r = await shareOrDownloadImage(card, 'ung-ho-lich-viet.png', 'Ủng hộ Lịch Việt');
      if (r === 'downloaded') toast('Đã lưu ảnh mã QR. Mở app ngân hàng → Quét QR → chọn ảnh từ thư viện.');
    } catch { toast('Không tạo được ảnh mã QR.'); }
  };

  return (
    <div className="mt-3 p-3 rounded-2xl bg-kim-50 border border-amber-100 space-y-3" data-testid="donate">
      <dl className="text-sm space-y-0.5">
        <div className="flex gap-2"><dt className="text-gray-500 w-20 shrink-0">STK</dt><dd className="font-bold text-muc tracking-wide" data-testid="stk">{AUTHOR.account}</dd></div>
        <div className="flex gap-2"><dt className="text-gray-500 w-20 shrink-0">Chủ TK</dt><dd className="font-semibold text-muc">{AUTHOR.accountName}</dd></div>
        <div className="flex gap-2"><dt className="text-gray-500 w-20 shrink-0">Ngân hàng</dt><dd className="font-semibold text-muc">{AUTHOR.bank}</dd></div>
      </dl>
      <button type="button" onClick={onCopy} className="w-full py-2.5 rounded-xl bg-white border border-giay-200 font-bold text-gray-700 flex items-center justify-center gap-1.5">
        {copied ? <Check size={16} className="text-green-700" /> : <Copy size={16} />}{copied ? 'Đã sao chép' : 'Sao chép STK'}
      </button>

      <div>
        <label htmlFor="donate-amount" className="text-xs font-bold text-gray-600 uppercase tracking-wider">Số tiền (không bắt buộc)</label>
        <div className="mt-1 flex items-center bg-white rounded-xl border border-giay-200 px-3 focus-within:ring-2 focus-within:ring-son-200">
          <input id="donate-amount" inputMode="numeric" autoComplete="off" ref={amountRef} value={amountText} onChange={(e) => onAmount(e.target.value)}
            placeholder="Nhập số tiền khác" className="flex-1 py-2.5 bg-transparent outline-none text-base font-bold text-muc" data-testid="donate-amount" />
          <span className="text-sm font-bold text-gray-500">đ</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 mt-2" data-testid="donate-quick">
          {QUICK.map((v) => (
            <button key={v} type="button" onClick={() => onAmount(String(v))} aria-pressed={amount === v}
              className={`py-2 rounded-xl text-sm font-bold border ${amount === v ? 'bg-son-600 text-white border-son-600' : 'bg-white text-gray-700 border-giay-200'}`}>{v / 1000}k</button>
          ))}
          <button type="button" data-testid="donate-other" aria-pressed={amount > 0 && !QUICK.includes(amount)}
            onClick={() => { if (QUICK.includes(amount)) setAmountText(''); amountRef.current?.focus(); }}
            className={`py-2 rounded-xl text-sm font-bold border ${amount > 0 && !QUICK.includes(amount) ? 'bg-son-600 text-white border-son-600' : 'bg-white text-gray-700 border-giay-200'}`}>Số khác</button>
        </div>
      </div>

      {qr && (
        <figure className="flex flex-col items-center">
          <img src={qr} alt={`Mã VietQR chuyển khoản tới ${AUTHOR.account} – ${AUTHOR.accountName} – ${AUTHOR.bank}${amount ? `, số tiền ${formatVnd(amount)}` : ''}`} className="w-48 h-48 rounded-xl bg-white p-1 border border-giay-200" data-testid="vietqr" data-amount={amount} />
          <figcaption className="text-xs text-gray-500 mt-1.5 text-center">{amount ? `Mã đã gồm số tiền ${formatVnd(amount)}.` : 'Số tiền do bạn tự nhập trong app.'} Quét bằng app ngân hàng bất kỳ.</figcaption>
        </figure>
      )}
      <button type="button" onClick={onSaveQr} className="w-full py-2.5 rounded-xl bg-white border border-giay-200 font-bold text-gray-700 flex items-center justify-center gap-1.5" data-testid="donate-save-qr">
        <ImageDown size={16} /> Lưu / gửi ảnh mã QR
      </button>

      <div className="pt-3 border-t border-amber-100">
        <label htmlFor="donate-bank" className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1"><Landmark size={14} /> Chuyển nhanh bằng app ngân hàng của bạn</label>
        <select id="donate-bank" value={bank} onChange={(e) => pickBank(e.target.value)} className="mt-1 w-full py-2.5 px-3 rounded-xl bg-white border border-giay-200 font-semibold text-muc" data-testid="donate-bank">
          <option value="">– Chọn ngân hàng bạn dùng –</option>
          {BANK_APPS.map((b) => <option key={b.id} value={b.id}>{b.bank} – {b.name}{b.autofill ? ' (tự điền)' : ''}</option>)}
        </select>
        <a href={link || '#'} target="_blank" rel="noopener noreferrer" onClick={onOpenBank} aria-disabled={!app}
          className={`mt-2 w-full py-3 rounded-xl font-bold flex items-center justify-center gap-1.5 ${app ? 'bg-son-600 text-white' : 'bg-gray-200 text-gray-500'}`} data-testid="donate-open">
          <ExternalLink size={16} /> {app ? `Mở ${app.name}${amount ? ` · ${formatVnd(amount)}` : ''}` : 'Chọn ngân hàng để mở app'}
        </a>
        <div className="mt-2 text-xs text-gray-600 flex gap-1.5" data-testid="donate-hint">
          <Info size={14} className="shrink-0 mt-0.5" />
          <span>
            {app?.autofill
              ? `${app.name} tự điền sẵn STK, số tiền, nội dung; bạn chỉ cần đăng nhập và xác nhận.`
              : app
                ? `${app.name} chỉ mở được app, chưa tự điền. Ứng dụng sẽ chép sẵn STK để bạn dán, hoặc dùng "Lưu ảnh mã QR" rồi quét từ thư viện ảnh.`
                : 'Tự điền sẵn thông tin: VietinBank, BIDV, MB, ACB, OCB. Các ngân hàng khác mở app và chép sẵn STK.'}
            {!mobile && ' Tính năng mở app chỉ dùng trên điện thoại; trên máy tính hãy quét mã QR bằng điện thoại.'}
            {' '}Cần có mạng (đi qua dịch vụ VietQR).
          </span>
        </div>
      </div>
    </div>
  );
};

export default DonatePanel;
