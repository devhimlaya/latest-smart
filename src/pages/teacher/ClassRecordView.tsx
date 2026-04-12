import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Edit,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle,
  BookOpen,
  Users,
  Award,
  FileText,
  ClipboardList,
  Loader2,
  TrendingUp,
  TrendingDown,
  Target,
  FileSpreadsheet,
  Upload,
  RefreshCw,
  FileUp,
  X,
  Check,
  AlertTriangle,
  SplitSquareHorizontal,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  gradesApi,
  type ClassAssignment,
  type ClassRecord,
  type Grade,
  type ScoreItem,
} from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";

const gradeLevelLabels: Record<string, string> = {
  GRADE_7: "Grade 7",
  GRADE_8: "Grade 8",
  GRADE_9: "Grade 9",
  GRADE_10: "Grade 10",
};

const gradeLevelColors: Record<string, string> = {
  GRADE_7: "theme",
  GRADE_8: "theme",
  GRADE_9: "theme",
  GRADE_10: "theme",
};

const quarters = ["Q1", "Q2", "Q3", "Q4"] as const;

function getGradeColor(grade: number | null): string {
  if (grade === null) return "text-gray-400";
  if (grade >= 90) return "text-emerald-600 font-bold";
  if (grade >= 85) return "text-blue-600 font-semibold";
  if (grade >= 80) return "text-amber-600 font-medium";
  if (grade >= 75) return "text-orange-600";
  return "text-red-600 font-semibold";
}

function getGradeBgColor(grade: number | null): string {
  if (grade === null) return "bg-gray-50";
  if (grade >= 90) return "bg-emerald-50";
  if (grade >= 85) return "bg-blue-50";
  if (grade >= 80) return "bg-amber-50";
  if (grade >= 75) return "bg-orange-50";
  return "bg-red-50";
}

function getGradeRemarks(grade: number | null): string {
  if (grade === null) return "-";
  if (grade >= 90) return "Outstanding";
  if (grade >= 85) return "Very Satisfactory";
  if (grade >= 80) return "Satisfactory";
  if (grade >= 75) return "Fairly Satisfactory";
  return "Did Not Meet";
}

