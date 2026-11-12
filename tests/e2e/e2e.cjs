// Kiểm thử trên trình duyệt thật: node tests/e2e/e2e.cjs [url]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const URL0 = process.argv[2] || 'http://localhost:4173/';
const OUT = path.resolve(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });

let pass = 0, fail = 0;
async function shot(page, file) {
  // mở rộng vùng cuộn để chụp được toàn bộ nội dung
  await page.evaluate(() => { const a = document.querySelector('.app-shell'); const m = document.getElementById('main'); a.dataset.h = a.style.height; a.style.height = 'auto'; a.style.overflow = 'visible'; m.style.overflow = 'visible'; document.body.style.overflow = 'visible'; });
  await page.screenshot({ path: file, fullPage: true });
  await page.evaluate(() => { const a = document.querySelector('.app-shell'); const m = document.getElementById('main'); a.style.height = a.dataset.h || ''; a.style.overflow = ''; m.style.overflow = ''; document.body.style.overflow = ''; });
}
const ok = (c, msg) => { if (c) { pass++; console.log('  ✓', msg); } else { fail++; console.log('  ✗', msg); } };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, deviceScaleFactor: 2, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', acceptDownloads: true });
  await ctx.clock?.setFixedTime?.(new Date('2026-11-02T08:30:00+07:00'));
  const page = await ctx.newPage();
  const external = [], errors = [], csp = [];
  page.on('request', (r) => { const u = new URL(r.url()); if (!['localhost', '127.0.0.1', ''].includes(u.hostname) && !['data:', 'blob:', 'file:'].includes(u.protocol)) external.push(r.url()); });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); if (/Content Security Policy/i.test(m.text())) csp.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('dialog', (d) => d.accept());

  console.log('1. Mở trang Hôm nay');
  await page.goto(URL0, { waitUntil: 'networkidle' });
  ok(await page.getByText('Lịch Việt').first().isVisible(), 'Hiện tiêu đề Lịch Việt');
  ok(await page.getByText('Canh Thìn').first().isVisible(), 'Ngày 2/11/2026 là Canh Thìn');
  ok(await page.getByText('Xem chi tiết ngày').isVisible(), 'Có nút xem chi tiết');
  ok(await page.getByText('Giờ Hoàng đạo').isVisible(), 'Có khung giờ Hoàng đạo');
  await shot(page, `${OUT}/01-homnay.png`);

  console.log('2. Chuyển ngày, về hôm nay');
  await page.getByLabel('Ngày sau').click();
  ok(await page.getByText('Tân Tỵ').first().isVisible(), 'Ngày sau là Tân Tỵ');
  await page.getByText('Về hôm nay').click();
  ok(await page.getByText('Canh Thìn').first().isVisible(), 'Về lại hôm nay');

  console.log('3. Tháng');
  await page.getByRole('button', { name: 'Tháng', exact: true }).click();
  ok(await page.getByText('Tháng 11, 2026').isVisible(), 'Hiện tháng 11/2026');
  await page.getByRole('button', { name: 'Cưới hỏi', exact: true }).click();
  await page.getByRole('button', { name: /^20 tháng 11/ }).click();
  ok(await page.getByText('Nhà giáo Việt Nam').first().isVisible(), 'Ngày lễ 20/11');
  await shot(page, `${OUT}/02-thang.png`);

  console.log('4. Xem ngày chi tiết');
  await page.getByRole('button', { name: 'Chi tiết' }).click();
  ok(await page.getByText('Hoàng đạo · Trực · Nhị thập bát tú').isVisible(), 'Có mục Hoàng đạo, Trực, 28 sao');
  ok(await page.getByText('Đánh giá theo việc').isVisible(), 'Có đánh giá theo việc');
  await page.getByRole('button', { name: 'Xem đủ 12 giờ' }).click();
  ok((await page.locator('tbody tr').count()) === 12, 'Bảng 12 giờ');
  await shot(page, `${OUT}/03-xemngay.png`);

  console.log('5. Chọn ngày tốt');
  await page.getByRole('tab', { name: 'Chọn ngày' }).click();
  await page.getByPlaceholder('VD: 1985').first().fill('1990');
  ok(await page.getByText('Tuổi Canh Ngọ').first().isVisible(), 'Năm 1990 là Canh Ngọ');
  await page.getByRole('button', { name: 'Tìm ngày tốt' }).click();
  await page.waitForTimeout(300);
  const nRes = await page.locator('li button[aria-expanded]').count();
  ok(nRes > 0, `Tìm được ${nRes} ngày tốt cho cưới hỏi`);
  ok(await page.getByText(/Xét tuổi Canh Ngọ theo năm/).isVisible(), 'Có xét Kim Lâu, Tam Tai');
  await page.locator('li button[aria-expanded]').first().click();
  ok(await page.getByText('Giờ tốt:').first().isVisible(), 'Mở chi tiết lý do và giờ tốt');
  await shot(page, `${OUT}/04-chonngay.png`);

  console.log('6. Đổi ngày');
  await page.getByRole('tab', { name: 'Đổi ngày' }).click();
  await page.getByRole('tab', { name: 'Âm → Dương' }).click();
  await page.locator('input[type=number]').fill('2025');
  await page.locator('select').nth(1).selectOption('6');
  await page.locator('select').nth(0).selectOption('1');
  await page.getByRole('checkbox').check();
  ok(await page.getByText('25/7/2025').isVisible(), '1/6 nhuận 2025 = 25/7/2025');
  await page.locator('select').nth(1).selectOption('5');
  ok(await page.getByText('Năm 2025 chỉ nhuận tháng 6.').isVisible(), 'Báo tháng nhuận không tồn tại');
  await shot(page, `${OUT}/05-doingay.png`);

  console.log('7. Nhắc lịch theo âm lịch');
  await page.getByRole('button', { name: 'Nhắc lịch', exact: true }).click();
  await page.getByRole('button', { name: 'Thêm' }).click();
  await page.getByPlaceholder('VD: Giỗ cụ nội').fill('Giỗ ông nội');
  await page.getByRole('button', { name: 'Âm lịch', exact: true }).click();
  await page.getByRole('button', { name: 'Lưu nhắc lịch' }).click();
  ok(await page.getByText('Giỗ ông nội').isVisible(), 'Đã thêm nhắc giỗ');
  await shot(page, `${OUT}/06-nhaclich.png`);
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Nhắc lịch', exact: true }).click();
  ok(await page.getByText('Giỗ ông nội').isVisible(), 'Nhắc lịch còn sau khi tải lại');

  console.log('8. Tiện ích, chế độ tối, chữ lớn');
  await page.getByRole('button', { name: 'Tiện ích', exact: true }).click();
  await page.getByText('Cài đặt, sao lưu', { exact: true }).click();
  await page.getByRole('tab', { name: 'Tối' }).click();
  await page.getByRole('tab', { name: 'Rất lớn' }).click();
  ok(await page.evaluate(() => document.documentElement.classList.contains('dark')), 'Bật chế độ tối');
  ok(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize) === '20px', 'Cỡ chữ 20px');
  await shot(page, `${OUT}/07-caidat-toi.png`);
  await page.getByRole('button', { name: 'Hôm nay', exact: true }).click();
  await shot(page, `${OUT}/08-homnay-toi.png`);
  await page.reload({ waitUntil: 'networkidle' });
  ok(await page.evaluate(() => document.documentElement.classList.contains('dark')), 'Nhớ chế độ tối khi tải lại');
  await page.getByRole('button', { name: 'Tiện ích', exact: true }).click();
  await page.getByText('Cài đặt, sao lưu', { exact: true }).click();
  await page.getByRole('tab', { name: 'Sáng' }).click();
  await page.getByRole('tab', { name: 'Vừa' }).click();
  await page.getByRole('button', { name: 'Tiện ích' }).first().click();
  await page.getByText('Phong tục, lễ tết').click();
  await page.waitForTimeout(200);
  await shot(page, `${OUT}/09-phongtuc.png`);
  await page.getByRole('button', { name: 'Tiện ích' }).first().click();
  await page.getByText('Nhịp sinh học').click();
  await page.waitForTimeout(200);
  await shot(page, `${OUT}/10-nhipsinhhoc.png`);

  console.log('9. Ảnh nền và chia sẻ');
  await page.getByRole('button', { name: 'Hôm nay', exact: true }).click();
  await page.getByLabel('Đổi ảnh nền').click();
  const png = path.resolve(__dirname, '../../public/icons/icon-512.png');
  await page.locator('input[type=file]').nth(1).setInputFiles(png);
  await page.waitForTimeout(500);
  ok(await page.evaluate(() => (localStorage.getItem('viet-calendar-user-bg') || '').startsWith('data:image/jpeg')), 'Ảnh tải lên được nén thành JPEG và lưu');
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }).catch(() => null), page.getByLabel('Chia sẻ tờ lịch thành ảnh').click()]);
  ok(!!dl && /lich-viet-2026-11-02\.jpg/.test(dl.suggestedFilename()), 'Tạo ảnh tờ lịch để chia sẻ');
  if (dl) await dl.saveAs(`${OUT}/11-anh-chia-se.jpg`);

  console.log('10. Dữ liệu hỏng không làm trắng màn hình');
  await page.evaluate(() => { localStorage.setItem('viet-calendar-reminders', '{hỏng'); localStorage.setItem('viet-calendar-settings', 'null'); localStorage.setItem('viet-calendar-person', '"abc"'); });
  await page.reload({ waitUntil: 'networkidle' });
  ok(await page.getByText('Giờ Hoàng đạo').isVisible(), 'Vẫn chạy khi dữ liệu lưu bị hỏng');

  const isFile = URL0.startsWith('file:');
  if (!isFile) {
  console.log('11. Không có mạng');
  await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 10000 }).catch(() => {});
  ok(await page.evaluate(() => !!navigator.serviceWorker.controller), 'Service worker đang hoạt động');
  await ctx.setOffline(true);
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(500);
  ok(await page.getByText('Giờ Hoàng đạo').isVisible(), 'Mở lại được khi mất mạng');
  await page.getByRole('button', { name: 'Xem ngày', exact: true }).click();
  await page.locator('#ask-text').fill('Tôi sinh năm 1980, ngày mai về nhà mới có tốt không?');
  await page.getByRole('button', { name: 'Hiểu câu hỏi' }).click();
  ok(await page.getByTestId('ask-verdict').isVisible(), 'Hỏi nhanh chạy khi mất mạng');
  await page.getByRole('tab', { name: 'Xem ngày' }).click();
  ok(await page.getByText('Đánh giá theo việc').isVisible(), 'Xem ngày chạy khi mất mạng');
  await ctx.setOffline(false);
  } else {
    console.log('11. Bản 1 tệp: chạy khi tắt mạng');
    await ctx.setOffline(true);
    await page.reload({ waitUntil: 'load' });
    ok(await page.getByText('Giờ Hoàng đạo').isVisible(), 'Mở lại được khi mất mạng');
    await ctx.setOffline(false);
  }

  console.log('12. Bảo mật');
  ok(external.length === 0, `Không có yêu cầu ra ngoài (${external.length})`);
  ok(csp.length === 0, `Không vi phạm CSP (${csp.length})`);
  ok(errors.length === 0, `Không có lỗi JavaScript (${errors.length})`);
  if (external.length) console.log(external);
  if (errors.length) console.log(errors);
  const meta = await page.evaluate(() => document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content') || '');
  ok(/connect-src '(self|none)'/.test(meta) && /script-src ('self'|'sha256-)/.test(meta), 'Có CSP chặn kết nối ngoài');

  console.log(`\nKết quả: ${pass} đạt, ${fail} lỗi`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
