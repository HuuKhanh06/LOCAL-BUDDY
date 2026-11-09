// utils/money.ts – Định dạng tiền tệ VNĐ & Công thức tài chính chuẩn BR-02, BR-03, BR-06, BR-07, BR-12, BR-13

/**
 * Định dạng tiền VNĐ chuẩn: 250000 → "250.000 ₫"
 */
export function formatMoney(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return safe.toLocaleString('vi-VN') + ' ₫';
}

/**
 * Định dạng đơn giá theo giờ trên thẻ HDV: 250000 → "250.000 ₫ / giờ"
 */
export function formatHourlyRate(hourlyRate: number): string {
  return `${formatMoney(hourlyRate)} / giờ`;
}

/**
 * Tổng tiền dịch vụ: G = Hourly_Rate × Hours
 */
export function calcTotal(hourlyRate: number, hours: number): number {
  return Math.round(hourlyRate * hours);
}

/**
 * Tiền đặt cọc 30%: D = 30% × G (BR-03)
 */
export function calcDeposit(total: number): number {
  return Math.round(total * 0.3);
}

/**
 * Tiền còn lại 70%: B = G - D = 70% × G (BR-03)
 */
export function calcRemaining(total: number): number {
  return total - calcDeposit(total);
}

/**
 * Phí hoa hồng nền tảng: F = G × Fee_Rate (BR-13, Fee_Rate ∈ [10%, 15%])
 */
export function calcPlatformFee(total: number, feeRate: number): number {
  return Math.round(total * feeRate);
}

/**
 * Tiền HDV thực nhận khi khách thanh toán Online 70% cuối:
 * Wallet_Credit_Online = G - F (BR-13)
 */
export function calcGuideReceives(total: number, feeRate: number): number {
  return total - calcPlatformFee(total, feeRate);
}

/**
 * Tiền ví HDV được cộng thêm khi khách trả Tiền mặt (CASH) 70% cuối trực tiếp cho HDV:
 * Do HDV đã cầm trực tiếp 70% tiền mặt từ khách, sàn đang giữ 30% cọc (D) và thu phí sàn F = G × Fee_Rate:
 * Wallet_Credit_Cash = D - F (BR-13)
 */
export function calcGuideCashReconcileDelta(total: number, feeRate: number): number {
  const deposit = calcDeposit(total);
  const fee = calcPlatformFee(total, feeRate);
  return deposit - fee;
}
