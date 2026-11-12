/** Đọc ảnh người dùng chọn, kiểm tra loại tệp, thu nhỏ và nén trước khi lưu. */
const MAX_INPUT = 25 * 1024 * 1024; // 25 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif'];

export async function compressImage(file: File, maxSide = 1280, quality = 0.82): Promise<string> {
  if (!file.type.startsWith('image/') || (file.type && !ALLOWED.includes(file.type) && file.type !== 'image/avif')) {
    throw new Error('Chỉ nhận tệp ảnh JPG, PNG, WEBP, HEIC.');
  }
  if (file.size > MAX_INPUT) throw new Error('Ảnh quá lớn (tối đa 25 MB).');

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Không đọc được ảnh này. Vui lòng chọn ảnh khác.'));
      i.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Trình duyệt không hỗ trợ xử lý ảnh.');
    ctx.drawImage(img, 0, 0, w, h);
    // Xuất lại thành JPEG: loại bỏ siêu dữ liệu (vị trí GPS, thiết bị…) có trong ảnh gốc
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
