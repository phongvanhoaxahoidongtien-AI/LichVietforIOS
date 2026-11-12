// Kiểm thử phiếu xem ngày theo tuổi (2.4): node tests/e2e/e2e-v24.cjs [url]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const URL0 = process.argv[2] || 'http://localhost:4173/';
const tag = URL0.startsWith('file:') ? 'html' : 'web';
const OUT = path.resolve(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) { pass++; console.log('  ✓', msg); } else { fail++; console.log('  ✗', msg); } };
async function shot(page, file, sel) {
  await page.evaluate(() => { const a = document.querySelector('.app-shell'); const m = document.getElementById('main'); a.dataset.h = a.style.height; a.style.height = 'auto'; a.style.overflow = 'visible'; m.style.overflow = 'visible'; document.body.style.overflow = 'visible'; });
  if (sel) await page.locator(sel).first().screenshot({ path: file }); else await page.screenshot({ path: file, fullPage: true });
  await page.evaluate(() => { const a = document.querySelector('.app-shell'); const m = document.getElementById('main'); a.style.height = a.dataset.h || ''; a.style.overflow = ''; m.style.overflow = ''; document.body.style.overflow = ''; });
}

async function newPage(browser) {
  const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, deviceScaleFactor: 2, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', acceptDownloads: true });
  await ctx.clock?.setFixedTime?.(new Date('2026-11-12T09:00:00+07:00'));
  const page = await ctx.newPage();
  page.errors = []; page.external = [];
  page.on('request', (r) => { const u = new URL(r.url()); if (!['localhost', '127.0.0.1', ''].includes(u.hostname) && !['data:', 'blob:', 'file:'].includes(u.protocol)) page.external.push(r.url()); });
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()); });
  page.on('pageerror', (e) => page.errors.push(String(e)));
  await page.goto(URL0, { waitUntil: 'networkidle' });
  return { ctx, page };
}