export default function ClassRecordView() {
  const { colors } = useTheme();
  const { classAssignmentId } = useParams();
  const [classAssignment, setClassAssignment] = useState<ClassAssignment | null>(null);
  const [classRecord, setClassRecord] = useState<ClassRecord[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState<string>("Q1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Grade input dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<ClassRecord | null>(null);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);

  // Score input state
  const [writtenWorkScores, setWrittenWorkScores] = useState<ScoreItem[]>([]);
  const [perfTaskScores, setPerfTaskScores] = useState<ScoreItem[]>([]);
  const [quarterlyAssessScore, setQuarterlyAssessScore] = useState<string>("");
  const [quarterlyAssessMax, setQuarterlyAssessMax] = useState<string>("100");

  // ECR Import state
  const [ecrDialogOpen, setEcrDialogOpen] = useState(false);
  const [ecrFile, setEcrFile] = useState<File | null>(null);
  const [ecrPreview, setEcrPreview] = useState<any>(null);
  const [ecrLoading, setEcrLoading] = useState(false);
  const [ecrImporting, setEcrImporting] = useState(false);
  const [ecrSyncStatus, setEcrSyncStatus] = useState<{
    hasSynced: boolean;
    ecrLastSyncedAt: string | null;
    ecrFileName: string | null;
  } | null>(null);
  const [separateByGender, setSeparateByGender] = useState(false);
  const ecrFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchClassRecord();
  }, [classAssignmentId, selectedQuarter]);

  // Fetch ECR sync status
  useEffect(() => {
    if (classAssignmentId) {
      fetchEcrStatus();
    }
  }, [classAssignmentId]);

  // Auto-dismiss messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const fetchClassRecord = async () => {
    if (!classAssignmentId) return;

    try {
      setLoading(true);
      const response = await gradesApi.getClassRecord(classAssignmentId, selectedQuarter);
      setClassAssignment(response.data.classAssignment);
      setClassRecord(response.data.classRecord);
    } catch (err) {
      console.error("Failed to fetch class record:", err);
      setError("Failed to load class record");
    } finally {
      setLoading(false);
    }
  };

  const fetchEcrStatus = async () => {
    if (!classAssignmentId) return;
    try {
      const response = await gradesApi.getEcrStatus(classAssignmentId);
      setEcrSyncStatus(response.data);
    } catch (err) {
      console.error("Failed to fetch ECR status:", err);
    }
  };

  const handleEcrFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEcrFile(file);
      handleEcrPreview(file);
    }
  };

  const handleEcrPreview = async (file: File) => {
    if (!classAssignmentId) return;
    
    try {
      setEcrLoading(true);
      setEcrPreview(null);
      const response = await gradesApi.previewEcr(classAssignmentId, file);
      setEcrPreview(response.data);
    } catch (err: any) {
      console.error("Failed to preview ECR:", err);
      setError(err.response?.data?.message || "Failed to parse ECR file");
      setEcrFile(null);
      setEcrDialogOpen(false);
    } finally {
      setEcrLoading(false);
    }
  };

  const handleEcrImport = async () => {
    if (!classAssignmentId || !ecrFile) return;
    
    try {
      setEcrImporting(true);
      const response = await gradesApi.importEcr(classAssignmentId, ecrFile);
      
      // Update sync status
      setEcrSyncStatus({
        hasSynced: true,
        ecrLastSyncedAt: response.data.ecrLastSyncedAt,
        ecrFileName: response.data.ecrFileName,
      });
      
      setSuccess(`Successfully imported ${response.data.importedGrades} grades from ECR. ${response.data.skippedStudents > 0 ? `${response.data.skippedStudents} students could not be matched.` : ''}`);
      setEcrDialogOpen(false);
      setEcrFile(null);
      setEcrPreview(null);
      
      // Refresh class record
      fetchClassRecord();
    } catch (err: any) {
      console.error("Failed to import ECR:", err);
      setError(err.response?.data?.message || "Failed to import ECR grades");
    } finally {
      setEcrImporting(false);
    }
  };

  const formatSyncDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-PH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openGradeDialog = (student: ClassRecord, existingGrade?: Grade) => {
    setSelectedStudent(student);
    setEditingGrade(existingGrade || null);

    if (existingGrade) {
      // Load existing scores, or add a default row if empty
      const ww = existingGrade.writtenWorkScores || [];
      const pt = existingGrade.perfTaskScores || [];
      setWrittenWorkScores(ww.length > 0 ? ww : [{ name: "Quiz 1", score: 0, maxScore: 10 }]);
      setPerfTaskScores(pt.length > 0 ? pt : [{ name: "Activity 1", score: 0, maxScore: 10 }]);
      setQuarterlyAssessScore(existingGrade.quarterlyAssessScore?.toString() || "");
      setQuarterlyAssessMax(existingGrade.quarterlyAssessMax?.toString() || "100");
    } else {
      // Auto-add first item for each category - less clicking!
      setWrittenWorkScores([{ name: "Quiz 1", score: 0, maxScore: 10 }]);
      setPerfTaskScores([{ name: "Activity 1", score: 0, maxScore: 10 }]);
      setQuarterlyAssessScore("");
      setQuarterlyAssessMax("100");
    }

    setDialogOpen(true);
  };

  const addWrittenWork = () => {
    setWrittenWorkScores([
      ...writtenWorkScores,
      { name: `Quiz ${writtenWorkScores.length + 1}`, score: 0, maxScore: 10 },
    ]);
  };

  const addPerfTask = () => {
    setPerfTaskScores([
      ...perfTaskScores,
      { name: `Activity ${perfTaskScores.length + 1}`, score: 0, maxScore: 10 },
    ]);
  };

  const updateWrittenWork = (index: number, field: keyof ScoreItem, value: string | number) => {
    const updated = [...writtenWorkScores];
    updated[index] = { ...updated[index], [field]: field === "name" ? value : Number(value) };
    setWrittenWorkScores(updated);
  };

  const updatePerfTask = (index: number, field: keyof ScoreItem, value: string | number) => {
    const updated = [...perfTaskScores];
    updated[index] = { ...updated[index], [field]: field === "name" ? value : Number(value) };
    setPerfTaskScores(updated);
  };

  const removeWrittenWork = (index: number) => {
    setWrittenWorkScores(writtenWorkScores.filter((_, i) => i !== index));
  };

  const removePerfTask = (index: number) => {
    setPerfTaskScores(perfTaskScores.filter((_, i) => i !== index));
  };

  const handleSaveGrade = async () => {
    if (!selectedStudent || !classAssignmentId) return;

    try {
      setSaving(true);

      const gradeData = {
        studentId: selectedStudent.student.id,
        classAssignmentId,
        quarter: selectedQuarter,
        writtenWorkScores,
        perfTaskScores,
        quarterlyAssessScore: quarterlyAssessScore ? Number(quarterlyAssessScore) : undefined,
        quarterlyAssessMax: quarterlyAssessMax ? Number(quarterlyAssessMax) : undefined,
      };

      await gradesApi.saveGrade(gradeData);

      setSuccess("Grade saved successfully!");
      setDialogOpen(false);
      fetchClassRecord();
    } catch (err) {
      console.error("Failed to save grade:", err);
      setError("Failed to save grade. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGrade = async (gradeId: string) => {
    if (!window.confirm("Are you sure you want to delete this grade?")) return;

    try {
      await gradesApi.deleteGrade(gradeId);
      setSuccess("Grade deleted successfully!");
      fetchClassRecord();
    } catch (err) {
      console.error("Failed to delete grade:", err);
      setError("Failed to delete grade. Please try again.");
    }
  };

  // Calculate class statistics
  const calculateStats = () => {
    const grades = classRecord
      .map((r) => r.grades.find((g) => g.quarter === selectedQuarter)?.quarterlyGrade)
      .filter((g): g is number => g !== undefined && g !== null);

    if (grades.length === 0) return { avg: 0, passed: 0, highest: 0, lowest: 0 };

    return {
      avg: grades.reduce((a, b) => a + b, 0) / grades.length,
      passed: grades.filter((g) => g >= 75).length,
      highest: Math.max(...grades),
      lowest: Math.min(...grades),
    };
  };

  const stats = classRecord.length > 0 ? calculateStats() : null;

  // Print SF8 - Class Record (Complete class grades)
  const printSF8 = () => {
    if (!classAssignment) return;
    
    const quarterLabel = selectedQuarter === 'Q1' ? '1st Quarter' : selectedQuarter === 'Q2' ? '2nd Quarter' : selectedQuarter === 'Q3' ? '3rd Quarter' : '4th Quarter';
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const studentsRows = classRecord.map((record, index) => {
      const grade = record.grades.find(g => g.quarter === selectedQuarter);
      return `
        <tr>
          <td style="text-align: center; padding: 8px; border: 1px solid #000;">${index + 1}</td>
          <td style="padding: 8px; border: 1px solid #000; font-family: monospace;">${record.student.lrn}</td>
          <td style="padding: 8px; border: 1px solid #000; font-weight: 500;">
            ${record.student.lastName}, ${record.student.firstName}${record.student.middleName ? ' ' + record.student.middleName.charAt(0) + '.' : ''}${record.student.suffix ? ' ' + record.student.suffix : ''}
          </td>
          <td style="text-align: center; padding: 8px; border: 1px solid #000;">${grade?.writtenWorkPS?.toFixed(1) || '-'}</td>
          <td style="text-align: center; padding: 8px; border: 1px solid #000;">${grade?.perfTaskPS?.toFixed(1) || '-'}</td>
          <td style="text-align: center; padding: 8px; border: 1px solid #000;">${grade?.quarterlyAssessPS?.toFixed(1) || '-'}</td>
          <td style="text-align: center; padding: 8px; border: 1px solid #000;">${grade?.initialGrade?.toFixed(2) || '-'}</td>
          <td style="text-align: center; padding: 8px; border: 1px solid #000; font-weight: bold; font-size: 14px;">${grade?.quarterlyGrade || '-'}</td>
          <td style="padding: 8px; border: 1px solid #000; text-align: center;">
            ${grade?.quarterlyGrade ? (grade.quarterlyGrade >= 75 ? 'Passed' : 'Failed') : '-'}
          </td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SF8 - Class Record - ${classAssignment.subject.name}</title>
        <style>
          @page { size: landscape; margin: 0.75in; }
          body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 25px; }
          .header { display: flex; align-items: center; justify-content: center; margin-bottom: 25px; gap: 20px; }
          .header-logo { width: 85px; height: 85px; }
          .header-text { text-align: center; flex-grow: 1; }
          .header-text p { margin: 4px 0; font-size: 12px; }
          .header-text h1 { margin: 10px 0 6px 0; font-size: 17px; text-transform: uppercase; font-weight: bold; }
          .header-text h2 { margin: 6px 0; font-size: 14px; font-weight: normal; }
          .republic { font-size: 12px; font-weight: normal; }
          .deped { font-size: 13px; font-weight: bold; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 18px; font-size: 12px; }
          .info-row div { flex: 1; padding: 0 5px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 20px; }
          th { background-color: #f0f0f0; padding: 12px 10px; border: 1px solid #000; font-weight: bold; }
          td { padding: 10px 8px; border: 1px solid #000; }
          .weights { margin-top: 20px; font-size: 11px; padding: 12px; background: #fafafa; border-radius: 5px; }
          .signature-section { margin-top: 50px; display: flex; justify-content: space-between; }
          .signature-box { width: 220px; text-align: center; }
          .signature-line { border-top: 1px solid #000; margin-top: 50px; padding-top: 8px; font-size: 11px; }
          @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/DepEd.png" alt="DepEd Logo" class="header-logo" />
          <div class="header-text">
            <p class="republic">Republic of the Philippines</p>
            <p class="deped">Department of Education</p>
            <p style="font-size: 10px; margin-top: 8px;">Region _____ Division _____ District _____</p>
            <h1>School Form 8 (SF8) - Class Record</h1>
            <h2>Learner's Progress Report Card</h2>
          </div>
          <div style="width: 80px;"></div>
        </div>
        
        <div class="info-row">
          <div><strong>School:</strong> _________________________</div>
          <div><strong>School ID:</strong> _________________________</div>
          <div><strong>School Year:</strong> ${classAssignment.section.schoolYear}</div>
        </div>
        
        <div class="info-row">
          <div><strong>Grade Level:</strong> ${gradeLevelLabels[classAssignment.section.gradeLevel]}</div>
          <div><strong>Section:</strong> ${classAssignment.section.name}</div>
          <div><strong>Quarter:</strong> ${quarterLabel}</div>
        </div>
        
        <div class="info-row">
          <div><strong>Subject:</strong> ${classAssignment.subject.name}</div>
          <div><strong>Teacher:</strong> _________________________</div>
          <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px;">#</th>
              <th style="width: 120px;">LRN</th>
              <th>Learner's Name<br>(Last Name, First Name, M.I.)</th>
              <th style="width: 60px;">WW<br>(${classAssignment.subject.writtenWorkWeight}%)</th>
              <th style="width: 60px;">PT<br>(${classAssignment.subject.perfTaskWeight}%)</th>
              <th style="width: 60px;">QA<br>(${classAssignment.subject.quarterlyAssessWeight}%)</th>
              <th style="width: 60px;">Initial<br>Grade</th>
              <th style="width: 60px;">Quarterly<br>Grade</th>
              <th style="width: 70px;">Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${studentsRows}
          </tbody>
        </table>

        <div class="weights">
          <strong>Component Weights:</strong> Written Work (${classAssignment.subject.writtenWorkWeight}%) | Performance Tasks (${classAssignment.subject.perfTaskWeight}%) | Quarterly Assessment (${classAssignment.subject.quarterlyAssessWeight}%)
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line">Subject Teacher</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">School Principal</div>
          </div>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div 
            className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-lg animate-pulse"
            style={{ backgroundColor: `${colors.primary}15` }}
          >
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: colors.primary }} />
          </div>
          <p className="text-gray-600 font-semibold text-lg">Loading class record...</p>
          <p className="text-gray-400 text-sm mt-1">Fetching student data</p>
        </div>
      </div>
    );
  }

  if (!classAssignment) {
    return (
      <Card className="max-w-lg mx-auto mt-16 border-none shadow-2xl rounded-3xl overflow-hidden">
        <CardContent className="flex flex-col items-center py-16 px-8">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-rose-100 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Class Not Found</h3>
          <p className="text-gray-500 text-center mb-8 leading-relaxed">
            The class record you're looking for doesn't exist or you don't have permission to access it.
          </p>
          <Link to="/teacher/records">
            <Button 
              className="shadow-lg rounded-xl px-6"
              style={{ backgroundColor: colors.primary }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Class Records
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const gradientClass = gradeLevelColors[classAssignment.section.gradeLevel] || "from-gray-500 to-gray-600";
  const useThemeGradient = gradientClass === "theme";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Success/Error Alerts - Floating Toast Style */}
      {(error || success) && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-4 px-5 py-4 rounded-2xl shadow-2xl border animate-slide-in-right ${
            error
              ? "bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-800"
              : "border-gray-200"
          }`}
          style={!error ? { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}30`, color: colors.primary } : undefined}
        >
          <div className={`p-2 rounded-xl ${error ? 'bg-red-100' : ''}`} style={!error ? { backgroundColor: `${colors.primary}20` } : undefined}>
            {error ? (
              <AlertCircle className="w-5 h-5 text-red-600" />
            ) : (
              <CheckCircle className="w-5 h-5" style={{ color: colors.primary }} />
            )}
          </div>
          <span className="font-semibold">{error || success}</span>
        </div>
      )}

      {/* Header Card - Premium Glass Design */}
      <Card className={`border-none shadow-2xl shadow-gray-200/50 overflow-hidden rounded-3xl ${useThemeGradient ? '' : `bg-gradient-to-r ${gradientClass}`}`}
        style={useThemeGradient ? { backgroundColor: colors.primary } : undefined}
      >
        <div className="p-8 lg:p-10 text-white relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }} />
          </div>
          
          <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-5">
              <Link
                to="/teacher/records"
                className="p-3 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-sm transition-all duration-300 border border-white/20 shadow-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Badge className="bg-white/20 text-white hover:bg-white/30 border-0 font-semibold px-3 py-1 backdrop-blur-sm">
                    {gradeLevelLabels[classAssignment.section.gradeLevel]}
                  </Badge>
                  <span className="text-white/70 text-sm">•</span>
                  <span className="text-white/80 text-sm font-medium">
                    Section {classAssignment.section.name}
                  </span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">{classAssignment.subject.name}</h1>
                <p className="text-white/60 mt-2 text-sm">
                  School Year {classAssignment.section.schoolYear}
                </p>
              </div>
            </div>
          </div>

          {/* Component Weights - Modern Cards */}
          <div className="relative grid grid-cols-3 gap-4 lg:gap-6 mt-8 pt-8 border-t border-white/20">
            {[
              { icon: FileText, label: "Written Work", value: classAssignment.subject.writtenWorkWeight },
              { icon: ClipboardList, label: "Performance", value: classAssignment.subject.perfTaskWeight },
              { icon: Award, label: "Quarterly Assess", value: classAssignment.subject.quarterlyAssessWeight },
            ].map((item) => (
              <div key={item.label} className="text-center p-4 lg:p-6 rounded-2xl bg-white/20 backdrop-blur-md shadow-lg">
                <div className="flex items-center justify-center gap-2 text-white/80 text-sm mb-2">
                  <item.icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <p className="text-3xl lg:text-4xl font-bold text-white">{item.value}%</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Stats Cards - Bento Grid Style */}
      {stats && stats.avg > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          {[
            { label: "Class Average", value: stats.avg.toFixed(1), icon: Target, color: "primary", gradient: "", iconBg: "", useTheme: true },
            { label: "Passed", value: `${stats.passed}/${classRecord.length}`, icon: TrendingUp, color: "blue", gradient: "from-blue-50 to-indigo-50", iconBg: "from-blue-500 to-indigo-600", useTheme: false },
            { label: "Highest Score", value: stats.highest.toString(), icon: Award, color: "amber", gradient: "from-amber-50 to-orange-50", iconBg: "from-amber-500 to-orange-600", useTheme: false },
            { label: "Lowest Score", value: stats.lowest.toString(), icon: TrendingDown, color: "purple", gradient: "from-purple-50 to-violet-50", iconBg: "from-purple-500 to-violet-600", useTheme: false },
          ].map((stat) => (
            <Card 
              key={stat.label} 
              className={`border-none shadow-lg rounded-2xl overflow-hidden ${!stat.useTheme ? `bg-gradient-to-br ${stat.gradient}` : ''}`}
              style={stat.useTheme ? { backgroundColor: `${colors.primary}10` } : undefined}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className={`p-2.5 rounded-xl text-white shadow-lg ${!stat.useTheme ? `bg-gradient-to-br ${stat.iconBg}` : ''}`}
                    style={stat.useTheme ? { backgroundColor: colors.primary } : undefined}
                  >
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
                <p 
                  className={`text-sm font-semibold uppercase tracking-wider ${!stat.useTheme ? `text-${stat.color}-600` : ''}`}
                  style={stat.useTheme ? { color: colors.primary } : undefined}
                >{stat.label}</p>
                <p 
                  className={`text-3xl font-bold mt-1 ${!stat.useTheme ? `text-${stat.color}-700` : ''}`}
                  style={stat.useTheme ? { color: colors.primary } : undefined}
                >{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Student Grades Header & Table Header - Combined Sticky */}
      <div className="sticky top-16 z-20 rounded-t-3xl overflow-hidden bg-white">
        {/* Student Grades Section */}
        <div className="bg-white border-b border-gray-100 py-4 lg:py-6 px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3 lg:gap-4">
              <div 
                className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: colors.primary }}
              >
                <Users className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg lg:text-xl font-bold" style={{ color: '#111827' }}>Student Grades</h2>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  <p className="text-xs lg:text-sm text-gray-500">{classRecord.length} students enrolled</p>
                  {ecrSyncStatus?.hasSynced && (
                    <>
                      <span className="text-gray-300">•</span>
                      <div 
                        className="flex items-center gap-1 text-xs text-emerald-600"
                        title={ecrSyncStatus.ecrFileName ? `Last synced from: ${ecrSyncStatus.ecrFileName}` : undefined}
                      >
                        <Check className="w-3 h-3" />
                        <span className="font-medium">Synced {formatSyncDate(ecrSyncStatus.ecrLastSyncedAt)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 lg:gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Label className="text-gray-600 font-semibold text-sm">Quarter:</Label>
                <Select value={selectedQuarter} onValueChange={(val) => val && setSelectedQuarter(val)}>
                  <SelectTrigger className="w-36 lg:w-40 bg-white border-gray-200 rounded-xl h-10 lg:h-11 font-medium shadow-sm">
                    <SelectValue>
                      {selectedQuarter === "Q1" ? "1st Quarter" : selectedQuarter === "Q2" ? "2nd Quarter" : selectedQuarter === "Q3" ? "3rd Quarter" : "4th Quarter"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {quarters.map((q) => (
                      <SelectItem key={q} value={q} className="rounded-lg">
                        {q === "Q1" ? "1st Quarter" : q === "Q2" ? "2nd Quarter" : q === "Q3" ? "3rd Quarter" : "4th Quarter"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Gender Separation Toggle */}
              <Button
                variant={separateByGender ? "default" : "outline"}
                onClick={() => setSeparateByGender(!separateByGender)}
                className="rounded-xl font-medium shadow-sm h-10 lg:h-11 px-3"
                style={separateByGender 
                  ? { backgroundColor: colors.primary } 
                  : { borderColor: `${colors.primary}40`, color: colors.primary }
                }
                title={separateByGender ? "Show combined list" : "Separate by gender"}
              >
                <SplitSquareHorizontal className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">{separateByGender ? "Separated" : "By Gender"}</span>
              </Button>
              {/* Hidden file input for ECR */}
              <input
                type="file"
                ref={ecrFileInputRef}
                onChange={handleEcrFileSelect}
                accept=".xlsx,.xls"
                className="hidden"
              />
              {/* Import/Sync ECR Button */}
              <Button
                onClick={() => {
                  if (ecrFileInputRef.current) {
                    ecrFileInputRef.current.click();
                  }
                  setEcrDialogOpen(true);
                }}
                variant="outline"
                className="rounded-xl font-medium shadow-sm h-10 lg:h-11 px-3 lg:px-4"
                style={{ 
                  borderColor: ecrSyncStatus?.hasSynced ? `${colors.primary}40` : '#10b98140',
                  color: ecrSyncStatus?.hasSynced ? colors.primary : '#10b981'
                }}
              >
                {ecrSyncStatus?.hasSynced ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Sync ECR</span>
                    <span className="sm:hidden">Sync</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Import ECR</span>
                    <span className="sm:hidden">Import</span>
                  </>
                )}
              </Button>
              <Button
                onClick={printSF8}
                variant="outline"
                className="rounded-xl font-medium shadow-sm h-10 lg:h-11 px-3 lg:px-4"
                style={{ borderColor: `${colors.primary}40`, color: colors.primary }}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Print SF8</span>
                <span className="sm:hidden">SF8</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Table Column Headers */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200">
          <table className="w-full">
            <thead>
              <tr>
                <th className="w-14 text-center font-bold py-3 px-2" style={{ color: '#374151' }}>#</th>
                <th className="w-32 font-bold py-3 px-2 text-left" style={{ color: '#374151' }}>LRN</th>
                <th className="font-bold py-3 px-2 text-left" style={{ color: '#374151' }}>Student Name</th>
                <th className="text-center w-20 font-bold py-3 px-2" style={{ color: '#374151' }}>WW%</th>
                <th className="text-center w-20 font-bold py-3 px-2" style={{ color: '#374151' }}>PT%</th>
                <th className="text-center w-20 font-bold py-3 px-2" style={{ color: '#374151' }}>QA%</th>
                <th className="text-center w-24 font-bold py-3 px-2" style={{ color: '#374151' }}>Initial</th>
                <th className="text-center w-24 font-bold py-3 px-2" style={{ color: '#374151' }}>Grade</th>
                <th className="w-36 font-bold py-3 px-2 text-left" style={{ color: '#374151' }}>Remarks</th>
                <th className="text-right w-28 font-bold py-3 px-2" style={{ color: '#374151' }}>Actions</th>
              </tr>
            </thead>
          </table>
        </div>
      </div>

      {/* Grades Table Data */}
      <div className="border-none overflow-visible rounded-b-3xl bg-white">
        {(() => {
          // Sort students alphabetically
          const sortedRecords = [...classRecord].sort((a, b) => {
            const nameA = `${a.student.lastName}, ${a.student.firstName}`.toLowerCase();
            const nameB = `${b.student.lastName}, ${b.student.firstName}`.toLowerCase();
            return nameA.localeCompare(nameB);
          });

          // Separate by gender if enabled
          const maleRecords = sortedRecords.filter(r => r.student.gender?.toLowerCase() === 'male');
          const femaleRecords = sortedRecords.filter(r => r.student.gender?.toLowerCase() === 'female');

          // Render student row
          const renderStudentRow = (record: ClassRecord, index: number, bgTint?: string) => {
            const grade = record.grades.find((g) => g.quarter === selectedQuarter);
            return (
              <TableRow
                key={record.student.id}
                className={`transition-all duration-200 hover:bg-gray-50/80 ${getGradeBgColor(grade?.quarterlyGrade ?? null)} border-b border-gray-50 ${bgTint || ''}`}
              >
                <TableCell className="text-center text-gray-500 font-semibold py-3">
                  {index + 1}
                </TableCell>
                <TableCell className="font-mono text-sm text-gray-600 tracking-wide py-3">
                  {record.student.lrn}
                </TableCell>
                <TableCell className="py-3">
                  <div className="font-semibold text-gray-900">
                    {record.student.lastName}, {record.student.firstName}
                    {record.student.middleName && (
                      <span className="text-gray-400 ml-1 font-normal">
                        {record.student.middleName.charAt(0)}.
                      </span>
                    )}
                    {record.student.suffix && (
                      <span className="text-gray-400 font-normal"> {record.student.suffix}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center font-semibold py-3">
                  {grade?.writtenWorkPS?.toFixed(1) || <span className="text-gray-300">—</span>}
                </TableCell>
                <TableCell className="text-center font-semibold py-3">
                  {grade?.perfTaskPS?.toFixed(1) || <span className="text-gray-300">—</span>}
                </TableCell>
                <TableCell className="text-center font-semibold py-3">
                  {grade?.quarterlyAssessPS?.toFixed(1) || <span className="text-gray-300">—</span>}
                </TableCell>
                <TableCell className="text-center font-semibold py-3">
                  {grade?.initialGrade?.toFixed(2) || <span className="text-gray-300">—</span>}
                </TableCell>
                <TableCell className={`text-center text-xl py-3 ${getGradeColor(grade?.quarterlyGrade ?? null)}`}>
                  {grade?.quarterlyGrade || <span className="text-gray-300 text-base">—</span>}
                </TableCell>
                <TableCell className="py-3">
                  <Badge
                    variant="secondary"
                    className={`text-xs font-semibold px-3 py-1 rounded-lg ${
                      grade?.quarterlyGrade
                        ? grade.quarterlyGrade >= 75
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-red-100 text-red-700 border border-red-200"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {getGradeRemarks(grade?.quarterlyGrade ?? null)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openGradeDialog(record, grade)}
                      className="h-8 w-8 p-0 rounded-lg transition-all"
                      title={grade ? "Edit Grade" : "Add Grade"}
                      style={{ color: colors.primary }}
                    >
                      {grade ? (
                        <Edit className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </Button>
                    {grade && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        onClick={() => handleDeleteGrade(grade.id)}
                        title="Delete Grade"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          };

          if (separateByGender) {
            return (
              <>
                {/* Male Section */}
                {maleRecords.length > 0 && (
                  <>
                    <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500 text-white text-xs font-semibold">Male</Badge>
                        <span className="text-sm font-semibold text-blue-800">
                          {maleRecords.length} {maleRecords.length === 1 ? 'student' : 'students'}
                        </span>
                      </div>
                    </div>
                    <Table>
                      <TableBody>
                        {maleRecords.map((record, index) => renderStudentRow(record, index))}
                      </TableBody>
                    </Table>
                  </>
                )}

                {/* Female Section */}
                {femaleRecords.length > 0 && (
                  <>
                    <div className="px-4 py-2.5 bg-pink-50 border-b border-pink-100">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-pink-500 text-white text-xs font-semibold">Female</Badge>
                        <span className="text-sm font-semibold text-pink-800">
                          {femaleRecords.length} {femaleRecords.length === 1 ? 'student' : 'students'}
                        </span>
                      </div>
                    </div>
                    <Table>
                      <TableBody>
                        {femaleRecords.map((record, index) => renderStudentRow(record, index))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </>
            );
          }

          // Combined view (alphabetically sorted)
          return (
            <Table>
              <TableBody>
                {sortedRecords.map((record, index) => renderStudentRow(record, index))}
              </TableBody>
            </Table>
          );
        })()}
      </div>

      {/* Grade Input Dialog - Tab-Based Responsive Design */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col rounded-2xl border-0 shadow-2xl bg-white p-0">
          {/* Header */}
          <DialogHeader className="border-b border-gray-100 px-4 sm:px-6 py-4 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg shrink-0`}>
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base font-bold truncate" style={{ color: '#000000' }}>
                  {editingGrade ? "Edit Grade" : "Add Grade"} — {selectedQuarter === 'Q1' ? '1st Quarter' : selectedQuarter === 'Q2' ? '2nd Quarter' : selectedQuarter === 'Q3' ? '3rd Quarter' : '4th Quarter'}
                </DialogTitle>
                <DialogDescription className="text-base truncate">
                  {selectedStudent && (
                    <span className="font-semibold text-black">
                      {selectedStudent.student.lastName}, {selectedStudent.student.firstName}
                    </span>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Tab Content */}
          <Tabs defaultValue="quiz" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="sticky top-0 z-10 shrink-0 mx-4 sm:mx-6 mt-4 mb-4 bg-white border-b border-gray-200 p-1 rounded-xl h-auto grid grid-cols-3 gap-1">
              <TabsTrigger 
                value="quiz" 
                className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg text-sm font-semibold transition-all data-[active]:bg-blue-500 data-[active]:text-white data-[active]:shadow-md"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Quiz</span>
                <span className="sm:hidden">WW</span>
                <span className="ml-1 bg-blue-100 text-blue-700 data-[active]:bg-blue-400 data-[active]:text-white text-xs px-1.5 py-0 h-5 rounded-full inline-flex items-center justify-center min-w-[20px]">
                  {writtenWorkScores.length}
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="pt" 
                className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg text-sm font-semibold transition-all data-[active]:bg-purple-500 data-[active]:text-white data-[active]:shadow-md"
              >
                <ClipboardList className="w-4 h-4" />
                <span>PT</span>
                <span className="ml-1 bg-purple-100 text-purple-700 data-[active]:bg-purple-400 data-[active]:text-white text-xs px-1.5 py-0 h-5 rounded-full inline-flex items-center justify-center min-w-[20px]">
                  {perfTaskScores.length}
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="qa" 
                className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg text-sm font-semibold transition-all data-[active]:bg-amber-500 data-[active]:text-white data-[active]:shadow-md"
              >
                <Award className="w-4 h-4" />
                <span>QA</span>
              </TabsTrigger>
            </TabsList>

            {/* Quiz Tab */}
            <TabsContent value="quiz" className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900" style={{ color: '#111827' }}>Written Work</h3>
                    <p className="text-sm text-blue-600 font-medium" style={{ color: '#2563eb' }}>Weight: {classAssignment.subject.writtenWorkWeight}%</p>
                  </div>
                  <Button
                    onClick={addWrittenWork}
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium h-9 px-3 shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                
                {writtenWorkScores.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No quizzes added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {writtenWorkScores.map((item, index) => (
                      <div
                        key={index}
                        className="p-3 bg-blue-50 rounded-xl border border-blue-100"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {index + 1}
                          </div>
                          <Input
                            type="text"
                            value={item.description || ""}
                            onChange={(e) => updateWrittenWork(index, "description", e.target.value)}
                            placeholder={`Quiz ${index + 1}`}
                            className="flex-1 bg-white border-2 border-blue-200 rounded-lg h-9 text-sm font-medium focus:border-blue-400"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                            onClick={() => removeWrittenWork(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 pl-10">
                          <Input
                            type="date"
                            value={item.date || ""}
                            onChange={(e) => updateWrittenWork(index, "date", e.target.value)}
                            className="flex-1 bg-white border-2 border-gray-200 rounded-lg h-9 text-sm focus:border-blue-400"
                          />
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Input
                              type="number"
                              value={item.score || ""}
                              onChange={(e) => updateWrittenWork(index, "score", e.target.value)}
                              onFocus={(e) => e.target.select()}
                              placeholder="0"
                              className="w-14 sm:w-16 text-center bg-white border-2 border-blue-200 rounded-lg h-9 text-base font-bold focus:border-blue-400"
                              min={0}
                            />
                            <span className="text-gray-400 font-bold">/</span>
                            <Input
                              type="number"
                              value={item.maxScore || ""}
                              onChange={(e) => updateWrittenWork(index, "maxScore", e.target.value)}
                              onFocus={(e) => e.target.select()}
                              placeholder="100"
                              className="w-14 sm:w-16 text-center bg-gray-50 border-2 border-gray-200 rounded-lg h-9 text-base font-bold focus:border-gray-400"
                              min={1}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Performance Tasks Tab */}
            <TabsContent value="pt" className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900" style={{ color: '#111827' }}>Performance Tasks</h3>
                    <p className="text-sm text-purple-600 font-medium" style={{ color: '#9333ea' }}>Weight: {classAssignment.subject.perfTaskWeight}%</p>
                  </div>
                  <Button
                    onClick={addPerfTask}
                    size="sm"
                    className="bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium h-9 px-3 shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                
                {perfTaskScores.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No tasks added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {perfTaskScores.map((item, index) => (
                      <div
                        key={index}
                        className="p-3 bg-purple-50 rounded-xl border border-purple-100"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {index + 1}
                          </div>
                          <Input
                            type="text"
                            value={item.description || ""}
                            onChange={(e) => updatePerfTask(index, "description", e.target.value)}
                            placeholder={`Task ${index + 1}`}
                            className="flex-1 bg-white border-2 border-purple-200 rounded-lg h-9 text-sm font-medium focus:border-purple-400"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                            onClick={() => removePerfTask(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 pl-10">
                          <Input
                            type="date"
                            value={item.date || ""}
                            onChange={(e) => updatePerfTask(index, "date", e.target.value)}
                            className="flex-1 bg-white border-2 border-gray-200 rounded-lg h-9 text-sm focus:border-purple-400"
                          />
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Input
                              type="number"
                              value={item.score || ""}
                              onChange={(e) => updatePerfTask(index, "score", e.target.value)}
                              onFocus={(e) => e.target.select()}
                              placeholder="0"
                              className="w-14 sm:w-16 text-center bg-white border-2 border-purple-200 rounded-lg h-9 text-base font-bold focus:border-purple-400"
                              min={0}
                            />
                            <span className="text-gray-400 font-bold">/</span>
                            <Input
                              type="number"
                              value={item.maxScore || ""}
                              onChange={(e) => updatePerfTask(index, "maxScore", e.target.value)}
                              onFocus={(e) => e.target.select()}
                              placeholder="100"
                              className="w-14 sm:w-16 text-center bg-gray-50 border-2 border-gray-200 rounded-lg h-9 text-base font-bold focus:border-gray-400"
                              min={1}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Quarterly Assessment Tab */}
            <TabsContent value="qa" className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
              <div className="space-y-4">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-gray-900" style={{ color: '#111827' }}>Quarterly Assessment</h3>
                  <p className="text-sm text-amber-600 font-medium" style={{ color: '#d97706' }}>Weight: {classAssignment.subject.quarterlyAssessWeight}%</p>
                </div>
                
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <div className="flex items-center gap-2 sm:gap-3 justify-center">
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        value={quarterlyAssessScore}
                        onChange={(e) => setQuarterlyAssessScore(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        placeholder="0"
                        min={0}
                        className="w-14 sm:w-16 text-center bg-white border-2 border-amber-200 rounded-lg h-9 text-base font-bold focus:border-amber-400"
                      />
                      <span className="text-gray-400 font-bold">/</span>
                      <Input
                        type="number"
                        value={quarterlyAssessMax}
                        onChange={(e) => setQuarterlyAssessMax(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        placeholder="100"
                        min={1}
                        className="w-14 sm:w-16 text-center bg-gray-50 border-2 border-gray-200 rounded-lg h-9 text-base font-bold focus:border-gray-400"
                      />
                    </div>
                    {quarterlyAssessScore && quarterlyAssessMax && (
                      <div className="text-sm">
                        <span className="text-gray-500">= </span>
                        <span className="font-bold text-amber-600">
                          {((Number(quarterlyAssessScore) / Number(quarterlyAssessMax)) * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer with Actions */}
          <div className="border-t border-gray-100 px-4 sm:px-6 py-4 bg-gray-50 flex items-center justify-end gap-3 shrink-0">
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)} 
              className="h-10 px-4 sm:px-6 rounded-lg font-medium text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveGrade}
              disabled={saving}
              className="h-10 px-4 sm:px-6 rounded-lg font-medium text-sm shadow-md"
              style={{ backgroundColor: colors.primary }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Grade
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ECR Import Dialog */}
      <Dialog open={ecrDialogOpen} onOpenChange={(open) => {
        setEcrDialogOpen(open);
        if (!open) {
          setEcrFile(null);
          setEcrPreview(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="shrink-0">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: colors.primary }}
              >
                <FileUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold" style={{ color: '#000000' }}>
                  {ecrSyncStatus?.hasSynced ? 'Sync ECR' : 'Import ECR'}
                </DialogTitle>
                <DialogDescription>
                  {ecrSyncStatus?.hasSynced 
                    ? 'Update grades from your E-Class Record Excel file'
                    : 'Import grades from your E-Class Record Excel file'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {!ecrFile ? (
              <div 
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:border-gray-400 hover:bg-gray-50"
                style={{ borderColor: `${colors.primary}40` }}
                onClick={() => ecrFileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-4" style={{ color: colors.primary }} />
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  Drop your ECR file here
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  or click to select file
                </p>
                <p className="text-xs text-gray-400">
                  Supports .xlsx and .xls files
                </p>
              </div>
            ) : ecrLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: colors.primary }} />
                <p className="text-gray-600 font-medium">Analyzing ECR file...</p>
                <p className="text-sm text-gray-400 mt-1">Reading student grades from Excel</p>
              </div>
            ) : ecrPreview ? (
              <div className="space-y-4">
                {/* File Info */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-8 h-8" style={{ color: colors.primary }} />
                    <div>
                      <p className="font-semibold text-gray-800">{ecrPreview.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {ecrPreview.quarters.length} quarter(s) found
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setEcrFile(null);
                      setEcrPreview(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Match Statistics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-blue-50 rounded-xl text-center">
                    <p className="text-2xl font-bold text-blue-600">{ecrPreview.stats.totalStudents}</p>
                    <p className="text-xs text-blue-700">Total Students</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl text-center">
                    <p className="text-2xl font-bold text-emerald-600">{ecrPreview.stats.matchedStudents}</p>
                    <p className="text-xs text-emerald-700">Matched</p>
                  </div>
                  <div className={`p-3 rounded-xl text-center ${ecrPreview.stats.unmatchedStudents > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
                    <p className={`text-2xl font-bold ${ecrPreview.stats.unmatchedStudents > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                      {ecrPreview.stats.unmatchedStudents}
                    </p>
                    <p className={`text-xs ${ecrPreview.stats.unmatchedStudents > 0 ? 'text-amber-700' : 'text-gray-500'}`}>Unmatched</p>
                  </div>
                </div>

                {/* Warning for unmatched students */}
                {ecrPreview.stats.unmatchedStudents > 0 && (() => {
                  // Collect unique unmatched names across all quarters
                  const unmatchedNames: string[] = [];
                  ecrPreview.quarters.forEach((q: any) => {
                    q.students.forEach((s: any) => {
                      if (!s.matchedStudentId && !unmatchedNames.includes(s.name)) {
                        unmatchedNames.push(s.name);
                      }
                    });
                  });
                  return (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
                      <div className="flex items-start gap-3 p-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-amber-800">
                            {ecrPreview.stats.unmatchedStudents} student(s) couldn't be matched
                          </p>
                          <p className="text-xs text-amber-600 mt-0.5">
                            Their grades will be skipped. Check that these names match your class roster.
                          </p>
                        </div>
                      </div>
                      <div className="border-t border-amber-200 divide-y divide-amber-100">
                        {unmatchedNames.map((name, idx) => (
                          <div key={idx} className="flex items-center gap-2 px-3 py-2">
                            <X className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="text-xs font-medium text-amber-900">{name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Quarter Preview */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">Quarters to Import:</h4>
                  {ecrPreview.quarters.map((q: any) => (
                    <div key={q.quarter} className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-semibold">
                            {q.quarter === 'Q1' ? '1st Quarter' : q.quarter === 'Q2' ? '2nd Quarter' : q.quarter === 'Q3' ? '3rd Quarter' : '4th Quarter'}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {q.students.filter((s: any) => s.matchedStudentId).length} students
                          </span>
                        </div>
                        <Check className="w-5 h-5 text-emerald-500" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sample matched students */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-700">Sample Matched Students:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {ecrPreview.quarters[0]?.students
                      .filter((s: any) => s.matchedStudentId)
                      .slice(0, 5)
                      .map((student: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-sm p-2 bg-emerald-50/50 rounded-lg">
                          <span className="text-gray-700">{student.name}</span>
                          <span className="text-emerald-600 font-semibold">
                            Grade: {student.quarterlyGrade || '—'}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter className="shrink-0 gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setEcrDialogOpen(false);
                setEcrFile(null);
                setEcrPreview(null);
              }}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEcrImport}
              disabled={!ecrPreview || ecrImporting || ecrPreview?.stats.matchedStudents === 0}
              className="rounded-lg shadow-md"
              style={{ backgroundColor: colors.primary }}
            >
              {ecrImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {ecrSyncStatus?.hasSynced ? 'Sync Grades' : 'Import Grades'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
