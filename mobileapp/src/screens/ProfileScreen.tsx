import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { profileApi, BASE_URL } from "../services/api";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

const getFullAvatarUri = (avatar?: string) => {
  if (!avatar) return null;
  if (avatar.startsWith("http://localhost:8080")) {
    return avatar.replace("http://localhost:8080", BASE_URL);
  }
  if (avatar.startsWith("http://127.0.0.1:8080")) {
    return avatar.replace("http://127.0.0.1:8080", BASE_URL);
  }
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
    return avatar;
  }
  if (avatar.startsWith("/")) {
    return `${BASE_URL}${avatar}`;
  }
  return `${BASE_URL}/${avatar}`;
};

export default function ProfileScreen() {
  const { user, logout, refreshProfile } = useAuth();

  // States for Avatar Upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // States for Contact Modal
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [personalEmail, setPersonalEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [savingContact, setSavingContact] = useState(false);

  // States for Password Modal
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Avatar Image Picker Handler
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Quyền truy cập", "Bạn cần cấp quyền truy cập thư viện ảnh để đổi avatar.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await uploadSelectedImage(asset);
      }
    } catch (err: any) {
      Alert.alert("Lỗi", "Không thể chọn ảnh: " + (err.message || "Lỗi không xác định"));
    }
  };

  const uploadSelectedImage = async (asset: ImagePicker.ImagePickerAsset) => {
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      const uri = asset.uri;
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1] || 'jpeg';
      const fileName = `avatar_${Date.now()}.${fileType}`;

      formData.append("file", {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: fileName,
        type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
      } as any);

      await profileApi.uploadAvatar(formData);
      await refreshProfile();
      Alert.alert("Thành công", "Đã cập nhật ảnh đại diện mới!");
    } catch (err: any) {
      console.error("Upload avatar error:", err);
      Alert.alert("Lỗi", err.response?.data?.message || "Tải ảnh lên thất bại. Vui lòng kiểm tra dung lượng (<5MB).");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Contact Modal Handlers
  const openContactModal = () => {
    setPersonalEmail(user?.personalEmail || "");
    setPhoneNumber(user?.phoneNumber || "");
    setContactModalVisible(true);
  };

  const handleSaveContact = async () => {
    setSavingContact(true);
    try {
      await profileApi.changeContact({ personalEmail, phoneNumber });
      await refreshProfile();
      setContactModalVisible(false);
      Alert.alert("Thành công", "Đã cập nhật thông tin liên lạc cá nhân!");
    } catch (err: any) {
      Alert.alert("Lỗi", err.response?.data?.message || "Cập nhật thất bại. Kiểm tra lại định dạng email hoặc số điện thoại.");
    } finally {
      setSavingContact(false);
    }
  };

  // Password Modal Handlers
  const openPasswordModal = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordModalVisible(true);
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ các trường mật khẩu.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    setSavingPassword(true);
    try {
      await profileApi.changePassword({ oldPassword, newPassword, confirmPassword });
      setPasswordModalVisible(false);
      Alert.alert("Thành công", "Đổi mật khẩu thành công!");
    } catch (err: any) {
      Alert.alert("Lỗi", err.response?.data?.message || "Mật khẩu hiện tại không đúng hoặc có lỗi xảy ra.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất tài khoản?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: () => logout() },
    ]);
  };

  const getRoleLabel = (role?: string) => {
    if (role === "ADMIN") return "Quản trị viên";
    if (role === "TEACHER") return "Giảng viên";
    return "Sinh viên";
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Banner & Avatar */}
      <View style={styles.headerBanner}>
        <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage} disabled={uploadingAvatar}>
          {user?.avatar ? (
            <Image source={{ uri: getFullAvatarUri(user.avatar) || undefined }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {user?.fullName?.charAt(0).toUpperCase() || "S"}
              </Text>
            </View>
          )}
          <View style={styles.cameraIconBadge}>
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera" size={16} color="#fff" />
            )}
          </View>
        </TouchableOpacity>

        <Text style={styles.headerName}>{user?.fullName || "Người dùng"}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{getRoleLabel(user?.role)}</Text>
        </View>
      </View>

      {/* Section 1: School Account Info */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="school-outline" size={20} color="#4f46e5" />
          <Text style={styles.cardTitle}>Thông tin tài khoản trường</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Họ và tên:</Text>
          <Text style={styles.infoValue}>{user?.fullName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email trường:</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Mã định danh:</Text>
          <Text style={styles.infoValue}>ID-{user?.id}</Text>
        </View>
      </View>

      {/* Section 2: Personal Contact Info */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle-outline" size={20} color="#4f46e5" />
            <Text style={styles.cardTitle}>Thông tin liên hệ cá nhân</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={openContactModal}>
            <Ionicons name="create-outline" size={16} color="#4f46e5" />
            <Text style={styles.editButtonText}>Sửa</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email cá nhân:</Text>
          <Text style={[styles.infoValue, !user?.personalEmail && styles.emptyText]}>
            {user?.personalEmail || "Chưa cập nhật"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Số điện thoại:</Text>
          <Text style={[styles.infoValue, !user?.phoneNumber && styles.emptyText]}>
            {user?.phoneNumber || "Chưa cập nhật"}
          </Text>
        </View>
      </View>

      {/* Section 3: Security & Password */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#4f46e5" />
          <Text style={styles.cardTitle}>Bảo mật tài khoản</Text>
        </View>
        <TouchableOpacity style={styles.actionRow} onPress={openPasswordModal}>
          <View style={styles.actionLeft}>
            <Ionicons name="lock-closed-outline" size={20} color="#475569" />
            <Text style={styles.actionText}>Đổi mật khẩu tài khoản</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
      </TouchableOpacity>

      {/* MODAL 1: Edit Contact Info */}
      <Modal visible={contactModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa thông tin liên hệ</Text>
              <TouchableOpacity onPress={() => setContactModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Email cá nhân</Text>
            <TextInput
              style={styles.input}
              placeholder="nhap.email@gmail.com"
              value={personalEmail}
              onChangeText={setPersonalEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              placeholder="0912345678"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setContactModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, savingContact && styles.saveBtnDisabled]}
                onPress={handleSaveContact}
                disabled={savingContact}
              >
                {savingContact ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Change Password */}
      <Modal visible={passwordModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đổi mật khẩu bảo mật</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Nhập mật khẩu cũ"
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry={!showOldPass}
              />
              <TouchableOpacity onPress={() => setShowOldPass(!showOldPass)}>
                <Ionicons name={showOldPass ? "eye-off" : "eye"} size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Mật khẩu mới</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPass}
              />
              <TouchableOpacity onPress={() => setShowNewPass(!showNewPass)}>
                <Ionicons name={showNewPass ? "eye-off" : "eye"} size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Xác nhận mật khẩu mới</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showNewPass}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setPasswordModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, savingPassword && styles.saveBtnDisabled]}
                onPress={handleChangePassword}
                disabled={savingPassword}
              >
                {savingPassword ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Cập nhật mật khẩu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  contentContainer: {
    paddingBottom: 40,
  },
  headerBanner: {
    backgroundColor: "#4f46e5",
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: "#fff",
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  avatarInitials: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
  },
  cameraIconBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#1e1b4b",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  headerName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 6,
  },
  roleBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  roleText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginLeft: 8,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  editButtonText: {
    color: "#4f46e5",
    fontWeight: "600",
    fontSize: 13,
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  infoLabel: {
    fontSize: 14,
    color: "#64748b",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  emptyText: {
    color: "#94a3b8",
    fontStyle: "italic",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "500",
    marginLeft: 10,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fee2e2",
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  logoutText: {
    color: "#ef4444",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0f172a",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0f172a",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 24,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginRight: 10,
  },
  cancelBtnText: {
    color: "#64748b",
    fontWeight: "600",
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: "#4f46e5",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  saveBtnDisabled: {
    backgroundColor: "#818cf8",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});
