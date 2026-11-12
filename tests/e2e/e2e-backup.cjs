// Kiểm thử sao lưu / khôi phục / Google Drive (giả lập) / Giới thiệu
// node tests/e2e/e2e-backup.cjs [url-bản-thường] [url-bản-có-Google]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const URL0 = process.argv[2] || 'http://localhost:4173/';
const URLG = process.argv[3] || '';
const OUT = path.resolve(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) { pass++; console.log('  ✓', msg); } else { fail++; console.log('  ✗', msg); } };
const isFile = URL0.startsWith('file:');

async function newPage(browser, url, extra = {}) {
  const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, deviceScaleFactor: 2, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', acceptDownloads: true, ...extra });
  await ctx.clock.setFixedTime(new Date('2026-11-03T21:00:00+07:00'));
  const page = await ctx.newPage();
  page.external = []; page.errors = [];
  page.on('request', (r) => { const u = new URL(r.url()); if (!['localhost', '127.0.0.1', ''].includes(u.hostname) && !['data:', 'blob:', 'file:'].includes(u.protocol)) page.external.push(r.url()); });
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()); });
  page.on('pageerror', (e) => page.errors.push(String(e)));
  page.on('dialog', (d) => d.accept());
  await page.goto(url, { waitUntil: 'networkidle' });
  return { ctx, page };
}
async function addReminder(page, title, lunar) {
  await page.getByRole('button', { name: 'Thêm' }).click();
  await page.getByPlaceholder('VD: Giỗ cụ nội').fill(title);
  if (lunar) await page.getByRole('button', { name: 'Âm lịch', exact: true }).click();
  await page.getByRole('button', { name: 'Lưu nhắc lịch' }).click();
}
const seen = (loc) => loc.waitFor({ timeout: 4000 }).then(() => true).catch(() => false);
const remCount = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('viet-calendar-reminders') || '[]').length);

