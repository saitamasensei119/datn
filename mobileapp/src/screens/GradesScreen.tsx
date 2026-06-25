import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from "react-native";
import { studentGradeApi } from "../services/api";

interface GradeResponse {
  courseId: number;
  courseCode: string;
  subjectName: string;
  credits: number;
  midtermScore: number | null;
  midtermStatus: string;
  finalScore: number | null;
  finalStatus: string;
  totalScore: number | null;
  status: string;
}

const getGradeInfo = (total: number | null) => {
  if (total === null || total === undefined) return { letter: "-", point: 0, color: "transparent" };
  if (total >= 9.5) return { letter: "A+", point: 4.0, color: "#4caf50" };
  if (total >= 8.5) return { letter: "A", point: 4.0, color: "#4caf50" };
  if (total >= 8.0) return { letter: "B+", point: 3.5, color: "#8bc34a" };
  if (total >= 7.0) return { letter: "B", point: 3.0, color: "#2196f3" };
  if (total >= 6.5) return { letter: "C+", point: 2.5, color: "#ff9800" };
  if (total >= 5.5) return { letter: "C", point: 2.0, color: "#ff9800" };
  if (total >= 5.0) return { letter: "D+", point: 1.5, color: "#f44336" };
  if (total >= 4.0) return { letter: "D", point: 1.0, color: "#f44336" };
  return { letter: "F", point: 0.0, color: "#999" };
};

export default function GradesScreen() {
  const [grades, setGrades] = useState<GradeResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGrades = async () => {
    try {
      const response = await studentGradeApi.getMyGrades();
      setGrades(response.data || []);
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể tải kết quả học tập.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  const calculateGPA = () => {
    const gradedCourses = grades.filter((g) => g.totalScore !== null);
    if (gradedCourses.length === 0) return "0.00";

    const totalCredits = gradedCourses.reduce((sum, g) => sum + g.credits, 0);
    const weightedSum = gradedCourses.reduce(
      (sum, g) => sum + getGradeInfo(g.totalScore).point * g.credits,
      0,
    );
    return totalCredits === 0 ? "0.00" : (weightedSum / totalCredits).toFixed(2);
  };

  const renderItem = ({ item }: { item: GradeResponse }) => {
    const gradeInfo = getGradeInfo(item.totalScore);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.subjectName}>{item.subjectName}</Text>
          <View style={[styles.letterBadge, { backgroundColor: gradeInfo.color !== "transparent" ? gradeInfo.color : "#e2e8f0" }]}>
             <Text style={styles.letterText}>{gradeInfo.letter}</Text>
          </View>
        </View>
        <Text style={styles.courseCode}>{item.courseCode} • {item.credits} Tín chỉ</Text>
        
        <View style={styles.scoresRow}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Giữa kỳ</Text>
            <Text style={styles.scoreValue}>{item.midtermScore !== null ? item.midtermScore.toFixed(1) : "-"}</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Cuối kỳ</Text>
            <Text style={styles.scoreValue}>{item.finalScore !== null ? item.finalScore.toFixed(1) : "-"}</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Hệ 10</Text>
            <Text style={[styles.scoreValue, { color: "#4f46e5" }]}>
              {item.totalScore !== null ? item.totalScore.toFixed(2) : "-"}
            </Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Hệ 4</Text>
            <Text style={[styles.scoreValue, { color: gradeInfo.color !== "transparent" ? gradeInfo.color : "#0f172a" }]}>
              {item.totalScore !== null ? gradeInfo.point.toFixed(1) : "-"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Kết Quả Học Tập</Text>
      </View>

      <View style={styles.gpaContainer}>
        <View style={styles.gpaBox}>
          <Text style={styles.gpaLabel}>GPA (Hệ 4)</Text>
          <Text style={styles.gpaValue}>{calculateGPA()}</Text>
        </View>
        <View style={styles.gpaBox}>
          <Text style={styles.gpaLabel}>Số Lớp</Text>
          <Text style={styles.gpaValue}>{grades.length}</Text>
        </View>
      </View>

      {grades.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chưa có kết quả học tập nào.</Text>
        </View>
      ) : (
        <FlatList
          data={grades}
          keyExtractor={(item) => item.courseId.toString()}
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a",
  },
  gpaContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  gpaBox: {
    flex: 1,
    backgroundColor: "#4f46e5",
    borderRadius: 12,
    padding: 16,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  gpaLabel: {
    color: "#c7d2fe",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  gpaValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
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
  },
  subjectName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
    paddingRight: 8,
  },
  courseCode: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 16,
  },
  letterBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  letterText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  scoresRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
  },
  scoreBox: {
    alignItems: "center",
  },
  scoreLabel: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0f172a",
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
