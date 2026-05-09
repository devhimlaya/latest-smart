import { useEffect, useState } from "react";
import { Calendar as CalendarIcon, Users, Check, X, Clock, FileText, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { useTheme } from "@/contexts/ThemeContext";
import { SERVER_URL } from "@/lib/api";
import axios from "axios";

interface Student {
  studentId: string;
  lrn: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  remarks?: string;
  attendanceId?: string | null;
}

interface Section {
  id: string;
  name: string;
  gradeLevel: string;
}

interface AttendanceData {
  section: Section;
  date: string;
  attendance: Student[];
}

const gradeLevelLabels: Record<string, string> = {
  GRADE_7: "Grade 7",
  GRADE_8: "Grade 8",
  GRADE_9: "Grade 9",
  GRADE_10: "Grade 10",
};

export default function Attendance() {
  const { colors } = useTheme();
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch teacher's sections
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const token = sessionStorage.getItem("token");
        
        // Get class assignments
        const classResponse = await axios.get(`${SERVER_URL}/api/grades/my-classes`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Get advisory section
        const advisoryResponse = await axios.get(`${SERVER_URL}/api/advisory/my-advisory`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const sectionsMap = new Map<string, Section>();

        // Add sections from class assignments (API returns array directly)
        if (Array.isArray(classResponse.data)) {
          classResponse.data.forEach((assignment: any) => {
            if (assignment.section && !sectionsMap.has(assignment.section.id)) {
              sectionsMap.set(assignment.section.id, {
                id: assignment.section.id,
                name: assignment.section.name,
                gradeLevel: assignment.section.gradeLevel,
              });
            }
          });
        }

        // Add advisory section if exists (API returns object with section property)
        if (advisoryResponse.data?.hasAdvisory && advisoryResponse.data?.section) {
          const advisorySection = advisoryResponse.data.section;
          if (!sectionsMap.has(advisorySection.id)) {
            sectionsMap.set(advisorySection.id, {
              id: advisorySection.id,
              name: advisorySection.name,
              gradeLevel: advisorySection.gradeLevel,
            });
          }
        }

        const sectionsList = Array.from(sectionsMap.values());
        setSections(sectionsList);

        // Auto-select advisory section if available
        if (advisoryResponse.data?.hasAdvisory && advisoryResponse.data?.section) {
          setSelectedSection(advisoryResponse.data.section.id);
        } else if (sectionsList.length > 0) {
          setSelectedSection(sectionsList[0].id);
        }
      } catch (error) {
        console.error("Error fetching sections:", error);
      }
    };

    fetchSections();
  }, []);

  // Fetch attendance when section or date changes
  useEffect(() => {
    if (selectedSection && selectedDate) {
      fetchAttendance();
    }
  }, [selectedSection, selectedDate]);

  const fetchAttendance = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const token = sessionStorage.getItem("token");
      const response = await axios.get(
        `${SERVER_URL}/api/attendance/section/${selectedSection}?date=${selectedDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAttendanceData(response.data.data);
    } catch (error: any) {
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to load attendance" });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED") => {
    if (!attendanceData) return;
    setAttendanceData({
      ...attendanceData,
      attendance: attendanceData.attendance.map((student) =>
        student.studentId === studentId ? { ...student, status } : student
      ),
    });
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    if (!attendanceData) return;
    setAttendanceData({
      ...attendanceData,
      attendance: attendanceData.attendance.map((student) =>
        student.studentId === studentId ? { ...student, remarks } : student
      ),
    });
  };

  const markAllPresent = () => {
    if (!attendanceData) return;
    setAttendanceData({
      ...attendanceData,
      attendance: attendanceData.attendance.map((student) => ({
        ...student,
        status: "PRESENT",
        remarks: "",
      })),
    });
  };

  const saveAttendance = async () => {
    if (!attendanceData) return;

    setSaving(true);
    setMessage(null);
    try {
      const token = sessionStorage.getItem("token");
      await axios.post(
        `${SERVER_URL}/api/attendance/bulk`,
        {
          sectionId: selectedSection,
          date: selectedDate,
          attendance: attendanceData.attendance.map((s) => ({
            studentId: s.studentId,
            status: s.status,
            remarks: s.remarks || null,
          })),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ type: "success", text: "Attendance saved successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to save attendance" });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any; label: string }> = {
      PRESENT: { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2, label: "Present" },
      ABSENT: { color: "bg-red-100 text-red-700 border-red-200", icon: X, label: "Absent" },
      LATE: { color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock, label: "Late" },
      EXCUSED: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: FileText, label: "Excused" },
    };
    const variant = variants[status] || variants.PRESENT;
    const Icon = variant.icon;
    return (
      <Badge className={`${variant.color} border font-medium px-3 py-1`}>
        <Icon className="w-3 h-3 mr-1.5" />
        {variant.label}
      </Badge>
    );
  };

  const getStatusStats = () => {
    if (!attendanceData) return { present: 0, absent: 0, late: 0, excused: 0 };
    return {
      present: attendanceData.attendance.filter((s) => s.status === "PRESENT").length,
      absent: attendanceData.attendance.filter((s) => s.status === "ABSENT").length,
      late: attendanceData.attendance.filter((s) => s.status === "LATE").length,
      excused: attendanceData.attendance.filter((s) => s.status === "EXCUSED").length,
    };
  };

  const stats = getStatusStats();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Attendance</h1>
          <p className="text-gray-500 mt-1">Mark student attendance for your sections</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Select Section & Date</CardTitle>
          <CardDescription>Choose the section and date to mark attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="section">Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger id="section">
                  <SelectValue placeholder="Select section">
                    {selectedSection && sections.length > 0 ? (
                      (() => {
                        const selected = sections.find(s => s.id === selectedSection);
                        return selected ? `${gradeLevelLabels[selected.gradeLevel]} - ${selected.name}` : 'Select section';
                      })()
                    ) : 'Select section'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {gradeLevelLabels[section.gradeLevel]} - {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <div className="relative">
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
                <CalendarIcon className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-end">
              <Button
                onClick={markAllPresent}
                variant="outline"
                className="w-full"
                disabled={!attendanceData || loading}
                style={{ borderColor: colors.primary, color: colors.primary }}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark All Present
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* Stats */}
      {attendanceData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Present</p>
                  <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Absent</p>
                  <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                </div>
                <X className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Late</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.late}</p>
                </div>
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Excused</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.excused}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {attendanceData?.section && `${gradeLevelLabels[attendanceData.section.gradeLevel]} - ${attendanceData.section.name}`}
              </CardTitle>
              <CardDescription>
                {attendanceData ? `${attendanceData.attendance.length} students` : "Select a section to view students"}
              </CardDescription>
            </div>
            {attendanceData && (
              <Button
                onClick={saveAttendance}
                disabled={saving}
                style={{ backgroundColor: colors.primary }}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Attendance
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div
                  className="w-12 h-12 mx-auto mb-4 border-[3px] border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: colors.primary, borderTopColor: "transparent" }}
                />
                <p className="text-gray-500">Loading attendance...</p>
              </div>
            </div>
          ) : attendanceData ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>LRN</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceData.attendance.map((student) => (
                  <TableRow key={student.studentId}>
                    <TableCell className="font-mono text-sm">{student.lrn}</TableCell>
                    <TableCell className="font-medium">
                      {student.lastName}, {student.firstName} {student.middleName?.[0]}.
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={student.status === "PRESENT" ? "default" : "outline"}
                          onClick={() => handleStatusChange(student.studentId, "PRESENT")}
                          className={student.status === "PRESENT" ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Present
                        </Button>
                        <Button
                          size="sm"
                          variant={student.status === "ABSENT" ? "default" : "outline"}
                          onClick={() => handleStatusChange(student.studentId, "ABSENT")}
                          className={student.status === "ABSENT" ? "bg-red-600 hover:bg-red-700" : ""}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Absent
                        </Button>
                        <Button
                          size="sm"
                          variant={student.status === "LATE" ? "default" : "outline"}
                          onClick={() => handleStatusChange(student.studentId, "LATE")}
                          className={student.status === "LATE" ? "bg-amber-600 hover:bg-amber-700" : ""}
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          Late
                        </Button>
                        <Button
                          size="sm"
                          variant={student.status === "EXCUSED" ? "default" : "outline"}
                          onClick={() => handleStatusChange(student.studentId, "EXCUSED")}
                          className={student.status === "EXCUSED" ? "bg-blue-600 hover:bg-blue-700" : ""}
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Excused
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Optional remarks..."
                        value={student.remarks || ""}
                        onChange={(e) => handleRemarksChange(student.studentId, e.target.value)}
                        className="text-sm"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Select a section and date to view attendance</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
