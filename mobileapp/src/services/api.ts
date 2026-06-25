import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Replace with your local machine's IP address where Spring Boot is running
const BASE_URL = "http://192.168.0.100:8080"; 

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      // AppNavigator or AuthContext will handle navigation to Login
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: any) => api.post("/auth/login", data),
};

export const studentApi = {
  getStats: () => api.get("/api/admin/students/statistics"),
  getById: (id: number) => api.get(`/api/admin/students/${id}`),
  getByStudentCode: (studentCode: string) => api.get(`/api/admin/students/code/${studentCode}`),
  getAll: () => api.get("/api/admin/students"),
};

export const courseApi = {
  getOpenCourses: (page: number = 0, size: number = 10) =>
    api.get("/api/student/courses", { params: { page, size } }),
};

export const enrollmentApi = {
  getMyEnrollments: () => api.get("/api/student/enrollments"),
  enroll: (data: { studentId: number; courseId: number }) =>
    api.post("/api/student/enrollments", data),
  unenroll: (courseId: number) => api.delete(`/api/student/enrollments/${courseId}`),
};

export const studentGradeApi = {
  getMyGrades: () => api.get("/api/student/grades"),
  getTranscript: () => api.get("/api/student/grades/transcript"),
};

export default api;
