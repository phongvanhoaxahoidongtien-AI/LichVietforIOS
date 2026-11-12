import type { DayInfo } from './almanac';

const WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const r = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / r, sh = h / r;
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
}

/** Vẽ tờ lịch thành ảnh 1080×1350 rồi chia sẻ (điện thoại) hoặc tải về (máy tính). */
export async function renderDayImage(info: DayInfo, bg: string): Promise<Blob> {
  await (document as any).fonts?.ready;
  const W = 1080, H = 1350;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;
  const d = info.date;

  ctx.fillStyle = '#FBF6EC'; ctx.fillRect(0, 0, W, H);
  // dải đỏ đầu tờ lịch
  ctx.fillStyle = '#B3261E'; ctx.fillRect(0, 0, W, 130);
  ctx.fillStyle = '#F6EBC4';
  ctx.font = '700 46px "Noto Serif", serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(`THÁNG ${d.getMonth() + 1} · ${d.getFullYear()}`, 60, 70);
  ctx.textAlign = 'right';
  ctx.font = '600 36px "Be Vietnam Pro", sans-serif';
  ctx.fillText(`Năm ${info.canChi.year}`, W - 60, 70);
  ctx.textAlign = 'left';

  const img = await loadImage(bg);
  const ih = 760;
  if (img) cover(ctx, img, 0, 130, W, ih);
  const g = ctx.createLinearGradient(0, 130, 0, 130 + ih);
  g.addColorStop(0, 'rgba(0,0,0,.05)'); g.addColorStop(1, 'rgba(0,0,0,.65)');
  ctx.fillStyle = g; ctx.fillRect(0, 130, W, ih);

  ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 30;
  ctx.font = '700 360px "Noto Serif", serif';
  ctx.fillText(String(d.getDate()), W / 2, 130 + ih - 250);
  ctx.shadowBlur = 0;
  ctx.font = '600 54px "Be Vietnam Pro", sans-serif';
  ctx.fillText(WEEKDAYS[d.getDay()], W / 2, 130 + ih - 60);

  // phần âm lịch
  const y0 = 130 + ih;
  ctx.fillStyle = '#2B2118';
  const cols = [W / 6, W / 2, (5 * W) / 6];
  ctx.font = '700 30px "Be Vietnam Pro", sans-serif'; ctx.fillStyle = '#7D6314';
  ctx.fillText('THÁNG', cols[0], y0 + 60); ctx.fillText('ÂM LỊCH', cols[1], y0 + 60); ctx.fillText('NGÀY', cols[2], y0 + 60);
  ctx.fillStyle = '#2B2118'; ctx.font = '700 56px "Noto Serif", serif';
  ctx.fillText(`${info.lunar.month}${info.lunar.leap ? 'N' : ''}`, cols[0], y0 + 130);
  ctx.fillText(info.canChi.day, cols[2], y0 + 130);
  ctx.fillStyle = '#B3261E'; ctx.font = '700 110px "Noto Serif", serif';
  ctx.fillText(String(info.lunar.day), cols[1], y0 + 145);
  ctx.fillStyle = '#6B5E4E'; ctx.font = '500 32px "Be Vietnam Pro", sans-serif';
  ctx.fillText(info.canChi.month, cols[0], y0 + 190); ctx.fillText(`Tiết ${info.solarTerm}`, cols[2], y0 + 190);

  ctx.strokeStyle = '#EEE2C8'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(60, y0 + 240); ctx.lineTo(W - 60, y0 + 240); ctx.stroke();

  ctx.textAlign = 'left'; ctx.fillStyle = '#2B2118'; ctx.font = '600 34px "Be Vietnam Pro", sans-serif';
  const hd = info.hours.filter((h) => h.hoangDao).map((h) => h.branch).join(', ');
  ctx.fillText(`${info.than.name} ${info.than.hoangDao ? 'Hoàng đạo' : 'Hắc đạo'} · Trực ${info.truc.name} · Sao ${info.sao28.name}`, 60, y0 + 295);
  ctx.fillStyle = '#6B5E4E'; ctx.font = '500 32px "Be Vietnam Pro", sans-serif';
  ctx.fillText(`Giờ hoàng đạo: ${hd}`, 60, y0 + 350);
  ctx.fillStyle = '#B3261E'; ctx.font = '700 30px "Be Vietnam Pro", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Lịch Việt', W - 60, H - 40);

  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/jpeg', 0.9));
}

export async function shareDayImage(info: DayInfo, bg: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const blob = await renderDayImage(info, bg);
  const d = info.date;
  const name = `lich-viet-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.jpg`;
  const file = new File([blob], name, { type: 'image/jpeg' });
  const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: 'Lịch Việt', text: `Ngày ${d.toLocaleDateString('vi-VN')} – âm lịch ${info.lunar.day}/${info.lunar.month}` });
      return 'shared';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded';
}
