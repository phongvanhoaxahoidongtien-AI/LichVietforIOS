// Kiểm thử tính năng 2.3: node tests/e2e/e2e-v23.cjs [url]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const URL0 = process.argv[2] || 'http://localhost:4173/';
const isFile = URL0.startsWith('file:');
const OUT = path.resolve(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const tag = isFile ? 'html' : 'web';

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) { pass++; console.log('  ✓', msg); } else { fail++; console.log('  ✗', msg); } };
async function shot(page, file) {
  await page.evaluate(() => { const a = document.querySelector('.app-shell'); const m = document.getElementById('main'); a.dataset.h = a.style.height; a.style.height = 'auto'; a.style.overflow = 'visible'; m.style.overflow = 'visible'; document.body.style.overflow = 'visible'; });
  await page.screenshot({ path: file, fullPage: true });
  await page.evaluate(() => { const a = document.querySelector('.app-shell'); const m = document.getElementById('main'); a.style.height = a.dataset.h || ''; a.style.overflow = ''; m.style.overflow = ''; document.body.style.overflow = ''; });
}
const closeSheet = (page) => page.getByRole('dialog').getByLabel('Đóng').click();

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, deviceScaleFactor: 2, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', acceptDownloads: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36' });
  await ctx.clock?.setFixedTime?.(new Date('2026-11-04T08:30:00+07:00'));
  const opened = [];
  await ctx.route('https://dl.vietqr.io/**', (r) => { opened.push(r.request().url()); return r.fulfill({ contentType: 'text/html', body: '<p>vietqr</p>' }); });
  const page = await ctx.newPage();
  const external = [], errors = [], csp = [];
  page.on('request', (r) => { const u = new URL(r.url()); if (!['localhost', '127.0.0.1', ''].includes(u.hostname) && !['data:', 'blob:', 'file:'].includes(u.protocol)) external.push(r.url()); });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); if (/Content Security Policy/i.test(m.text())) csp.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(URL0, { waitUntil: 'networkidle' });

  console.log('1. Trực trên trang Hôm nay');
  const badge = page.getByTestId('truc-badge').first();
  ok(await badge.isVisible(), 'Có nhãn Trực ở phần tóm tắt');
  const badgeText = await badge.innerText();
  ok(/^Trực \S+ · (Tốt|Bình hòa|Xấu)$/.test(badgeText.trim()), `Nhãn: "${badgeText.trim()}"`);
  const card = page.getByTestId('truc-card');
  ok(await card.isVisible(), 'Có thẻ "Trực hôm nay"');
  const cardText = await card.innerText();
  ok(/hôm nay/.test(cardText) && /Nên:/.test(cardText) && /Kiêng:/.test(cardText), 'Thẻ có Nên / Kiêng');
  await shot(page, `${OUT}/v23-${tag}-01-homnay.png`);
  await card.getByText('Xem ý nghĩa cả 12 Trực').click();
  ok(await page.getByTestId('truc-guide').isVisible(), 'Mở bảng 12 Trực');
  ok((await page.getByTestId('truc-guide').locator('li').count()) === 12, 'Bảng có đủ 12 Trực');
  ok(await page.getByTestId('truc-guide').getByText('(hôm đang xem)').isVisible(), 'Đánh dấu Trực của ngày');
  await page.screenshot({ path: `${OUT}/v23-${tag}-02-12truc.png` });
  await closeSheet(page);

  console.log('2. Trực trên lịch tháng');
  await page.getByRole('navigation').getByText('Tháng').click();
  await page.waitForTimeout(300);
  ok((await page.getByTestId('cell-truc').count()) === 30, 'Cả 30 ô tháng 11 đều hiện Trực');
  const aria = await page.getByRole('grid').locator('button').first().getAttribute('aria-label');
  ok(/Trực /.test(aria || ''), 'Nhãn đọc màn hình có Trực');
  await shot(page, `${OUT}/v23-${tag}-03-thang.png`);
  await page.getByTestId('toggle-truc').click();
  ok((await page.getByTestId('cell-truc').count()) === 0, 'Bấm "Ẩn Trực" thì ẩn');
  await page.getByTestId('toggle-truc').click();
  ok((await page.getByTestId('cell-truc').count()) === 30, 'Bấm "Hiện Trực" thì hiện lại');
  await page.getByText('12 Trực là gì?').click();
  ok(await page.getByTestId('truc-guide').isVisible(), 'Mở bảng 12 Trực từ lịch tháng');
  await closeSheet(page);

  console.log('3. Chia sẻ ứng dụng');
  await page.getByTestId('header-share').click();
  ok(await page.getByTestId('share-app').isVisible(), 'Mở bảng chia sẻ từ thanh trên');
  const st = await page.getByTestId('share-text').innerText();
  ok(/Lỗ Ban/.test(st) && /12 Trực/.test(st), 'Lời giới thiệu có nội dung');
  if (isFile) ok(await page.getByTestId('share-no-url').isVisible(), 'Mở từ tệp: báo chưa có địa chỉ web');
  else {
    ok(await page.getByTestId('share-qr').isVisible(), 'Bản web: có mã QR của ứng dụng');
    ok(st.includes('http://localhost:4173/'), 'Bản web: lời giới thiệu kèm liên kết');
  }
  await page.getByTestId('share-copy').click();
  await page.waitForTimeout(200);
  ok(await page.getByText(/Đã sao chép/).first().isVisible(), 'Sao chép lời giới thiệu');
  await page.screenshot({ path: `${OUT}/v23-${tag}-04-chiase.png` });
  await closeSheet(page);

  console.log('4. Thước Lỗ Ban');
  await page.getByRole('navigation').getByText('Tiện ích').click();
  ok(await page.getByTestId('menu-share').isVisible(), 'Tiện ích có mục Chia sẻ ứng dụng');
  await page.getByText('Thước Lỗ Ban').first().click();
  ok(await page.getByTestId('loban').isVisible(), 'Mở thước Lỗ Ban');
  ok((await page.getByTestId('loban-cung').innerText()).startsWith('Nhân Lộc'), 'Mặc định 81 cm thước 52,2: Nhân Lộc');
  const inp = page.getByTestId('loban-input');
  await inp.fill('70');
  ok((await page.getByTestId('loban-result').getAttribute('data-good')) === 'false', '70 cm thông thủy: cung xấu');
  ok((await page.getByTestId('loban-cung').innerText()).startsWith('Thiên Tai'), '70 cm là Thiên Tai');
  ok(await page.getByTestId('loban-near').isVisible(), 'Gợi ý kích thước tốt gần nhất');
  await shot(page, `${OUT}/v23-${tag}-05-loban-xau.png`);
  await page.getByTestId('loban-near').locator('button').last().click();
  ok((await page.getByTestId('loban-result').getAttribute('data-good')) === 'true', 'Bấm gợi ý → cung tốt');
  await page.getByTestId('ruler-429').click();
  ok((await page.getByTestId('ruler-use').innerText()).includes('42,9'), 'Đổi sang thước 42,9');
  await page.getByRole('tab', { name: 'Âm phần' }).click();
  ok((await page.getByTestId('ruler-use').innerText()).includes('38,8'), 'Âm phần dùng thước 38,8');
  await inp.fill('127');
  ok((await page.getByTestId('loban-cung').innerText()).startsWith('Vượng'), 'Bàn thờ 127 cm: Vượng');
  ok((await page.getByTestId('loban-table').locator('li').count()) === 10, 'Bảng 10 cung');
  await inp.fill('abc');
  ok(await page.getByText('Chỉ nhập số').isVisible(), 'Nhập chữ: báo lỗi');
  await page.getByRole('tab', { name: 'mm', exact: true }).click();
  await inp.fill('1270');
  ok((await page.getByTestId('loban-cung').innerText()).startsWith('Vượng'), 'Đơn vị mm: 1270 mm là Vượng');
  const before = await inp.inputValue();
  const rb = await page.getByTestId('loban-ruler').boundingBox();
  await page.mouse.move(rb.x + rb.width / 2, rb.y + 40);
  await page.mouse.down();
  await page.mouse.move(rb.x + rb.width / 2 - 120, rb.y + 40, { steps: 6 });
  await page.mouse.up();
  const after = await inp.inputValue();
  ok(Number(after) - Number(before) === 50, `Kéo thước sang trái 120px → +50 mm (${before} → ${after})`);
  await page.getByLabel('Tăng 1 mm').click();
  ok(Number(await inp.inputValue()) === Number(after) + 1, 'Nút +1 mm');
  await shot(page, `${OUT}/v23-${tag}-06-loban-am.png`);
  // lưu lựa chọn
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('navigation').getByText('Tiện ích').click();
  await page.getByText('Thước Lỗ Ban').first().click();
  ok((await page.getByTestId('ruler-use').innerText()).includes('38,8'), 'Nhớ loại thước sau khi tải lại');
  await page.getByText('Tiện ích').first().click();

  console.log('5. Mục 12 Trực trong Tiện ích');
  await page.getByText('12 Trực').first().click();
  ok((await page.getByTestId('truc-guide').locator('li').count()) === 12, 'Trang 12 Trực');
  await page.getByText('Tiện ích').first().click();

  console.log('6. Ủng hộ: số tiền, chọn ngân hàng, mở app');
  await page.getByText('Cài đặt, sao lưu').click();
  ok(await page.getByTestId('setting-truc').isChecked(), 'Cài đặt: Hiện Trực đang bật');
  ok((await page.getByTestId('donate').count()) === 0, 'Cài đặt không còn phần ủng hộ');
  await page.getByText('Tiện ích').first().click();
  const menuTitles = await page.locator('#main button span.font-bold').allInnerTexts();
  ok(menuTitles[4] === 'Cài đặt, sao lưu' && menuTitles[5] === 'Giới thiệu, ủng hộ', `Mục thứ 6 là "Giới thiệu, ủng hộ" (${menuTitles.join(' | ')})`);
  await page.getByText('Giới thiệu, ủng hộ').click();
  ok(await page.getByTestId('about-version').isVisible() && await page.getByTestId('support-card').isVisible(), 'Có Giới thiệu và Ủng hộ tác giả');
  ok((await page.getByTestId('donate-quick').locator('button').allInnerTexts()).join(',') === '100k,200k,500k,Số khác', 'Chọn nhanh: 100k, 200k, 500k, Số khác');
  const donate = page.getByTestId('donate');
  await donate.scrollIntoViewIfNeeded();
  await donate.getByRole('button', { name: '200k' }).click();
  ok((await page.getByTestId('donate-amount').inputValue()) === '200.000', 'Chọn nhanh 200k');
  await page.waitForTimeout(200);
  ok((await page.getByTestId('vietqr').getAttribute('data-amount')) === '200000', 'Mã QR cập nhật số tiền');
  await page.getByTestId('donate-other').click();
  ok((await page.getByTestId('donate-amount').inputValue()) === '' && await page.getByTestId('donate-amount').evaluate((e) => e === document.activeElement), 'Bấm "Số khác": xóa số, đưa con trỏ vào ô nhập');
  await page.getByTestId('donate-amount').fill('35000');
  ok((await page.getByTestId('donate-other').getAttribute('aria-pressed')) === 'true', 'Tự nhập 35.000: nút "Số khác" sáng');
  await page.getByTestId('donate-amount').fill('abc123x456');
  ok((await page.getByTestId('donate-amount').inputValue()) === '123.456', 'Ô số tiền chỉ nhận số');
  await page.getByTestId('donate-amount').fill('100000');
  ok((await page.getByTestId('donate-open').innerText()).includes('Chọn ngân hàng'), 'Chưa chọn ngân hàng: nút mờ');
  await page.getByTestId('donate-bank').selectOption('mb');
  const href = await page.getByTestId('donate-open').getAttribute('href');
  ok(href.startsWith('https://dl.vietqr.io/pay?app=mb&ba=0781000409918%40vcb&am=100000&tn=Ung%20ho%20Lich%20Viet&bn=LE%20THE%20DIEP'), 'Đường dẫn mở app MB đúng');
  ok((await page.getByTestId('donate-hint').innerText()).includes('tự điền'), 'MB: báo tự điền');
  await shot(page, `${OUT}/v23-${tag}-07-ungho.png`);
  await page.getByTestId('donate-bank').selectOption('vcb');
  ok((await page.getByTestId('donate-hint').innerText()).includes('chép sẵn STK'), 'VCB: báo chép sẵn STK');
  const [popup] = await Promise.all([ctx.waitForEvent('page'), page.getByTestId('donate-open').click()]);
  await popup.waitForLoadState().catch(() => {});
  ok(opened.some((u) => u.includes('app=vcb')), 'Bấm nút mở đường dẫn VietQR cho VCB');
  ok(await page.getByText(/Đã chép STK/).first().isVisible(), 'Báo đã chép STK');
  await popup.close();
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('navigation').getByText('Tiện ích').click();
  await page.getByText('Giới thiệu, ủng hộ').click();
  ok((await page.getByTestId('donate-bank').inputValue()) === 'vcb', 'Nhớ ngân hàng đã chọn');
  await page.getByTestId('donate-amount').fill('20000');
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }).catch(() => null), page.getByTestId('donate-save-qr').click()]);
  ok(dl && dl.suggestedFilename() === 'ung-ho-lich-viet.png', 'Lưu ảnh mã QR');
  if (dl) { const p = path.join(OUT, `v23-${tag}-qr-card.png`); await dl.saveAs(p); ok(fs.statSync(p).size > 10000, 'Ảnh QR có nội dung'); }

  console.log('7. An toàn');
  const ext = external.filter((u) => !u.startsWith('https://dl.vietqr.io/'));
  ok(ext.length === 0, `Không có kết nối ra ngoài ngoài VietQR khi người dùng bấm (${ext.join(', ')})`);
  ok(csp.length === 0, `Không vi phạm CSP ${csp.slice(0, 2).join(' | ')}`);
  ok(errors.length === 0, `Không có lỗi JavaScript ${errors.slice(0, 3).join(' | ')}`);

  await browser.close();
  console.log(`\nKết quả: ${pass} đạt, ${fail} lỗi`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
