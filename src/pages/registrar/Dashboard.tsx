import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  FileText,
  TrendingUp,
  ChevronRight,
  ArrowUpRight,
  BarChart3,
  FolderOpen,
  ClipboardList,
  UserPlus,
  Loader2,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { registrarApi } from "@/lib/api";

const gradeLevelLabels: Record<string, string> = {
  GRADE_7: "Grade 7",
  GRADE_8: "Grade 8",
  GRADE_9: "Grade 9",
  GRADE_10: "Grade 10",
  "7": "Grade 7",
  "8": "Grade 8",
  "9": "Grade 9",
  "10": "Grade 10",
};

const schoolForms = [
  { id: "SF8", name: "Class Grades", description: "Class grades summary by section", icon: BookOpen },
  { id: "SF9", name: "Report Card", description: "Learner's progress report card", icon: FileText },
  { id: "SF10", name: "Permanent Record", description: "Cumulative academic record", icon: FolderOpen },
];

interface DashboardStats {
  totalStudents: number;
  totalSections: number;
  maleCount: number;
  femaleCount: number;
}

interface SectionData {
  id: string;
  name: string;
  gradeLevel: string;
  studentCount: number;
  adviser: string | null;
}

export default function RegistrarDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({ totalStudents: 0, totalSections: 0, maleCount: 0, femaleCount: 0 });
  const [sections, setSections] = useState<SectionData[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch sections and students data
        const [studentsRes, sectionsRes] = await Promise.all([
          registrarApi.getStudents({ schoolYear: "2025-2026" }),
          registrarApi.getSections({ schoolYear: "2025-2026" }),
        ]);

        const studentsData = studentsRes.data.students || studentsRes.data;
        const students = Array.isArray(studentsData) ? studentsData : [];
        const sectionsData = sectionsRes.data || [];

        // Calculate stats
        setStats({
          totalStudents: students.length,
          totalSections: sectionsData.length,
          maleCount: students.filter((s: any) => s.gender?.toLowerCase() === "male").length,
          femaleCount: students.filter((s: any) => s.gender?.toLowerCase() === "female").length,
        });

        // Transform sections data
        setSections(sectionsData.map((s: any) => ({
          id: s.id,
          name: s.name,
          gradeLevel: s.gradeLevel,
          studentCount: s._count?.enrollments || 0,
          adviser: s.adviser,
        })));
      } catch (error: any) {
        console.error("Error loading dashboard:", error);
        if (error.response?.status === 403) {
          setError("Access denied. Please log in as Registrar.");
        } else if (error.response?.status === 401) {
          setError("Session expired. Please log in again.");
        } else {
          setError("Failed to load dashboard data. Please check server connection.");
        }
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  // Group sections by grade level
  const sectionsByGrade = sections.reduce((acc, section) => {
    const grade = section.gradeLevel;
    if (!acc[grade]) {
      acc[grade] = { sections: [], studentCount: 0 };
    }
    acc[grade].sections.push(section);
    acc[grade].studentCount += section.studentCount;
    return acc;
  }, {} as Record<string, { sections: SectionData[]; studentCount: number }>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <ClipboardList className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Dashboard</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Registrar Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Manage student records, enrollment, and school forms
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/registrar/enrollment">
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl px-5 py-2.5 font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all">
              <UserPlus className="w-4 h-4 mr-2" />
              New Enrollment
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: "Total\nStudents", value: stats.totalStudents, icon: Users, gradient: "from-blue-500 to-indigo-600" },
          { label: "Total\nSections", value: stats.totalSections, icon: FolderOpen, gradient: "from-purple-500 to-violet-600" },
          { label: "Male\nStudents", value: stats.maleCount, icon: Users, gradient: "from-sky-500 to-blue-600" },
          { label: "Female\nStudents", value: stats.femaleCount, icon: Users, gradient: "from-pink-500 to-rose-600" },
        ].map((stat) => (
          <Card 
            key={stat.label} 
            className="group border-0 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-all duration-300 bg-white overflow-hidden"
          >
            <CardContent className="p-6 h-full flex flex-col">
              <div className="flex items-start justify-between flex-1">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider whitespace-pre-line leading-tight h-10 flex items-center">{stat.label}</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2 tracking-tight">{stat.value}</p>
                </div>
                <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg group-hover:scale-110 transition-all duration-300 flex-shrink-0`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex items-center gap-1 text-blue-600 font-medium">
                    <TrendingUp className="w-4 h-4" />
                    Active
                  </span>
                  <span className="text-gray-400">S.Y. 2024-2025</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* School Forms Quick Access */}
      <Card className="border-0 shadow-xl shadow-gray-200/50 bg-white overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">DepEd School Forms</CardTitle>
                <CardDescription className="text-gray-500 text-sm">Quick access to official school forms</CardDescription>
              </div>
            </div>
            <Link to="/registrar/forms">
              <Button variant="outline" size="sm" className="rounded-xl font-medium hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200">
                View All
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {schoolForms.map((form) => (
              <Link
                key={form.id}
                to="/registrar/forms"
                className="group"
              >
                <div className="p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 bg-white">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                      <form.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-900">{form.id}</h4>
                      </div>
                      <p className="text-sm font-medium text-gray-700 mt-0.5">{form.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{form.description}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-xl shadow-gray-200/50 bg-white overflow-hidden rounded-2xl">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900">Grade Level Summary</CardTitle>
                  <CardDescription className="text-gray-500 text-sm">Students per grade level</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {Object.entries(sectionsByGrade).map(([grade, data]) => (
                <div key={grade} className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-blue-100 text-blue-700 font-semibold px-3">
                      {gradeLevelLabels[grade] || grade}
                    </Badge>
                    <span className="text-sm font-bold text-gray-900">{data.studentCount} students</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <FolderOpen className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{data.sections.length} section(s)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sections List */}
        <Card className="border-0 shadow-xl shadow-gray-200/50 bg-white overflow-hidden rounded-2xl">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900">Sections</CardTitle>
                  <CardDescription className="text-gray-500 text-sm">All sections this school year</CardDescription>
                </div>
              </div>
              <Link to="/registrar/students">
                <Button variant="ghost" size="sm" className="rounded-xl font-medium text-blue-600 hover:bg-blue-50">
                  View Students
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              {sections.map((section) => (
                <div key={section.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                      {section.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        Grade {(section.gradeLevel || "").replace("GRADE_", "")} - {section.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {section.adviser || "No adviser assigned"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {section.studentCount} students
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
