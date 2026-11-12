/**
 * Bản 1 tệp HTML chạy trực tiếp trên máy (nháy đúp, không cần mạng, không cần cài đặt).
 * Lệnh: npm run build:single  →  dist-single/LichViet.html
 */
import path from 'path';
import fs from 'fs';
import { createHash } from 'crypto';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

const sha = (s: string) => `'sha256-${createHash('sha256').update(s, 'utf8').digest('base64')}'`;

/** Nhúng theme-init.js, bỏ manifest/icon ngoài, chèn CSP chặn mọi kết nối mạng (dùng mã băm cho script nhúng). */
function singleHtml(): Plugin {
  return {
    name: 'single-html-finalize',
    apply: 'build',
    enforce: 'post',
    closeBundle() {
      const out = path.resolve(__dirname, 'dist-single');
      const src = path.join(out, 'index.html');
      if (!fs.existsSync(src)) return;
      let s = fs.readFileSync(src, 'utf8');
      const init = fs.readFileSync(path.resolve(__dirname, 'public/theme-init.js'), 'utf8');
      const icon = 'data:image/png;base64,' + fs.readFileSync(path.resolve(__dirname, 'public/icons/icon-192.png')).toString('base64');
      s = s.replace('<script src="/theme-init.js"></script>', () => `<script>${init}</script>`);
      s = s.replace(/<link rel="manifest"[^>]*>\s*/, '');
      s = s.replace(/<link rel="apple-touch-icon"[^>]*>\s*/, '');
      s = s.replace(/<link rel="icon"[^>]*>/, () => `<link rel="icon" type="image/png" href="${icon}">`);
      // Băm đúng nội dung các thẻ <script> cấp cao nhất (như trình duyệt đọc: đến </script> đầu tiên)
      const hashes: string[] = [];
      const lower = s.toLowerCase();
      let i = 0;
      while ((i = lower.indexOf('<script', i)) !== -1) {
        const open = lower.indexOf('>', i) + 1;
        const close = lower.indexOf('</script>', open);
        hashes.push(sha(s.slice(open, close)));
        i = close + 9;
      }
      const csp = [
        "default-src 'none'",
        `script-src ${hashes.join(' ')}`,
        "style-src 'unsafe-inline'",
        'img-src data: blob:',
        'font-src data:',
        "connect-src 'none'",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'none'",
      ].join('; ');
      s = s.replace('<meta charset="UTF-8">', () => `<meta charset="UTF-8">\n  <meta http-equiv="Content-Security-Policy" content="${csp}">`);
      fs.writeFileSync(path.join(out, 'LichViet.html'), s);
      fs.unlinkSync(src);
    },
  };
}

export default defineConfig({
  plugins: [react(), viteSingleFile({ removeViteModuleLoader: true }), singleHtml()],
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  publicDir: false,
  build: { outDir: 'dist-single', target: 'es2019', assetsInlineLimit: 100_000_000, cssCodeSplit: false, sourcemap: false, emptyOutDir: true },
});
