import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Create axios instance with auth header
const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  username: string;
  role: "TEACHER" | "ADMIN" | "REGISTRAR";
  firstName?: string;
  lastName?: string;
}

export interface Teacher {
  id: string;
  userId: string;
  employeeId: string;
  specialization?: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

export interface Student {
  id: string;
  lrn: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  gender?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  type: string;
  writtenWorkWeight: number;
  perfTaskWeight: number;
  quarterlyAssessWeight: number;
}

export interface Section {
  id: string;
  name: string;
  gradeLevel: string;
  schoolYear: string;
  adviser?: string;
  enrollments?: {
    student: Student;
  }[];
  _count?: {
    enrollments: number;
  };
}

export interface ClassAssignment {
  id: string;
  teacherId: string;
  subjectId: string;
  sectionId: string;
  schoolYear: string;
  subject: Subject;
  section: Section;
}

export interface ScoreItem {
  name: string;
  score: number;
  maxScore: number;
}

export interface Grade {
  id: string;
  studentId: string;
  classAssignmentId: string;
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  writtenWorkScores: ScoreItem[] | null;
  perfTaskScores: ScoreItem[] | null;
  quarterlyAssessScore: number | null;
  quarterlyAssessMax: number | null;
  writtenWorkPS: number | null;
  perfTaskPS: number | null;
  quarterlyAssessPS: number | null;
  initialGrade: number | null;
  quarterlyGrade: number | null;
  remarks?: string;
}

export interface ClassRecord {
  student: Student;
  grades: Grade[];
}

// Auth API
export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ token: string; user: User; message: string }>("/auth/login", {
      username,
      password,
    }),
  me: () => api.get<User>("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

// Grades API
export const gradesApi = {
  getDashboard: () =>
    api.get<{
      teacher: Teacher & { name: string };
      stats: {
        totalClasses: number;
        totalStudents: number;
        subjects: string[];
      };
      classAssignments: ClassAssignment[];
    }>("/grades/dashboard"),

  getDashboardStats: () =>
    api.get<{
      classStats: {
        id: string;
        subjectName: string;
        sectionName: string;
        gradeLevel: string;
        totalStudents: number;
        gradedCount: number;
        avgGrade: number | null;
        passingRate: number;
        studentsAtRisk: { id: string; name: string; grade: number; class: string }[];
        honorsStudents: { id: string; name: string; grade: number; honor: string }[];
        withHonorsStudents: { id: string; name: string; grade: number; honor: string }[];
      }[];
      summary: {
        totalClasses: number;
        totalStudents: number;
        totalGraded: number;
        gradeSubmissionRate: number;
        overallPassingRate: number;
        studentsAtRisk: { id: string; name: string; grade: number; class: string }[];
        studentsAtRiskCount: number;
      };
    }>("/grades/dashboard-stats"),

  getMyClasses: () => api.get<ClassAssignment[]>("/grades/my-classes"),

  getClassRecord: (classAssignmentId: string, quarter?: string) =>
    api.get<{
      classAssignment: ClassAssignment;
      classRecord: ClassRecord[];
    }>(`/grades/class-record/${classAssignmentId}`, {
      params: quarter ? { quarter } : {},
    }),

  saveGrade: (data: {
    studentId: string;
    classAssignmentId: string;
    quarter: string;
    writtenWorkScores?: ScoreItem[];
    perfTaskScores?: ScoreItem[];
    quarterlyAssessScore?: number;
    quarterlyAssessMax?: number;
  }) => api.post<Grade>("/grades/grade", data),

  deleteGrade: (gradeId: string) => api.delete(`/grades/grade/${gradeId}`),

  getMasteryDistribution: (gradeLevel?: string, sectionId?: string) =>
    api.get<{
      distribution: {
        outstanding: number;
        verySatisfactory: number;
        satisfactory: number;
        fairlySatisfactory: number;
        didNotMeet: number;
      };
      totalStudents: number;
      filters: {
        gradeLevels: string[];
        sections: { id: string; name: string; gradeLevel: string }[];
      };
    }>("/grades/mastery-distribution", {
      params: { gradeLevel, sectionId },
    }),
};

// Advisory API
export interface AdvisoryStudent {
  id: string;
  lrn: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  gender?: string;
  birthDate?: string;
  address?: string;
  guardianName?: string;
  guardianContact?: string;
  rank?: number;
}

export interface AdvisorySubject {
  id: string;
  code: string;
  name: string;
  type: string;
  teacher: string;
}

export interface AdvisoryData {
  hasAdvisory: boolean;
  message?: string;
  teacher: {
    id: string;
    name: string;
    employeeId: string;
  };
  section?: {
    id: string;
    name: string;
    gradeLevel: string;
    schoolYear: string;
  };
  students?: AdvisoryStudent[];
  stats?: {
    totalStudents: number;
    maleCount: number;
    femaleCount: number;
  };
  subjects?: AdvisorySubject[];
}

export interface QuarterGrade {
  writtenWorkPS: number | null;
  perfTaskPS: number | null;
  quarterlyAssessPS: number | null;
  initialGrade: number | null;
  quarterlyGrade: number | null;
}

export interface SubjectGrade {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  subjectType: string;
  teacher: string;
  grades: {
    Q1: QuarterGrade | null;
    Q2: QuarterGrade | null;
    Q3: QuarterGrade | null;
    Q4: QuarterGrade | null;
  };
  finalGrade: number | null;
  remarks: string | null;
}

export interface StudentGradeProfile {
  student: {
    id: string;
    lrn: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    suffix?: string;
    gender?: string;
    birthDate?: string;
    address?: string;
    guardianName?: string;
    guardianContact?: string;
  };
  enrollment: {
    sectionName: string;
    gradeLevel: string;
    schoolYear: string;
    status: string;
  };
  subjectGrades: SubjectGrade[];
  summary: {
    generalAverage: number | null;
    honors: string | null;
    promotionStatus: string | null;
    totalSubjects: number;
    completedSubjects: number;
  };
}

export interface AdvisorySummary {
  hasAdvisory: boolean;
  section?: {
    id: string;
    name: string;
    gradeLevel: string;
    schoolYear: string;
  };
  rankings?: {
    studentId: string;
    name: string;
    lrn: string;
    gender?: string;
    average: number | null;
    gradedSubjects: number;
    totalSubjects: number;
    rank: number | null;
    honors: string | null;
  }[];
  stats?: {
    totalStudents: number;
    gradedStudents: number;
    withHonors: number;
    passingRate: number;
  };
}

export const advisoryApi = {
  getMyAdvisory: () => api.get<AdvisoryData>("/advisory/my-advisory"),

  getStudentGrades: (studentId: string, schoolYear?: string) =>
    api.get<StudentGradeProfile>(`/advisory/student/${studentId}/grades`, {
      params: schoolYear ? { schoolYear } : {},
    }),

  getAdvisorySummary: () => api.get<AdvisorySummary>("/advisory/summary"),
};

export default api;
