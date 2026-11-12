import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Ruler as RulerIcon, Minus, Plus, ThumbsUp, ThumbsDown, Info } from 'lucide-react';
import { Card, SectionTitle, Segmented } from './ui';
import { RULERS, RULER_LIST, lookup, segments, nearestGood, parseSize, fmtMm, type RulerId } from '../services/loban';
import { KEYS, loadJSON, saveJSON } from '../services/storage';

type Unit = 'mm' | 'cm';
const PX_PER_MM = 2.4;

const LoBan: React.FC = () => {
  const saved = loadJSON<{ ruler?: RulerId; group?: 'duong' | 'am'; unit?: Unit; mm?: number }>(KEYS.loban, {});
  const [group, setGroup] = useState<'duong' | 'am'>(saved.group === 'am' ? 'am' : 'duong');
  const [rid, setRid] = useState<RulerId>(saved.ruler && RULERS[saved.ruler] ? saved.ruler : '522');
  const [unit, setUnit] = useState<Unit>(saved.unit === 'mm' ? 'mm' : 'cm');
  const [mm, setMm] = useState<number>(typeof saved.mm === 'number' && saved.mm >= 0 ? saved.mm : 810);
  const [text, setText] = useState<string>(() => String(unit === 'cm' ? (typeof saved.mm === 'number' ? saved.mm : 810) / 10 : (saved.mm ?? 810)).replace('.', ','));
  const [err, setErr] = useState<string | null>(null);

  const ruler = RULERS[group === 'am' ? '388' : rid === '388' ? '522' : rid];
  useEffect(() => { saveJSON(KEYS.loban, { ruler: ruler.id, group, unit, mm }); }, [ruler.id, group, unit, mm]);

  const res = useMemo(() => lookup(ruler, mm), [ruler, mm]);
  const near = useMemo(() => nearestGood(ruler, mm), [ruler, mm]);

  const setValue = (v: number, syncText = true) => {
    const x = Math.max(0, Math.min(100000, Math.round(v * 10) / 10));
    setMm(x); setErr(null);
    if (syncText) setText(String(unit === 'cm' ? Math.round(x) / 10 : Math.round(x)).replace('.', ','));
  };
  const onText = (t: string) => {
    setText(t);
    if (!t.trim()) { setErr(null); return; }
    const v = parseSize(t, unit);
    if (v == null) setErr('Chỉ nhập số, ví dụ 81 hoặc 81,5');
    else { setMm(v); setErr(null); }
  };
  const onUnit = (u: Unit) => { setUnit(u); setText(String(u === 'cm' ? Math.round(mm) / 10 : Math.round(mm)).replace('.', ',')); };

  /* ---- thước kéo ---- */
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const update = () => setWidth(el.clientWidth || 320);
    update();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, []);
  const drag = useRef<{ x: number; mm: number } | null>(null);
  const half = width / 2 / PX_PER_MM;
  const from = Math.max(0, mm - half), to = mm + half;
  const segs = segments(ruler, Math.max(0, from - 1), to + 1);
  const xOf = (v: number) => (v - mm) * PX_PER_MM + width / 2;
  const ticks: number[] = [];
  for (let t = Math.ceil(from / 10) * 10; t <= to; t += 10) ticks.push(t);

  return (
    <div className="p-4 pb-8 space-y-4" data-testid="loban">
      <Card>
        <SectionTitle icon={<RulerIcon size={18} />} tone="kim" title="Thước Lỗ Ban" />
        <Segmented<'duong' | 'am'> value={group} onChange={(v) => setGroup(v)}
          options={[{ value: 'duong', label: 'Dương trạch' }, { value: 'am', label: 'Âm phần' }]} />
        {group === 'duong' && (
          <div className="grid grid-cols-2 gap-2 mt-3" role="group" aria-label="Chọn loại thước">
            {RULER_LIST.filter((r) => r.group === 'duong').map((r) => (
              <button key={r.id} type="button" onClick={() => setRid(r.id)} aria-pressed={ruler.id === r.id} data-testid={`ruler-${r.id}`}
                className={`p-2.5 rounded-2xl border text-left ${ruler.id === r.id ? 'bg-son-600 text-white border-son-600' : 'bg-white border-giay-200 text-gray-700'}`}>
                <span className="block font-bold">{r.short}</span>
                <span className={`block text-xs ${ruler.id === r.id ? 'text-white/85' : 'text-gray-500'}`}>{r.id === '522' ? 'Thông thủy: cửa, ô thoáng' : 'Khối xây, nội thất'}</span>
              </button>
            ))}
          </div>
        )}
        <p className="text-sm text-gray-600 mt-3" data-testid="ruler-use"><b className="text-muc">{ruler.name}.</b> {ruler.use}</p>

        <div className="mt-4">
          <label htmlFor="loban-size" className="text-xs font-bold text-gray-600 uppercase tracking-wider">Kích thước cần xem</label>
          <div className="flex gap-2 mt-1">
            <div className="flex-1 min-w-0 flex items-center bg-white rounded-xl border border-giay-200 px-3 focus-within:ring-2 focus-within:ring-son-200">
              <input id="loban-size" inputMode="decimal" autoComplete="off" value={text} onChange={(e) => onText(e.target.value)} data-testid="loban-input"
                className="flex-1 min-w-0 py-2.5 bg-transparent outline-none text-xl font-bold text-muc" aria-invalid={!!err} />
            </div>
            <div className="w-28 shrink-0"><Segmented<Unit> value={unit} onChange={onUnit} options={[{ value: 'cm', label: 'cm' }, { value: 'mm', label: 'mm' }]} /></div>
          </div>
          {err && <p className="text-xs font-semibold text-son-600 mt-1">{err}</p>}
        </div>
      </Card>

      {/* Kết quả */}
      <div className={`rounded-3xl p-5 border ${res.good ? 'bg-green-50 border-green-100' : 'bg-son-50 border-red-100'}`} data-testid="loban-result" data-good={res.good}>
        <div className="flex items-center gap-3">
          <span className={`p-2.5 rounded-2xl ${res.good ? 'bg-green-600 text-white' : 'bg-son-600 text-white'}`}>{res.good ? <ThumbsUp size={22} /> : <ThumbsDown size={22} />}</span>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{fmtMm(mm)}</div>
            <div className={`font-serif text-2xl font-bold ${res.good ? 'text-green-700' : 'text-son-700'}`} data-testid="loban-cung">
              {res.cung.name} · {res.sub}
            </div>
            <div className={`text-sm font-bold ${res.good ? 'text-green-700' : 'text-son-700'}`}>{res.good ? 'Cung tốt (đỏ trên thước)' : 'Cung xấu (đen trên thước)'}</div>
          </div>
        </div>
        <p className="text-sm text-gray-700 mt-3">{res.cung.meaning}. Cung này từ {String(res.range[0]).replace('.', ',')} đến {String(res.range[1]).replace('.', ',')} mm.</p>
        {!res.good && (
          <div className="mt-3 grid grid-cols-2 gap-2" data-testid="loban-near">
            {near.below && (
              <button type="button" onClick={() => setValue(Math.round((near.below![0] + near.below![1]) / 2))} className="p-2.5 rounded-2xl bg-white border border-giay-200 text-left">
                <span className="block text-xs text-gray-500 font-bold">Tốt gần nhất, nhỏ hơn</span>
                <span className="block text-sm font-bold text-green-700">{near.below[0]}–{near.below[1]} mm</span>
              </button>
            )}
            {near.above && (
              <button type="button" onClick={() => setValue(Math.round((near.above![0] + near.above![1]) / 2))} className="p-2.5 rounded-2xl bg-white border border-giay-200 text-left">
                <span className="block text-xs text-gray-500 font-bold">Tốt gần nhất, lớn hơn</span>
                <span className="block text-sm font-bold text-green-700">{near.above[0]}–{near.above[1]} mm</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Thước kéo */}
      <Card className="!p-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kéo thước để dò</span>
          <div className="flex gap-1">
            <button type="button" aria-label="Giảm 1 cm" onClick={() => setValue(mm - 10)} className="px-2 py-1 rounded-lg bg-giay border border-giay-200 text-xs font-bold flex items-center"><Minus size={12} />1cm</button>
            <button type="button" aria-label="Giảm 1 mm" onClick={() => setValue(mm - 1)} className="px-2 py-1 rounded-lg bg-giay border border-giay-200 text-xs font-bold flex items-center"><Minus size={12} />1mm</button>
            <button type="button" aria-label="Tăng 1 mm" onClick={() => setValue(mm + 1)} className="px-2 py-1 rounded-lg bg-giay border border-giay-200 text-xs font-bold flex items-center"><Plus size={12} />1mm</button>
            <button type="button" aria-label="Tăng 1 cm" onClick={() => setValue(mm + 10)} className="px-2 py-1 rounded-lg bg-giay border border-giay-200 text-xs font-bold flex items-center"><Plus size={12} />1cm</button>
          </div>
        </div>
        <div ref={box} data-testid="loban-ruler"
          className="relative h-28 overflow-hidden rounded-xl bg-[#F3E3C3] select-none touch-none cursor-grab active:cursor-grabbing border border-amber-200"
          onPointerDown={(e) => { drag.current = { x: e.clientX, mm }; (e.target as Element).setPointerCapture?.(e.pointerId); }}
          onPointerMove={(e) => { if (!drag.current) return; setValue(drag.current.mm - (e.clientX - drag.current.x) / PX_PER_MM); }}
          onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
          {segs.map((s) => {
            const l = xOf(s.start), w = (s.end - s.start) * PX_PER_MM;
            const subW = w / s.cung.subs.length;
            return (
              <div key={s.start} className="absolute top-0 h-[4.25rem] border-r border-amber-800/40" style={{ left: l, width: w }}>
                <div className={`h-6 flex items-center justify-center text-[0.6875rem] font-bold text-white truncate ${s.cung.good ? 'bg-[#C0261C]' : 'bg-[#2B2520]'}`}>{s.cung.name}</div>
                <div className="flex h-[2.75rem]">
                  {s.cung.subs.map((sub) => (
                    <div key={sub} className={`border-r border-amber-800/20 text-[0.5625rem] leading-tight px-0.5 pt-0.5 font-semibold overflow-hidden ${s.cung.good ? 'text-[#C0261C]' : 'text-[#2B2520]'}`} style={{ width: subW }}>{subW > 26 ? sub : ''}</div>
                  ))}
                </div>
              </div>
            );
          })}
          {ticks.map((t) => (
            <div key={t} className="absolute bottom-0" style={{ left: xOf(t) }}>
              <div className={`w-px bg-amber-900/70 ${t % 50 === 0 ? 'h-5' : 'h-2.5'}`} />
              {t % 50 === 0 && <div className="absolute bottom-5 -translate-x-1/2 text-[0.5625rem] font-bold text-amber-900">{t / 10}</div>}
            </div>
          ))}
          <div className="absolute top-0 bottom-0 w-0.5 bg-blue-600" style={{ left: width / 2 - 1 }} aria-hidden>
            <div className="absolute -top-0 -left-1.5 w-3.5 h-3.5 rotate-45 bg-blue-600" />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 px-1">Vạch xanh là kích thước đang xem. Số phía dưới là cm. Ô đỏ là cung tốt, ô đen là cung xấu.</p>
      </Card>

      {/* Bảng cung */}
      <Card>
        <SectionTitle icon={<Info size={18} />} title={`Các cung thước ${ruler.short}`} />
        <ul className="space-y-1.5" data-testid="loban-table">
          {ruler.cung.map((c, i) => {
            const cl = ruler.length / ruler.cung.length;
            return (
              <li key={c.name + i} className={`p-2.5 rounded-xl border text-sm ${i === res.cungIndex ? 'ring-2 ring-blue-500 ' : ''}${c.good ? 'bg-green-50 border-green-100' : 'bg-son-50 border-red-100'}`}>
                <div className="flex justify-between gap-2">
                  <b className={c.good ? 'text-green-700' : 'text-son-700'}>{c.name} ({c.good ? 'tốt' : 'xấu'})</b>
                  <span className="text-xs text-gray-500">{String(Math.round(i * cl * 10) / 10).replace('.', ',')}–{String(Math.round((i + 1) * cl * 10) / 10).replace('.', ',')} mm</span>
                </div>
                <div className="text-xs text-gray-600">{c.subs.join(' · ')}</div>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-gray-500 mt-3">Kích thước lớn hơn một chu kỳ ({ruler.length} mm) thì lặp lại từ đầu. Nên chọn kích thước nằm khoảng giữa cung tốt để tránh sai số thi công.</p>
        <p className="text-xs text-gray-500 mt-1 italic">Tên cung theo thước Lỗ Ban phổ biến ở Việt Nam; mang tính tham khảo văn hóa dân gian.</p>
      </Card>
    </div>
  );
};

export default LoBan;
