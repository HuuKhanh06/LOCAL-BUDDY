// scripts/audit-clean.mjs
// Quét mã nguồn để đảm bảo tiêu chí "thương mại sạch" trước khi phát hành v1.0.0

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
      for (const rule of FORBIDDEN_PATTERNS) {
        if (rule.pattern.test(content)) {
          console.error(`❌ Vi phạm [${rule.name}] tại: ${path.relative(process.cwd(), fullPath)}`);
          violationsCount++;
        }
      }
    }
  }
}

console.log('=== KIỂM TOÁN MÃ NGUỒN AUDIT-CLEAN LOCALBUDDY ===');
scanDir(SRC_DIR);

if (violationsCount > 0) {
  console.error(`\n❌ Phát hiện ${violationsCount} vi phạm cần xử lý trước khi xuất bản.`);
  process.exit(1);
} else {
  console.log('\n🎉 KIỂM TOÁN HOÀN TẤT: 0 lỗi TODO/FIXME, 0 lorem ipsum, 0 href="#", mã nguồn sạch 100%!');
  process.exit(0);
}
