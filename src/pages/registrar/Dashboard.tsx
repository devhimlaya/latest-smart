import { Link } from "react-router-dom";
import {
  Users,
  FileText,
  GraduationCap,
  TrendingUp,
  ChevronRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  BarChart3,
  FolderOpen,
  Printer,
  ClipboardList,
  UserPlus,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const gradeLevelLabels: Record<string, string> = {
  GRADE_7: "Grade 7",
  GRADE_8: "Grade 8",
  GRADE_9: "Grade 9",
  GRADE_10: "Grade 10",
};

// Mock data for the dashboard
const mockStats = {
  totalStudents: 850,
  totalSections: 24,
  enrolledThisSY: 120,
  pendingEnrollments: 15,
};

const mockRecentEnrollments = [
  { id: 1, name: "Santos, Maria Clara", gradeLevel: "GRADE_7", section: "Einstein", date: "Mar 30, 2026", status: "Approved" },
  { id: 2, name: "Reyes, Juan Miguel", gradeLevel: "GRADE_8", section: "Newton", date: "Mar 29, 2026", status: "Pending" },
  { id: 3, name: "Cruz, Angela Mae", gradeLevel: "GRADE_7", section: "Darwin", date: "Mar 28, 2026", status: "Approved" },
  { id: 4, name: "Garcia, Paolo Jose", gradeLevel: "GRADE_9", section: "Galileo", date: "Mar 27, 2026", status: "Pending" },
  { id: 5, name: "Fernandez, Sofia", gradeLevel: "GRADE_10", section: "Curie", date: "Mar 26, 2026", status: "Approved" },
];

const mockSchoolForms = [
  { id: "SF1", name: "School Register", description: "Learner's basic profile and enrollment", icon: ClipboardList, count: 850 },
  { id: "SF2", name: "Daily Attendance", description: "Daily attendance record of learners", icon: Calendar, count: 24 },
  { id: "SF4", name: "Monthly Report", description: "Monthly school attendance summary", icon: BarChart3, count: 8 },
  { id: "SF5", name: "Report on Promotion", description: "Learner's promotion and retention", icon: GraduationCap, count: 850 },
  { id: "SF9", name: "Report Card", description: "Learner's progress report card", icon: FileText, count: 850 },
  { id: "SF10", name: "Learner's Permanent Record", description: "Cumulative academic record", icon: FolderOpen, count: 850 },
];

const mockSectionSummary = [
  { gradeLevel: "GRADE_7", sections: 6, students: 240, complete: 5, pending: 1 },
  { gradeLevel: "GRADE_8", sections: 6, students: 220, complete: 4, pending: 2 },
  { gradeLevel: "GRADE_9", sections: 6, students: 200, complete: 6, pending: 0 },
  { gradeLevel: "GRADE_10", sections: 6, students: 190, complete: 3, pending: 3 },
];

export default function RegistrarDashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#111827' }}>
            Registrar Dashboard
          </h1>
          <p style={{ color: '#6b7280' }} className="mt-1">
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
          { label: "Total\nStudents", value: mockStats.totalStudents, icon: Users, color: "blue", gradient: "from-blue-500 to-indigo-600" },
          { label: "Total\nSections", value: mockStats.totalSections, icon: FolderOpen, color: "purple", gradient: "from-purple-500 to-violet-600" },
          { label: "Enrolled\nThis S.Y.", value: mockStats.enrolledThisSY, icon: UserPlus, color: "emerald", gradient: "from-emerald-500 to-teal-600" },
          { label: "Pending\nEnrollments", value: mockStats.pendingEnrollments, icon: Clock, color: "amber", gradient: "from-amber-500 to-orange-600" },
        ].map((stat) => (
          <Card 
            key={stat.label} 
            className="group border-0 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300 bg-white overflow-hidden"
          >
            <CardContent className="p-6 h-full flex flex-col">
              <div className="flex items-start justify-between flex-1">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider whitespace-pre-line leading-tight h-10 flex items-center">{stat.label}</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2 tracking-tight">{stat.value}</p>
                </div>
                <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 flex-shrink-0`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm">
                  <span className={`flex items-center gap-1 text-${stat.color}-600 font-medium`}>
                    <TrendingUp className="w-4 h-4" />
                    Active
                  </span>
                  <span className="text-gray-400">S.Y. 2025-2026</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockSchoolForms.map((form) => (
              <Link
                key={form.id}
                to={`/registrar/forms/${form.id.toLowerCase()}`}
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
                        <Badge className="bg-blue-100 text-blue-700 text-xs">{form.count}</Badge>
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

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Enrollments */}
        <Card className="border-0 shadow-xl shadow-gray-200/50 bg-white overflow-hidden rounded-2xl">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900">Recent Enrollments</CardTitle>
                  <CardDescription className="text-gray-500 text-sm">Latest enrollment activities</CardDescription>
                </div>
              </div>
              <Link to="/registrar/enrollment">
                <Button variant="ghost" size="sm" className="rounded-xl font-medium text-blue-600 hover:bg-blue-50">
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {mockRecentEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                      {enrollment.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{enrollment.name}</p>
                      <p className="text-xs text-gray-500">
                        {gradeLevelLabels[enrollment.gradeLevel]} - {enrollment.section}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={enrollment.status === "Approved" 
                      ? "bg-emerald-100 text-emerald-700" 
                      : "bg-amber-100 text-amber-700"
                    }>
                      {enrollment.status === "Approved" ? (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      ) : (
                        <Clock className="w-3 h-3 mr-1" />
                      )}
                      {enrollment.status}
                    </Badge>
                    <p className="text-xs text-gray-400 mt-1">{enrollment.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section Summary */}
        <Card className="border-0 shadow-xl shadow-gray-200/50 bg-white overflow-hidden rounded-2xl">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900">Section Summary</CardTitle>
                  <CardDescription className="text-gray-500 text-sm">Grade level breakdown</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {mockSectionSummary.map((item) => (
                <div key={item.gradeLevel} className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-blue-100 text-blue-700 font-semibold px-3">
                        {gradeLevelLabels[item.gradeLevel]}
                      </Badge>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{item.students} students</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <FolderOpen className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{item.sections} sections</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-600">{item.complete} complete</span>
                    </div>
                    {item.pending > 0 && (
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <span className="text-amber-600">{item.pending} pending</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-xl shadow-gray-200/50 bg-white overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">Quick Actions</CardTitle>
              <CardDescription className="text-gray-500 text-sm">Common registrar tasks</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: "Print SF1", icon: ClipboardList, href: "/registrar/print/sf1", color: "blue" },
              { name: "Print SF9", icon: FileText, href: "/registrar/print/sf9", color: "indigo" },
              { name: "Print SF10", icon: FolderOpen, href: "/registrar/print/sf10", color: "purple" },
              { name: "Enroll Student", icon: UserPlus, href: "/registrar/enrollment/new", color: "emerald" },
            ].map((action) => (
              <Link key={action.name} to={action.href}>
                <div className={`p-4 rounded-xl border border-gray-100 hover:border-${action.color}-200 hover:shadow-lg hover:shadow-${action.color}-500/10 transition-all duration-300 bg-white text-center group cursor-pointer`}>
                  <div className={`w-12 h-12 mx-auto rounded-xl bg-${action.color}-50 text-${action.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <p className="mt-3 font-semibold text-gray-900 text-sm">{action.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
