// src/i18n/index.ts
// Bộ từ điển Anh - Việt chuẩn hóa cho toàn bộ nền tảng LocalBuddy Đà Nẵng
// Đảm bảo thuật ngữ tự nhiên, chuyên nghiệp và nhất quán giữa 3 vai trò: Du khách, Thổ địa, Quản trị viên

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const resources = {
  vi: {
    translation: {
      app_name: 'LocalBuddy Đà Nẵng',
      tagline: 'Đặt Thổ địa bản xứ theo giờ tại Đà Nẵng',
      hero_title_1: 'Trải nghiệm đầy mê hoặc,',
      hero_title_highlight: 'cùng người bản xứ tuyệt vời',
      hero_subtitle: 'Đặt trước những trải nghiệm độc bản tại Đà Nẵng, đồng hành theo giờ cùng Thổ địa bản địa đã xác thực KYC 100%.',
      hero_search_placeholder: 'Bạn muốn đi đâu tại Đà Nẵng?',
      hero_search_btn: 'Tìm kiếm',
      hero_trust_badge: 'Xuất sắc 4.8 trên 5 ★ Trustpilot • 100% Thổ địa duyệt KYC • Cọc 30% giữ chỗ',

      // Navigation
      nav_home: 'Trang chủ',
      nav_guides: 'Tìm Thổ địa',
      nav_how_it_works: 'Giới thiệu',
      nav_become_guide: 'Trở thành Thổ địa',
      nav_my_bookings: 'Chuyến đi của tôi',
      nav_my_shifts: 'Lịch & Ca đồng hành',
      nav_wallet: 'Ví & Rút tiền',
      nav_admin: 'Quản trị hệ thống',

      // Roles
      role_tourist: 'Du khách',
      role_guide: 'Thổ địa bản xứ',
      role_admin: 'Quản trị viên',

      // Core Business Terms
      deposit_30: 'Cọc 30% giữ chỗ',
      balance_70: 'Tất toán 70% sau tour',
      hold_15_mins: 'Giữ chỗ nguyên tử 15 phút',
      service_agreement: 'Thỏa thuận dịch vụ điện tử',
      kyc_verified: 'Đã xác thực KYC 100%',
      verified_reviews: 'Đánh giá thật đã kiểm chứng',
      free_cancellation_48h: 'Hủy trước 48h miễn phí',
      hourly_rate: 'Đơn giá theo giờ',
      group_tour_inclusive: 'Áp dụng cho cả đoàn (tối đa 20 người)',

      // Status Labels
      status_pending: 'Chờ Thổ địa duyệt',
      status_waiting_payment: 'Chờ nộp cọc 30%',
      status_confirmed: 'Đã chốt lịch',
      status_completed: 'Hoàn tất chuyến đi',
      status_disputed: 'Khiếu nại / Tranh chấp',
      status_cancelled: 'Đã hủy đơn',

      // Payment Status
      payment_not_paid: 'Chưa thanh toán',
      payment_deposit_pending: 'Đang mở phiên cọc',
      payment_deposit_paid: 'Đã thanh toán cọc 30%',
      payment_balance_pending: 'Đang trả 70% còn lại',
      payment_balance_paid: 'Đã tất toán 100%',
      payment_refunded: 'Đã hoàn tiền',

      // Common Actions
      common_login: 'Đăng nhập',
      common_register: 'Đăng ký',
      common_logout: 'Đăng xuất',
      common_cancel: 'Hủy',
      common_confirm: 'Xác nhận',
      common_save: 'Lưu thay đổi',
      common_book_now: 'Đặt lịch ngay',
      common_explore: 'Khám phá ngay',
      common_view_details: 'Xem chi tiết',
      common_back: 'Quay lại',
      common_filter: 'Bộ lọc',
      common_all: 'Tất cả',

      // Error and Notice Messages
      msg_invalid_login: 'Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại.',
      msg_dup_contact: 'Số điện thoại hoặc email này đã được đăng ký tài khoản.',
      msg_slot_unavailable_retry: 'Khung giờ này vừa có người giữ chỗ hoặc đã kín. Vui lòng chọn khung giờ khác.',
      msg_slot_unavailable: 'Khung giờ này không còn khả dụng.',
      msg_early_completion: 'Chỉ có thể gửi yêu cầu hoàn thành sau khi khung giờ đồng hành thực tế kết thúc.',
      msg_complaint_completed_blocked: 'Chuyến đi đã hoàn tất quá thời hạn khiếu nại quy định.',
      msg_min_payout: 'Số dư khả dụng tối thiểu để tạo yêu cầu rút tiền là 200.000 VNĐ.',
      msg_slot_locked_or_booked: 'Khung giờ đang được giữ chỗ trong 15 phút hoặc đã chốt đơn.',
      msg_invalid_hourly_rate: 'Đơn giá thuê Thổ địa phải nằm trong khoảng từ 80.000 đến 500.000 VNĐ/giờ.',
      msg_invalid_fee_rate: 'Tỷ lệ phí sàn nền tảng phải nằm trong khoảng từ 10% đến 15%.',
      msg_no_guide_matched: 'Không tìm thấy Thổ địa phù hợp với tiêu chí tìm kiếm.',
      msg_no_guide_filter: 'Không có Thổ địa nào thỏa mãn các điều kiện lọc hiện tại.',
      msg_profile_unavailable: 'Hồ sơ Thổ địa hiện không còn khả dụng.',
      msg_upload_doc_failed: 'Không thể tải lên tệp hồ sơ. Vui lòng thử lại với định dạng ảnh/PDF.',
      msg_update_failed: 'Cập nhật thất bại. Vui lòng thử lại sau giây lát.',
      msg_no_data_period: 'Không có dữ liệu thống kê trong khoảng thời gian đã chọn.',
      msg_no_penalty_or_refund: 'Không phát sinh phí phạt hoặc hoàn cọc cho trường hợp này.',
      msg_profile_pending_kyc: 'Hồ sơ đang trong quá trình thẩm định danh tính KYC bởi Quản trị viên.',
    },
  },
  en: {
    translation: {
      app_name: 'LocalBuddy Da Nang',
      tagline: 'Book Local Guides by the Hour in Da Nang',
      hero_title_1: 'Enchanting experiences,',
      hero_title_highlight: 'with amazing local guides',
      hero_subtitle: 'Book unique experiences in Da Nang guided by 100% KYC-verified local insiders by the hour.',
      hero_search_placeholder: 'Where do you want to explore in Da Nang?',
      hero_search_btn: 'Search',
      hero_trust_badge: 'Excellent 4.8 out of 5 ★ Trustpilot • 100% KYC Verified • 30% Deposit Hold',

      // Navigation
      nav_home: 'Home',
      nav_guides: 'Find Guides',
      nav_how_it_works: 'How it works',
      nav_become_guide: 'Become a Guide',
      nav_my_bookings: 'My Bookings',
      nav_my_shifts: 'Schedule & Shifts',
      nav_wallet: 'Wallet & Payouts',
      nav_admin: 'Admin Console',

      // Roles
      role_tourist: 'Traveler',
      role_guide: 'Local Guide',
      role_admin: 'Administrator',

      // Core Business Terms
      deposit_30: '30% Deposit Hold',
      balance_70: '70% Balance Post-Tour',
      hold_15_mins: '15-minute Atomic Lock',
      service_agreement: 'Electronic Service Agreement',
      kyc_verified: '100% KYC Verified',
      verified_reviews: 'Verified Authentic Reviews',
      free_cancellation_48h: 'Free Cancellation > 48h',
      hourly_rate: 'Hourly Rate',
      group_tour_inclusive: 'Applies to entire group (up to 20 guests)',

      // Status Labels
      status_pending: 'Awaiting Guide Confirmation',
      status_waiting_payment: 'Awaiting 30% Deposit',
      status_confirmed: 'Confirmed & Scheduled',
      status_completed: 'Tour Completed',
      status_disputed: 'Dispute / Complaint',
      status_cancelled: 'Cancelled',

      // Payment Status
      payment_not_paid: 'Not Paid',
      payment_deposit_pending: 'Deposit Session Open',
      payment_deposit_paid: '30% Deposit Paid',
      payment_balance_pending: 'Balance Payment Pending',
      payment_balance_paid: '100% Fully Settled',
      payment_refunded: 'Refunded',

      // Common Actions
      common_login: 'Log in',
      common_register: 'Sign up',
      common_logout: 'Log out',
      common_cancel: 'Cancel',
      common_confirm: 'Confirm',
      common_save: 'Save changes',
      common_book_now: 'Book Now',
      common_explore: 'Explore Now',
      common_view_details: 'View Details',
      common_back: 'Back',
      common_filter: 'Filter',
      common_all: 'All',

      // Error and Notice Messages
      msg_invalid_login: 'Incorrect login credentials. Please verify and try again.',
      msg_dup_contact: 'Phone number or email is already registered.',
      msg_slot_unavailable_retry: 'This time slot is temporarily held or already booked. Please choose another slot.',
      msg_slot_unavailable: 'This time slot is no longer available.',
      msg_early_completion: 'Completion requests can only be sent after the booked shift has concluded.',
      msg_complaint_completed_blocked: 'This booking has passed the allowed dispute resolution window.',
      msg_min_payout: 'Minimum balance required to request a payout is 200,000 VND.',
      msg_slot_locked_or_booked: 'Time slot is held under the 15-minute lock or already confirmed.',
      msg_invalid_hourly_rate: 'Hourly rate must be between 80,000 and 500,000 VND/hour.',
      msg_invalid_fee_rate: 'Platform fee must be between 10% and 15%.',
      msg_no_guide_matched: 'No matching Guides found for your search criteria.',
      msg_no_guide_filter: 'No Guides match the current filter selection.',
      msg_profile_unavailable: 'Guide profile is currently unavailable.',
      msg_upload_doc_failed: 'Unable to upload document. Please retry with an image or PDF file.',
      msg_update_failed: 'Update failed. Please try again shortly.',
      msg_no_data_period: 'No statistics available for the selected period.',
      msg_no_penalty_or_refund: 'No penalty or refund is applicable for this case.',
      msg_profile_pending_kyc: 'Profile is undergoing identity verification by administrators.',
    },
  },
};

void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('lb_language') || 'vi',
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