(async () => {
  const browser = await chromium.launch();
  const { page } = await newPage(browser, URL0);

  console.log('1. Tạo dữ liệu');
  await page.getByRole('button', { name: 'Nhắc lịch', exact: true }).click();
  await addReminder(page, 'Giỗ ông nội', true);
  await addReminder(page, 'Giỗ bà ngoại', true);
  await page.evaluate(() => {
    localStorage.setItem('viet-calendar-family', JSON.stringify([{ id: 'a', name: 'Tôi', birthYear: 1980, gender: 'nam' }, { id: 'b', name: 'Vợ', birthYear: 1982, gender: 'nu' }]));
    localStorage.setItem('viet-calendar-user-bg', 'data:image/jpeg;base64,' + 'A'.repeat(5000));
    localStorage.setItem('viet-calendar-settings', JSON.stringify({ theme: 'light', fontScale: 1.125, notifications: false }));
  });
  ok((await remCount(page)) === 2, 'Có 2 ngày giỗ');

  console.log('2. Sao lưu ra tệp (cách 1)');
  await page.getByRole('button', { name: /Sao lưu, chuyển sang máy khác/ }).click();
  ok(await page.getByText('Cách 1: Lưu ra tệp').isVisible(), 'Mở bảng sao lưu từ màn hình Nhắc lịch');
  ok(await page.getByText(/2 lịch hẹn, ngày giỗ/).first().isVisible(), 'Hiện số mục sẽ sao lưu');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Tải tệp sao lưu về máy' }).click()]);
  const file = path.join(OUT, dl.suggestedFilename());
  await dl.saveAs(file);
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  ok(/^lich-viet-sao-luu-2026-11-03\.json$/.test(dl.suggestedFilename()), `Tên tệp: ${dl.suggestedFilename()}`);
  ok(json.app === 'lich-viet' && json.data.reminders.length === 2 && json.data.family.length === 2, 'Tệp có 2 ngày giỗ, 2 người trong nhà');
  ok(json.data.settings.fontScale === 1.125 && !!json.data.ritual, 'Tệp có cài đặt giao diện và nhắc thắp hương');
  ok(!fs.readFileSync(file, 'utf8').includes('base64'), 'Tệp không chứa ảnh nền');
  ok(await page.getByText(/Lần sao lưu gần nhất/).isVisible(), 'Ghi nhận lần sao lưu gần nhất');

  console.log('3. "Đổi máy": xóa sạch rồi khôi phục');
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Nhắc lịch', exact: true }).click();
  ok((await remCount(page)) === 0, 'Máy mới: chưa có ngày giỗ');
  await page.getByRole('button', { name: /Sao lưu, chuyển sang máy khác/ }).click();
  await page.getByTestId('restore-input').setInputFiles(file);
  ok(await seen(page.getByText(/Có 2 lịch hẹn, ngày giỗ và 2 người trong nhà/)), 'Xem trước nội dung tệp');
  await Promise.all([page.waitForNavigation(), page.getByRole('button', { name: 'Gộp và khôi phục' }).click()]);
  await page.waitForTimeout(300);
  ok(await page.getByText(/Đã khôi phục: thêm 2 lịch hẹn, 2 người trong nhà/).isVisible(), 'Thông báo đã khôi phục');
  ok((await remCount(page)) === 2, 'Có lại 2 ngày giỗ');
  ok(await page.evaluate(() => document.documentElement.getAttribute('data-font')) === '1.125', 'Khôi phục cả cỡ chữ');

  console.log('4. Gộp lần nữa: không nhân đôi');
  await page.getByRole('button', { name: 'Nhắc lịch', exact: true }).click();
  await page.getByRole('button', { name: /Sao lưu, chuyển sang máy khác/ }).click();
  await page.getByTestId('restore-input').setInputFiles(file);
  await Promise.all([page.waitForNavigation(), page.getByRole('button', { name: 'Gộp và khôi phục' }).click()]);
  await page.waitForTimeout(300);
  ok(await page.getByText(/bỏ qua 4 mục trùng/).isVisible(), 'Bỏ qua 4 mục trùng');
  ok((await remCount(page)) === 2, 'Vẫn 2 ngày giỗ');

  console.log('5. Thay thế toàn bộ');
  await page.getByRole('button', { name: 'Nhắc lịch', exact: true }).click();
  await addReminder(page, 'Họp tổ dân phố', false);
  ok((await remCount(page)) === 3, 'Thêm mục thứ 3');
  await page.getByRole('button', { name: /Sao lưu, chuyển sang máy khác/ }).click();
  await page.getByTestId('restore-input').setInputFiles(file);
  await page.getByText('Thay thế toàn bộ').click();
  ok(await page.getByText(/xóa 3 lịch hẹn/).isVisible(), 'Cảnh báo sẽ xóa 3 lịch hẹn đang có');
  await Promise.all([page.waitForNavigation(), page.getByRole('button', { name: 'Thay thế', exact: true }).click()]);
  await page.waitForTimeout(300);
  ok((await remCount(page)) === 2, 'Còn đúng 2 mục như bản sao lưu');

  console.log('6. Tệp sai');
  await page.getByRole('button', { name: 'Nhắc lịch', exact: true }).click();
  await page.getByRole('button', { name: /Sao lưu, chuyển sang máy khác/ }).click();
  const bad = path.join(OUT, 'sai.json'); fs.writeFileSync(bad, '{"hello":1}');
  await page.getByTestId('restore-input').setInputFiles(bad);
  ok(await seen(page.getByText('Đây không phải tệp sao lưu của Lịch Việt.')), 'Báo lỗi tệp không phải sao lưu');
  ok(await page.getByText(isFile ? /Đang mở ứng dụng từ tệp trên máy/ : /chưa bật sao lưu Google Drive/).isVisible(), isFile ? 'Bản HTML: hướng dẫn dùng bản web cho Google Drive' : 'Bản chưa cấu hình: Google Drive tắt, có hướng dẫn');
  await page.screenshot({ path: `${OUT}/30-saoluu.png` });
  await page.getByLabel('Đóng').click();

  console.log('7. Giới thiệu, VietQR, sao chép STK');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  await page.getByRole('button', { name: 'Tiện ích', exact: true }).click();
  await page.getByText('Giới thiệu, ủng hộ').click();
  ok(/phiên bản 2\.4 by Ltd/.test(await page.getByTestId('about-version').innerText()), 'Phiên bản 2.4 by Ltd');
  ok((await page.getByRole('link', { name: 'dieplt.dongtien@gmail.com' }).getAttribute('href')).startsWith('mailto:dieplt.dongtien@gmail.com'), 'Bấm email mở thư');
  ok((await page.getByRole('link', { name: /SĐT: 0973 884 366/ }).getAttribute('href')) === 'tel:0973884366', 'Bấm số điện thoại để gọi');
  ok((await page.getByTestId('stk').innerText()) === '0781000409918', 'STK 0781000409918');
  await page.getByRole('button', { name: 'Sao chép STK' }).click();
  ok(await seen(page.getByText('Đã sao chép', { exact: true })), 'Sao chép STK');
  if (!isFile) ok((await page.evaluate(() => navigator.clipboard.readText()).catch(() => '')) === '0781000409918', 'Bộ nhớ tạm có đúng STK');
  const qr = page.getByTestId('vietqr');
  await qr.scrollIntoViewIfNeeded();
  await qr.screenshot({ path: `${OUT}/31-vietqr.png` });
  ok(await qr.isVisible(), 'Có mã VietQR');
  await page.getByTestId('about-version').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/32-gioithieu.png` });
  ok(page.external.length === 0, `Bản thường: không có yêu cầu ra ngoài (${page.external.length})`);
  ok(page.errors.length === 0, `Không có lỗi JavaScript (${page.errors.length})`);
  if (page.errors.length) console.log(page.errors.slice(0, 5));

  if (URLG) {
    console.log('8. Google Drive (cách 2) – giả lập máy chủ Google');
    const { ctx, page: g } = await newPage(browser, 'about:blank');
    const drive = { file: null, calls: [] };
    await ctx.route('https://accounts.google.com/gsi/client', (r) => r.fulfill({ contentType: 'text/javascript', body: `window.google={accounts:{oauth2:{initTokenClient:function(c){return{requestAccessToken:function(){setTimeout(function(){c.callback({access_token:'tok-123',expires_in:3600})},50)}}},revoke:function(t,cb){window.__revoked=t;cb&&cb()}}}};` }));
    await ctx.route('https://www.googleapis.com/**', async (r) => {
      const req = r.request(); const u = req.url();
      drive.calls.push({ method: req.method(), url: u, auth: req.headers()['authorization'] });
      if (u.includes('/drive/v3/files?q=')) return r.fulfill({ json: { files: drive.file ? [{ id: 'F1', modifiedTime: '2026-11-03T14:00:00Z' }] : [] } });
      if (u.includes('/upload/drive/v3/files')) { const body = req.postData(); const m = body.match(/\r\n\r\n(\{\s*"app": "lich-viet"[\s\S]*\})\r\n--/); drive.file = m ? m[1] : null; return r.fulfill({ json: { id: 'F1', modifiedTime: '2026-11-03T14:00:00Z' } }); }
      if (u.includes('/drive/v3/files/F1?alt=media')) return r.fulfill({ body: drive.file || '' });
      return r.fulfill({ status: 404, body: '' });
    });
    await g.goto(URLG, { waitUntil: 'networkidle' });
    ok(g.external.length === 0, 'Chưa bấm kết nối: không tải gì từ Google');
    await g.evaluate(() => localStorage.setItem('viet-calendar-reminders', JSON.stringify([{ id: 'x1', title: 'Giỗ cụ', note: '', time: '07:00', date: '2026-11-20', isRitual: false, repeat: 'lunar-yearly', lunarDay: 10, lunarMonth: 10 }])));
    await g.reload({ waitUntil: 'networkidle' });
    await g.getByRole('button', { name: 'Nhắc lịch', exact: true }).click();
    await g.getByRole('button', { name: /Sao lưu, chuyển sang máy khác/ }).click();
    ok(await g.getByText(/chỉ xin quyền/).isVisible(), 'Có khuyến cáo quyền truy cập Drive');
    await g.getByRole('button', { name: 'Kết nối Google Drive' }).click();
    await g.getByRole('button', { name: 'Lưu lên Google Drive' }).waitFor();
    ok(true, 'Kết nối Google Drive (đăng nhập giả lập)');
    await g.getByRole('button', { name: 'Lưu lên Google Drive' }).click();
    await g.getByText(/Đã lưu lên Google Drive lúc/).waitFor();
    ok(!!drive.file && JSON.parse(drive.file).data.reminders[0].title === 'Giỗ cụ', 'Tệp lên Drive có đúng ngày giỗ');
    ok(drive.calls.every((c) => c.auth === 'Bearer tok-123'), 'Mọi yêu cầu Drive đều kèm mã truy cập');
    ok(drive.calls.some((c) => c.method === 'POST' && c.url.includes('uploadType=multipart')), 'Tạo tệp mới lần đầu');
    await g.getByRole('button', { name: 'Lưu lên Google Drive' }).click();
    await g.waitForTimeout(300);
    ok(drive.calls.some((c) => c.method === 'PATCH' && c.url.includes('/files/F1')), 'Lần sau ghi đè đúng tệp cũ');
    await g.evaluate(() => localStorage.setItem('viet-calendar-reminders', '[]'));
    await g.getByRole('button', { name: 'Khôi phục từ Google Drive' }).click();
    ok(await seen(g.getByText(/Bản sao lưu từ Google Drive/)), 'Xem trước bản sao lưu từ Drive');
    await Promise.all([g.waitForNavigation(), g.getByRole('button', { name: 'Gộp và khôi phục' }).click()]);
    ok((await remCount(g)) === 1, 'Khôi phục từ Drive: có lại ngày giỗ');
    const hosts = Array.from(new Set(g.external.map((u) => new URL(u).hostname)));
    ok(hosts.every((h) => h === 'accounts.google.com' || h === 'www.googleapis.com'), `Chỉ kết nối tới Google: ${hosts.join(', ')}`);
    ok(g.errors.length === 0, `Không có lỗi JavaScript (${g.errors.length})`);
    if (g.errors.length) console.log(g.errors.slice(0, 5));
  }

  console.log(`\nKết quả: ${pass} đạt, ${fail} lỗi`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
