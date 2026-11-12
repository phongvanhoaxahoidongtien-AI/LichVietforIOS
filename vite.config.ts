import path from 'path';
import fs from 'fs';
import { createHash } from 'crypto';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** Chính sách bảo mật nội dung: chỉ cho phép tài nguyên của chính ứng dụng, chặn mọi kết nối ra ngoài.
 *  (frame-ancestors chỉ có hiệu lực qua header – xem vercel.json) */
/** Miền Google chỉ mở khi bản build bật sao lưu Google Drive (có VITE_GOOGLE_CLIENT_ID). */
function buildCsp(google: boolean) {
  const g = (x: string) => (google ? ` ${x}` : '');
  return [
    "default-src 'self'",
    `script-src 'self'${g('https://accounts.google.com/gsi/client')}`,
    `style-src 'self' 'unsafe-inline'${g('https://accounts.google.com/gsi/style')}`,
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self'${g('https://www.googleapis.com https://accounts.google.com/gsi/')}`,
    `frame-src ${google ? 'https://accounts.google.com/gsi/' : "'none'"}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join('; ');
}

/** Chèn CSP vào bản build (không chèn khi chạy thử để không chặn công cụ phát triển). */
function cspPlugin(csp: string): Plugin {
  return {
    name: 'csp-meta',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace('<meta charset="UTF-8">', `<meta charset="UTF-8">\n  <meta http-equiv="Content-Security-Policy" content="${csp}">`);
    },
  };
}

/** Tạo service worker lưu sẵn toàn bộ tệp của ứng dụng để chạy khi mất mạng. */
function serviceWorkerPlugin(): Plugin {
  return {
    name: 'offline-sw',
    apply: 'build',
    writeBundle(options, bundle) {
      const outDir = options.dir || 'dist';
      const publicFiles: string[] = [];
      const walk = (dir: string, base = '') => {
        for (const f of fs.readdirSync(dir)) {
          const full = path.join(dir, f);
          if (fs.statSync(full).isDirectory()) walk(full, `${base}${f}/`);
          else if (f !== 'sw.js') publicFiles.push(`/${base}${f}`);
        }
      };
      walk(path.resolve(__dirname, 'public'));
      const assets = Object.keys(bundle).filter((f) => !f.endsWith('.woff')).map((f) => `/${f}`); // trình duyệt hiện đại dùng .woff2
      const files = Array.from(new Set(['/', '/index.html', ...assets, ...publicFiles]));
      const version = createHash('sha256').update(files.join('|') + Object.values(bundle).map((b: any) => b.code || '').join('').length).digest('hex').slice(0, 12);
      const tpl = fs.readFileSync(path.resolve(__dirname, 'sw.template.js'), 'utf8');
      fs.writeFileSync(path.join(outDir, 'sw.js'), tpl.replace('__VERSION__', version).replace('__FILES__', JSON.stringify(files, null, 0)));
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const google = !!env.VITE_GOOGLE_CLIENT_ID?.trim();
  return {
  server: { port: 3000, host: '0.0.0.0' },
  plugins: [react(), cspPlugin(buildCsp(google)), serviceWorkerPlugin()],
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  build: { target: 'es2019', assetsInlineLimit: 0, sourcemap: false },
  };
});
