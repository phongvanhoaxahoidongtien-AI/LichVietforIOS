/** Địa chỉ ứng dụng để chia sẻ: lấy VITE_APP_URL khi build, nếu không có thì dùng địa chỉ trang web đang mở. */
export function appUrl(): string | null {
  const env = (import.meta.env.VITE_APP_URL as string | undefined)?.trim();
  if (env && /^https:\/\//.test(env)) return env;
  if (typeof location !== 'undefined' && /^https?:$/.test(location.protocol) && !/^(localhost|127\.)/.test(location.hostname)) {
    return location.origin + location.pathname.replace(/index\.html$/, '');
  }
  if (typeof location !== 'undefined' && /^https?:$/.test(location.protocol)) return location.origin + '/';
  return null;
}

export const SHARE_TITLE = 'Lịch Việt: Văn hóa & Phong tục';
export const SHARE_TEXT = 'Ứng dụng lịch âm dương, xem ngày tốt xấu, 12 Trực, giờ hoàng đạo, trạch ngày theo tuổi, thước Lỗ Ban, nhắc ngày giỗ. Miễn phí, không quảng cáo, chạy cả khi không có mạng.';

export async function copyText(t: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(t); return true; } catch { /* dùng cách dự phòng */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'absolute'; ta.style.left = '-9999px';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch { return false; }
}

export const isMobile = () => typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

/** Chia sẻ ảnh (PNG data URL) qua bảng chia sẻ của máy; nếu không được thì tải về. */
export async function shareOrDownloadImage(dataUrl: string, fileName: string, title: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  try {
    const blob = dataUrlToBlob(dataUrl);
    const file = new File([blob], fileName, { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      await nav.share({ files: [file], title });
      return 'shared';
    }
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') return 'cancelled';
  }
  const a = document.createElement('a');
  a.href = dataUrl; a.download = fileName;
  document.body.appendChild(a); a.click(); a.remove();
  return 'downloaded';
}

/** Đổi data URL sang Blob mà không dùng fetch (CSP chặn kết nối). */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [head, b64] = dataUrl.split(',');
  const mime = /data:([^;]+)/.exec(head)?.[1] || 'application/octet-stream';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
