import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { timetableApi, ClassScheduleItem } from "../services/api";

const DAYS = [
  { label: "Thứ 2", value: 2 },
  { label: "Thứ 3", value: 3 },
  { label: "Thứ 4", value: 4 },
  { label: "Thứ 5", value: 5 },
  { label: "Thứ 6", value: 6 },
  { label: "Thứ 7", value: 7 },
  { label: "CN", value: 8 },
];

export default function TimetableScreen() {
  const [schedules, setSchedules] = useState<ClassScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(2);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const res = await timetableApi.getMyTimetable();
      setSchedules(res.data || []);
      setIsMock(res.isMock);
    } catch (err) {
      console.error("Lỗi khi tải thời khóa biểu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Determine current day of week (1: Sunday -> 8: Sunday in VN conventions, or JS getDay())
    const jsDay = new Date().getDay();
    const vnDay = jsDay === 0 ? 8 : jsDay + 1;
    if (vnDay >= 2 && vnDay <= 8) {
      setSelectedDay(vnDay);
    }
    fetchTimetable();
  }, []);

  const filteredSchedules = schedules
    .filter((s) => s.dayOfWeek === selectedDay)
    .sort((a, b) => a.startPeriod - b.startPeriod);

  const renderItem = ({ item }: { item: ClassScheduleItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.timeBadge}>
          <Ionicons name="time-outline" size={16} color="#fff" />
          <Text style={styles.timeBadgeText}>
            {item.timeString || `Tiết ${item.startPeriod} - ${item.endPeriod}`}
          </Text>
        </View>
        <View style={styles.roomBadge}>
          <Ionicons name="location-outline" size={14} color="#10b981" />
          <Text style={styles.roomText}>{item.roomName || "Chưa gán"}</Text>
        </View>
      </View>

      <Text style={styles.courseName}>{item.courseName}</Text>
      <Text style={styles.courseCode}>{item.courseCode}</Text>

      <View style={styles.divider} />

      <View style={styles.footerRow}>
        <View style={styles.footerItem}>
          <Ionicons name="person-outline" size={14} color="#64748b" />
          <Text style={styles.footerText}>
            GV: {item.lecturerName || "Chưa gán"}
          </Text>
        </View>
        <View style={styles.shiftBadge}>
          <Text style={styles.shiftText}>Ca {item.shift || "Sáng"}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Thời Khóa Biểu</Text>
        <Text style={styles.subtitle}>
          Lịch học trong tuần của bạn
        </Text>
      </View>

      {/* {isMock && (
        <View style={styles.mockBanner}>
          <Ionicons name="information-circle" size={18} color="#d97706" />
          <Text style={styles.mockText}>
            Hiển thị dữ liệu giả lập (Mock API) để trải nghiệm giao diện
          </Text>
        </View>
      )} */}

      {/* Horizontal Day Selector */}
      <View style={styles.daysWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysContainer}
        >
          {DAYS.map((d) => {
            const active = d.value === selectedDay;
            const count = schedules.filter((s) => s.dayOfWeek === d.value).length;
            return (
              <TouchableOpacity
                key={d.value}
                style={[styles.dayButton, active && styles.dayButtonActive]}
                onPress={() => setSelectedDay(d.value)}
              >
                <Text style={[styles.dayText, active && styles.dayTextActive]}>
                  {d.label}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.dayDot,
                      active && styles.dayDotActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayDotText,
                        active && styles.dayDotTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : filteredSchedules.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>
            Không có tiết học nào vào {DAYS.find((d) => d.value === selectedDay)?.label}
          </Text>
          <Text style={styles.emptySubtitle}>
            Bạn có thể chọn các ngày khác để xem lịch học
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredSchedules}
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
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  mockBanner: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#fde68a",
  },
  mockText: {
    fontSize: 12,
    color: "#b45309",
    flex: 1,
    fontWeight: "500",
  },
  daysWrapper: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  daysContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dayButtonActive: {
    backgroundColor: "#4f46e5",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  dayTextActive: {
    color: "#fff",
  },
  dayDot: {
    backgroundColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  dayDotActive: {
    backgroundColor: "#6366f1",
  },
  dayDotText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#475569",
  },
  dayDotTextActive: {
    color: "#fff",
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  timeBadge: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  roomBadge: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  roomText: {
    color: "#047857",
    fontSize: 13,
    fontWeight: "bold",
  },
  courseName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  courseCode: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 12,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
  },
  shiftBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  shiftText: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#475569",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 6,
    textAlign: "center",
  },
});
