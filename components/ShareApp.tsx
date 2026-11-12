import React, { useEffect, useState } from 'react';
import { Share2, Copy, Check, MessageSquare, Mail } from 'lucide-react';
import QRCode from 'qrcode';
import { Sheet } from './ui';
import { useApp } from '../context';
import { appUrl, copyText, SHARE_TEXT, SHARE_TITLE } from '../services/appShare';

/** Bảng chia sẻ ứng dụng: chia sẻ qua máy, sao chép liên kết, mã QR để người bên cạnh quét. */
const ShareApp: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { toast } = useApp();
  const url = appUrl();
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const message = url ? `${SHARE_TEXT}\n${url}` : SHARE_TEXT;

  useEffect(() => {
    if (!open || !url) return;
    QRCode.toDataURL(url, { errorCorrectionLevel: 'M', margin: 4, width: 440, color: { dark: '#7A1712', light: '#FFFFFF' } })
      .then(setQr).catch(() => setQr(null));
  }, [open, url]);

  const onShare = async () => {
    try {
      await navigator.share(url ? { title: SHARE_TITLE, text: SHARE_TEXT, url } : { title: SHARE_TITLE, text: SHARE_TEXT });
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') toast('Máy không mở được bảng chia sẻ. Hãy dùng "Sao chép liên kết".');
    }
  };
  const onCopy = async () => {
    const ok = await copyText(message);
    if (ok) { setCopied(true); toast('Đã sao chép lời giới thiệu và liên kết.'); setTimeout(() => setCopied(false), 2500); }
    else toast('Không sao chép được.');
  };

  return (
    <Sheet open={open} onClose={onClose} title="Chia sẻ ứng dụng" subtitle="Giới thiệu Lịch Việt tới người thân, bạn bè">
      <div className="space-y-4" data-testid="share-app">
        <p className="text-sm text-gray-700 p-3 rounded-2xl bg-giay border border-giay-200 whitespace-pre-line" data-testid="share-text">{message}</p>
        {!url && (
          <p className="text-sm font-semibold text-kim-700 p-3 rounded-2xl bg-kim-50 border border-amber-100" data-testid="share-no-url">
            Ứng dụng đang mở từ tệp trên máy nên chưa có địa chỉ web để gửi kèm. Khi dùng bản đăng trên mạng, liên kết và mã QR sẽ hiện ở đây.
          </p>
        )}
        <div className="grid grid-cols-1 gap-2">
          {canShare && (
            <button type="button" onClick={onShare} className="py-3 rounded-2xl bg-son-600 text-white font-bold flex items-center justify-center gap-2" data-testid="share-native">
              <Share2 size={18} /> Chia sẻ qua Zalo, Messenger…
            </button>
          )}
          <button type="button" onClick={onCopy} className={`py-3 rounded-2xl font-bold flex items-center justify-center gap-2 ${canShare ? 'bg-white border border-giay-200 text-gray-700' : 'bg-son-600 text-white'}`} data-testid="share-copy">
            {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? 'Đã sao chép' : url ? 'Sao chép liên kết' : 'Sao chép lời giới thiệu'}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <a href={`sms:?&body=${encodeURIComponent(message)}`} className="py-2.5 rounded-2xl bg-white border border-giay-200 font-bold text-gray-700 flex items-center justify-center gap-1.5 text-sm"><MessageSquare size={16} /> Tin nhắn</a>
            <a href={`mailto:?subject=${encodeURIComponent(SHARE_TITLE)}&body=${encodeURIComponent(message)}`} className="py-2.5 rounded-2xl bg-white border border-giay-200 font-bold text-gray-700 flex items-center justify-center gap-1.5 text-sm"><Mail size={16} /> Email</a>
          </div>
        </div>
        {url && qr && (
          <figure className="flex flex-col items-center pt-2">
            <img src={qr} alt={`Mã QR mở ứng dụng: ${url}`} className="w-44 h-44 rounded-xl border border-giay-200 bg-white" data-testid="share-qr" />
            <figcaption className="text-xs text-gray-500 mt-1.5 text-center">Người bên cạnh mở camera điện thoại, quét mã để mở ứng dụng.<br /><span className="break-all">{url}</span></figcaption>
          </figure>
        )}
      </div>
    </Sheet>
  );
};

export default ShareApp;
