import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { profileApi } from "../services/api";
import { X, Key, Image as ImageIcon, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"avatar" | "password">("avatar");

  // Avatar state
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

  const handleUpdateAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    setAvatarLoading(true);
    setAvatarSuccess("");
    setAvatarError("");

    try {
      await profileApi.changeAvatar({ avatarUrl });
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
            }}
          >
            <Key size={18} />
            Đổi Mật Khẩu
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ maxHeight: "400px", overflowY: "auto" }}>
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

              <div className="form-group">
                <label className="form-label">URL Ảnh đại diện mới (hoặc Base64)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  required
                />
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
                    XEM TRƯỚC (LIVE PREVIEW)
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
                  Lưu Ảnh Đại Diện
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
