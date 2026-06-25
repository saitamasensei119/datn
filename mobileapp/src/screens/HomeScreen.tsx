import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { useAuth } from "../context/AuthContext";
import { studentApi } from "../services/api";

export default function HomeScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  // Add state for stats if you want, but this is simple version

  useEffect(() => {
    // In a real app, fetch student dashboard info here
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Xin chào,</Text>
        <Text style={styles.name}>{user?.fullName || "Sinh viên"}</Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Vai trò:</Text>
          <Text style={styles.value}>{user?.role}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tổng quan học tập</Text>
        <Text style={styles.placeholder}>Dữ liệu sẽ được cập nhật sớm.</Text>
      </View>
    </ScrollView>
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
    padding: 16,
  },
  header: {
    marginBottom: 24,
    marginTop: 16,
  },
  greeting: {
    fontSize: 16,
    color: "#64748b",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
  },
  label: {
    width: 80,
    color: "#64748b",
    fontWeight: "500",
  },
  value: {
    flex: 1,
    color: "#334155",
  },
  placeholder: {
    color: "#94a3b8",
    fontStyle: "italic",
  },
});
