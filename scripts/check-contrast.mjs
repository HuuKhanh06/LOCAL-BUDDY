// scripts/check-contrast.mjs
// Kiểm tra tỷ lệ tương phản WCAG AA (>= 4.5:1 cho văn bản thông thường, >= 3:1 cho văn bản lớn)

function hexToRgb(hex) {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function getLuminance({ r, g, b }) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hexToRgb(hex1));
  const lum2 = getLuminance(hexToRgb(hex2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

const COLOR_TOKENS = {
  bg: '#272A2D',
  bgDeep: '#1E2124',
  surface: '#2F3337',
  surface2: '#383D42',
  text: '#E6E4DC',
  muted: '#A8ABA8',
  accent: '#EB5B38',
  onAccent: '#1B1D1F',
  accentText: '#F27C5E',
  blue: '#347CCB',
  blueText: '#6FA3E0',
  blueSolid: '#2F6FB8',
  sand: '#FEEDDC',
  onSand: '#1C1917',
  accentOnSand: '#B81B66',
  blueOnSand: '#285B9A',
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',
  withlocalsPrimary: '#D12B79',
};

const PAIRS_TO_TEST = [
  { name: 'Văn bản thường (--lb-text / --lb-bg)', fg: COLOR_TOKENS.text, bg: COLOR_TOKENS.bg, min: 4.5 },
  { name: 'Văn bản trên surface (--lb-text / --lb-surface)', fg: COLOR_TOKENS.text, bg: COLOR_TOKENS.surface, min: 4.5 },
  { name: 'Chữ trên nút cam (--lb-on-accent / --lb-accent)', fg: COLOR_TOKENS.onAccent, bg: COLOR_TOKENS.accent, min: 4.5 },
  { name: 'Chữ tối trên khối kem Withlocals (--lb-on-sand / --lb-sand)', fg: COLOR_TOKENS.onSand, bg: COLOR_TOKENS.sand, min: 4.5 },
  { name: 'Điểm nhấn mận trên khối kem Withlocals (--lb-accent-on-sand / --lb-sand)', fg: COLOR_TOKENS.accentOnSand, bg: COLOR_TOKENS.sand, min: 4.5 },
  { name: 'Liên kết xanh trên khối kem Withlocals (--lb-blue-on-sand / --lb-sand)', fg: COLOR_TOKENS.blueOnSand, bg: COLOR_TOKENS.sand, min: 4.5 },
  { name: 'Liên kết xanh trên nền tối (--lb-blue-text / --lb-bg)', fg: COLOR_TOKENS.blueText, bg: COLOR_TOKENS.bg, min: 4.5 },
  { name: 'Chữ cam trên nền sâu (--lb-accent-text / --lb-bg-deep)', fg: COLOR_TOKENS.accentText, bg: COLOR_TOKENS.bgDeep, min: 4.5 },
  { name: 'Nút xanh chữ trắng (#FFFFFF / --lb-blue-solid)', fg: '#FFFFFF', bg: COLOR_TOKENS.blueSolid, min: 4.5 },
  { name: 'Nút hồng Withlocals chữ trắng (#FFFFFF / #D12B79)', fg: '#FFFFFF', bg: COLOR_TOKENS.withlocalsPrimary, min: 4.5 },
];

console.log('=== KIỂM TRA ĐỘ TƯƠNG PHẢN WCAG AA CHO TOKENS LOCALBUDDY ===');
let hasError = false;

for (const pair of PAIRS_TO_TEST) {
  const ratio = getContrastRatio(pair.fg, pair.bg);
  const passed = ratio >= pair.min;
  const status = passed ? '✅ ĐẠT' : '❌ KHÔNG ĐẠT';
  console.log(`${status} [${ratio.toFixed(2)}:1, chuẩn >= ${pair.min}:1] ${pair.name}`);
  if (!passed) hasError = true;
}

if (hasError) {
  console.error('\n❌ Có cặp màu chưa đạt chuẩn WCAG AA.');
  process.exit(1);
} else {
  console.log('\n🎉 100% CÁC CẶP MÀU CHÍNH ĐẠT CHUẨN WCAG AA (>= 4.5:1)');
  process.exit(0);
}
