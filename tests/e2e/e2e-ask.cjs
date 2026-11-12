// Kiểm thử trình duyệt cho tính năng Hỏi nhanh: node tests/e2e/e2e-ask.cjs [url]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const URL0 = process.argv[2] || 'http://localhost:4173/';
const OUT = path.resolve(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) { pass++; console.log('  ✓', msg); } else { fail++; console.log('  ✗', msg); } };
async function shot(page, file) {
  await page.evaluate(() => { const a = document.querySelector('.app-shell'); const m = document.getElementById('main'); a.style.height = 'auto'; a.style.overflow = 'visible'; m.style.overflow = 'visible'; document.body.style.overflow = 'visible'; });
  await page.screenshot({ path: file, fullPage: true });
  await page.evaluate(() => { const a = document.querySelector('.app-shell'); const m = document.getElementById('main'); a.style.height = ''; a.style.overflow = ''; m.style.overflow = ''; document.body.style.overflow = ''; });
}
const ask = async (page, q) => { await page.locator('#ask-text').fill(q); await page.getByRole('button', { name: 'Hiểu câu hỏi' }).click(); await page.waitForTimeout(250); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, deviceScaleFactor: 2, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' });
  await ctx.clock.setFixedTime(new Date('2026-11-02T08:30:00+07:00'));
  const page = await ctx.newPage();
  const external = [], errors = [];
  page.on('request', (r) => { const u = new URL(r.url()); if (!['localhost', '127.0.0.1', ''].includes(u.hostname) && !['data:', 'blob:', 'file:'].includes(u.protocol)) external.push(r.url()); });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('dialog', (d) => d.accept(d.defaultValue()));
  await page.goto(URL0, { waitUntil: 'networkidle' });

  console.log('1. Lối vào từ trang Hôm nay');
  await page.getByRole('button', { name: /Hỏi nhanh: việc của bạn/ }).click();
  ok(await page.getByText('Hỏi nhanh: việc này có tốt không?').isVisible(), 'Mở màn hình Hỏi nhanh');
  ok(await page.getByRole('tab', { name: 'Hỏi nhanh' }).getAttribute('aria-selected') === 'true', 'Thẻ Hỏi nhanh là thẻ đầu, đang chọn');

  console.log('2. Ví dụ 1: sinh 1980, ngày mai về nhà mới');
  await ask(page, 'Tôi sinh năm 1980, ngày mai tôi muốn dọn vào nhà mới thì có tốt không?');
  const v1 = await page.getByTestId('ask-verdict').innerText();
  ok(/Không nên về nhà mới/.test(v1), `Kết luận: "${v1.trim()}"`);
  ok(await page.getByText('Thứ Ba 3/11/2026').first().isVisible(), 'Đúng ngày 3/11/2026');
  ok(await page.getByText(/Dương Công Kỵ Nhật/).first().isVisible(), 'Lý do: Dương Công Kỵ Nhật');
  ok(await page.getByText(/Hoang Ốc: Tuổi mụ 47/).isVisible(), 'Xét Hoang Ốc tuổi mụ 47');
  ok(await page.getByText(/Thứ Sáu 6\/11\/2026/).first().isVisible(), 'Gợi ý ngày tốt gần nhất 6/11');
  ok((await page.locator('#slot-p1').inputValue()) === '1980', 'Ô năm sinh tự điền 1980');
  await shot(page, `${OUT}/20-hoinhanh-vd1.png`);

  console.log('3. Ví dụ 2: chồng 1980, vợ 1982, cưới tháng 11');
  await ask(page, 'tôi sinh năm 1980, vợ tôi sinh năm 1982, tôi nên tổ chức đám cưới vào ngày nào của tháng 11');
  const t2 = await page.getByTestId('ask-pick-title').innerText();
  ok(/ngày tốt để cưới hỏi trong tháng 11\/2026/.test(t2), `Tiêu đề: "${t2.trim()}"`);
  ok((await page.locator('#slot-groom').inputValue()) === '1980' && (await page.locator('#slot-bride').inputValue()) === '1982', 'Chú rể 1980, cô dâu 1982');
  ok(await page.getByText('Tuổi vợ chồng').isVisible(), 'Có xem tuổi vợ chồng');
  ok(await page.getByText(/Hợp · 5\/6/).isVisible(), 'Tuổi vợ chồng: Hợp 5/6 (mệnh sinh, can sinh, chi bình)');
  const first = await page.locator('li button').filter({ hasText: '/11/2026' }).first().innerText();
  ok(/Thứ Tư 4\/11\/2026/.test(first), 'Ngày tốt nhất: Thứ Tư 4/11/2026');
  ok(await page.getByText(/Kim Lâu.*chỉ tham khảo/).isVisible(), 'Kim Lâu chú rể chỉ tham khảo');
  await shot(page, `${OUT}/21-hoinhanh-vd2.png`);

  console.log('4. Chọn theo danh sách, không gõ chữ');
  await page.getByRole('button', { name: 'Nên chọn ngày nào?' }).click();
  await page.getByLabel('Việc khác').selectOption('mua-xe');
  ok(await page.locator('#slot-p1').isVisible(), 'Việc khác: chỉ còn 1 ô người làm');
  await page.locator('#slot-p1').selectOption('1985');
  await page.getByRole('button', { name: 'Tháng sau' }).click();
  await page.getByRole('button', { name: 'Xem kết quả' }).click();
  await page.waitForTimeout(200);
  const t3 = await page.getByTestId('ask-pick-title').innerText();
  ok(/ngày tốt để mua xe trong tháng 12\/2026/.test(t3), `Tiêu đề: "${t3.trim()}"`);
  await page.getByRole('button', { name: 'Ngày này có tốt không?' }).click();
  await page.getByRole('button', { name: 'Chọn ngày', exact: true }).click();
  await page.locator('input[aria-label="Chọn ngày cần xem"]').fill('2026-11-17');
  await page.getByRole('button', { name: 'Xem kết quả' }).click();
  ok(await page.getByTestId('ask-verdict').isVisible(), 'Xem một ngày cụ thể 17/11');

  console.log('5. Người trong nhà');
  await page.getByRole('button', { name: /Người trong nhà/ }).first().click();
  await page.getByLabel('Tên gọi').fill('Tôi');
  await page.locator('#fam-year').selectOption('1980');
  await page.getByLabel('Giới tính').last().selectOption('nam');
  await page.getByRole('button', { name: 'Thêm vào người trong nhà' }).click();
  await page.getByLabel('Tên gọi').fill('Vợ');
  await page.locator('#fam-year').selectOption('1982');
  await page.getByLabel('Giới tính').last().selectOption('nu');
  await page.getByRole('button', { name: 'Thêm vào người trong nhà' }).click();
  ok(await page.getByText('· 1982 · Nhâm Tuất · Nữ').isVisible(), 'Đã lưu Vợ 1982');
  await page.getByLabel('Đóng').click();
  await page.getByRole('button', { name: 'Cưới hỏi', exact: true }).click();
  await page.locator('#slot-groom').selectOption('');
  await page.locator('#slot-bride').selectOption('');
  await page.getByRole('button', { name: 'Vợ · 1982' }).click();
  await page.getByRole('button', { name: 'Tôi · 1980' }).click();
  ok((await page.locator('#slot-groom').inputValue()) === '1980' && (await page.locator('#slot-bride').inputValue()) === '1982', 'Bấm nhanh: Tôi → chú rể, Vợ → cô dâu (theo giới tính)');
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Xem ngày', exact: true }).click();
  ok(await page.getByRole('button', { name: 'Vợ · 1982' }).isVisible(), 'Người trong nhà còn sau khi tải lại');

  console.log('6. Câu hỏi thiếu thông tin');
  await ask(page, 'ngày mai có tốt không');
  ok(await page.getByText(/Còn thiếu: việc cần làm/).isVisible(), 'Báo còn thiếu việc cần làm');
  await ask(page, 'sửa bếp cuối tuần này được không, vợ chồng tôi 1984 và 1987');
  ok(/Sửa nhà/.test(await page.getByText('Đang chọn:').innerText()), 'Hiểu "sửa bếp" (không nhầm "cuối" thành "cưới")');
  ok(await page.getByTestId('ask-pick-title').isVisible(), 'Tìm ngày cuối tuần này');
  await ask(page, 'mai táng ông vào tháng 12 ngày nào tốt, con trưởng sinh 1970');
  ok(/ngày tốt để an táng trong tháng 12\/2026/.test(await page.getByTestId('ask-pick-title').innerText()), 'Hiểu "mai táng" không phải "ngày mai"');

  console.log('7. Xem chi tiết từ kết quả, chế độ tối + chữ lớn');
  await page.locator('li button').filter({ hasText: '/12/2026' }).first().click();
  ok(await page.getByText('Đánh giá theo việc').isVisible(), 'Bấm ngày trong kết quả → mở chi tiết');
  await page.getByRole('button', { name: /Xem thêm \d+ việc khác/ }).click();
  ok((await page.locator('button[aria-expanded]').count()) >= 19, 'Chi tiết ngày đánh giá đủ 19 việc');
  await page.evaluate(() => { document.documentElement.classList.add('dark'); document.documentElement.setAttribute('data-font', '1.25'); });
  await page.getByRole('tab', { name: 'Hỏi nhanh' }).click();
  await ask(page, 'Tôi sinh năm 1980, ngày mai về nhà mới có tốt không?');
  await shot(page, `${OUT}/22-hoinhanh-toi-chulon.png`);
  ok(await page.getByTestId('ask-verdict').isVisible(), 'Hiển thị tốt ở chế độ tối, chữ rất lớn');

  console.log('8. Bảo mật');
  ok(external.length === 0, `Không có yêu cầu ra ngoài (${external.length})`);
  ok(errors.length === 0, `Không có lỗi JavaScript (${errors.length})`);
  if (errors.length) console.log(errors.slice(0, 5));
  console.log(`\nKết quả: ${pass} đạt, ${fail} lỗi`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
