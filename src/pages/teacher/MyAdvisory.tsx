import { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Users,
  GraduationCap,
  Calendar,
  ChevronRight,
  Search,
  UserCircle,
  BookOpen,
  ClipboardList,
  SplitSquareHorizontal,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { advisoryApi, type AdvisoryData } from "@/lib/api";

const gradeLevelLabels: Record<string, string> = {
  GRADE_7: "Grade 7",
  GRADE_8: "Grade 8",
  GRADE_9: "Grade 9",
  GRADE_10: "Grade 10",
};

export default function MyAdvisory() {
  const location = useLocation();
  const [data, setData] = useState<AdvisoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [separateByGender, setSeparateByGender] = useState(false);

  const fetchAdvisory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await advisoryApi.getMyAdvisory();
      setData(res.data);
    } catch (err) {
      setError("Failed to load advisory data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch when navigating to the page (location.key changes)
  useEffect(() => {
    fetchAdvisory();
  }, [fetchAdvisory, location.key]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center shadow-lg shadow-purple-100 animate-pulse">
            <div className="w-10 h-10 border-[3px] border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-500 font-medium">Loading your advisory...</p>
          <p className="text-gray-400 text-sm mt-1">Please wait a moment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center shadow-lg">
            <span className="text-4xl">😕</span>
          </div>
          <h3 className="font-semibold text-gray-900 text-lg mb-2">Something went wrong</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 shadow-lg shadow-purple-500/25">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!data?.hasAdvisory) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gray-100 to-slate-100 flex items-center justify-center shadow-lg">
            <ClipboardList className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="font-bold text-gray-900 text-xl mb-2">No Advisory Section Assigned</h3>
          <p className="text-gray-500 mb-6">
            You don't have an advisory section yet. Please contact your school administrator to be assigned as a class adviser.
          </p>
          <Link to="/teacher">
            <Button variant="outline" className="rounded-xl">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Filter students based on search query
  const filteredStudents = data.students?.filter((student) => {
    const fullName = `${student.lastName}, ${student.firstName} ${student.middleName || ""}`.toLowerCase();
    const lrn = student.lrn.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || lrn.includes(query);
  }) || [];

  // Separate by gender if enabled
  const maleStudents = filteredStudents
    .filter((s) => s.gender?.toLowerCase() === "male")
    .sort((a, b) => {
      const nameA = `${a.lastName}, ${a.firstName}`.toLowerCase();
      const nameB = `${b.lastName}, ${b.firstName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

  const femaleStudents = filteredStudents
    .filter((s) => s.gender?.toLowerCase() === "female")
    .sort((a, b) => {
      const nameA = `${a.lastName}, ${a.firstName}`.toLowerCase();
      const nameB = `${b.lastName}, ${b.firstName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

  // Combined list (alphabetically sorted)
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const nameA = `${a.lastName}, ${a.firstName}`.toLowerCase();
    const nameB = `${b.lastName}, ${b.firstName}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-violet-500 to-indigo-500 p-8 lg:p-10 text-white shadow-2xl shadow-purple-500/20">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 animate-float" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 animate-float" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-purple-100" />
              </div>
              <span className="text-sm text-purple-100 font-semibold tracking-wide uppercase">Advisory Class</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-3 tracking-tight !text-white">
              {gradeLevelLabels[data.section?.gradeLevel || ""] || data.section?.gradeLevel} - {data.section?.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="bg-white/20 text-white border-0 font-semibold px-3 py-1 backdrop-blur-sm">
                <Users className="w-4 h-4 mr-1.5" />
                {data.stats?.totalStudents} Students
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-0 font-semibold px-3 py-1 backdrop-blur-sm">
                <Calendar className="w-4 h-4 mr-1.5" />
                S.Y. {data.section?.schoolYear}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
              <UserCircle className="w-7 h-7 text-purple-100" />
            </div>
            <div>
              <p className="text-xs text-purple-200 uppercase tracking-wider font-semibold">Class Adviser</p>
              <p className="text-xl font-bold mt-0.5">{data.teacher.name}</p>
              <p className="text-sm text-purple-100 mt-0.5">{data.teacher.employeeId}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="border-0 shadow-lg shadow-gray-200/50 bg-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Students</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{data.stats?.totalStudents || 0}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-gray-200/50 bg-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Male</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{data.stats?.maleCount || 0}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <UserCircle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-gray-200/50 bg-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Female</p>
                <p className="text-3xl font-bold text-pink-600 mt-1">{data.stats?.femaleCount || 0}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg">
                <UserCircle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-gray-200/50 bg-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Subjects</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{data.subjects?.length || 0}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Teachers */}
      {data.subjects && data.subjects.length > 0 && (
        <Card className="border-0 shadow-xl shadow-gray-200/50 bg-white overflow-hidden rounded-2xl">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">Subject Teachers</CardTitle>
                <CardDescription className="text-gray-500 text-sm">Teachers handling this section</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.subjects.map((subject) => (
                <div key={subject.id} className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{subject.name}</p>
                    <p className="text-xs text-gray-500">{subject.teacher}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student List */}
      <Card className="border-0 shadow-xl shadow-gray-200/50 bg-white overflow-hidden rounded-2xl p-0">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">Class List</CardTitle>
                <CardDescription className="text-gray-500 text-sm">Click on a student to view their complete grades</CardDescription>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant={separateByGender ? "default" : "outline"}
                size="sm"
                onClick={() => setSeparateByGender(!separateByGender)}
                className={`rounded-xl font-medium ${
                  separateByGender 
                    ? "bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white" 
                    : "hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200"
                }`}
              >
                <SplitSquareHorizontal className="w-4 h-4 mr-2" />
                {separateByGender ? "Gender Separated" : "Group by Gender"}
              </Button>
              
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name or LRN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl border-gray-200"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">{separateByGender ? (
              // Gender-separated view
              <>
                {/* Male Students */}
                {maleStudents.length > 0 && (
                  <>
                    <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500 text-white">
                          Male
                        </Badge>
                        <span className="text-sm font-semibold text-blue-900">
                          {maleStudents.length} {maleStudents.length === 1 ? 'Student' : 'Students'}
                        </span>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-blue-50/50">
                          <TableHead className="w-16 text-center font-bold">#</TableHead>
                          <TableHead className="font-bold">LRN</TableHead>
                          <TableHead className="font-bold">Student Name</TableHead>
                          <TableHead className="font-bold">Guardian</TableHead>
                          <TableHead className="w-24 text-center font-bold">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {maleStudents.map((student, index) => (
                          <TableRow key={student.id} className="hover:bg-blue-50/30 transition-colors">
                            <TableCell className="text-center font-medium text-gray-500">{index + 1}</TableCell>
                            <TableCell className="font-mono text-sm text-gray-600">{student.lrn}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-white bg-gradient-to-br from-blue-500 to-indigo-600">
                                  {student.lastName.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    {student.lastName}, {student.firstName} {student.middleName ? `${student.middleName.charAt(0)}.` : ""} {student.suffix || ""}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600 text-sm">
                              {student.guardianName || "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              <Link to={`/teacher/advisory/student/${student.id}`}>
                                <Button 
                                  size="sm" 
                                  className="rounded-lg bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 shadow-md"
                                >
                                  View
                                  <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}

                {/* Female Students */}
                {femaleStudents.length > 0 && (
                  <>
                    <div className="px-6 py-3 bg-pink-50 border-b border-pink-100">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-pink-500 text-white">
                          Female
                        </Badge>
                        <span className="text-sm font-semibold text-pink-900">
                          {femaleStudents.length} {femaleStudents.length === 1 ? 'Student' : 'Students'}
                        </span>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-pink-50/50">
                          <TableHead className="w-16 text-center font-bold">#</TableHead>
                          <TableHead className="font-bold">LRN</TableHead>
                          <TableHead className="font-bold">Student Name</TableHead>
                          <TableHead className="font-bold">Guardian</TableHead>
                          <TableHead className="w-24 text-center font-bold">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {femaleStudents.map((student, index) => (
                          <TableRow key={student.id} className="hover:bg-pink-50/30 transition-colors">
                            <TableCell className="text-center font-medium text-gray-500">{index + 1}</TableCell>
                            <TableCell className="font-mono text-sm text-gray-600">{student.lrn}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-white bg-gradient-to-br from-pink-500 to-rose-600">
                                  {student.lastName.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    {student.lastName}, {student.firstName} {student.middleName ? `${student.middleName.charAt(0)}.` : ""} {student.suffix || ""}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600 text-sm">
                              {student.guardianName || "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              <Link to={`/teacher/advisory/student/${student.id}`}>
                                <Button 
                                  size="sm" 
                                  className="rounded-lg bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 shadow-md"
                                >
                                  View
                                  <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}

                {maleStudents.length === 0 && femaleStudents.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    {searchQuery ? "No students found matching your search." : "No students enrolled in this section."}
                  </div>
                )}
              </>
            ) : (
              // Combined view
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="w-16 text-center font-bold">#</TableHead>
                    <TableHead className="font-bold">LRN</TableHead>
                    <TableHead className="font-bold">Student Name</TableHead>
                    <TableHead className="font-bold text-center">Gender</TableHead>
                    <TableHead className="font-bold">Guardian</TableHead>
                    <TableHead className="w-24 text-center font-bold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                        {searchQuery ? "No students found matching your search." : "No students enrolled in this section."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedStudents.map((student, index) => (
                      <TableRow key={student.id} className="hover:bg-purple-50/30 transition-colors">
                        <TableCell className="text-center font-medium text-gray-500">{index + 1}</TableCell>
                        <TableCell className="font-mono text-sm text-gray-600">{student.lrn}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-white ${
                              student.gender?.toLowerCase() === "male" 
                                ? "bg-gradient-to-br from-blue-500 to-indigo-600" 
                                : "bg-gradient-to-br from-pink-500 to-rose-600"
                            }`}>
                              {student.lastName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {student.lastName}, {student.firstName} {student.middleName ? `${student.middleName.charAt(0)}.` : ""} {student.suffix || ""}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={`${
                            student.gender?.toLowerCase() === "male"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-pink-100 text-pink-700"
                          }`}>
                            {student.gender || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm">
                          {student.guardianName || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Link to={`/teacher/advisory/student/${student.id}`}>
                            <Button 
                              size="sm" 
                              className="rounded-lg bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 shadow-md"
                            >
                              View
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
