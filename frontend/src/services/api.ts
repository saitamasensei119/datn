import axios from "axios";

// Create Axios Instance
const api = axios.create({
  // Vite proxy will redirect this, so we can use relative path /
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor to add Authorization JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Variables to manage refresh token state across concurrent requests
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

// Response Interceptor to handle global errors (e.g. 401 Unauthorized) & Automatic Token Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes("/auth/login") || originalRequest.url?.includes("/auth/refresh")) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      try {
        const res = await axios.post("/auth/refresh", { refreshToken });
        const newAccessToken = res.data?.accessToken || res.data?.token;
        const newRefreshToken = res.data?.refreshToken;

        if (newAccessToken) {
          localStorage.setItem("token", newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem("refreshToken", newRefreshToken);
          }
          api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

// API Endpoints Mapping
export const authApi = {
  login: (data: any) => api.post("/auth/login", data),
  refresh: (refreshToken: string) => api.post("/auth/refresh", { refreshToken }),
  logout: (refreshToken?: string) => api.post("/auth/logout", { refreshToken }),
};

export const profileApi = {
  getMyProfile: () => api.get("/api/profile"),
  changePassword: (data: { oldPassword: string; newPassword: string; confirmPassword: string }) =>
    api.put("/api/profile/password", data),
  changeAvatar: (data: { avatarUrl: string }) =>
    api.put("/api/profile/avatar", data),
};

export const departmentApi = {
  getAll: () => api.get("/api/departments"),
  getById: (id: number) => api.get(`/api/departments/${id}`),
  create: (data: any) => api.post("/api/departments", data),
  update: (id: number, data: any) => api.put(`/api/departments/${id}`, data),
  delete: (id: number) => api.delete(`/api/departments/${id}`),
};

export const subjectApi = {
  getAll: () => api.get("/api/subjects"),
  searchSimple: (keyword: string, limit: number = 15) =>
    api.get("/api/subjects/simple-search", { params: { keyword, limit } }),
  getPaginated: (page: number, size: number, search?: string) =>
    api.get("/api/subjects/page", { params: { page, size, search } }),
  getById: (id: number) => api.get(`/api/subjects/${id}`),
  create: (data: any) => api.post("/api/subjects", data),
  update: (id: number, data: any) => api.put(`/api/subjects/${id}`, data),
  delete: (id: number) => api.delete(`/api/subjects/${id}`),
  import: (formData: FormData) => api.post("/api/subjects/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
};

export const subjectConditionApi = {
  getConditions: (subjectId: number) => api.get(`/api/subjects/${subjectId}/conditions`),
  addCondition: (subjectId: number, data: { requiredSubjectId: number, conditionType: string }) => 
    api.post(`/api/subjects/${subjectId}/conditions`, data),
  removeCondition: (subjectId: number, conditionId: number) => 
    api.delete(`/api/subjects/${subjectId}/conditions/${conditionId}`)
};

export const semesterApi = {
  getAll: () => api.get("/api/semesters"),
  getById: (id: number) => api.get(`/api/semesters/${id}`),
  create: (data: any) => api.post("/api/semesters", data),
  update: (id: number, data: any) => api.put(`/api/semesters/${id}`, data),
  delete: (id: number) => api.delete(`/api/semesters/${id}`),
};

export const lecturerApi = {
  getAll: () => api.get("/api/admin/lecturers"),
  getById: (id: number) => api.get(`/api/admin/lecturers/${id}`),
  create: (data: any) => api.post("/api/admin/lecturers", data),
  update: (id: number, data: any) =>
    api.put(`/api/admin/lecturers/${id}`, data),
  changeStatus: (id: number, status: string) =>
    api.put(`/api/admin/lecturers/${id}`, { status }),
};

export const studentApi = {
  getStats: () => api.get("/api/admin/students/statistics"),
  getById: (id: number) => api.get(`/api/admin/students/${id}`),
  getByStudentCode: (studentCode: string) => api.get(`/api/admin/students/code/${studentCode}`),
  create: (data: any) => api.post("/api/admin/students", data),
  update: (id: number, data: any) => api.put(`/api/admin/students/${id}`, data),
  getAll: () => api.get("/api/admin/students"),
  getPaginated: (page: number, size: number, search?: string) =>
    api.get("/api/admin/students/page", { params: { page, size, search } }),
  changeStatus: (id: number, status: string) =>
    api.put(`/api/admin/students/${id}`, { status }),
};

export const courseApi = {
  getAll: () => api.get("/api/admin/courses"),
  getPaginated: (page: number, size: number, search?: string, semesterId?: number) =>
    api.get("/api/admin/courses/page", { params: { page, size, search, semesterId: semesterId ? semesterId : undefined } }),
  getById: (id: number) => api.get(`/api/admin/courses/${id}`),
  create: (data: any) => api.post("/api/admin/courses", data),
  update: (id: number, data: any) => api.put(`/api/admin/courses/${id}`, data),
  delete: (id: number) => api.delete(`/api/admin/courses/${id}`),
  getMyCourses: () => api.get("/api/teacher/courses/my-courses"),
  getOpenCourses: (page: number = 0, size: number = 10) =>
    api.get("/api/student/courses", { params: { page, size } }),
  searchOpenCourses: (
    page: number = 0,
    size: number = 10,
    courseCode?: string,
    subjectCode?: string,
    subjectName?: string,
  ) =>
    api.get("/api/student/courses/search", {
      params: { page, size, courseCode, subjectCode, subjectName },
    }),
  getStudentCourseById: (id: number) => api.get(`/api/student/courses/${id}`),
  getStudentsByCourseAdmin: (courseId: number) =>
    api.get(`/api/admin/courses/${courseId}/students`),
  searchAdminCourses: (courseCode: string) =>
    api.get("/api/admin/courses/search", { params: { courseCode } }),
  searchAdminCourseStudents: (courseId: number, studentCode: string) =>
    api.get(`/api/admin/courses/${courseId}/students/search`, { params: { studentCode } }),
  getStudentsByCourseTeacher: (courseId: number) =>
    api.get(`/api/teacher/courses/${courseId}/students`),
  importExcel: (file: File, semesterId?: number) => {
    const formData = new FormData();
    formData.append("file", file);
    if (semesterId) {
      formData.append("semesterId", semesterId.toString());
    }
    return api.post(`/api/admin/courses/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

export const enrollmentApi = {
  getMyEnrollments: () => api.get("/api/student/enrollments"),
  enroll: (data: { studentId: number; courseId: number }) =>
    api.post("/api/student/enrollments", data),
  enrollMultiple: (
    enrollments: Array<{ studentId: number; courseId: number; ignoreWarning?: boolean }>,
  ) => Promise.all(enrollments.map((e) => api.post("/api/student/enrollments", e))),
  unenroll: (courseId: number) => api.delete(`/api/student/enrollments/${courseId}`),
};

export const adminEnrollmentApi = {
  enroll: (data: { studentId: number; courseId: number }) =>
    api.post("/api/admin/enrollments", data),
  unenroll: (data: { studentId: number; courseId: number }) =>
    api.delete("/api/admin/enrollments", { data }),
};

export const teacherGradeApi = {
  getGrades: (courseId: number) => api.get(`/api/teacher/courses/${courseId}/grades`),
  updateGrades: (courseId: number, data: Array<{ enrollmentId: number; midtermScore: number | null; finalScore: number | null }>) =>
    api.put(`/api/teacher/courses/${courseId}/grades`, data),
  getSubmissions: (courseId: number) => api.get(`/api/teacher/courses/${courseId}/grades/submissions`),
  submitMidterm: (courseId: number) => api.post(`/api/teacher/courses/${courseId}/grades/submissions/midterm/submit`),
  submitFinal: (courseId: number) => api.post(`/api/teacher/courses/${courseId}/grades/submissions/final/submit`),
  downloadTemplate: (courseId: number) => api.get(`/api/teacher/courses/${courseId}/grades/template`, { responseType: 'blob' }),
  uploadExcel: (courseId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/api/teacher/courses/${courseId}/grades/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

export const adminGradeApi = {
  getSubmissions: (courseId: number) => api.get(`/api/admin/courses/${courseId}/submissions`),
  unlockMidterm: (courseId: number) => api.post(`/api/admin/courses/${courseId}/submissions/midterm/unlock`),
  unlockFinal: (courseId: number) => api.post(`/api/admin/courses/${courseId}/submissions/final/unlock`),
};

export const teacherAttendanceApi = {
  getSessions: (courseId: number) => api.get(`/api/teacher/courses/${courseId}/attendance-sessions`),
  getOrCreateSession: (courseId: number, date: string) => 
    api.post(`/api/teacher/courses/${courseId}/attendance-sessions?date=${date}`),
  getRecords: (sessionId: number) => api.get(`/api/teacher/attendance-sessions/${sessionId}/records`),
  updateRecords: (sessionId: number, records: Array<{recordId: number, status: string, note?: string}>) =>
    api.put(`/api/teacher/attendance-sessions/${sessionId}/records`, { records })
};

export const studentGradeApi = {
  getMyGrades: () => api.get(`/api/student/grades`),
  getTranscript: () => api.get(`/api/student/grades/transcript`),
};

export const studentAttendanceApi = {
  getSummary: () => api.get(`/api/student/attendance/summary`),
  getDetails: (courseId: number) => api.get(`/api/student/attendance/courses/${courseId}`),
};

export const adminDashboardApi = {
  getOverview: () => api.get("/api/admin/dashboard/overview"),
};

export const studentDashboardApi = {
  getStats: () => api.get("/api/student/dashboard/summary"),
};

export const roomApi = {
  getAll: () => api.get("/api/admin/rooms"),
  getPage: (page: number = 0, size: number = 10) => api.get("/api/admin/rooms/page", { params: { page, size } }),
  create: (data: any) => api.post("/api/admin/rooms", data),
  update: (id: number, data: any) => api.put(`/api/admin/rooms/${id}`, data),
  delete: (id: number) => api.delete(`/api/admin/rooms/${id}`),
  importExcel: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/api/admin/rooms/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

export const timeslotApi = {
  getAll: () => api.get("/api/admin/timeslots"),
  getPage: (page: number = 0, size: number = 10) => api.get("/api/admin/timeslots/page", { params: { page, size } }),
  create: (data: any) => api.post("/api/admin/timeslots", data),
  update: (id: number, data: any) => api.put(`/api/admin/timeslots/${id}`, data),
  delete: (id: number) => api.delete(`/api/admin/timeslots/${id}`),
  autoGenerate: () => api.post("/api/admin/timeslots/seed"),
};

export const preRegistrationApi = {
  registerIntent: (subjectId: number, semesterId: number, ignoreWarning: boolean = false) =>
    api.post("/api/pre-registrations", null, { params: { subjectId, semesterId, ignoreWarning } }),
  removeIntent: (id: number) => api.delete(`/api/pre-registrations/${id}`),
  getMyIntents: (semesterId: number) =>
    api.get("/api/pre-registrations/me", { params: { semesterId } }),
  getMyTotalCredits: (semesterId: number) =>
    api.get("/api/pre-registrations/me/credits", { params: { semesterId } }),
};

export const timetableApi = {
  generateCourses: (semesterId: number, defaultMaxStudents: number = 40) =>
    api.post("/api/admin/timetable/generate-courses", { semesterId, defaultMaxStudents }),
  scheduleCourses: (semesterId: number) =>
    api.post("/api/admin/timetable/schedule", { semesterId }),
  exportExcel: (semesterId: number) =>
    api.get("/api/admin/timetable/export-excel", { params: { semesterId }, responseType: "blob" }),
};

export default api;
