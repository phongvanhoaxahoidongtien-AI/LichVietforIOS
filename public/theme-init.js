// Áp dụng giao diện sáng/tối và cỡ chữ trước khi vẽ để tránh nháy màn hình
try {
  var s = JSON.parse(localStorage.getItem('viet-calendar-settings') || '{}');
  var dark = s.theme === 'dark' || ((!s.theme || s.theme === 'system') && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  if (dark) document.documentElement.classList.add('dark');
  if (s.fontScale) document.documentElement.setAttribute('data-font', String(s.fontScale));
} catch (e) {}
