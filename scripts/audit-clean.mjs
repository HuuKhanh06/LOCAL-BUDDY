// scripts/audit-clean.mjs
// Quét mã nguồn để đảm bảo tiêu chí "thương mại sạch" trước khi phát hành v1.0.0
// Tuân thủ toàn diện mục [12] trong PROMPT TỔNG THỂ v3

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, '../localbuddy-web/src');

const FORBIDDEN_PATTERNS = [
  { pattern: /TODO[:\s]/i, name: 'Còn ghi chú TODO chưa giải quyết' },
  { pattern: /FIXME[:\s]/i, name: 'Còn ghi chú FIXME lỗi cần sửa' },
  { pattern: /lorem ipsum/i, name: 'Dữ liệu giả lập lorem ipsum' },
  { pattern: /href=["']#["']/i, name: 'Liên kết chết href="#"' },
  { pattern: /console\.log\(/, name: 'Còn sót lệnh gỡ lỗi console.log' },
  { pattern: /placeholder\.(com|org)/i, name: 'Ảnh placeholder từ dịch vụ ngoài' },
];

// Mã màu legacy bị cấm trong trang quản trị
const ADMIN_LEGACY_COLORS = [
  '#E8CED5',
  '#1A0A0F',
  '#FDF7F9',
  '#1EC1CB',
  '#D4C0C6',
  '#F6E6EA',
  '#118B93',
  '#E6F9FA',
  '#525266',
  '#1C1C28',
];

let violationsCount = 0;

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        scanDir(fullPath);
      }
    } else if (/\.(tsx|ts|jsx|js|css)$/.test(file)) {
      if (file.includes('.test.') || file.includes('.spec.')) {
        continue;
      }
      const content = fs.readFileSync(fullPath, 'utf-8');

      // 1. Kiểm tra các mẫu bị cấm chung
      for (const rule of FORBIDDEN_PATTERNS) {
        if (rule.pattern.test(content)) {
          console.error(`❌ Vi phạm [${rule.name}] tại: ${path.relative(process.cwd(), fullPath)}`);
          violationsCount++;
        }
      }

      // 2. Kiểm tra mã màu legacy trong admin pages
      if (fullPath.includes(path.join('pages', 'admin'))) {
        for (const hex of ADMIN_LEGACY_COLORS) {
          if (content.toLowerCase().includes(hex.toLowerCase())) {
            console.error(`❌ Vi phạm [Mã màu legacy ${hex} ngoài tokens] tại: ${path.relative(process.cwd(), fullPath)}`);
            violationsCount++;
          }
        }
      }
    }
  }
}

// 3. Kiểm tra file demo / style-guide không được tồn tại
const designSystemPagePath = path.resolve(SRC_DIR, 'pages/public/DesignSystemPage.tsx');
if (fs.existsSync(designSystemPagePath)) {
  console.error(`❌ Vi phạm: File demo/styleguide vẫn còn tồn tại tại ${designSystemPagePath}`);
  violationsCount++;
}

console.log('=== KIỂM TOÁN MÃ NGUỒN AUDIT-CLEAN LOCALBUDDY ===');
scanDir(SRC_DIR);

if (violationsCount > 0) {
  console.error(`\n❌ Phát hiện ${violationsCount} vi phạm cần xử lý trước khi xuất bản.`);
  process.exit(1);
} else {
  console.log('\n🎉 KIỂM TOÁN HOÀN TẤT: 0 TODO/FIXME, 0 lorem ipsum, 0 href="#", 0 console.log, 0 mã màu legacy, mã nguồn thương mại sạch 100%!');
  process.exit(0);
}
