import React from 'react';
import { Link } from 'react-router-dom';

export { HowItWorksPage } from './HowItWorksPage';

export const BecomeGuidePage: React.FC = () => (
  <div className="max-w-3xl mx-auto py-12 px-4 space-y-8 text-center">
    <div className="space-y-3">
      <span className="px-3 py-1 rounded-full bg-[var(--lb-surface-2)] text-[var(--lb-accent-text)] text-xs font-bold uppercase tracking-wider">
        Gia nhập cộng đồng
      </span>
      <h1 className="text-3xl font-black text-[var(--lb-text)]">Trở thành Hướng dẫn viên LocalBuddy</h1>
      <p className="text-[var(--lb-muted)] text-sm max-w-lg mx-auto">
        Tự do định giá theo giờ (80.000 ₫ – 500.000 ₫/giờ), chủ động bật lịch rảnh và kết nối du khách khắp thế giới đến với Đà Nẵng.
      </p>
    </div>

    <div className="bg-[var(--lb-surface)] border border-[var(--lb-border)] rounded-[24px] p-8 text-left space-y-4">
      <h3 className="font-bold text-[var(--lb-text)]">Yêu cầu tham gia:</h3>
      <ul className="text-xs text-[var(--lb-muted)] space-y-2 list-disc pl-5">
        <li>Có căn cước công dân hoặc Thẻ sinh viên hợp lệ để nộp xác minh KYC.</li>
        <li>Am hiểu văn hóa, ẩm thực, địa điểm tham quan tại Đà Nẵng, Hội An hoặc Sơn Trà.</li>
        <li>Thái độ nhiệt tình, thân thiện, trung thực và đúng giờ.</li>
      </ul>
      <div className="pt-4">
        <Link
          to="/dang-ky?role=guide"
          className="inline-block px-6 py-2.5 rounded-full bg-[var(--lb-accent)] text-[var(--lb-on-accent)] font-bold text-sm hover:bg-[var(--lb-accent-hover)]"
        >
          Đăng ký làm Guide ngay →
        </Link>
      </div>
    </div>
  </div>
);

export const CancellationPolicyPage: React.FC = () => (
  <div className="max-w-3xl mx-auto py-12 px-4 space-y-8">
    <div className="space-y-3">
      <span className="px-3 py-1 rounded-full bg-[var(--lb-surface-2)] text-[var(--lb-accent-text)] text-xs font-bold uppercase tracking-wider">
        Chính sách minh bạch
      </span>
      <h1 className="text-3xl font-black text-[var(--lb-text)]">Chính sách hủy đơn & Hoàn cọc</h1>
      <p className="text-[var(--lb-muted)] text-sm">
        Quy định hoàn tiền cọc 30% được tính toán tự động dựa trên khoảng thời gian từ thời điểm hủy đến giờ bắt đầu chuyến đi:
      </p>
    </div>

    <div className="bg-[var(--lb-surface)] border border-[var(--lb-border)] rounded-[20px] divide-y divide-[var(--lb-border)] text-sm">
      <div className="p-5 space-y-1">
        <div className="font-bold text-[var(--lb-success)]">Trước hơn 48 giờ so với giờ hẹn</div>
        <p className="text-xs text-[var(--lb-muted)]">
          Phạt 0% tiền cọc. Du khách được hoàn lại <strong>100% số tiền cọc</strong> đã thanh toán.
        </p>
      </div>
      <div className="p-5 space-y-1">
        <div className="font-bold text-[var(--lb-warning)]">Từ 24 giờ đến 48 giờ trước giờ bắt đầu</div>
        <p className="text-xs text-[var(--lb-muted)]">
          Phạt 50% tiền cọc. Du khách nhận lại 50% tiền cọc, 50% còn lại bồi thường cho Hướng dẫn viên (sau khi trừ phí sàn).
        </p>
      </div>
      <div className="p-5 space-y-1">
        <div className="font-bold text-[var(--lb-error)]">Dưới 24 giờ so với giờ hẹn</div>
        <p className="text-xs text-[var(--lb-muted)]">
          Phạt 100% tiền cọc. Không hoàn lại cọc cho du khách, toàn bộ tiền cọc chuyển bồi thường cho Guide (sau khi trừ phí sàn).
        </p>
      </div>
      <div className="p-5 space-y-1">
        <div className="font-bold text-[var(--lb-blue-text)]">Guide hủy đơn đã chốt </div>
        <p className="text-xs text-[var(--lb-muted)]">
          Du khách nhận lại <strong>100% tiền cọc</strong> ngay lập tức. Guide bị ghi nhận 1 lần vi phạm hủy tour.
        </p>
      </div>
    </div>
  </div>
);

