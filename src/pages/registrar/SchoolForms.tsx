import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FolderOpen,
  FileText,
  ClipboardList,
  Calendar,
  BarChart3,
  GraduationCap,
  Users,
  Download,
  Printer,
  Eye,
  Search,
  BookOpen,
  FileCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SchoolForm {
  id: string;
  name: string;
  fullName: string;
  description: string;
  icon: React.ElementType;
  category: string;
  recordCount: number;
  lastUpdated: string;
  color: string;
}

const schoolForms: SchoolForm[] = [
  {
    id: "SF1",
    name: "School Register",
    fullName: "School Form 1 - School Register",
    description: "Contains basic information of all learners enrolled in a school during a school year including LRN, name, birth date, gender, etc.",
    icon: ClipboardList,
    category: "Registration",
    recordCount: 850,
    lastUpdated: "Mar 30, 2026",
    color: "blue",
  },
  {
    id: "SF2",
    name: "Daily Attendance",
    fullName: "School Form 2 - Daily Attendance Report of Learners",
    description: "Daily record of attendance for each class/section including present, absent, and tardy counts.",
    icon: Calendar,
    category: "Attendance",
    recordCount: 24,
    lastUpdated: "Mar 30, 2026",
    color: "emerald",
  },
  {
    id: "SF4",
    name: "Monthly Report",
    fullName: "School Form 4 - Monthly Learner Movement and Attendance",
    description: "Monthly summary of learner movement including enrollment, dropouts, transfers and attendance summary.",
    icon: BarChart3,
    category: "Reports",
    recordCount: 8,
    lastUpdated: "Mar 28, 2026",
    color: "purple",
  },
  {
    id: "SF5",
    name: "Report on Promotion",
    fullName: "School Form 5 - Report on Promotion and Level of Proficiency",
    description: "End of year report showing learners' promotion status and level of proficiency per subject.",
    icon: GraduationCap,
    category: "Academic",
    recordCount: 850,
    lastUpdated: "Jun 15, 2025",
    color: "amber",
  },
  {
    id: "SF6",
    name: "Summarized Report",
    fullName: "School Form 6 - Summarized Report on Promotion and Level of Proficiency",
    description: "School-wide summary of promotion statistics and proficiency levels per grade level.",
    icon: FileCheck,
    category: "Reports",
    recordCount: 4,
    lastUpdated: "Jun 16, 2025",
    color: "indigo",
  },
  {
    id: "SF7",
    name: "School Personnel",
    fullName: "School Form 7 - School Personnel Assignment List",
    description: "Record of all school personnel including teachers, administrative staff, and their assignments.",
    icon: Users,
    category: "Personnel",
    recordCount: 45,
    lastUpdated: "Mar 25, 2026",
    color: "teal",
  },
  {
    id: "SF8",
    name: "Class Record",
    fullName: "School Form 8 - Learner Basic Health and Nutrition Report",
    description: "Health and nutrition profile of learners including BMI, nutritional status, and health conditions.",
    icon: BookOpen,
    category: "Health",
    recordCount: 850,
    lastUpdated: "Mar 20, 2026",
    color: "rose",
  },
  {
    id: "SF9",
    name: "Report Card",
    fullName: "School Form 9 - Learner's Progress Report Card",
    description: "Individual learner's quarterly grades and progress report to be given to parents/guardians.",
    icon: FileText,
    category: "Academic",
    recordCount: 850,
    lastUpdated: "Mar 30, 2026",
    color: "blue",
  },
  {
    id: "SF10",
    name: "Permanent Record",
    fullName: "School Form 10 - Learner's Permanent Academic Record",
    description: "Cumulative record of learner's academic history including grades, attendance, and awards from all school years.",
    icon: FolderOpen,
    category: "Academic",
    recordCount: 850,
    lastUpdated: "Mar 30, 2026",
    color: "violet",
  },
];

const categories = ["All", "Registration", "Attendance", "Academic", "Reports", "Personnel", "Health"];

export default function SchoolForms() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredForms = schoolForms.filter((form) => {
    const matchesSearch = form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || form.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#111827' }}>
            DepEd School Forms
          </h1>
          <p style={{ color: '#6b7280' }} className="mt-1">
            Access and manage official Department of Education forms
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search forms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-xl border-gray-200"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={`rounded-xl ${selectedCategory === category ? "bg-blue-600 hover:bg-blue-700" : ""}`}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredForms.map((form) => (
          <Card 
            key={form.id} 
            className="group border-0 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 bg-white overflow-hidden rounded-2xl cursor-pointer"
          >
            <CardHeader className={`border-b border-gray-100 bg-gradient-to-r from-${form.color}-50 to-${form.color}-50/50 px-6 py-4`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br from-${form.color}-500 to-${form.color}-600 text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    <form.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <Badge className={`bg-${form.color}-100 text-${form.color}-700 font-bold text-sm`}>
                      {form.id}
                    </Badge>
                    <CardTitle className="text-base font-bold text-gray-900 mt-1">{form.name}</CardTitle>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{form.description}</p>
              
              <div className="flex items-center justify-between text-sm mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-gray-500">
                    <span className="font-semibold text-gray-900">{form.recordCount}</span> records
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {form.category}
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400">Updated: {form.lastUpdated}</span>
                <div className="flex items-center gap-2">
                  <Link to={`/registrar/forms/${form.id.toLowerCase()}`}>
                    <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg hover:bg-blue-50 hover:text-blue-600">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </Link>
                  <Link to={`/registrar/print/${form.id.toLowerCase()}`}>
                    <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg hover:bg-blue-50 hover:text-blue-600">
                      <Printer className="w-4 h-4 mr-1" />
                      Print
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Reference Card */}
      <Card className="border-0 shadow-xl shadow-gray-200/50 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 overflow-hidden rounded-2xl text-white">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">DepEd Forms Quick Reference</h3>
              <p className="text-blue-100 max-w-xl">
                All school forms follow the Department of Education Order No. 58, s. 2017 guidelines. 
                Ensure all forms are properly filled out and submitted within the prescribed deadlines.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button className="bg-white text-blue-600 hover:bg-blue-50 font-semibold rounded-xl px-6">
                <Download className="w-4 h-4 mr-2" />
                Download Guidelines
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
