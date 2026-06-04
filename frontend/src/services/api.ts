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

// Response Interceptor to handle global errors (e.g. 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear storage and redirect if token is expired or invalid
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// API Endpoints Mapping
export const authApi = {
  login: (data: any) => api.post("/auth/login", data),
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
  getById: (id: number) => api.get(`/api/subjects/${id}`),
  create: (data: any) => api.post("/api/subjects", data),
  update: (id: number, data: any) => api.put(`/api/subjects/${id}`, data),
  delete: (id: number) => api.delete(`/api/subjects/${id}`),
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
  create: (data: any) => api.post("/api/admin/students", data),
  update: (id: number, data: any) => api.put(`/api/admin/students/${id}`, data),
  getAll: () => api.get("/api/admin/students"),
  changeStatus: (id: number, status: string) =>
    api.put(`/api/admin/students/${id}`, { status }),
};

export const courseApi = {
  getAll: () => api.get("/api/courses"),
  getById: (id: number) => api.get(`/api/courses/${id}`),
  create: (data: any) => api.post("/api/courses", data),
  update: (id: number, data: any) => api.put(`/api/courses/${id}`, data),
  delete: (id: number) => api.delete(`/api/courses/${id}`),
};

export const enrollmentApi = {
  enroll: (data: { studentId: number; courseId: number }) =>
    api.post("/api/enrollments", data),
};

export default api;
