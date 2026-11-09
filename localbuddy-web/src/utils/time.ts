// utils/time.ts – Định dạng ngày giờ tiếng Việt & tính toán khoảng thời gian ΔT

/**
 * Định dạng ngày: "2026-11-15" → "15/11/2026"
 */
export function formatDate(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export const formatDateVN = formatDate;

/**
 * Định dạng ngày giờ ISO: "2026-11-08T10:30:00Z" → "08/11/2026 • 17:30"
 */
export function formatDateTime(isoStr?: string): string {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return isoStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} • ${hours}:${mins}`;
}

export const formatDateTimeVN = formatDateTime;

/**
 * Định dạng khoảng giờ: "09:00", "12:00" → "09:00 – 12:00"
 */
export function formatTimeRange(start: string, end: string): string {
  return `${start} – ${end}`;
}

/**
 * Tính ΔT (giờ) từ thời điểm hiện tại đến giờ khởi hành (Start_Time - Cancel_Time)
 */
export function calcDeltaHours(date: string, startTime: string): number {
  const now = Date.now();
  const startMs = new Date(`${date}T${startTime}:00`).getTime();
  if (Number.isNaN(startMs)) return 48;
  return Math.round(((startMs - now) / (1000 * 60 * 60)) * 10) / 10;
}

/**
 * Kiểm tra giờ bắt đầu có cách hiện tại ≥ 24 giờ không
 */
export function isAtLeast24HoursAway(date: string, startTime: string): boolean {
  return calcDeltaHours(date, startTime) >= 24;
}

/**
 * Tính số giây còn lại đến mốc ISO datetime
 */
export function getSecondsUntil(isoTarget?: string, fallbackSeconds = 900): number {
  if (!isoTarget) return fallbackSeconds;
  const targetMs = new Date(isoTarget).getTime();
  if (Number.isNaN(targetMs)) return fallbackSeconds;
  const diffSec = Math.floor((targetMs - Date.now()) / 1000);
  return Math.max(0, diffSec);
}
