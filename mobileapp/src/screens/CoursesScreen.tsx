import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { enrollmentApi } from "../services/api";

interface MyCourse {
  id: number;
  name: string;
  code: string;
  lecturer?: string;
  credits?: number;
  status?: string;
}

export default function CoursesScreen() {
  const [courses, setCourses] = useState<MyCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      const response = await enrollmentApi.getMyEnrollments();
      const data = response.data || [];
      const mappedCourses = data.map((item: any) => ({
        id: item.course?.id || item.id,
        name: item.course?.subjectName || item.subjectName || item.name || "Chưa có tên",
        code: item.course?.courseCode || item.courseCode || item.code || "N/A",
        lecturer: item.course?.lecturerName || item.lecturerName || item.lecturer,
        credits: item.course?.credits || item.credits,
        status: item.course?.status || item.status,
      }));
      setCourses(mappedCourses);
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể tải dữ liệu lớp học phần");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "OPEN": return "#42a5f5";
      case "IN_PROGRESS": return "#03a9f4";
      case "COMPLETED": return "#1a237e";
      case "CANCELLED": return "#e57373";
      case "PLANNED": return "#64b5f6";
      default: return "#64748b";
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "OPEN": return "Đang Mở Đăng Kí";
      case "IN_PROGRESS": return "Đang Học";
      case "COMPLETED": return "Kết Thúc";
      case "CANCELLED": return "Hủy";
      case "PLANNED": return "Chuẩn Bị Mở";
      default: return "Không Xác Định";
    }
  };

  const renderItem = ({ item }: { item: MyCourse }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.courseName}>{item.name}</Text>
          <Text style={styles.courseCode}>{item.code}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.badgeText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        {item.lecturer && (
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Giảng viên:</Text> {item.lecturer}
          </Text>
        )}
        {item.credits && (
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Tín chỉ:</Text> {item.credits}
          </Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lớp Học Phần Của Tôi</Text>
      <Text style={styles.subtitle}>Tổng số: {courses.length} lớp</Text>

      {courses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Bạn chưa đăng ký lớp học phần nào.</Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  listContainer: {
    padding: 16,
    paddingTop: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    paddingRight: 8,
  },
  courseName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  courseCode: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
  },
  detailText: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 4,
  },
  boldText: {
    fontWeight: "600",
    color: "#334155",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 16,
  },
});