export const SafetyPage: React.FC = () => (
  <div className="max-w-3xl mx-auto py-12 px-4 space-y-6">
    <h1 className="text-3xl font-black text-[var(--lb-text)]">An toàn & Độ tin cậy</h1>
    <p className="text-xs text-[var(--lb-muted)] leading-relaxed">
      100% Hướng dẫn viên công khai trên LocalBuddy đều trải qua quy trình xác minh danh tính KYC nghiêm ngặt với CCCD/Thẻ SV và chứng chỉ du lịch. Hệ thống đóng băng tiền cọc an toàn, chỉ giải ngân cho Guide khi chuyến đi hoàn thành trọn vẹn.
    </p>
  </div>
);

export const FaqPage: React.FC = () => (
  <div className="max-w-3xl mx-auto py-12 px-4 space-y-6">
    <h1 className="text-3xl font-black text-[var(--lb-text)]">Câu hỏi thường gặp (FAQ)</h1>
    <div className="space-y-4">
      <div className="bg-[var(--lb-surface)] border border-[var(--lb-border)] rounded-[16px] p-5">
        <h4 className="font-bold text-sm text-[var(--lb-text)]">Giá thuê theo giờ đã bao gồm những gì?</h4>
        <p className="text-xs text-[var(--lb-muted)] mt-1">
          Bao gồm công hướng dẫn, đồng hành và hỗ trợ chụp ảnh của Guide. Chi phí ăn uống, vé tham quan và phương tiện di chuyển do du khách tự chi trả theo thực tế.
        </p>
      </div>
      <div className="bg-[var(--lb-surface)] border border-[var(--lb-border)] rounded-[16px] p-5">
        <h4 className="font-bold text-sm text-[var(--lb-text)]">Tôi có thể trả 70% còn lại bằng tiền mặt không?</h4>
        <p className="text-xs text-[var(--lb-muted)] mt-1">
          Có. Sau khi kết thúc tour và xác nhận hoàn tất, bạn có thể chọn trả 70% qua cổng Online hoặc thanh toán Tiền mặt trực tiếp cho Guide.
        </p>
      </div>
    </div>
  </div>
);

export const TermsPage: React.FC = () => (
  <div className="max-w-3xl mx-auto py-12 px-4 space-y-4">
    <h1 className="text-3xl font-black text-[var(--lb-text)]">Điều khoản dịch vụ</h1>
    <p className="text-xs text-[var(--lb-muted)] leading-relaxed">
      Bằng việc sử dụng nền tảng LocalBuddy Đà Nẵng, bạn đồng ý với các quy định về xác thực danh tính, quy tắc ứng xử văn minh và chính sách hủy/phạt cọc minh bạch.
    </p>
  </div>
);

export const PrivacyPage: React.FC = () => (
  <div className="max-w-3xl mx-auto py-12 px-4 space-y-4">
    <h1 className="text-3xl font-black text-[var(--lb-text)]">Chính sách bảo mật</h1>
    <p className="text-xs text-[var(--lb-muted)] leading-relaxed">
      Thông tin CCCD và giấy tờ tùy thân của Guide được mã hóa và lưu trữ trong private storage, chỉ phục vụ mục đích thẩm định của Quản trị viên và tuyệt đối không công khai cho bên thứ ba.
    </p>
  </div>
);

export const ContactPage: React.FC = () => (
  <div className="max-w-3xl mx-auto py-12 px-4 space-y-4">
    <h1 className="text-3xl font-black text-[var(--lb-text)]">Liên hệ hỗ trợ</h1>
    <p className="text-xs text-[var(--lb-muted)] leading-relaxed">
      Ban quản trị LocalBuddy Đà Nẵng — Email: support@localbuddy.vn • Hotline: 0905 000 111.
    </p>
  </div>
);