(async () => {
  const browser = await chromium.launch();
  const { page } = await newPage(browser);

  console.log('1. Trang Hôm nay khi chưa có năm sinh');
  ok(await page.getByTestId('today-generic').isVisible(), 'Hiện việc nên làm chung');
  await page.getByTestId('today-enter-age').click();
  await page.getByPlaceholder('VD: 1985').fill('1989');
  await page.waitForTimeout(200);
  const today = page.getByTestId('today-for-age');
  ok(await today.isVisible(), 'Nhập 1989 → thẻ "Hôm nay với tuổi"');
  ok((await today.innerText()).includes('Hôm nay với tuổi Kỷ Tỵ'), 'Tiêu đề tuổi Kỷ Tỵ');
  ok((await today.locator('li').count()) === 8, 'Đủ 8 việc chính, có điểm và mức');
  await shot(page, `${OUT}/v24-${tag}-01-homnay.png`, '[data-testid="today-for-age"]');

  console.log('2. Hỏi nhanh: ví dụ của anh Điệp');
  await page.getByRole('button', { name: /Hỏi nhanh: việc của bạn/ }).click();
  await page.locator('#ask-text').fill('Tôi sinh 1989 muốn xem ngày 15/11/2026 có phù hợp để về nhà mới không?');
  await page.getByRole('button', { name: 'Hiểu câu hỏi' }).click();
  await page.waitForTimeout(400);
  const rep = page.getByTestId('personal-report');
  ok(await rep.isVisible(), 'Hiện phiếu đánh giá');
  const verdict = page.getByTestId('ask-verdict');
  ok((await verdict.innerText()).includes('Không nên về nhà mới'), `Kết luận: ${(await verdict.innerText()).trim()}`);
  ok((await verdict.getAttribute('data-level')) === 'khong-nen', 'Mức: Không nên');
  ok(/Chủ nhật 15\/11\/2026 · âm 7\/10/.test(await rep.innerText()), 'Đúng ngày 15/11/2026, âm 7/10');
  ok(/tuổi mụ 38/.test(await rep.innerText()), 'Tuổi mụ 38');
  ok((await page.getByTestId('report-groups').locator('> div').count()) === 4, 'Đủ 4 nhóm điểm');
  ok((await page.getByTestId('group-ky').innerText()).includes('Tam Nương'), 'Nhóm Ngày kỵ: Tam Nương');
  ok((await page.getByTestId('group-ngay').innerText()).includes('Trực Phá'), 'Nhóm Chất lượng ngày: Trực Phá');
  ok((await page.getByTestId('group-nam').innerText()).includes('Hoang Ốc: Tuổi mụ 38'), 'Nhóm Hạn năm: Hoang Ốc');
  ok((await page.getByTestId('group-tuoi').innerText()).includes('Kỷ Tỵ'), 'Nhóm Hợp tuổi Kỷ Tỵ');
  const adv = await page.getByTestId('report-advice').innerText();
  ok(/2028/.test(adv), 'Lời khuyên: năm không phạm 2028');
  ok(/mượn tuổi/.test(adv), 'Lời khuyên: mượn tuổi, có ví dụ năm sinh');
  ok((await page.getByTestId('report-near').locator('button').count()) >= 1, 'Gợi ý ngày phù hợp gần nhất');
  ok(await page.getByTestId('report-cung-ask').isVisible(), 'Hỏi giới tính để xem cung mệnh');
  await page.getByTestId('report-cung-ask').getByRole('button', { name: 'Nam' }).click();
  const cung = await page.getByTestId('report-cung').innerText();
  ok(cung.includes('Khôn') && cung.includes('Tây tứ mệnh') && cung.includes('Đông Bắc (Sinh Khí'), 'Nam 1989: cung Khôn, Đông Bắc Sinh Khí');
  await page.getByTestId('report-cung').getByText('Đổi sang nữ').click();
  ok((await page.getByTestId('report-cung').innerText()).includes('Tốn'), 'Đổi sang nữ: cung Tốn');
  await page.getByTestId('report-cung').getByText('Đổi sang nam').click();
  await page.getByTestId('report-ritual').locator('summary').click();
  ok((await page.getByTestId('report-ritual').innerText()).includes('bát hương'), 'Phong tục về nhà mới');
  await shot(page, `${OUT}/v24-${tag}-02-phieu.png`, '[data-testid="personal-report"]');
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }).catch(() => null), page.getByTestId('report-save').click()]);
  ok(dl && /^xem-ngay-15-11-2026\.png$/.test(dl.suggestedFilename()), 'Lưu ảnh phiếu');
  if (dl) { const p = path.join(OUT, `v24-${tag}-phieu-anh.png`); await dl.saveAs(p); ok(fs.statSync(p).size > 50000, 'Ảnh phiếu có nội dung'); }

  console.log('3. Bấm ngày gợi ý → Chi tiết ngày theo tuổi');
  const chip = page.getByTestId('report-near').locator('button').first();
  const chipText = await chip.innerText();
  await chip.click();
  await page.waitForTimeout(400);
  const sec = page.getByTestId('personal-section');
  ok(await sec.isVisible(), 'Chi tiết ngày có mục Xem ngày theo tuổi');
  ok((await page.getByTestId('ps-act').inputValue()) === 'nhap-trach', 'Giữ việc Về nhà mới');
  ok((await sec.getByTestId('ask-verdict').getAttribute('data-level')) === 'nen', `Ngày gợi ý (${chipText.split('·')[0].trim()}) ở mức Nên`);
  ok((await page.getByTestId('ps-who').innerText()).includes('1989'), 'Người xem 1989');
  await page.getByTestId('ps-act').selectOption('ky-ket');
  ok((await sec.getByTestId('group-nam').innerText()).includes('không cần xét'), 'Ký kết: không xét hạn năm, đủ 15 điểm');
  await shot(page, `${OUT}/v24-${tag}-03-chitiet.png`, '[data-testid="personal-section"]');

  console.log('4. Hôm nay → bấm một việc mở phiếu đúng việc');
  await page.getByRole('navigation').getByText('Hôm nay').click();
  await page.getByTestId('today-act-cuoi-hoi').click();
  await page.waitForTimeout(300);
  ok((await page.getByTestId('ps-act').inputValue()) === 'cuoi-hoi', 'Mở phiếu Cưới hỏi');

  console.log('5. Cưới hỏi 2 người');
  await page.getByRole('tab', { name: 'Hỏi nhanh' }).click();
  await page.locator('#ask-text').fill('tôi 1980 vợ 1982 cưới ngày 17/11/2026 được không');
  await page.getByRole('button', { name: 'Hiểu câu hỏi' }).click();
  await page.waitForTimeout(400);
  const rep2 = await page.getByTestId('personal-report').innerText();
  ok(/Tuổi vợ chồng/.test(rep2), 'Có xem tuổi vợ chồng');
  ok(/cô dâu/.test(await page.getByTestId('group-nam').innerText()), 'Kim Lâu chú rể chỉ tham khảo, xét theo cô dâu');

  console.log('6. An toàn');
  ok(page.external.length === 0, `Không kết nối ra ngoài (${page.external.length})`);
  ok(page.errors.length === 0, `Không lỗi JavaScript ${page.errors.slice(0, 3).join(' | ')}`);
  await browser.close();
  console.log(`\nKết quả: ${pass} đạt, ${fail} lỗi`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
