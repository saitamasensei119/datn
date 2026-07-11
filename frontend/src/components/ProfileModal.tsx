import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { profileApi } from "../services/api";
import { X, Key, Image as ImageIcon, CheckCircle, AlertCircle, Loader2, Mail, Phone, ShieldCheck, Upload } from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"contact" | "avatar" | "password">("contact");

  // Contact state (PII)
  const [personalEmail, setPersonalEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState("");
  const [contactError, setContactError] = useState("");

  // Avatar state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState("");
  const [avatarError, setAvatarError] = useState("");

  // Password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (isOpen && user) {
      setPersonalEmail(user.personalEmail || "");
      setPhoneNumber(user.phoneNumber || "");
      setContactSuccess("");
      setContactError("");
      setAvatarUrl(user.avatar || "");
      setAvatarSuccess("");
      setAvatarError("");
      setPasswordSuccess("");
      setPasswordError("");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    setContactSuccess("");
    setContactError("");

    try {
      await profileApi.updateContact({ personalEmail, phoneNumber });
      await refreshProfile();
      setContactSuccess("Cập nhật thông tin liên lạc thành công!");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data || err.message || "Cập nhật thông tin liên lạc thất bại";
      setContactError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setContactLoading(false);
    }
  };

  const handleUpdateAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    setAvatarLoading(true);
    setAvatarSuccess("");
    setAvatarError("");

    try {
      if (!avatarFile) {
        throw new Error("Vui lòng chọn một tệp hình ảnh để tải lên");
      }
      const formData = new FormData();
      formData.append("file", avatarFile);
      await profileApi.uploadAvatar(formData);
      await refreshProfile();
      setAvatarSuccess("Cập nhật ảnh đại diện thành công!");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data || err.message || "Cập nhật ảnh thất bại";
      setAvatarError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordSuccess("");
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu mới và xác nhận mật khẩu không trùng khớp");
      setPasswordLoading(false);
      return;
    }

    try {
      await profileApi.changePassword({
        oldPassword,
        newPassword,
        confirmPassword,
      });
      setPasswordSuccess("Đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data || err.message || "Đổi mật khẩu thất bại";
      setPasswordError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: "520px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>
              Cài Đặt Tài Khoản
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* User Short Info */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--card-border)",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            background: "rgba(18, 19, 26, 0.3)",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              overflow: "hidden",
              background: "linear-gradient(135deg, var(--primary), var(--accent))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 700,
              fontSize: "1.5rem",
              border: "2px solid var(--primary)",
            }}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt="Avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              user.email.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "1rem", color: "var(--text-primary)" }}>
              {user.fullName || user.email}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              {user.email}
            </div>
            <span
              className="badge"
              style={{
                marginTop: "0.35rem",
                fontSize: "0.7rem",
                backgroundColor: "var(--primary-light)",
                color: "var(--primary)",
              }}
            >
              VAI TRÒ: {user.role}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--card-border)",
            background: "var(--bg-secondary)",
          }}
        >
          <button
            onClick={() => setActiveTab("contact")}
            style={{
              flex: 1,
              padding: "0.85rem",
              border: "none",
              background: activeTab === "contact" ? "var(--bg-tertiary)" : "transparent",
              color: activeTab === "contact" ? "var(--primary)" : "var(--text-secondary)",
              fontWeight: activeTab === "contact" ? 600 : 500,
              cursor: "pointer",
              borderBottom: activeTab === "contact" ? "2px solid var(--primary)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "all 0.2s",
              fontSize: "0.9rem",
            }}
          >
            <ShieldCheck size={18} />
            Liên Lạc & OTP
          </button>
          <button
            onClick={() => setActiveTab("avatar")}
            style={{
              flex: 1,
              padding: "0.85rem",
              border: "none",
              background: activeTab === "avatar" ? "var(--bg-tertiary)" : "transparent",
              color: activeTab === "avatar" ? "var(--primary)" : "var(--text-secondary)",
              fontWeight: activeTab === "avatar" ? 600 : 500,
              cursor: "pointer",
              borderBottom: activeTab === "avatar" ? "2px solid var(--primary)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "all 0.2s",
              fontSize: "0.9rem",
            }}
          >
            <ImageIcon size={18} />
            Ảnh Đại Diện
          </button>
          <button
            onClick={() => setActiveTab("password")}
            style={{
              flex: 1,
              padding: "0.85rem",
              border: "none",
              background: activeTab === "password" ? "var(--bg-tertiary)" : "transparent",
              color: activeTab === "password" ? "var(--primary)" : "var(--text-secondary)",
              fontWeight: activeTab === "password" ? 600 : 500,
              cursor: "pointer",
              borderBottom: activeTab === "password" ? "2px solid var(--primary)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "all 0.2s",
              fontSize: "0.9rem",
            }}
          >
            <Key size={18} />
            Đổi Mật Khẩu
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ maxHeight: "420px", overflowY: "auto" }}>
          {activeTab === "contact" && (
            <form onSubmit={handleUpdateContact}>
              {contactSuccess && (
                <div className="alert alert-success">
                  <CheckCircle size={18} />
                  <span>{contactSuccess}</span>
                </div>
              )}
              {contactError && (
                <div className="alert alert-danger">
                  <AlertCircle size={18} />
                  <span>{contactError}</span>
                </div>
              )}

              <div
                style={{
                  padding: "0.85rem",
                  background: "rgba(59, 130, 246, 0.1)",
                  borderLeft: "3px solid var(--primary)",
                  borderRadius: "4px",
                  marginBottom: "1.25rem",
                  fontSize: "0.85rem",
                  color: "var(--text-primary)",
                  lineHeight: "1.4",
                }}
              >
                <b>Ghi chú bảo mật:</b> Email cá nhân và Số điện thoại dưới đây là thông tin định danh dùng để nhận mã <b>OTP khôi phục mật khẩu</b> khi bạn quên mật khẩu. Vui lòng điền đúng email bạn đang sử dụng.
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Mail size={16} style={{ color: "var(--primary)" }} /> Email Cá Nhân (Nhận OTP)
                </label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="email_canhan@gmail.com"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Phone size={16} style={{ color: "var(--primary)" }} /> Số Điện Thoại Cá Nhân
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ví dụ: 0912345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                  marginTop: "1.5rem",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={contactLoading}
                >
                  {contactLoading && <Loader2 size={16} className="spinner" />}
                  Lưu Thông Tin Liên Lạc
                </button>
              </div>
            </form>
          )}

          {activeTab === "avatar" && (
            <form onSubmit={handleUpdateAvatar}>
              {avatarSuccess && (
                <div className="alert alert-success">
                  <CheckCircle size={18} />
                  <span>{avatarSuccess}</span>
                </div>
              )}
              {avatarError && (
                <div className="alert alert-danger">
                  <AlertCircle size={18} />
                  <span>{avatarError}</span>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                <label className="form-label" style={{ fontSize: "0.9rem", marginBottom: "0.5rem", display: "block" }}>
                  Chọn tệp hình ảnh (JPG, PNG, WEBP, GIF - Tối đa 5MB)
                </label>
                <div
                  style={{
                    border: "2px dashed var(--primary)",
                    borderRadius: "10px",
                    padding: "1.5rem",
                    textAlign: "center",
                    background: "rgba(59, 130, 246, 0.03)",
                    cursor: "pointer",
                  }}
                  onClick={() => document.getElementById("modal-avatar-file-input")?.click()}
                >
                  <input
                    id="modal-avatar-file-input"
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/gif"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          setAvatarError("Dung lượng tệp không được vượt quá 5MB!");
                          return;
                        }
                        setAvatarError("");
                        setAvatarFile(file);
                        setAvatarUrl(URL.createObjectURL(file));
                      }
                    }}
                  />
                  <Upload size={28} color="var(--primary)" style={{ marginBottom: "0.5rem" }} />
                  <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                    {avatarFile ? avatarFile.name : "Nhấp để chọn tệp từ máy tính"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {avatarFile ? `Dung lượng: ${(avatarFile.size / 1024 / 1024).toFixed(2)} MB` : "Được bảo vệ bằng 4 lớp kiểm tra nhị phân"}
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              {avatarUrl && (
                <div
                  style={{
                    marginTop: "1rem",
                    textAlign: "center",
                    padding: "1rem",
                    background: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "var(--radius-md)",
                    border: "1px dashed var(--card-border)",
                  }}
                >
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                    XEM TRƯỚC HÌNH ẢNH
                  </div>
                  <img
                    src={avatarUrl}
                    alt="Preview"
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid var(--primary)",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                    }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                  marginTop: "1.5rem",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={avatarLoading}
                >
                  {avatarLoading && <Loader2 size={16} className="spinner" />}
                  Tải Lên & Lưu Ảnh
                </button>
              </div>
            </form>
          )}

          {activeTab === "password" && (
            <form onSubmit={handleUpdatePassword}>
              {passwordSuccess && (
                <div className="alert alert-success">
                  <CheckCircle size={18} />
                  <span>{passwordSuccess}</span>
                </div>
              )}
              {passwordError && (
                <div className="alert alert-danger">
                  <AlertCircle size={18} />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Nhập mật khẩu hiện tại"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mật khẩu mới (ít nhất 6 ký tự)</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                  marginTop: "1.5rem",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={passwordLoading}
                >
                  {passwordLoading && <Loader2 size={16} className="spinner" />}
                  Cập Nhật Mật Khẩu
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
