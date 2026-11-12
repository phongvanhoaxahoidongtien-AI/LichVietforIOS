import React, { useRef, useState } from 'react';
import { HardDriveDownload, Upload, Share2, Cloud, CloudUpload, CloudDownload, LogOut, ShieldCheck, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { exportToFile, parseBackup, mergeBackup, applyBackup, collectBackup, lastBackup, type BackupFile } from '../services/backup';
import { driveStatus, connect, disconnect, isConnected, uploadBackup, downloadBackup } from '../services/gdrive';
import { useApp } from '../context';

const fmtTime = (iso: string) => { const d = new Date(iso); return isNaN(d.getTime()) ? '' : `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`; };

/** Sao lưu – khôi phục: cách A (tệp), cách B (Google Drive). */
const BackupPanel: React.FC = () => {
  const { toast } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ b: BackupFile; source: string } | null>(null);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [connected, setConnected] = useState(isConnected());
  const [last, setLast] = useState(lastBackup());
  const st = driveStatus();
  const cur = collectBackup().data;
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator && 'canShare' in navigator;

  const doExport = async (share: boolean) => {
    setError(null);
    try {
      const r = await exportToFile(share);
      if (r === 'downloaded') toast('Đã tải tệp sao lưu về máy (thư mục Tải xuống).');
      if (r === 'shared') toast('Đã gửi tệp sao lưu.');
      setLast(lastBackup());
    } catch { setError('Không tạo được tệp sao lưu. Vui lòng thử lại.'); }
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setError(null);
    if (f.size > 2 * 1024 * 1024) return setError('Tệp quá lớn, không phải tệp sao lưu của Lịch Việt.');
    try { setPending({ b: parseBackup(await f.text()), source: `tệp ${f.name}` }); setMode('merge'); }
    catch (err) { setError((err as Error).message); }
  };

  const confirmRestore = () => {
    if (!pending) return;
    const m = mergeBackup(cur, pending.b.data, mode);
    if (!applyBackup(m.data)) return setError('Không ghi được dữ liệu: bộ nhớ trình duyệt đã đầy.');
    try {
      sessionStorage.setItem('lich-viet-toast', mode === 'merge'
        ? `Đã khôi phục: thêm ${m.added.reminders} lịch hẹn, ${m.added.family} người trong nhà; bỏ qua ${m.skipped.reminders + m.skipped.family} mục trùng.`
        : `Đã thay thế bằng bản sao lưu: ${m.data.reminders.length} lịch hẹn, ${m.data.family.length} người trong nhà.`);
    } catch { /* bỏ qua */ }
    window.location.reload();
  };

  const run = async (label: string, fn: () => Promise<void>) => {
    setError(null); setBusy(label);
    try { await fn(); } catch (err) { setError((err as Error).message); } finally { setBusy(null); setConnected(isConnected()); }
  };

  return (
    <div className="space-y-4" data-testid="backup-panel">
      <div className="text-sm text-gray-700 bg-giay rounded-2xl p-3 border border-giay-200">
        <p>Sao lưu gồm: <b>{cur.reminders.length} lịch hẹn, ngày giỗ</b>, cài đặt nhắc thắp hương, <b>{cur.family.length} người trong nhà</b> và cài đặt giao diện. Không gồm ảnh nền.</p>
        <p className="mt-1 text-gray-500">{last ? `Lần sao lưu gần nhất: ${fmtTime(last.at)} (${last.where === 'drive' ? 'Google Drive' : 'tệp'}).` : 'Chưa sao lưu lần nào trên máy này.'}</p>
      </div>

      {/* Cách A */}
      <div className="rounded-2xl border border-giay-200 p-4">
        <div className="flex items-center gap-2 font-bold text-muc"><HardDriveDownload size={18} className="text-son-600" /> Cách 1: Lưu ra tệp <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Khuyên dùng</span></div>
        <p className="text-sm text-gray-600 mt-1">Không cần đăng nhập, không cần mạng. Bạn tự giữ tệp <code className="text-xs">.json</code>; khi đổi máy, mở tệp này bằng nút "Khôi phục từ tệp".</p>
        <div className="grid grid-cols-1 gap-2 mt-3">
          {canShare && <button type="button" onClick={() => doExport(true)} className="py-3 rounded-2xl bg-son-600 text-white font-bold flex items-center justify-center gap-2"><Share2 size={18} /> Gửi tệp (Google Drive, Zalo, email…)</button>}
          <button type="button" onClick={() => doExport(false)} className={`py-3 rounded-2xl font-bold flex items-center justify-center gap-2 ${canShare ? 'border border-giay-200 text-gray-700' : 'bg-son-600 text-white'}`}><HardDriveDownload size={18} /> Tải tệp sao lưu về máy</button>
          <button type="button" onClick={() => fileRef.current?.click()} className="py-3 rounded-2xl border border-giay-200 font-bold text-gray-700 flex items-center justify-center gap-2"><Upload size={18} /> Khôi phục từ tệp</button>
          <input ref={fileRef} type="file" accept="application/json,.json" onChange={onPickFile} className="hidden" aria-label="Chọn tệp sao lưu" data-testid="restore-input" />
        </div>
        <p className="text-xs text-gray-500 mt-2">Trên điện thoại: bấm "Gửi tệp" rồi chọn Google Drive để cất tệp lên Drive mà không cần đăng nhập trong ứng dụng.</p>
      </div>

      {/* Cách B */}
      <div className="rounded-2xl border border-giay-200 p-4">
        <div className="flex items-center gap-2 font-bold text-muc"><Cloud size={18} className="text-blue-700" /> Cách 2: Sao lưu lên Google Drive</div>
        {st.available ? (
          <>
            <p className="text-sm text-gray-600 mt-1">Đăng nhập tài khoản Google của bạn để lưu và lấy lại dữ liệu ở bất kỳ máy nào. Cần có mạng.</p>
            {!connected ? (
              <button type="button" disabled={!!busy} onClick={() => run('connect', async () => { await connect(); toast('Đã kết nối Google Drive.'); })} className="mt-3 w-full py-3 rounded-2xl bg-blue-700 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                <Cloud size={18} /> {busy === 'connect' ? 'Đang kết nối…' : 'Kết nối Google Drive'}
              </button>
            ) : (
              <div className="grid grid-cols-1 gap-2 mt-3">
                <button type="button" disabled={!!busy} onClick={() => run('up', async () => { const r = await uploadBackup(); setLast(lastBackup()); toast(`Đã lưu lên Google Drive lúc ${fmtTime(r.modifiedTime)}.`); })} className="py-3 rounded-2xl bg-blue-700 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"><CloudUpload size={18} /> {busy === 'up' ? 'Đang lưu…' : 'Lưu lên Google Drive'}</button>
                <button type="button" disabled={!!busy} onClick={() => run('down', async () => { const r = await downloadBackup(); if (!r) throw new Error('Chưa có bản sao lưu nào của Lịch Việt trên Google Drive này.'); setPending({ b: r.backup, source: `Google Drive (lưu lúc ${fmtTime(r.modifiedTime)})` }); setMode('merge'); })} className="py-3 rounded-2xl border border-giay-200 font-bold text-gray-700 flex items-center justify-center gap-2 disabled:opacity-50"><CloudDownload size={18} /> {busy === 'down' ? 'Đang tải…' : 'Khôi phục từ Google Drive'}</button>
                <button type="button" onClick={() => run('out', async () => { await disconnect(); toast('Đã ngắt kết nối Google.'); })} className="py-2 text-sm font-bold text-gray-500 flex items-center justify-center gap-1.5"><LogOut size={16} /> Ngắt kết nối Google</button>
              </div>
            )}
            <ul className="text-xs text-gray-600 mt-3 space-y-1 list-disc pl-4">
              <li>Ứng dụng chỉ xin quyền <b>tạo và mở đúng tệp sao lưu của mình</b> ("Lịch Việt - sao lưu.json"), không đọc được ảnh, tài liệu khác trong Drive.</li>
              <li>Ứng dụng không biết mật khẩu Google của bạn; đăng nhập do Google thực hiện.</li>
              <li>Dùng máy chung (cơ quan, quán net): bấm "Ngắt kết nối Google" sau khi dùng.</li>
            </ul>
          </>
        ) : (
          <p className="text-sm text-gray-600 mt-1 flex gap-2"><Info size={16} className="shrink-0 mt-0.5 text-gray-500" />
            {st.reason === 'local-file'
              ? 'Đang mở ứng dụng từ tệp trên máy nên chưa đăng nhập Google được. Hãy dùng bản web (cài ra màn hình chính) để sao lưu Google Drive, hoặc dùng Cách 1.'
              : st.reason === 'insecure' ? 'Sao lưu Google Drive chỉ chạy trên trang web có https.'
              : 'Bản cài đặt này chưa bật sao lưu Google Drive. Vui lòng dùng Cách 1.'}
          </p>
        )}
      </div>

      <div className="text-xs text-gray-600 flex gap-2 p-3 rounded-2xl bg-kim-50 border border-amber-100">
        <ShieldCheck size={16} className="shrink-0 mt-0.5 text-kim-700" />
        <span>Tệp sao lưu có ngày giỗ, năm sinh người trong nhà. Hãy giữ ở nơi của riêng bạn, không gửi cho người lạ. Nên sao lưu sau mỗi lần thêm ngày giỗ và trước khi đổi máy, cài lại trình duyệt.</span>
      </div>

      {error && <p className="text-sm font-semibold text-son-600 flex gap-1.5" role="alert"><AlertTriangle size={16} className="shrink-0 mt-0.5" />{error}</p>}

      {pending && (
        <div className="p-4 rounded-2xl border-2 border-son-200 bg-son-50 space-y-3" role="dialog" aria-label="Xác nhận khôi phục">
          <div className="font-bold text-muc flex items-center gap-2"><CheckCircle2 size={18} className="text-green-700" /> Bản sao lưu từ {pending.source}</div>
          <p className="text-sm text-gray-700">
            {pending.b.exportedAt && <>Tạo lúc {fmtTime(pending.b.exportedAt)}. </>}
            Có <b>{pending.b.data.reminders.length} lịch hẹn, ngày giỗ</b> và <b>{pending.b.data.family.length} người trong nhà</b>.
          </p>
          <div className="space-y-2">
            <label className="flex gap-2 items-start text-sm"><input type="radio" name="rmode" checked={mode === 'merge'} onChange={() => setMode('merge')} className="mt-1 accent-son-600" /><span><b>Gộp với dữ liệu đang có</b> (khuyên dùng): giữ dữ liệu trên máy này, thêm mục mới, tự bỏ mục trùng.</span></label>
            <label className="flex gap-2 items-start text-sm"><input type="radio" name="rmode" checked={mode === 'replace'} onChange={() => setMode('replace')} className="mt-1 accent-son-600" /><span><b>Thay thế toàn bộ</b>: xóa {cur.reminders.length} lịch hẹn, {cur.family.length} người trong nhà đang có trên máy này, dùng đúng như bản sao lưu.</span></label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setPending(null)} className="py-2.5 rounded-xl bg-white border border-giay-200 font-bold text-gray-700">Hủy</button>
            <button type="button" onClick={confirmRestore} className="py-2.5 rounded-xl bg-son-600 text-white font-bold">{mode === 'merge' ? 'Gộp và khôi phục' : 'Thay thế'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupPanel;
