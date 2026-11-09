// services/paymentProvider.ts
// Lớp trừu tượng cổng thanh toán có thể thay thế (Adapter Pattern)
// Mặc định chạy chế độ SANDBOX để demo đầy đủ các ngách:
// - Thành công (SUCCESS)
// - Lỗi mạng tạm thời cho phép thử lại trong hạn giữ chỗ 15p (FAILED_RETRYABLE)
// - Người dùng hủy ngang / từ chối giao dịch (CANCELLED_MIDWAY / REJECTED_RELEASE_SLOT)
// - Hết hạn phiên cổng thanh toán (EXPIRED)
// - Chống thanh toán trùng lặp (Idempotency Key)
// - Khôi phục phiên khi đóng tab / tải lại trang giữa lúc thanh toán

export type PaymentGatewayId = 'VNPAY' | 'MOMO' | 'BANK_CARD';

export type PaymentPhase = 'DEPOSIT_30' | 'BALANCE_70';

export type SandboxOutcome =
  | 'SUCCESS'
  | 'FAILED_RETRYABLE'
  | 'CANCELLED_MIDWAY'
  | 'REJECTED_RELEASE_SLOT'
  | 'EXPIRED';

export interface PaymentCheckoutRequest {
  bookingId: string;
  phase: PaymentPhase;
  amount: number;
  gateway: PaymentGatewayId;
  idempotencyKey?: string;
  sandboxOutcome?: SandboxOutcome;
}

export interface PaymentCheckoutResult {
  ok: boolean;
  status:
    | 'SUCCESS'
    | 'FAILED_RETRYABLE'
    | 'CANCELLED_MIDWAY'
    | 'REJECTED_RELEASE_SLOT'
    | 'EXPIRED'
    | 'DUPLICATE_BLOCKED';
  transactionRef: string;
  gateway: PaymentGatewayId;
  messageVi: string;
  processedAt: string;
}

export interface PendingCheckoutSession {
  bookingId: string;
  phase: PaymentPhase;
  amount: number;
  gateway: PaymentGatewayId;
  startedAt: string;
  interrupted?: boolean;
}

export interface IPaymentProvider {
  readonly mode: 'SANDBOX' | 'PRODUCTION';
  readonly providerName: string;
  startCheckoutSession(session: Omit<PendingCheckoutSession, 'startedAt'>): PendingCheckoutSession;
  getInterruptedSession(bookingId: string, phase: PaymentPhase): PendingCheckoutSession | null;
  markSessionInterrupted(bookingId: string, phase: PaymentPhase): void;
  clearCheckoutSession(bookingId: string, phase: PaymentPhase): void;
  processPayment(req: PaymentCheckoutRequest): Promise<PaymentCheckoutResult>;
}

const PENDING_SESSION_KEY = 'localbuddy_pending_checkout_v1';
const IDEMPOTENCY_STORE_KEY = 'localbuddy_paid_idempotency_v1';

function safeReadJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.sessionStorage) return fallback;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWriteJson(key: string, value: unknown): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Bỏ qua nếu trình duyệt chặn storage
  }
}

export class SandboxPaymentProvider implements IPaymentProvider {
  public readonly mode = 'SANDBOX' as const;
  public readonly providerName = 'LocalBuddy Sandbox Gateway (VNPay / MoMo / Napas)';

  startCheckoutSession(
    session: Omit<PendingCheckoutSession, 'startedAt'>
  ): PendingCheckoutSession {
    const all = safeReadJson<Record<string, PendingCheckoutSession>>(PENDING_SESSION_KEY, {});
    const sessionKey = `${session.bookingId}:${session.phase}`;
    const record: PendingCheckoutSession = {
      ...session,
      startedAt: new Date().toISOString(),
      interrupted: false,
    };
    all[sessionKey] = record;
    safeWriteJson(PENDING_SESSION_KEY, all);
    return record;
  }

  getInterruptedSession(
    bookingId: string,
    phase: PaymentPhase
  ): PendingCheckoutSession | null {
    const all = safeReadJson<Record<string, PendingCheckoutSession>>(PENDING_SESSION_KEY, {});
    const existing = all[`${bookingId}:${phase}`];
    if (!existing) return null;
    return existing.interrupted ? existing : null;
  }

