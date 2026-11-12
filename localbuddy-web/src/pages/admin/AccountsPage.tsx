// pages/admin/AccountsPage.tsx
// Chuẩn thiết kế tokens: #EB5B38, #272A2D, #E6E4DC, #347CCB

import React, { useState, useEffect } from 'react';
import {
  Users,
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  Search,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useBookingContext } from '../../context/BookingContext';
import { formatDateVN } from '../../utils/time';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { User, UserRole } from '../../types';

export const AccountsPage: React.FC = () => {
  const {
    allUsers,
    getGuideById,
    toggleUserLock,
    revokeGuideVerification,
    addVerifiedGuide,
  } = useBookingContext();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmUser, setConfirmUser] = useState<User | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  const filteredUsers = allUsers.filter((u) => {
    const matchesRole = roleFilter === 'ALL' ? true : u.role === roleFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  const handleConfirmToggleLock = () => {
    if (!confirmUser) return;
    toggleUserLock(confirmUser.id);
    showToast(
      confirmUser.isLocked
        ? `Đã mở khóa tài khoản ${confirmUser.fullName} .`
        : `Đã khóa tài khoản ${confirmUser.fullName} do vi phạm quy chuẩn nền tảng .`,
      confirmUser.isLocked ? 'success' : 'info'
    );
    setConfirmUser(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-white rounded-2xl border border-[#E7E5E4]" />
        <div className="h-96 bg-white rounded-2xl border border-[#E7E5E4]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#347CCB] bg-sky-50 border border-sky-200 px-3 py-1 rounded-full mb-2">
            <Users className="w-3.5 h-3.5" /> Quản trị Người dùng & Kỷ luật 
          </span>
          <h1 className="text-2xl font-extrabold text-[#1C1917]">
            Quản lý Tài khoản & Theo dõi Vi phạm
          </h1>
          <p className="text-sm text-[#78716C] mt-0.5">
            Giám sát số lần vi phạm (`soLanViPham`), khóa/mở khóa tài khoản và thu hồi huy hiệu xác minh HDV.
          </p>
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên, email, SĐT, mã..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-[#E7E5E4] text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#347CCB]"
          />
        </div>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: 'ALL', label: `Tất cả tài khoản (${allUsers.length})` },
            {
              key: 'tourist',
              label: `Du khách (${allUsers.filter((u) => u.role === 'tourist').length})`,
            },
            {
              key: 'guide',
              label: `Hướng dẫn viên (${allUsers.filter((u) => u.role === 'guide').length})`,
            },
            {
              key: 'admin',
              label: `Quản trị viên (${allUsers.filter((u) => u.role === 'admin').length})`,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setRoleFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              roleFilter === tab.key
                ? 'bg-[#EB5B38] text-white shadow-xs'
                : 'bg-white text-[#78716C] hover:bg-[#F3F1EC] border border-[#E7E5E4]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F3F1EC] border-b border-[#E7E5E4] text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
                <th className="py-3.5 px-4">Người dùng</th>
                <th className="py-3.5 px-4">Vai trò</th>
                <th className="py-3.5 px-4">Trạng thái KYC (Nếu là HDV)</th>
                <th className="py-3.5 px-4">Chỉ số Vi phạm (`soLanViPham`)</th>
                <th className="py-3.5 px-4">Trạng thái TK</th>
                <th className="py-3.5 px-4 text-right">Thao tác quản trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5E4] text-sm">
              {filteredUsers.map((user) => {
                const guideData = user.role === 'guide' ? getGuideById(user.id) : undefined;
                return (
                  <tr key={user.id} className="hover:bg-[#F3F1EC]/50 transition-colors">
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatarUrl}
                          alt={user.fullName}
                          className="w-10 h-10 rounded-full object-cover border border-[#E7E5E4]"
                        />
                        <div>
                          <div className="font-extrabold text-[#1C1917]">{user.fullName}</div>
                          <div className="text-xs text-[#78716C]">
                            {user.email} • {user.phone}
                          </div>
                          <div className="text-[11px] text-[#78716C] mt-0.5">
                            Mã: {user.id} • Tham gia: {formatDateVN(user.createdAt.slice(0, 10))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 align-top">
                      {user.role === 'tourist' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F3F1EC] text-[#1C1917] border border-[#E7E5E4]">
                          Du khách ({user.nationality || 'Việt Nam'})
                        </span>
                      )}
                      {user.role === 'guide' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-[#347CCB] border border-sky-200">
                          Hướng dẫn viên
                        </span>
                      )}
                      {user.role === 'admin' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEEDDC] text-[#D12B79] border border-[#F1DEC9]">
                          Quản trị viên
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 align-top">
                      {user.role === 'guide' && guideData ? (
                        <div className="space-y-1">
                          {guideData.profile.isVerified ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck className="w-3.5 h-3.5" /> Đã xác minh KYC
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              KYC: {guideData.profile.kycStatus}
                            </span>
                          )}
                          <div>
                            {guideData.profile.isVerified ? (
                              <button
                                type="button"
                                onClick={() => {
                                  revokeGuideVerification(user.id);
                                  showToast(
                                    `Đã thu hồi trạng thái xác minh KYC của HDV ${user.fullName}.`,
                                    'info'
                                  );
                                }}
                                className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                              >
                                Thu hồi xác minh KYC
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  addVerifiedGuide(user.id);
                                  showToast(
                                    `Đã cấp xác minh KYC cho HDV ${user.fullName}.`,
                                    'success'
                                  );
                                }}
                                className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                              >
                                Cấp xác minh nhanh
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-[#78716C]">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4 align-top">
                      {user.violationCount === 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 0 vi phạm (Tốt)
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                              user.violationCount >= 2
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" /> {user.violationCount} lần vi phạm
                          </span>
                          {user.violationCount >= 2 && (
                            <div className="text-[11px] font-bold text-red-600">
                              Đề xuất khóa tài khoản 
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 align-top">
                      {user.isLocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                          <Lock className="w-3.5 h-3.5" /> Đang bị khóa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Hoạt động
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                      {user.role !== 'admin' ? (
                        <Button
                          variant={user.isLocked ? 'primary' : 'danger'}
                          size="sm"
                          onClick={() => setConfirmUser(user)}
                          icon={
                            user.isLocked ? (
                              <Unlock className="w-3.5 h-3.5" />
                            ) : (
                              <Lock className="w-3.5 h-3.5" />
                            )
                          }
                        >
                          {user.isLocked ? 'Mở khóa TK' : 'Khóa tài khoản'}
                        </Button>
                      ) : (
                        <span className="text-xs text-[#78716C]">Quản trị hệ thống</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmUser && (
        <Modal
          isOpen={!!confirmUser}
          onClose={() => setConfirmUser(null)}
          title={
            confirmUser.isLocked
              ? `Mở khóa tài khoản: ${confirmUser.fullName}`
              : `Xác nhận khóa tài khoản: ${confirmUser.fullName} `
          }
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#F3F1EC] border border-[#E7E5E4] text-sm text-[#1C1917] space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#1C1917]">
                <ShieldAlert className="w-5 h-5 text-[#EB5B38]" />
                {confirmUser.isLocked
                  ? 'Khôi phục quyền đăng nhập và giao dịch cho người dùng này?'
                  : 'Tài khoản bị khóa sẽ lập tức mất quyền đăng nhập và ẩn khỏi kết quả tìm kiếm.'}
              </div>
              <p className="text-xs text-[#78716C]">
                Người dùng: <strong>{confirmUser.fullName}</strong> ({confirmUser.email}) • Số lần vi
                phạm ghi nhận: <strong>{confirmUser.violationCount} lần</strong>.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmUser(null)}>
                Hủy
              </Button>
              <Button
                variant={confirmUser.isLocked ? 'primary' : 'danger'}
                onClick={handleConfirmToggleLock}
              >
                {confirmUser.isLocked ? 'Xác nhận Mở khóa' : 'Xác nhận Khóa tài khoản'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
