import { useState } from "react";
import {
  Users,
  Search,
  Download,
  Eye,
  Edit,
  MoreHorizontal,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const gradeLevelLabels: Record<string, string> = {
  GRADE_7: "Grade 7",
  GRADE_8: "Grade 8",
  GRADE_9: "Grade 9",
  GRADE_10: "Grade 10",
};

const gradeLevelColors: Record<string, string> = {
  GRADE_7: "bg-blue-100 text-blue-700",
  GRADE_8: "bg-purple-100 text-purple-700",
  GRADE_9: "bg-amber-100 text-amber-700",
  GRADE_10: "bg-emerald-100 text-emerald-700",
};

// Mock data
const mockStudents = [
  { id: 1, lrn: "100000000001", lastName: "Santos", firstName: "Maria Clara", middleName: "G.", gender: "Female", gradeLevel: "GRADE_7", section: "Einstein", status: "Active" },
  { id: 2, lrn: "100000000002", lastName: "Reyes", firstName: "Juan Miguel", middleName: "D.", gender: "Male", gradeLevel: "GRADE_8", section: "Newton", status: "Active" },
  { id: 3, lrn: "100000000003", lastName: "Cruz", firstName: "Angela Mae", middleName: "L.", gender: "Female", gradeLevel: "GRADE_7", section: "Darwin", status: "Active" },
  { id: 4, lrn: "100000000004", lastName: "Garcia", firstName: "Paolo Jose", middleName: "M.", gender: "Male", gradeLevel: "GRADE_9", section: "Galileo", status: "Active" },
  { id: 5, lrn: "100000000005", lastName: "Fernandez", firstName: "Sofia", middleName: "R.", gender: "Female", gradeLevel: "GRADE_10", section: "Curie", status: "Active" },
  { id: 6, lrn: "100000000006", lastName: "Bautista", firstName: "Francisco", middleName: "G.", gender: "Male", gradeLevel: "GRADE_7", section: "Einstein", status: "Active" },
  { id: 7, lrn: "100000000007", lastName: "Dela Cruz", firstName: "Pedro", middleName: "A.", gender: "Male", gradeLevel: "GRADE_7", section: "Einstein", status: "Inactive" },
  { id: 8, lrn: "100000000008", lastName: "Gonzales", firstName: "Jorge", middleName: "B.", gender: "Male", gradeLevel: "GRADE_8", section: "Newton", status: "Active" },
  { id: 9, lrn: "100000000009", lastName: "Mercado", firstName: "Paula", middleName: "C.", gender: "Female", gradeLevel: "GRADE_9", section: "Galileo", status: "Active" },
  { id: 10, lrn: "100000000010", lastName: "Aquino", firstName: "Miguel", middleName: "E.", gender: "Male", gradeLevel: "GRADE_10", section: "Curie", status: "Active" },
];

export default function StudentRecords() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGradeLevel, setSelectedGradeLevel] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filteredStudents = mockStudents.filter((student) => {
    const matchesSearch = 
      student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.lrn.includes(searchQuery);
    const matchesGrade = selectedGradeLevel === "all" || student.gradeLevel === selectedGradeLevel;
    const matchesStatus = selectedStatus === "all" || student.status === selectedStatus;
    return matchesSearch && matchesGrade && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#111827' }}>
            Student Records
          </h1>
          <p style={{ color: '#6b7280' }} className="mt-1">
            Manage and view all student information
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: 850, color: "blue" },
          { label: "Grade 7", value: 240, color: "purple" },
          { label: "Grade 8-9", value: 420, color: "amber" },
          { label: "Grade 10", value: 190, color: "emerald" },
        ].map((stat) => (
          <div key={stat.label} className={`p-4 rounded-xl bg-${stat.color}-50 border border-${stat.color}-100`}>
            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Table Card */}
      <Card className="border-0 shadow-xl shadow-gray-200/50 bg-white overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">All Students</CardTitle>
                <CardDescription className="text-gray-500 text-sm">{filteredStudents.length} students found</CardDescription>
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64 rounded-xl border-gray-200"
                />
              </div>
              <Select value={selectedGradeLevel} onValueChange={(val) => val && setSelectedGradeLevel(val)}>
                <SelectTrigger className="w-36 rounded-xl border-gray-200">
                  <SelectValue>
                    {selectedGradeLevel === "all" ? "All Grades" : gradeLevelLabels[selectedGradeLevel]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  <SelectItem value="GRADE_7">Grade 7</SelectItem>
                  <SelectItem value="GRADE_8">Grade 8</SelectItem>
                  <SelectItem value="GRADE_9">Grade 9</SelectItem>
                  <SelectItem value="GRADE_10">Grade 10</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={(val) => val && setSelectedStatus(val)}>
                <SelectTrigger className="w-32 rounded-xl border-gray-200">
                  <SelectValue>
                    {selectedStatus === "all" ? "All Status" : selectedStatus}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="font-bold text-gray-700">LRN</TableHead>
                  <TableHead className="font-bold text-gray-700">Student Name</TableHead>
                  <TableHead className="font-bold text-gray-700">Gender</TableHead>
                  <TableHead className="font-bold text-gray-700">Grade Level</TableHead>
                  <TableHead className="font-bold text-gray-700">Section</TableHead>
                  <TableHead className="font-bold text-gray-700">Status</TableHead>
                  <TableHead className="font-bold text-gray-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id} className="hover:bg-blue-50/30">
                    <TableCell className="font-mono text-sm text-gray-600">{student.lrn}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                          {student.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {student.lastName}, {student.firstName} {student.middleName}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={student.gender === "Male" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}>
                        {student.gender}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={gradeLevelColors[student.gradeLevel]}>
                        {gradeLevelLabels[student.gradeLevel]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-gray-700">{student.section}</TableCell>
                    <TableCell>
                      <Badge className={student.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}>
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem className="rounded-lg">
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Record
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg">
                            <Download className="w-4 h-4 mr-2" />
                            Print SF10
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