  markSessionInterrupted(bookingId: string, phase: PaymentPhase): void {
    const all = safeReadJson<Record<string, PendingCheckoutSession>>(PENDING_SESSION_KEY, {});
    const sessionKey = `${bookingId}:${phase}`;
    if (all[sessionKey]) {
      all[sessionKey] = {
        ...all[sessionKey],
        interrupted: true,
      };
      safeWriteJson(PENDING_SESSION_KEY, all);
    }
  }

  clearCheckoutSession(bookingId: string, phase: PaymentPhase): void {
    const all = safeReadJson<Record<string, PendingCheckoutSession>>(PENDING_SESSION_KEY, {});
    delete all[`${bookingId}:${phase}`];
    safeWriteJson(PENDING_SESSION_KEY, all);
  }

  async processPayment(req: PaymentCheckoutRequest): Promise<PaymentCheckoutResult> {
    const idemKey = req.idempotencyKey || `${req.bookingId}:${req.phase}`;
    const paidMap = safeReadJson<Record<string, string>>(IDEMPOTENCY_STORE_KEY, {});
    const nowIso = new Date().toISOString();

    // 1. Chặn thanh toán trùng (Idempotency check)
    if (paidMap[idemKey]) {
      return {
        ok: false,
        status: 'DUPLICATE_BLOCKED',
        transactionRef: paidMap[idemKey],
        gateway: req.gateway,
        messageVi: `Khoản thanh toán này đã được ghi nhận trước đó (Mã tham chiếu: ${paidMap[idemKey]}). Hệ thống đã tự động chặn trừ tiền trùng lặp!`,
        processedAt: nowIso,
      };
    }

    const outcome = req.sandboxOutcome || 'SUCCESS';
    const refCode = `SBX-${req.gateway}-${Date.now().toString().slice(-6)}`;

    if (outcome === 'SUCCESS') {
      paidMap[idemKey] = refCode;
      safeWriteJson(IDEMPOTENCY_STORE_KEY, paidMap);
      this.clearCheckoutSession(req.bookingId, req.phase);
      return {
        ok: true,
        status: 'SUCCESS',
        transactionRef: refCode,
        gateway: req.gateway,
        messageVi: `Thanh toán qua ${req.gateway} thành công (Mã GD: ${refCode}).`,
        processedAt: nowIso,
      };
    }

    if (outcome === 'CANCELLED_MIDWAY') {
      this.markSessionInterrupted(req.bookingId, req.phase);
      return {
        ok: false,
        status: 'CANCELLED_MIDWAY',
        transactionRef: refCode,
        gateway: req.gateway,
        messageVi:
          'Bạn đã hủy thao tác thanh toán giữa chừng trên cổng. Chưa có khoản tiền nào bị trừ — khung giờ vẫn đang được giữ cho bạn trong thời hạn đếm ngược.',
        processedAt: nowIso,
      };
    }

    if (outcome === 'FAILED_RETRYABLE') {
      this.markSessionInterrupted(req.bookingId, req.phase);
      return {
        ok: false,
        status: 'FAILED_RETRYABLE',
        transactionRef: refCode,
        gateway: req.gateway,
        messageVi:
          'Kết nối tới ngân hàng phát hành tạm thời gián đoạn. Khung giờ của bạn vẫn được giữ nguyên để thử lại hoặc đổi sang cổng thanh toán khác.',
        processedAt: nowIso,
      };
    }

    if (outcome === 'EXPIRED') {
      this.clearCheckoutSession(req.bookingId, req.phase);
      return {
        ok: false,
        status: 'EXPIRED',
        transactionRef: refCode,
        gateway: req.gateway,
        messageVi:
          'Phiên thanh toán đã hết hạn 15 phút giữ chỗ (BR-05). Hệ thống tự động hủy đơn và mở lại khung giờ cho du khách khác.',
        processedAt: nowIso,
      };
    }

    // REJECTED_RELEASE_SLOT
    this.clearCheckoutSession(req.bookingId, req.phase);
    return {
      ok: false,
      status: 'REJECTED_RELEASE_SLOT',
      transactionRef: refCode,
      gateway: req.gateway,
      messageVi:
        'Giao dịch bị từ chối bởi ngân hàng phát hành (UC.14 Ngoại lệ 1). Đơn đặt lịch đã hủy và giải phóng khung giờ.',
      processedAt: nowIso,
    };
  }
}

export const paymentProvider: IPaymentProvider = new SandboxPaymentProvider();
