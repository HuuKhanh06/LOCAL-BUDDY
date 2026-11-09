// features/payment/calc.ts – Công thức tính tiền, phí sàn, hủy phạt theo ΔT (BR-03, BR-06, BR-07, BR-12, BR-13)

/**
 * Tỷ lệ phạt trên tiền cọc 30% theo ΔT = Start_Time - Cancel_Time (BR-06, BR-07):
 * - ΔT > 48 giờ  → phạt 0% cọc (hoàn 100% cọc)
 * - 24h ≤ ΔT ≤ 48h → phạt 50% cọc (hoàn 50% cọc)
 * - ΔT < 24 giờ  → phạt 100% cọc (không hoàn cọc)
 */
export function calcPenaltyRate(deltaHours: number): number {
  if (deltaHours > 48) return 0;
  if (deltaHours >= 24) return 0.5;
  return 1;
}

/**
 * Số tiền phạt cọc khi Du khách hủy đơn đã CONFIRMED:
 * Penalty = Deposit × Penalty_Rate
 */
export function calcPenaltyAmount(deposit: number, deltaHours: number): number {
  return Math.round(deposit * calcPenaltyRate(deltaHours));
}

/**
 * Số tiền hoàn lại cho Du khách khi hủy đơn:
 * Refund = Deposit - Penalty
 */
export function calcRefundAmount(deposit: number, deltaHours: number): number {
  return deposit - calcPenaltyAmount(deposit, deltaHours);
}

/**
 * Phân bổ tiền phạt cọc giữa Nền tảng và HDV (BR-07):
 * - Platform_Fee_On_Penalty = Penalty × Fee_Rate
 * - Guide_Compensation = Penalty - Platform_Fee_On_Penalty
 */
export function calcPenaltySplit(
  deposit: number,
  deltaHours: number,
  feeRate: number
): {
  penaltyRate: number;
  penaltyAmount: number;
  refundToTourist: number;
  platformFeeOnPenalty: number;
  guideCompensation: number;
} {
  const penaltyRate = calcPenaltyRate(deltaHours);
  const penaltyAmount = Math.round(deposit * penaltyRate);
  const refundToTourist = deposit - penaltyAmount;
  const platformFeeOnPenalty = Math.round(penaltyAmount * feeRate);
  const guideCompensation = penaltyAmount - platformFeeOnPenalty;

  return {
    penaltyRate,
    penaltyAmount,
    refundToTourist,
    platformFeeOnPenalty,
    guideCompensation,
  };
}

/**
 * Tính đầy đủ các khoản của 1 đơn đặt lịch theo giờ (BR-03, BR-13)
 */
export function calcBookingAmounts(
  hourlyRate: number,
  hours: number,
  feeRate: number
): {
  total: number;
  deposit: number;
  remaining: number;
  platformFee: number;
  guideReceives: number;
  guideCashDelta: number;
} {
  const total = Math.round(hourlyRate * hours);
  const deposit = Math.round(total * 0.3);
  const remaining = total - deposit;
  const platformFee = Math.round(total * feeRate);
  const guideReceives = total - platformFee;
  const guideCashDelta = deposit - platformFee;
  return { total, deposit, remaining, platformFee, guideReceives, guideCashDelta };
}
