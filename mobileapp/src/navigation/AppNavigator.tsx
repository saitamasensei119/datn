import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { ActivityIndicator, View } from "react-native";

import CoursesScreen from "../screens/CoursesScreen";
import GradesScreen from "../screens/GradesScreen";
import TimetableScreen from "../screens/TimetableScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Courses") {
            iconName = focused ? "book" : "book-outline";
          } else if (route.name === "Timetable") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "Grades") {
            iconName = focused ? "ribbon" : "ribbon-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#4f46e5",
        tabBarInactiveTintColor: "gray",
        headerStyle: {
          backgroundColor: "#fff",
        },
        headerTintColor: "#0f172a",
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Trang chủ" }} />
      <Tab.Screen name="Courses" component={CoursesScreen} options={{ title: "Lớp học" }} />
      <Tab.Screen name="Timetable" component={TimetableScreen} options={{ title: "Lịch học" }} />
      <Tab.Screen name="Grades" component={GradesScreen} options={{ title: "Điểm số" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Tài khoản" }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="MainTabs" component={MainTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
