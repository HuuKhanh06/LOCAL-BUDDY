import React, { useState } from 'react';
import {
  ShieldCheck,
  Clock,
  XCircle,
  AlertTriangle,
  FileCheck2,
  Upload,
  CheckCircle2,
  Building2,
  CreditCard,
  Award,
} from 'lucide-react';
import { useBookingContext } from '../../context/BookingContext';
import { formatDateTimeVN } from '../../utils/time';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { KycDocument } from '../../types';

export const KycSubmissionPage: React.FC = () => {
  const { currentUser, getGuideById, kycRecords, submitKycApplication, uploadFile } =
    useBookingContext();
  const { showToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadFile('kyc-documents', file);
      if (res.ok) {
        setter(res.url);
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const guideId = currentUser?.role === 'guide' ? currentUser.id : 'u-guide-1';
  const guideData = getGuideById(guideId);
  const existingRecord = kycRecords.find((r) => r.guideId === guideId);

  const [idNumber, setIdNumber] = useState(existingRecord?.idNumber || '048096001284');
  const [bankName, setBankName] = useState(
    existingRecord?.bankName || guideData?.profile.bankName || 'Vietcombank – CN Đà Nẵng'
  );
  const [bankAccountNumber, setBankAccountNumber] = useState(
    existingRecord?.bankAccountNumber || guideData?.profile.bankAccountNumber || '0041000389214'
  );
  const [bankAccountHolder, setBankAccountHolder] = useState(
    existingRecord?.bankAccountHolder ||
      guideData?.profile.bankAccountHolder ||
      (guideData?.user.fullName || 'NGUYEN HUU KHANH').toUpperCase()
  );

  const [cccdFrontUrl, setCccdFrontUrl] = useState(
    existingRecord?.documents.find((d) => d.docType === 'CCCD_FRONT')?.url ||
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80'
  );
  const [cccdBackUrl, setCccdBackUrl] = useState(
    existingRecord?.documents.find((d) => d.docType === 'CCCD_BACK')?.url ||
      'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80'
  );
  const [guideCardUrl, setGuideCardUrl] = useState(
    existingRecord?.documents.find((d) => d.docType === 'GUIDE_CARD')?.url ||
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80'
  );
  const [langCertUrl, setLangCertUrl] = useState(
    existingRecord?.documents.find((d) => d.docType === 'LANGUAGE_CERT')?.url ||
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80'
  );

  const [formError, setFormError] = useState('');

  const kycStatus = guideData?.profile.kycStatus || existingRecord?.status || 'NOT_SUBMITTED';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!idNumber.trim() || idNumber.trim().length < 9) {
      setFormError('Vui lòng nhập số CCCD/CMND hợp lệ (từ 9 đến 12 chữ số).');
      return;
    }
    if (!bankName.trim() || !bankAccountNumber.trim() || !bankAccountHolder.trim()) {
      setFormError('Vui lòng điền đầy đủ thông tin tài khoản ngân hàng nhận thanh toán.');
      return;
    }
    if (!cccdFrontUrl.trim() || !cccdBackUrl.trim() || !guideCardUrl.trim()) {
      setFormError('Vui lòng đính kèm đủ ảnh CCCD mặt trước, mặt sau và Thẻ HDV / Chứng chỉ.');
      return;
    }

    const docs: KycDocument[] = [
      {
        id: `doc-${Date.now()}-1`,
        docType: 'CCCD_FRONT',
        name: 'CCCD gắn chip (Mặt trước)',
        url: cccdFrontUrl.trim(),
      },
      {
        id: `doc-${Date.now()}-2`,
        docType: 'CCCD_BACK',
        name: 'CCCD gắn chip (Mặt sau)',
        url: cccdBackUrl.trim(),
      },
      {
        id: `doc-${Date.now()}-3`,
        docType: 'GUIDE_CARD',
        name: 'Thẻ Hướng dẫn viên Du lịch / Xác nhận cộng tác viên bản địa',
        url: guideCardUrl.trim(),
      },
    ];

    if (langCertUrl.trim()) {
      docs.push({
        id: `doc-${Date.now()}-4`,
        docType: 'LANGUAGE_CERT',
        name: 'Chứng chỉ Ngoại ngữ Quốc tế (IELTS / TOPIK / JLPT)',
        url: langCertUrl.trim(),
      });
    }

    const res = submitKycApplication({
      guideId,
      idNumber: idNumber.trim(),
      bankName: bankName.trim(),
      bankAccountNumber: bankAccountNumber.trim(),
      bankAccountHolder: bankAccountHolder.trim().toUpperCase(),
      documents: docs,
    });

    if (res.ok) {
      showToast(res.message, 'success');
    } else {
      setFormError(res.message);
      showToast(res.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#118B93] bg-[#E6F9FA] px-3 py-1 rounded-full mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Xác minh danh tính KYC 
          </span>
          <h1 className="text-2xl font-extrabold text-[#1A0A0F]">
            Hồ sơ định danh KYC & Tài khoản nhận tiền
          </h1>
          <p className="text-sm text-[#525266] mt-0.5">
            Chỉ Hướng dẫn viên đã được Admin phê duyệt KYC (`APPROVED`) mới hiển thị công khai và được mở lịch rảnh nhận khách.
          </p>
        </div>
      </div>

      {/* Status Banner */}
      {kycStatus === 'APPROVED' && (
        <div className="bg-[#E6F7F0] border border-[#B2E5D0] rounded-[12px] p-5 flex items-start gap-4">
          <CheckCircle2 className="w-6 h-6 text-[#1B8A5A] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-[#146C43]">
              Hồ sơ KYC đã được phê duyệt (APPROVED)
            </h2>
            <p className="text-xs text-[#146C43]/90">
              Tài khoản của bạn đã gắn huy hiệu <strong>Đã xác minh KYC Đà Nẵng</strong>. Hồ sơ đang hiển thị công khai trên trang tìm kiếm Du khách và bạn có toàn quyền thiết lập lịch rảnh .
            </p>
            {existingRecord?.reviewedAt && (
              <p className="text-xs text-[#146C43]/80 font-medium pt-1">
                Phê duyệt lúc: {formatDateTimeVN(existingRecord.reviewedAt)} • Ghi chú Admin:{' '}
                {existingRecord.reviewNote || 'Giấy tờ hợp lệ'}
              </p>
            )}
          </div>
        </div>
      )}

      {kycStatus === 'PENDING' && (
        <div className="bg-[#FFF5E5] border border-[#F8D39A] rounded-[12px] p-5 flex items-start gap-4">
          <Clock className="w-6 h-6 text-[#D9820B] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-[#9A5B06]">
              Hồ sơ KYC đang chờ Admin thẩm định (PENDING)
            </h2>
            <p className="text-xs text-[#9A5B06]/90">
              Hồ sơ định danh của bạn đã được gửi lúc{' '}
              {existingRecord ? formatDateTimeVN(existingRecord.submittedAt) : 'vừa xong'}. Trong thời gian chờ duyệt, hồ sơ chưa hiển thị trên kết quả tìm kiếm công khai . Bạn vẫn có thể cập nhật lại giấy tờ bên dưới nếu cần bổ sung.
            </p>
          </div>
        </div>
      )}

      {kycStatus === 'REJECTED' && (
        <div className="bg-[#FDECEC] border border-[#F5B5B5] rounded-[12px] p-5 flex items-start gap-4">
          <XCircle className="w-6 h-6 text-[#C93B3B] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-[#A62626]">
              Hồ sơ KYC bị từ chối — Cần bổ sung lại (REJECTED)
            </h2>
            <p className="text-xs text-[#A62626]">
              Lý do từ Admin:{' '}
              <strong>
                {existingRecord?.reviewNote ||
                  'Ảnh chụp giấy tờ bị mờ hoặc thông tin không trùng khớp. Vui lòng cập nhật lại.'}
              </strong>
            </p>
          </div>
        </div>
      )}

      {kycStatus === 'NOT_SUBMITTED' && (
        <div className="bg-[#FDF7F9] border border-[#E8CED5] rounded-[12px] p-5 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-[#1A0A0F] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-[#1A0A0F]">
              Bạn chưa nộp hồ sơ xác minh danh tính KYC
            </h2>
            <p className="text-xs text-[#525266]">
              Vui lòng cung cấp CCCD gắn chip, Thẻ HDV hoặc chứng chỉ ngoại ngữ để kích hoạt tài khoản nhận khách tại Đà Nẵng.
            </p>
          </div>
        </div>
      )}

      {/* KYC Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Personal ID & Bank Info + Document URLs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[12px] border border-[#E8CED5] p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E8CED5] pb-3">
              <CreditCard className="w-5 h-5 text-[#1A0A0F]" />
              <h2 className="text-base font-extrabold text-[#1A0A0F]">
                1. Thông tin định danh & Ngân hàng đối soát
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Họ và tên Hướng dẫn viên"
                value={guideData?.user.fullName || currentUser?.fullName || ''}
                disabled
              />
              <Input
                label="Số CCCD / Định danh cá nhân (12 số) *"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="VD: 048096001284"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <Input
                label="Ngân hàng nhận thanh toán *"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="VD: Vietcombank – CN Đà Nẵng"
                required
              />
              <Input
                label="Số tài khoản ngân hàng *"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="VD: 0041000389214"
                required
              />
              <Input
                label="Chủ tài khoản (Không dấu) *"
                value={bankAccountHolder}
                onChange={(e) => setBankAccountHolder(e.target.value.toUpperCase())}
                placeholder="VD: NGUYEN HUU KHANH"
                required
              />
            </div>
          </div>

          <div className="bg-white rounded-[12px] border border-[#E8CED5] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8CED5] pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#1A0A0F]" />
                <h2 className="text-base font-extrabold text-[#1A0A0F]">
                  2. Tài liệu chứng thực đính kèm (Ảnh chụp rõ nét)
                </h2>
              </div>
              <span className="text-xs font-semibold text-[#525266]">Hỗ trợ JPG, PNG, URL</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Input
                  label="Ảnh CCCD gắn chip — Mặt trước *"
                  value={cccdFrontUrl}
                  onChange={(e) => setCccdFrontUrl(e.target.value)}
                  placeholder="Nhập đường dẫn hoặc tải tệp ảnh CCCD mặt trước..."
                  required
                />
                <label className="inline-flex items-center gap-1.5 text-xs font-bold text-[#118B93] hover:text-[#1A0A0F] cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Đang tải tệp...' : 'Tải tệp ảnh từ máy (Supabase Storage: kyc-documents)'}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => void handleFileUpload(e, setCccdFrontUrl)}
                  />
                </label>
              </div>

              <div className="space-y-1.5">
                <Input
                  label="Ảnh CCCD gắn chip — Mặt sau *"
                  value={cccdBackUrl}
                  onChange={(e) => setCccdBackUrl(e.target.value)}
                  placeholder="Nhập đường dẫn hoặc tải tệp ảnh CCCD mặt sau..."
                  required
                />
                <label className="inline-flex items-center gap-1.5 text-xs font-bold text-[#118B93] hover:text-[#1A0A0F] cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Tải tệp ảnh CCCD mặt sau từ máy</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => void handleFileUpload(e, setCccdBackUrl)}
                  />
                </label>
              </div>

              <div className="space-y-1.5">
                <Input
                  label="Thẻ Hướng dẫn viên Du lịch / Giấy xác nhận CTV Du lịch Đà Nẵng *"
                  value={guideCardUrl}
                  onChange={(e) => setGuideCardUrl(e.target.value)}
                  placeholder="Nhập đường dẫn hoặc tải tệp ảnh Thẻ HDV..."
                  required
                />
                <label className="inline-flex items-center gap-1.5 text-xs font-bold text-[#118B93] hover:text-[#1A0A0F] cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Tải tệp ảnh Thẻ HDV / Xác nhận CTV từ máy</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => void handleFileUpload(e, setGuideCardUrl)}
                  />
                </label>
              </div>

              <div className="space-y-1.5">
                <Input
                  label="Chứng chỉ Ngoại ngữ (IELTS, TOPIK, JLPT, HSK — Khuyến khích)"
                  value={langCertUrl}
                  onChange={(e) => setLangCertUrl(e.target.value)}
                  placeholder="Nhập đường dẫn hoặc tải tệp chứng chỉ ngoại ngữ..."
                />
                <label className="inline-flex items-center gap-1.5 text-xs font-bold text-[#118B93] hover:text-[#1A0A0F] cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Tải tệp Chứng chỉ ngoại ngữ từ máy</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => void handleFileUpload(e, setLangCertUrl)}
                  />
                </label>
              </div>
            </div>

            {formError && (
              <div className="p-3 rounded-[10px] bg-[#FDECEC] border border-[#F5B5B5] text-xs font-semibold text-[#A62626]">
                {formError}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" icon={<Upload className="w-4 h-4" />}>
                {kycStatus === 'NOT_SUBMITTED'
                  ? 'Nộp hồ sơ xác minh KYC '
                  : 'Cập nhật & Gửi duyệt lại hồ sơ KYC'}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Document Preview */}
        <div className="space-y-4">
          <div className="bg-white rounded-[12px] border border-[#E8CED5] p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-[#1A0A0F] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#118B93]" /> Xem trước hồ sơ đính kèm
            </h3>

            <div className="space-y-3">
              <div className="border border-[#E8CED5] rounded-[10px] overflow-hidden">
                <div className="bg-[#FDF7F9] px-3 py-1.5 text-xs font-bold text-[#1C1C28] border-b border-[#E8CED5]">
                  CCCD Mặt trước
                </div>
                {cccdFrontUrl ? (
                  <img
                    src={cccdFrontUrl}
                    alt="CCCD Mặt trước"
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div className="h-28 flex items-center justify-center text-xs text-[#6E7085]">
                    Chưa có ảnh
                  </div>
                )}
              </div>

              <div className="border border-[#E8CED5] rounded-[10px] overflow-hidden">
                <div className="bg-[#FDF7F9] px-3 py-1.5 text-xs font-bold text-[#1C1C28] border-b border-[#E8CED5]">
                  Thẻ HDV / Chứng nhận bản địa
                </div>
                {guideCardUrl ? (
                  <img
                    src={guideCardUrl}
                    alt="Thẻ HDV"
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div className="h-28 flex items-center justify-center text-xs text-[#6E7085]">
                    Chưa có ảnh
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#F6E6EA]/60 rounded-[10px] p-3.5 text-xs text-[#525266] space-y-1.5">
              <div className="font-bold text-[#1A0A0F] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Cam kết bảo mật dữ liệu
              </div>
              <p>
                Giấy tờ tùy thân của bạn được mã hóa và chỉ phục vụ mục đích thẩm định định danh Hướng dẫn viên bản địa Đà Nẵng bởi bộ phận Admin LocalBuddy .
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
