/**
 * Sao lưu lên Google Drive của người dùng (cách B).
 * - Chỉ bật khi bản build có VITE_GOOGLE_CLIENT_ID và chạy trên trang web (https), không chạy ở tệp HTML mở từ máy.
 * - Thư viện đăng nhập của Google chỉ được tải khi người dùng bấm "Kết nối Google Drive".
 * - Quyền drive.file: ứng dụng chỉ thấy đúng tệp sao lưu do chính ứng dụng tạo, không đọc được tệp khác trên Drive.
 * - Mã truy cập chỉ giữ trong bộ nhớ, đóng ứng dụng là mất; không lưu mật khẩu.
 */
import { collectBackup, parseBackup, markBackedUp, type BackupFile } from './backup';

const CLIENT_ID: string = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() || '';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const FILE_NAME = 'Lịch Việt - sao lưu.json';
const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';

export type DriveStatus = { available: true } | { available: false; reason: 'not-configured' | 'local-file' | 'insecure' };

export function driveStatus(): DriveStatus {
  if (typeof location !== 'undefined' && location.protocol === 'file:') return { available: false, reason: 'local-file' };
  if (!CLIENT_ID) return { available: false, reason: 'not-configured' };
  if (typeof location !== 'undefined' && location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return { available: false, reason: 'insecure' };
  return { available: true };
}

interface TokenResponse { access_token?: string; expires_in?: number; error?: string; error_description?: string }
interface TokenClient { requestAccessToken: (o?: { prompt?: string }) => void }
type GoogleNS = { accounts: { oauth2: { initTokenClient: (c: { client_id: string; scope: string; callback: (r: TokenResponse) => void; error_callback?: (e: { type?: string; message?: string }) => void }) => TokenClient; revoke: (t: string, cb?: () => void) => void } } };

let token: { value: string; exp: number } | null = null;
let gisPromise: Promise<GoogleNS> | null = null;

function loadGis(): Promise<GoogleNS> {
  const w = window as unknown as { google?: GoogleNS };
  if (w.google?.accounts?.oauth2) return Promise.resolve(w.google);
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => (w.google?.accounts?.oauth2 ? resolve(w.google) : reject(new Error('Không tải được dịch vụ đăng nhập Google.')));
    s.onerror = () => { gisPromise = null; reject(new Error('Không kết nối được Google. Kiểm tra mạng rồi thử lại.')); };
    document.head.appendChild(s);
  });
  return gisPromise;
}

export const isConnected = () => !!token && token.exp > Date.now();

/** Đăng nhập Google và xin quyền lưu tệp của ứng dụng (cửa sổ của Google). */
export async function connect(): Promise<void> {
  if (isConnected()) return;
  const st = driveStatus();
  if (!st.available) throw new Error('Bản này chưa bật sao lưu Google Drive.');
  const g = await loadGis();
  await new Promise<void>((resolve, reject) => {
    const client = g.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (r) => {
        if (r.error || !r.access_token) return reject(new Error(r.error === 'access_denied' ? 'Bạn chưa cho phép ứng dụng lưu tệp lên Google Drive.' : 'Đăng nhập Google không thành công.'));
        token = { value: r.access_token, exp: Date.now() + Math.max(60, (r.expires_in || 3600) - 60) * 1000 };
        resolve();
      },
      error_callback: (e) => reject(new Error(e?.type === 'popup_closed' ? 'Bạn đã đóng cửa sổ đăng nhập Google.' : e?.type === 'popup_failed_to_open' ? 'Trình duyệt chặn cửa sổ đăng nhập. Hãy cho phép cửa sổ bật lên rồi thử lại.' : 'Đăng nhập Google không thành công.')),
    });
    client.requestAccessToken({ prompt: '' });
  });
}

export async function disconnect(): Promise<void> {
  const t = token?.value;
  token = null;
  const w = window as unknown as { google?: GoogleNS };
  if (t && w.google?.accounts?.oauth2) await new Promise<void>((r) => w.google!.accounts.oauth2.revoke(t, () => r()));
}

async function api(url: string, init: RequestInit = {}): Promise<Response> {
  if (!isConnected()) throw new Error('Phiên đăng nhập Google đã hết. Vui lòng kết nối lại.');
  const res = await fetch(url, { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${token!.value}` } });
  if (res.status === 401) { token = null; throw new Error('Phiên đăng nhập Google đã hết. Vui lòng kết nối lại.'); }
  if (!res.ok) throw new Error(`Google Drive báo lỗi (${res.status}). Vui lòng thử lại sau.`);
  return res;
}

async function findFile(): Promise<{ id: string; modifiedTime: string } | null> {
  const q = encodeURIComponent(`name = '${FILE_NAME.replace(/'/g, "\\'")}' and trashed = false and appProperties has { key='app' and value='lich-viet' }`);
  const res = await api(`${API}/files?q=${q}&spaces=drive&orderBy=modifiedTime desc&pageSize=1&fields=files(id,modifiedTime)`);
  const j = (await res.json()) as { files?: { id: string; modifiedTime: string }[] };
  return j.files?.[0] || null;
}

/** Tải bản sao lưu hiện tại lên Drive (ghi đè tệp cũ của ứng dụng). */
export async function uploadBackup(): Promise<{ modifiedTime: string }> {
  const body = JSON.stringify(collectBackup(), null, 2);
  const existing = await findFile();
  const boundary = `lichviet${Math.random().toString(36).slice(2)}`;
  const meta = existing ? {} : { name: FILE_NAME, mimeType: 'application/json', appProperties: { app: 'lich-viet' } };
  const multipart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`;
  const url = existing ? `${UPLOAD}/files/${existing.id}?uploadType=multipart&fields=id,modifiedTime` : `${UPLOAD}/files?uploadType=multipart&fields=id,modifiedTime`;
  const res = await api(url, { method: existing ? 'PATCH' : 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body: multipart });
  const j = (await res.json()) as { modifiedTime?: string };
  markBackedUp('drive');
  return { modifiedTime: j.modifiedTime || new Date().toISOString() };
}

/** Lấy bản sao lưu trên Drive (null nếu chưa có). */
export async function downloadBackup(): Promise<{ backup: BackupFile; modifiedTime: string } | null> {
  const f = await findFile();
  if (!f) return null;
  const res = await api(`${API}/files/${f.id}?alt=media`);
  return { backup: parseBackup(await res.text()), modifiedTime: f.modifiedTime };
}
