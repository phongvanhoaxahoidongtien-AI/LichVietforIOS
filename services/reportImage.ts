import { ACT_DEF, personInfo } from './almanac';
import { LEVEL_LABEL, type PersonalReport } from './personal';

const WD = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const LEVEL_COLOR = { nen: '#1F7A3A', 'can-nhac': '#9A6A08', 'khong-nen': '#B3261E' } as const;

/** Xuống dòng theo bề rộng. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Vẽ phiếu đánh giá thành ảnh PNG (data URL) rộng 1080 px. */
export async function renderReportImage(r: PersonalReport, advice: string[]): Promise<string> {
  await (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready;
  const W = 1080, P = 64;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d')!;
  const draw = (H: number, real: boolean) => {
    c.width = W; c.height = H;
    let y = 0;
    const text = (t: string, font: string, color: string, x = P, maxW = W - 2 * P, lh = 44) => {
      ctx.font = font; ctx.fillStyle = color;
      for (const line of wrap(ctx, t, maxW)) { y += lh; if (real) ctx.fillText(line, x, y); }
    };
    if (real) { ctx.fillStyle = '#FBF6EC'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#B3261E'; ctx.fillRect(0, 0, W, 120); }
    ctx.textBaseline = 'alphabetic';
    if (real) { ctx.fillStyle = '#F6EBC4'; ctx.font = '700 44px "Noto Serif", serif'; ctx.fillText('PHIẾU XEM NGÀY THEO TUỔI', P, 76); }
    y = 130;
    const d = r.date, l = r.info.lunar;
    text(`${WD[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} · âm ${l.day}/${l.month}${l.leap ? ' nhuận' : ''} · ngày ${r.info.canChi.day}`, '600 34px "Be Vietnam Pro", sans-serif', '#4A3F33');
    text(`Việc: ${ACT_DEF[r.act].label}`, '600 34px "Be Vietnam Pro", sans-serif', '#4A3F33');
    if (r.people.length) text(`Tuổi: ${r.people.map((p) => `${p.name ? p.name + ' ' : ''}${p.birthYear} (${personInfo(p).canChi})`).join(' · ')}`, '600 34px "Be Vietnam Pro", sans-serif', '#4A3F33');
    y += 30;
    const col = LEVEL_COLOR[r.level];
    if (real) {
      ctx.lineWidth = 18; ctx.strokeStyle = '#EADFCB'; ctx.beginPath(); ctx.arc(P + 90, y + 90, 80, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(P + 90, y + 90, 80, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * r.score) / 100); ctx.stroke();
      ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.font = '700 64px "Be Vietnam Pro", sans-serif'; ctx.fillText(String(r.score), P + 90, y + 110);
      ctx.textAlign = 'left'; ctx.font = '700 54px "Noto Serif", serif'; ctx.fillText(LEVEL_LABEL[r.level], P + 220, y + 80);
      ctx.fillStyle = '#6B6257'; ctx.font = '500 30px "Be Vietnam Pro", sans-serif'; ctx.fillText('Điểm phù hợp / 100', P + 220, y + 130);
    }
    y += 200;
    if (r.mainReasons.length) text(`Lý do chính: ${r.mainReasons.join('; ')}.`, '500 32px "Be Vietnam Pro", sans-serif', '#2B2118', P, W - 2 * P, 44);
    y += 20;
    for (const g of r.groups) {
      y += 56;
      if (real) {
        ctx.fillStyle = '#2B2118'; ctx.font = '700 32px "Be Vietnam Pro", sans-serif'; ctx.fillText(g.title, P, y);
        ctx.textAlign = 'right'; ctx.fillText(`${g.points}/${g.max}`, W - P, y); ctx.textAlign = 'left';
        ctx.fillStyle = '#EADFCB'; ctx.fillRect(P, y + 14, W - 2 * P, 14);
        const ratio = g.points / g.max;
        ctx.fillStyle = ratio >= 0.65 ? '#1F7A3A' : ratio >= 0.4 ? '#C98A10' : '#B3261E';
        ctx.fillRect(P, y + 14, (W - 2 * P) * ratio, 14);
      }
      y += 24;
      for (const it of g.items.slice(0, 4)) text(`${it.good ? '✓' : '✗'} ${it.text}`, '400 28px "Be Vietnam Pro", sans-serif', it.good ? '#1F7A3A' : '#9C2018', P + 10, W - 2 * P - 10, 38);
    }
    if (advice.length) {
      y += 40;
      text('Lời khuyên', '700 34px "Be Vietnam Pro", sans-serif', '#2B2118');
      for (const a of advice) text(`• ${a}`, '400 28px "Be Vietnam Pro", sans-serif', '#2B2118', P + 10, W - 2 * P - 10, 38);
    }
    y += 50;
    text('Lịch Việt: Văn hóa & Phong tục · nội dung mang tính tham khảo văn hóa dân gian', 'italic 400 24px "Be Vietnam Pro", sans-serif', '#8A7F72');
    return y + 40;
  };
  const H = draw(4000, false);
  draw(H, true);
  return c.toDataURL('image/png');
}
