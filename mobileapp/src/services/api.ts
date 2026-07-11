import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Replace with your local machine's IP address where Spring Boot is running
export const BASE_URL = "http://192.168.0.102:8080"; 
// const BASE_URL = "http://192.168.91.128:8080"; 
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
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

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes("/auth/login") || originalRequest.url?.includes("/auth/refresh")) {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = "Bearer " + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        if (res.data && res.data.token) {
          const newToken = res.data.token;
          await AsyncStorage.setItem("token", newToken);
          api.defaults.headers.common["Authorization"] = "Bearer " + newToken;
          originalRequest.headers.Authorization = "Bearer " + newToken;
          processQueue(null, newToken);
          return api(originalRequest);
        } else {
          throw new Error("No token returned");
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: any) => api.post("/auth/login", data),
};

export const profileApi = {
  getMyProfile: () => api.get("/api/profile"),
  changePassword: (data: any) => api.put("/api/profile/password", data),
  changeContact: (data: { personalEmail?: string; phoneNumber?: string }) => api.put("/api/profile/contact", data),
  uploadAvatar: (formData: FormData) => api.post("/api/profile/avatar/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
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

// Mock Timetable Data for Student Mobile View
export interface ClassScheduleItem {
  id: number;
  courseId: number;
  courseName: string;
  courseCode: string;
  lecturerName?: string;
  dayOfWeek: number; // 2: Thứ 2, 3: Thứ 3, ..., 8: Chủ Nhật
  startPeriod: number;
  endPeriod: number;
  shift: string;
  timeString?: string;
  roomName: string;
  weekPattern?: string;
}

export const MOCK_TIMETABLE_DATA: ClassScheduleItem[] = [
  {
    id: 101,
    courseId: 1,
    courseName: "Tiếng Nhật I",
    courseCode: "FL1431_02",
    lecturerName: "Nguyễn Văn Tuấn",
    dayOfWeek: 2, // Thứ 2
    startPeriod: 4,
    endPeriod: 6,
    shift: "Sáng",
    timeString: "Tiết 4 - 6 (10:15 - 12:30)",
    roomName: "D4-302",
    weekPattern: "1-15",
  },
  {
    id: 102,
    courseId: 2,
    courseName: "Cấu trúc dữ liệu và giải thuật",
    courseCode: "IT3011_01",
    lecturerName: "Trần Minh Quang",
    dayOfWeek: 3, // Thứ 3
    startPeriod: 1,
    endPeriod: 3,
    shift: "Sáng",
    timeString: "Tiết 1 - 3 (06:45 - 09:00)",
    roomName: "A1-101",
    weekPattern: "1-15",
  },
  {
    id: 103,
    courseId: 3,
    courseName: "Cơ sở dữ liệu",
    courseCode: "IT3090_05",
    lecturerName: "Lê Hữu Hoàng",
    dayOfWeek: 3, // Thứ 3
    startPeriod: 7,
    endPeriod: 9,
    shift: "Chiều",
    timeString: "Tiết 7 - 9 (12:30 - 14:45)",
    roomName: "C2-201",
    weekPattern: "1-15",
  },
  {
    id: 104,
    courseId: 4,
    courseName: "Mạng máy tính",
    courseCode: "IT3080_03",
    lecturerName: "Phạm Quốc Dũng",
    dayOfWeek: 5, // Thứ 5
    startPeriod: 4,
    endPeriod: 6,
    shift: "Sáng",
    timeString: "Tiết 4 - 6 (10:15 - 12:30)",
    roomName: "B1-301",
    weekPattern: "1-15",
  },
  {
    id: 105,
    courseId: 5,
    courseName: "Triết học Mác - Lênin",
    courseCode: "SSH1110_12",
    lecturerName: "Đặng Thị Mai",
    dayOfWeek: 6, // Thứ 6
    startPeriod: 10,
    endPeriod: 12,
    shift: "Chiều",
    timeString: "Tiết 10 - 12 (15:00 - 17:15)",
    roomName: "D9-401",
    weekPattern: "1-15",
  },
];

export const timetableApi = {
  getMockTimetable: () => Promise.resolve({ data: MOCK_TIMETABLE_DATA }),
  getMyTimetable: async (): Promise<{ data: ClassScheduleItem[]; isMock: boolean }> => {
    try {
      const res = await enrollmentApi.getMyEnrollments();
      const enrollments = res.data || [];
      const extractedSchedules: ClassScheduleItem[] = [];

      enrollments.forEach((item: any) => {
        const course = item.course || item;
        const courseName = course.subjectName || item.subjectName || course.name || "Chưa có tên";
        const courseCode = course.courseCode || item.courseCode || course.code || "N/A";
        const lecturerName = course.lecturerName || item.lecturerName || "Chưa gán GV";
        const schedules = course.schedules || item.schedules || [];

        schedules.forEach((sch: any) => {
          extractedSchedules.push({
            id: sch.id || Math.random(),
            courseId: course.id,
            courseName,
            courseCode,
            lecturerName,
            dayOfWeek: sch.dayOfWeek || 2,
            startPeriod: sch.startPeriod || 1,
            endPeriod: sch.endPeriod || 3,
            shift: sch.shift || (sch.startPeriod <= 6 ? "Sáng" : "Chiều"),
            timeString: sch.timeString || `Tiết ${sch.startPeriod} - ${sch.endPeriod}`,
            roomName: sch.roomName || "Chưa gán phòng",
            weekPattern: sch.weekPattern || "1-15",
          });
        });
      });

      if (extractedSchedules.length > 0) {
        return { data: extractedSchedules, isMock: false };
      }
      // If real enrollments have no schedules or empty, return Mock fallback for smooth UI testing
      return { data: MOCK_TIMETABLE_DATA, isMock: true };
    } catch (err) {
      console.warn("Real API getMyEnrollments failed or unavailable, falling back to Mock Timetable Data.");
      return { data: MOCK_TIMETABLE_DATA, isMock: true };
    }
  },
};

export default api;
