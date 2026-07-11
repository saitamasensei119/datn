import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { profileApi } from "../services/api";
import { 
  Mail, 
  Phone, 
  ShieldCheck, 
  Key, 
  Image as ImageIcon, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Award,
  Sparkles,
  Upload
} from "lucide-react";

const ProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [activeSection, setActiveSection] = useState<"contact" | "password" | "avatar">("contact");

  // Contact state (PII)
  const [personalEmail, setPersonalEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState("");
  const [contactError, setContactError] = useState("");

  // Password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Avatar state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [imgPreviewError, setImgPreviewError] = useState(false);

  useEffect(() => {
    if (user) {
      setPersonalEmail(user.personalEmail || "");
      setPhoneNumber(user.phoneNumber || "");
      setAvatarUrl(user.avatar || "");
    }
  }, [user]);

  if (!user) return null;

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
      setPasswordSuccess("Đổi mật khẩu thành công! Mật khẩu mới đã được áp dụng.");
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

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header Banner */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(147, 51, 234, 0.15))",
          border: "1px solid rgba(59, 130, 246, 0.3)",
          padding: "2rem",
          borderRadius: "16px",
          display: "flex",
          alignItems: "center",
          gap: "1.75rem",
          marginBottom: "2rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "88px",
            height: "88px",
            borderRadius: "50%",
            overflow: "hidden",
            background: "linear-gradient(135deg, var(--primary), #9333ea)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 700,
            fontSize: "2.25rem",
            border: "3px solid white",
            boxShadow: "0 8px 24px rgba(59, 130, 246, 0.3)",
            flexShrink: 0,
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

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {user.fullName || user.email}
            </h2>
            <span
              className="badge"
              style={{
                backgroundColor: "var(--primary)",
                color: "white",
                padding: "0.35rem 0.75rem",
                borderRadius: "20px",
                fontSize: "0.75rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <Award size={14} /> VAI TRÒ: {user.role}
            </span>
          </div>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "6px" }}>
            <Mail size={16} style={{ color: "var(--primary)" }} /> Email trường cấp: <b style={{ color: "var(--text-primary)" }}>{user.email}</b>
          </p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: "1.5rem" }}>
        {/* Navigation Sidebar */}
        <div className="card" style={{ padding: "1rem", borderRadius: "12px", height: "fit-content" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.75rem", paddingLeft: "0.5rem" }}>
            Danh Mục Quản Lý
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <button
              onClick={() => setActiveSection("contact")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "0.85rem 1rem",
                borderRadius: "8px",
                border: "none",
                background: activeSection === "contact" ? "var(--primary)" : "transparent",
                color: activeSection === "contact" ? "white" : "var(--text-secondary)",
                fontWeight: activeSection === "contact" ? 600 : 500,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s",
                fontSize: "0.95rem"
              }}
            >
              <ShieldCheck size={18} />
              Thông Tin Liên Lạc (OTP)
            </button>

            <button
              onClick={() => setActiveSection("password")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "0.85rem 1rem",
                borderRadius: "8px",
                border: "none",
                background: activeSection === "password" ? "var(--primary)" : "transparent",
                color: activeSection === "password" ? "white" : "var(--text-secondary)",
                fontWeight: activeSection === "password" ? 600 : 500,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s",
                fontSize: "0.95rem"
              }}
            >
              <Key size={18} />
              Đổi Mật Khẩu
            </button>

            <button
              onClick={() => setActiveSection("avatar")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "0.85rem 1rem",
                borderRadius: "8px",
                border: "none",
                background: activeSection === "avatar" ? "var(--primary)" : "transparent",
                color: activeSection === "avatar" ? "white" : "var(--text-secondary)",
                fontWeight: activeSection === "avatar" ? 600 : 500,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s",
                fontSize: "0.95rem"
              }}
            >
              <ImageIcon size={18} />
              Cập Nhật Ảnh Đại Diện
            </button>
          </div>
        </div>

        {/* Section Content Area */}
        <div className="card" style={{ padding: "2rem", borderRadius: "12px" }}>
          {/* Section 1: Contact Info (PII) */}
          {activeSection === "contact" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--card-border)", paddingBottom: "1rem" }}>
                <ShieldCheck size={24} style={{ color: "var(--primary)" }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--text-primary)" }}>
                    Thiết Lập Thông Tin Liên Lạc & Khôi Phục Mật Khẩu
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Quản lý email cá nhân nhận mã OTP khi bạn quên hoặc cần đặt lại mật khẩu.
                  </p>
                </div>
              </div>

              {contactSuccess && (
                <div className="alert alert-success" style={{ marginBottom: "1.5rem" }}>
                  <CheckCircle size={18} />
                  <span>{contactSuccess}</span>
                </div>
              )}
              {contactError && (
                <div className="alert alert-danger" style={{ marginBottom: "1.5rem" }}>
                  <AlertCircle size={18} />
                  <span>{contactError}</span>
                </div>
              )}

              <div
                style={{
                  padding: "1rem 1.25rem",
                  background: "rgba(59, 130, 246, 0.08)",
                  border: "1px solid rgba(59, 130, 246, 0.25)",
                  borderRadius: "8px",
                  marginBottom: "1.75rem",
                  fontSize: "0.9rem",
                  color: "var(--text-primary)",
                  lineHeight: "1.5",
                  display: "flex",
                  gap: "12px"
                }}
              >
                <Sparkles size={20} style={{ color: "var(--primary)", flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <b>Ghi chú về bảo mật:</b><b>Email cá nhân</b> dưới đây để hệ thống gửi mã xác thực OTP 6 chữ số khi thực hiện khôi phục mật khẩu.
                </div>
              </div>

              <form onSubmit={handleUpdateContact}>
                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem" }}>
                    <Mail size={18} style={{ color: "var(--primary)" }} /> Email Cá Nhân (Nhận Mã OTP Khôi Phục)
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Ví dụ: nguyen.van.a@gmail.com"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    style={{ padding: "0.75rem" }}
                    required
                  />
                  <small style={{ color: "var(--text-muted)", marginTop: "6px", display: "block" }}>
                    Mã OTP đặt lại mật khẩu sẽ được gửi trực tiếp tới hòm thư này.
                  </small>
                </div>

                <div className="form-group" style={{ marginBottom: "2rem" }}>
                  <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem" }}>
                    <Phone size={18} style={{ color: "var(--primary)" }} /> Số Điện Thoại Liên Lạc
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ví dụ: 0912345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    style={{ padding: "0.75rem" }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: "0.75rem 1.5rem", fontSize: "0.95rem", display: "inline-flex", alignItems: "center", gap: "8px" }}
                  disabled={contactLoading}
                >
                  {contactLoading && <Loader2 size={18} className="spinner" />}
                  Lưu Thông Tin Liên Lạc
                </button>
              </form>
            </div>
          )}

          {/* Section 2: Password */}
          {activeSection === "password" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--card-border)", paddingBottom: "1rem" }}>
                <Key size={24} style={{ color: "var(--primary)" }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--text-primary)" }}>
                    Đổi Mật Khẩu Bảo Mật Tài Khoản
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Đảm bảo mật khẩu dài ít nhất 6 ký tự và không chia sẻ với bất kỳ ai.
                  </p>
                </div>
              </div>

              {passwordSuccess && (
                <div className="alert alert-success" style={{ marginBottom: "1.5rem" }}>
                  <CheckCircle size={18} />
                  <span>{passwordSuccess}</span>
                </div>
              )}
              {passwordError && (
                <div className="alert alert-danger" style={{ marginBottom: "1.5rem" }}>
                  <AlertCircle size={18} />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword}>
                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <label className="form-label" style={{ fontSize: "0.95rem" }}>Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Nhập mật khẩu bạn đang sử dụng"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    style={{ padding: "0.75rem" }}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <label className="form-label" style={{ fontSize: "0.95rem" }}>Mật khẩu mới</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Ít nhất 6 ký tự"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ padding: "0.75rem" }}
                    required
                    minLength={6}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "2rem" }}>
                  <label className="form-label" style={{ fontSize: "0.95rem" }}>Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ padding: "0.75rem" }}
                    required
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: "0.75rem 1.5rem", fontSize: "0.95rem", display: "inline-flex", alignItems: "center", gap: "8px" }}
                  disabled={passwordLoading}
                >
                  {passwordLoading && <Loader2 size={18} className="spinner" />}
                  Cập Nhật Mật Khẩu
                </button>
              </form>
            </div>
          )}

          {/* Section 3: Avatar */}
          {activeSection === "avatar" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--card-border)", paddingBottom: "1rem" }}>
                <ImageIcon size={24} style={{ color: "var(--primary)" }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--text-primary)" }}>
                    Cập Nhật Ảnh Đại Diện
                  </h3>
                  {/* <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Dùng đường dẫn URL hình ảnh để thay đổi hình đại diện hiển thị toàn hệ thống.
                  </p> */}
                </div>
              </div>

              {avatarSuccess && (
                <div className="alert alert-success" style={{ marginBottom: "1.5rem" }}>
                  <CheckCircle size={18} />
                  <span>{avatarSuccess}</span>
                </div>
              )}
              {avatarError && (
                <div className="alert alert-danger" style={{ marginBottom: "1.5rem" }}>
                  <AlertCircle size={18} />
                  <span>{avatarError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateAvatar}>
                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <label className="form-label" style={{ fontSize: "0.95rem", marginBottom: "0.75rem", display: "block" }}>
                    Chọn tệp hình ảnh (JPG, PNG, WEBP, GIF - Tối đa 5MB)
                  </label>
                  <div
                    style={{
                      border: "2px dashed var(--primary)",
                      borderRadius: "12px",
                      padding: "2rem",
                      textAlign: "center",
                      background: "rgba(59, 130, 246, 0.03)",
                      cursor: "pointer",
                      position: "relative"
                    }}
                    onClick={() => document.getElementById("avatar-file-input")?.click()}
                  >
                    <input
                      id="avatar-file-input"
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
                          setImgPreviewError(false);
                        }
                      }}
                    />
                    <Upload size={36} color="var(--primary)" style={{ marginBottom: "0.75rem" }} />
                    <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "1rem", marginBottom: "0.4rem" }}>
                      {avatarFile ? avatarFile.name : "Nhấp để chọn tệp từ máy tính"}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {avatarFile ? `Dung lượng: ${(avatarFile.size / 1024 / 1024).toFixed(2)} MB` : ""}
                    </div>
                  </div>
                </div>

                {avatarUrl && (
                  <div
                    style={{
                      marginBottom: "2rem",
                      padding: "1.5rem",
                      background: "rgba(255, 255, 255, 0.02)",
                      borderRadius: "12px",
                      border: "1px dashed var(--card-border)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "10px"
                    }}
                  >
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                      Xem Trước Hình Ảnh
                    </span>
                    {imgPreviewError ? (
                      <div
                        style={{
                          padding: "1rem",
                          background: "rgba(239, 68, 68, 0.1)",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                          borderRadius: "8px",
                          color: "#f87171",
                          fontSize: "0.85rem",
                          textAlign: "left",
                          maxWidth: "100%",
                          lineHeight: "1.4"
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "6px" }}>
                          <AlertCircle size={16} /> Không thể tải hình ảnh!
                        </div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                          Tệp đã chọn không thể hiển thị dưới dạng hình ảnh hợp lệ.
                        </div>
                      </div>
                    ) : (
                      <img
                        src={avatarUrl}
                        alt="Preview"
                        style={{
                          width: "110px",
                          height: "110px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "3px solid var(--primary)",
                          boxShadow: "0 6px 16px rgba(0,0,0,0.4)",
                        }}
                        onLoad={() => setImgPreviewError(false)}
                        onError={() => setImgPreviewError(true)}
                      />
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: "0.75rem 1.5rem", fontSize: "0.95rem", display: "inline-flex", alignItems: "center", gap: "8px" }}
                  disabled={avatarLoading}
                >
                  {avatarLoading && <Loader2 size={18} className="spinner" />}
                  Tải Lên & Lưu Ảnh
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
