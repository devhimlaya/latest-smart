import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  BookOpen,
  TrendingUp,
  ChevronRight,
  Award,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  Target,
  FileCheck,
  Star,
  Medal,
  Filter,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { gradesApi, type ClassAssignment } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DashboardData {
  teacher: {
    name: string;
    employeeId: string;
    specialization?: string;
  };
  stats: {
    totalClasses: number;
    totalStudents: number;
    subjects: string[];
  };
  classAssignments: ClassAssignment[];
}

interface ClassStats {
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
}

interface DashboardStats {
  classStats: ClassStats[];
  summary: {
    totalClasses: number;
    totalStudents: number;
    totalGraded: number;
    gradeSubmissionRate: number;
    overallPassingRate: number;
    studentsAtRisk: { id: string; name: string; grade: number; class: string }[];
    studentsAtRiskCount: number;
  };
}

interface MasteryDistribution {
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
}

const gradeLevelLabels: Record<string, string> = {
  GRADE_7: "Grade 7",
  GRADE_8: "Grade 8",
  GRADE_9: "Grade 9",
  GRADE_10: "Grade 10",
};

const gradeLevelColors: Record<string, string> = {
  GRADE_7: "bg-blue-100 text-blue-700 border-blue-200",
  GRADE_8: "bg-purple-100 text-purple-700 border-purple-200",
  GRADE_9: "bg-amber-100 text-amber-700 border-amber-200",
  GRADE_10: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function TeacherDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [masteryData, setMasteryData] = useState<MasteryDistribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHonorsClass, setSelectedHonorsClass] = useState<string>("all");
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");

  // Fetch mastery distribution with filters
  const fetchMasteryDistribution = async (gradeLevel?: string, sectionId?: string) => {
    try {
      const res = await gradesApi.getMasteryDistribution(
        gradeLevel === "all" ? undefined : gradeLevel,
        sectionId === "all" ? undefined : sectionId
      );
      setMasteryData(res.data);
    } catch (err) {
      console.error("Error fetching mastery distribution:", err);
    }
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashboardRes, statsRes, masteryRes] = await Promise.all([
          gradesApi.getDashboard(),
          gradesApi.getDashboardStats(),
          gradesApi.getMasteryDistribution(),
        ]);
        setData(dashboardRes.data);
        setStats(statsRes.data);
        setMasteryData(masteryRes.data);
      } catch (err) {
        setError("Failed to load dashboard data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Update mastery data when filters change
  useEffect(() => {
    if (!loading) {
      fetchMasteryDistribution(selectedGradeLevel, selectedSection);
    }
  }, [selectedGradeLevel, selectedSection]);

  // Get filtered sections based on selected grade level
  const filteredSections = selectedGradeLevel === "all"
    ? masteryData?.filters.sections || []
    : masteryData?.filters.sections.filter(s => s.gradeLevel === selectedGradeLevel) || [];

  // Prepare chart data
  const chartData = masteryData ? [
    { 
      name: "Outstanding", 
      range: "90-100", 
      students: masteryData.distribution.outstanding,
      fill: "#10b981" // emerald-500
    },
    { 
      name: "Very Satisfactory", 
      range: "85-89", 
      students: masteryData.distribution.verySatisfactory,
      fill: "#3b82f6" // blue-500
    },
    { 
      name: "Satisfactory", 
      range: "80-84", 
      students: masteryData.distribution.satisfactory,
      fill: "#f59e0b" // amber-500
    },
    { 
      name: "Fairly Satisfactory", 
      range: "75-79", 
      students: masteryData.distribution.fairlySatisfactory,
      fill: "#f97316" // orange-500
    },
    { 
      name: "Did Not Meet", 
      range: "<75", 
      students: masteryData.distribution.didNotMeet,
      fill: "#ef4444" // red-500
    },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shadow-lg shadow-emerald-100 animate-pulse">
            <div className="w-10 h-10 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-500 font-medium">Loading your dashboard...</p>
          <p className="text-gray-400 text-sm mt-1">Please wait a moment</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center shadow-lg">
            <span className="text-4xl">😕</span>
          </div>
          <h3 className="font-semibold text-gray-900 text-lg mb-2">Something went wrong</h3>
          <p className="text-gray-500 mb-6">{error || "Failed to load dashboard data"}</p>
          <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* DepEd Mastery Level Distribution Chart */}
      <Card className="border-0 shadow-xl shadow-gray-200/50 bg-white overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">DepEd Mastery Level Distribution</CardTitle>
                <CardDescription className="text-gray-500 text-sm">Q1 student performance by mastery level</CardDescription>
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500 font-medium">Filter:</span>
              </div>
              <Select 
                value={selectedGradeLevel} 
                onValueChange={(val) => {
                  if (val) setSelectedGradeLevel(val);
                  setSelectedSection("all"); // Reset section when grade level changes
                }}
              >
                <SelectTrigger className="w-36 bg-white border-gray-200 rounded-xl">
                  <SelectValue placeholder="Grade Level">
                    {selectedGradeLevel === "all" ? "All Grades" : gradeLevelLabels[selectedGradeLevel] || selectedGradeLevel}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="rounded-lg">All Grades</SelectItem>
                  {masteryData?.filters.gradeLevels.map((gl) => (
                    <SelectItem key={gl} value={gl} className="rounded-lg">
                      {gradeLevelLabels[gl] || gl}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedSection} onValueChange={(val) => val && setSelectedSection(val)}>
                <SelectTrigger className="w-40 bg-white border-gray-200 rounded-xl">
                  <SelectValue placeholder="Section">
                    {selectedSection === "all" 
                      ? "All Sections" 
                      : filteredSections.find(s => s.id === selectedSection)?.name || selectedSection}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="rounded-lg">All Sections</SelectItem>
                  {filteredSections.map((section) => (
                    <SelectItem key={section.id} value={section.id} className="rounded-lg">
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge className="bg-emerald-100 text-emerald-700 font-semibold px-3 py-1">
                {masteryData?.totalStudents || 0} Students Graded
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  label={{ value: 'Number of Students', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11, dx: -5 }}
                  allowDecimals={false}
                  width={50}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value, _name, props) => [
                    `${value} student${Number(value) !== 1 ? 's' : ''}`,
                    `${(props.payload as { name: string; range: string }).name} (${(props.payload as { name: string; range: string }).range})`
                  ]}
                  labelFormatter={() => ''}
                />
                <Bar 
                  dataKey="students" 
                  radius={[8, 8, 0, 0]}
                  maxBarSize={80}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-4 pt-4 border-t border-gray-100">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: item.fill }} />
                <span className="text-xs sm:text-sm text-gray-600">
                  {item.name} <span className="text-gray-400">({item.range})</span>
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards - Modern Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: "Total Classes", value: data.stats.totalClasses, icon: BookOpen, color: "blue", gradient: "from-blue-500 to-indigo-600" },
          { label: "Students", value: data.stats.totalStudents, icon: Users, color: "emerald", gradient: "from-emerald-500 to-teal-600" },
          { label: "Academic Year", value: "2025-2026", icon: Calendar, color: "purple", gradient: "from-purple-500 to-violet-600" },
          { label: "Current Quarter", value: "Q1", icon: Award, color: "amber", gradient: "from-amber-500 to-orange-600" },
        ].map((stat, index) => (
          <Card 
            key={stat.label} 
            className="group border-0 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300 bg-white overflow-hidden"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-6 h-full flex flex-col">
              <div className="flex items-start justify-between flex-1">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-3 tracking-tight">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 flex-shrink-0 ml-2`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm">
                  <span className={`flex items-center gap-1 text-${stat.color}-600 font-medium`}>
                    <TrendingUp className="w-4 h-4" />
                    Active
                  </span>
                  <span className="text-gray-400">this semester</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grading Progress & Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grading Progress */}
        <Card className="border-0 shadow-xl shadow-gray-200/50 bg-white overflow-hidden rounded-2xl">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">Grading Progress</CardTitle>
                <CardDescription className="text-gray-500 text-sm">Q1 grade submission status</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {stats?.classStats.slice(0, 4).map((classStat) => {
                const percentage = classStat.totalStudents > 0 
                  ? Math.round((classStat.gradedCount / classStat.totalStudents) * 100)
                  : 0;
                const isComplete = percentage === 100;
                
                return (
                  <div key={classStat.id} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{gradeLevelLabels[classStat.gradeLevel as keyof typeof gradeLevelLabels] || classStat.gradeLevel}</span>
                        <span className="text-gray-400 text-xs">• <span className="font-bold text-gray-600">{classStat.sectionName}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isComplete ? (
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs font-medium">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Complete
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-500">{classStat.gradedCount}/{classStat.totalStudents}</span>
                        )}
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <Link to="/teacher/classes" className="block mt-5">
              <Button variant="outline" size="sm" className="w-full rounded-xl font-medium hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200">
                View All Classes
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Class Performance */}
        <Card className="border-0 shadow-xl shadow-gray-200/50 bg-white overflow-hidden rounded-2xl">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">Class Performance</CardTitle>
                <CardDescription className="text-gray-500 text-sm">Average grades by class</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {stats?.classStats.slice(0, 4).map((classStat) => {
                const avgGrade = classStat.avgGrade ?? 0;
                
                return (
                  <div key={classStat.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${
                        avgGrade >= 90 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                        avgGrade >= 85 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                        avgGrade >= 80 ? 'bg-gradient-to-br from-amber-500 to-orange-500' :
                        avgGrade >= 75 ? 'bg-gradient-to-br from-orange-500 to-red-500' :
                        'bg-gradient-to-br from-gray-400 to-gray-500'
                      }`}>
                        {avgGrade > 0 ? avgGrade : '-'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{gradeLevelLabels[classStat.gradeLevel as keyof typeof gradeLevelLabels] || classStat.gradeLevel}</p>
                        <p className="text-xs text-gray-500 font-bold">{classStat.sectionName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-600">{classStat.passingRate}%</p>
                      <p className="text-xs text-gray-400">passing</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Honors Section with Dropdown & Students Needing Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Honors / With Honors Students */}
        <Card className="lg:col-span-2 border-0 shadow-xl shadow-gray-200/50 bg-white overflow-hidden rounded-2xl">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 text-white shadow-lg">
                  <Medal className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900">Honor Students</CardTitle>
                  <CardDescription className="text-gray-500 text-sm">Students with outstanding performance (85+)</CardDescription>
                </div>
              </div>
              <Select value={selectedHonorsClass} onValueChange={(val) => val && setSelectedHonorsClass(val)}>
                <SelectTrigger className="w-52 bg-white border-gray-200 rounded-xl">
                  <SelectValue placeholder="Select Class">
                    {selectedHonorsClass === "all" 
                      ? "All Classes" 
                      : (() => {
                          const cs = stats?.classStats.find(c => c.id === selectedHonorsClass);
                          return cs ? `${gradeLevelLabels[cs.gradeLevel as keyof typeof gradeLevelLabels] || cs.gradeLevel} - ${cs.sectionName}` : selectedHonorsClass;
                        })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="rounded-lg">All Classes</SelectItem>
                  {stats?.classStats.map((cs) => (
                    <SelectItem key={cs.id} value={cs.id} className="rounded-lg">
                      {gradeLevelLabels[cs.gradeLevel as keyof typeof gradeLevelLabels] || cs.gradeLevel} - {cs.sectionName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {(() => {
              const filteredStats = selectedHonorsClass === "all" 
                ? stats?.classStats 
                : stats?.classStats.filter(cs => cs.id === selectedHonorsClass);
              
              const allHonors = filteredStats?.flatMap(cs => 
                [...cs.honorsStudents, ...cs.withHonorsStudents].map(s => ({
                  ...s,
                  class: `${gradeLevelLabels[cs.gradeLevel as keyof typeof gradeLevelLabels] || cs.gradeLevel} - ${cs.sectionName}`
                }))
              ) || [];
              
              const sortedHonors = allHonors.sort((a, b) => b.grade - a.grade);
              
              if (sortedHonors.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <Star className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p>No honor students in this selection yet.</p>
                  </div>
                );
              }
              
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                  {sortedHonors.slice(0, 10).map((student, index) => (
                    <div key={`${student.id}-${index}`} className={`flex items-center justify-between p-3 rounded-xl border ${
                      student.honor === "Highest Honors" ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-amber-200' :
                      student.honor === "High Honors" ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-orange-200' :
                      student.honor === "Honors" ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' :
                      'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          student.honor === "Highest Honors" ? 'bg-yellow-100' :
                          student.honor === "High Honors" ? 'bg-amber-100' :
                          student.honor === "Honors" ? 'bg-blue-100' :
                          'bg-emerald-100'
                        }`}>
                          <Star className={`w-4 h-4 ${
                            student.honor === "Highest Honors" ? 'text-yellow-600' :
                            student.honor === "High Honors" ? 'text-amber-600' :
                            student.honor === "Honors" ? 'text-blue-600' :
                            'text-emerald-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{student.name}</p>
                          <p className="text-xs text-gray-500"><span className="font-bold">{student.class.split(' - ')[0]}</span> - <span className="font-bold">{student.class.split(' - ')[1]}</span></p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          student.honor === "Highest Honors" ? 'text-yellow-600' :
                          student.honor === "High Honors" ? 'text-amber-600' :
                          student.honor === "Honors" ? 'text-blue-600' :
                          'text-emerald-600'
                        }`}>{student.grade}</p>
                        <Badge className={`text-xs ${
                          student.honor === "Highest Honors" ? 'bg-yellow-100 text-yellow-700' :
                          student.honor === "High Honors" ? 'bg-amber-100 text-amber-700' :
                          student.honor === "Honors" ? 'bg-blue-100 text-blue-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>{student.honor}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
            {(() => {
              const filteredStats = selectedHonorsClass === "all" 
                ? stats?.classStats 
                : stats?.classStats.filter(cs => cs.id === selectedHonorsClass);
              const totalHonors = filteredStats?.reduce((sum, cs) => 
                sum + cs.honorsStudents.length + cs.withHonorsStudents.length, 0) || 0;
              
              if (totalHonors > 10) {
                return (
                  <p className="text-center text-sm text-gray-400 mt-4">
                    Showing top 10 of {totalHonors} honor students
                  </p>
                );
              }
              return null;
            })()}
          </CardContent>
        </Card>

        {/* Quick Stats Summary */}
        <Card className="border-0 shadow-xl shadow-gray-200/50 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 overflow-hidden rounded-2xl text-white">
          <CardContent className="p-6 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">Quick Summary</h3>
            </div>
            
            <div className="space-y-4 flex-1">
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                <p className="text-emerald-100 text-sm mb-1">Overall Passing Rate</p>
                <p className="text-3xl font-bold">{stats?.summary.overallPassingRate ?? 0}%</p>
              </div>
              
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                <p className="text-emerald-100 text-sm mb-1">Grade Submissions</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold">{stats?.summary.gradeSubmissionRate ?? 0}%</p>
                  <Badge className="bg-white/20 text-white text-xs">Q1</Badge>
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                <p className="text-emerald-100 text-sm mb-1">Students At Risk</p>
                <p className="text-3xl font-bold">{stats?.summary.studentsAtRiskCount ?? 0}</p>
              </div>
            </div>

            <Link to="/teacher/classes" className="block mt-4">
              <Button className="w-full bg-white text-emerald-600 hover:bg-emerald-50 font-semibold rounded-xl">
                Enter Grades
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Students At Risk Section */}
      {stats && stats.summary.studentsAtRisk.length > 0 && (
        <Card className="border-0 shadow-xl shadow-gray-200/50 bg-white overflow-hidden rounded-2xl">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-red-50 to-rose-50 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-lg">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900">Students Needing Attention</CardTitle>
                  <CardDescription className="text-gray-500 text-sm">Students at risk of failing (below 75)</CardDescription>
                </div>
              </div>
              <Badge className="bg-red-100 text-red-700 font-semibold">
                {stats.summary.studentsAtRiskCount} students
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="max-h-[280px] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stats.summary.studentsAtRisk.map((student, index) => (
                  <div key={`${student.id}-${index}`} className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                        <span className="text-red-600 font-bold text-sm">{student.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{student.name}</p>
                        <p className="text-xs text-gray-500"><span className="font-bold">{student.class.split(' - ')[0]}</span> - <span className="font-bold">{student.class.split(' - ')[1]}</span></p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">{student.grade}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {stats.summary.studentsAtRiskCount > 6 && (
              <p className="text-center text-sm text-gray-400 mt-4">
                Scroll to see all {stats.summary.studentsAtRiskCount} students at risk
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Classes - Compact View */}
      <Card className="border-0 shadow-xl shadow-gray-200/50 bg-white overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">My Classes</CardTitle>
                <CardDescription className="text-gray-500 text-sm">Quick access to your assigned classes</CardDescription>
              </div>
            </div>
            <Link to="/teacher/classes">
              <Button variant="outline" size="sm" className="rounded-xl font-medium hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200">
                View All
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.classAssignments.map((assignment) => (
              <Link
                key={assignment.id}
                to={`/teacher/records/${assignment.id}`}
                className="block group"
              >
                <div className="p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 bg-white">
                  <div className="flex items-start justify-between mb-3">
                    <Badge
                      variant="secondary"
                      className={`${gradeLevelColors[assignment.section.gradeLevel]} border font-medium text-xs px-2 py-0.5`}
                    >
                      {gradeLevelLabels[assignment.section.gradeLevel]}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h4 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{gradeLevelLabels[assignment.section.gradeLevel]}</h4>
                  <p className="text-sm text-gray-500 mt-1">Section <span className="font-bold text-gray-700">{assignment.section.name}</span></p>
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>{assignment.section._count?.enrollments ?? assignment.section.enrollments?.length ?? 0} students</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
