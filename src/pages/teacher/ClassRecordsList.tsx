import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Users, ChevronRight, Search, Filter, LayoutGrid, List, Sparkles, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { gradesApi, type ClassAssignment } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";

const gradeLevelLabels: Record<string, string> = {
  GRADE_7: "Grade 7",
  GRADE_8: "Grade 8",
  GRADE_9: "Grade 9",
  GRADE_10: "Grade 10",
};

const gradeLevelColors: Record<string, string> = {
  GRADE_7: "border",
  GRADE_8: "border",
  GRADE_9: "border",
  GRADE_10: "border",
};

const gradeLevelOpacity: Record<string, string> = {
  GRADE_7: "18",
  GRADE_8: "28",
  GRADE_9: "38",
  GRADE_10: "48",
};

export default function ClassRecordsList() {
  const { colors } = useTheme();
  const [classes, setClasses] = useState<ClassAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await gradesApi.getMyClasses();
        setClasses(response.data);
      } catch (err) {
        console.error("Failed to fetch classes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const filteredClasses = classes.filter(
    (c) =>
      c.subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gradeLevelLabels[c.section.gradeLevel]
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div 
            className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-lg animate-pulse"
            style={{ backgroundColor: `${colors.primary}15` }}
          >
            <div 
              className="w-10 h-10 border-[3px] border-t-transparent rounded-full animate-spin"
              style={{ borderColor: colors.primary, borderTopColor: 'transparent' }}
            />
          </div>
          <p className="text-gray-500 font-medium">Loading your classes...</p>
          <p className="text-gray-400 text-sm mt-1">Please wait a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with gradient accent */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="p-2.5 rounded-xl text-white shadow-lg"
              style={{ backgroundColor: colors.primary }}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <Badge 
              variant="secondary" 
              className="font-semibold px-3 py-1"
              style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}
            >
              <Sparkles className="w-3 h-3 mr-1.5" />
              {classes.length} Classes
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#000000' }}>Class Records</h1>
          <p className="text-gray-500 mt-2 text-lg">
            Select a class to view and manage student grades
          </p>
        </div>
      </div>

      {/* Search and filters - Modern Glass Card */}
      <Card className="border-0 shadow-xl shadow-gray-200/50 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="p-2 rounded-lg bg-gray-100 group-focus-within:bg-gray-200 transition-colors">
                  <Search className="w-4 h-4 text-gray-400 transition-colors" style={{ color: undefined }} />
                </div>
              </div>
              <Input
                placeholder="Search by subject, section, or grade level..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-16 h-14 bg-gray-50/80 border-gray-200 hover:border-gray-300 focus:ring-4 rounded-xl text-base transition-all"
                style={{ '--tw-ring-color': `${colors.primary}15` } as React.CSSProperties}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="h-14 px-5 rounded-xl border-gray-200 hover:bg-gray-50 hover:border-gray-300">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <div className="flex items-center bg-gray-100 rounded-xl p-1.5">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className={`h-10 w-10 rounded-lg transition-all ${viewMode === "grid" ? "bg-white shadow-md" : "hover:bg-gray-200"}`}
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className={`h-10 w-10 rounded-lg transition-all ${viewMode === "list" ? "bg-white shadow-md" : "hover:bg-gray-200"}`}
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Class List - Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClasses.map((assignment, index) => (
            <Link 
              key={assignment.id} 
              to={`/teacher/records/${assignment.id}`}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Card className="h-full group border-0 shadow-lg shadow-gray-200/50 hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden rounded-2xl bg-white relative" style={{ ['--hover-shadow' as any]: `${colors.primary}15` }}>
                {/* Gradient left accent */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl" style={{ backgroundColor: colors.primary }} />
                
                <CardHeader className="pb-4 pt-6 px-6 pl-8">
                  <div className="flex items-start justify-between">
                    <Badge
                      variant="secondary"
                      className={`${gradeLevelColors[assignment.section.gradeLevel]} border font-semibold px-3 py-1`}
                      style={{ backgroundColor: `${colors.primary}${gradeLevelOpacity[assignment.section.gradeLevel] || '18'}`, color: colors.primary, borderColor: `${colors.primary}30` }}
                    >
                      {gradeLevelLabels[assignment.section.gradeLevel]}
                    </Badge>
                    <div className="p-2.5 rounded-xl bg-gray-100 text-gray-400 group-hover:scale-110 transition-all duration-300">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                  <CardTitle className="flex items-center gap-3 mt-5 transition-colors">
                    <div className="p-3 rounded-xl text-white shadow-lg" style={{ backgroundColor: colors.primary }}>
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold">{assignment.subject.name}</span>
                  </CardTitle>
                  <CardDescription className="mt-2 text-base">
                    Section {assignment.section.name} • {assignment.schoolYear}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="px-6 pb-6 pl-8">
                  <div className="flex items-center justify-between pt-5 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-gray-700">
                        {assignment.section.enrollments?.length || 0} Students
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 font-mono bg-gray-100 px-3 py-1.5 rounded-lg font-semibold">
                      {assignment.subject.writtenWorkWeight}/{assignment.subject.perfTaskWeight}/{assignment.subject.quarterlyAssessWeight}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Class List - List View */}
      {viewMode === "list" && (
        <Card className="border-0 shadow-xl shadow-gray-200/50 overflow-hidden rounded-2xl">
          <div className="divide-y divide-gray-100">
            {filteredClasses.map((assignment, index) => (
              <Link 
                key={assignment.id} 
                to={`/teacher/records/${assignment.id}`}
                className="animate-slide-up block"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="p-6 hover:bg-gray-50/80 transition-all duration-300 flex items-center gap-5 group">
                  <div className="p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: colors.primary }}>
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="font-bold text-gray-900 text-lg transition-colors">
                        {assignment.subject.name}
                      </h3>
                      <Badge
                        variant="secondary"
                        className={`${gradeLevelColors[assignment.section.gradeLevel]} border font-semibold text-xs px-2.5 py-0.5`}
                        style={{ backgroundColor: `${colors.primary}${gradeLevelOpacity[assignment.section.gradeLevel] || '18'}`, color: colors.primary, borderColor: `${colors.primary}30` }}
                      >
                        {gradeLevelLabels[assignment.section.gradeLevel]}
                      </Badge>
                    </div>
                    <p className="text-gray-500">
                      Section {assignment.section.name} • {assignment.schoolYear}
                    </p>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">
                        {assignment.section.enrollments?.length || 0}
                      </p>
                      <p className="text-xs text-gray-500 font-medium">Students</p>
                    </div>
                    <div className="text-center px-4 py-2 rounded-xl bg-gray-50">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                        WW/PT/QA
                      </p>
                      <p className="text-sm text-gray-700 font-mono font-bold">
                        {assignment.subject.writtenWorkWeight}/{assignment.subject.perfTaskWeight}/{assignment.subject.quarterlyAssessWeight}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-100 text-gray-400 transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {filteredClasses.length === 0 && (
        <Card className="border-0 shadow-xl shadow-gray-200/50 rounded-2xl">
          <CardContent className="py-20 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="font-bold text-gray-800 text-xl mb-2">No classes found</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              {searchTerm 
                ? "Try adjusting your search terms to find what you're looking for" 
                : "You don't have any class assignments yet. Contact your administrator."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
