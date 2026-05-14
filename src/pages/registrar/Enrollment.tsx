import { useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, Users, CheckCircle2, Clock, XCircle, Wifi, WifiOff } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useTheme } from "@/contexts/ThemeContext";
import { adminApi, advisoryApi, registrarApi, type RegistrarStudent } from "@/lib/api";

const gradeLevelLabels: Record<string, string> = {
  GRADE_7: "Grade 7",
  GRADE_8: "Grade 8",
  GRADE_9: "Grade 9",
  GRADE_10: "Grade 10",
};

const statusBadge: Record<string, string> = {
  ENROLLED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  DROPPED: "bg-gray-200 text-gray-700",
  TRANSFERRED: "bg-blue-100 text-blue-700",
};

export default function Enrollment() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("2026-2027");
  const [activeTab, setActiveTab] = useState("all");
  const [students, setStudents] = useState<RegistrarStudent[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncConnection, setSyncConnection] = useState<"connected" | "offline">("connected");

  const loadData = async (year: string) => {
    setLoading(true);
    try {
      const [studentsRes, settingsRes] = await Promise.all([
        registrarApi.getStudents({ schoolYear: year }),
        adminApi.getSettings(),
      ]);
      setStudents(studentsRes.data.students || []);
      setLastSync(settingsRes.data.settings?.lastEnrollProSync ?? null);
    } catch (error) {
      console.error("Failed to load enrollment data:", error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedYear);
  }, [selectedYear]);

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await advisoryApi.syncFromEnrollPro();
      setSyncConnection("connected");
    } catch {
      // External systems may be offline on Tailnet; treat as valid state.
      setSyncConnection("offline");
    } finally {
      await loadData(selectedYear);
      setSyncing(false);
    }
  };

  const filteredEnrollments = useMemo(() => {
    return students.filter((student) => {
      const fullName = `${student.lastName}, ${student.firstName} ${student.middleName || ""}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchQuery.toLowerCase()) || student.lrn.includes(searchQuery.trim());
      const matchesTab = activeTab === "all" || (student.status || "").toLowerCase() === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [students, searchQuery, activeTab]);

  const stats = useMemo(() => {
    return {
      total: students.length,
      enrolled: students.filter((s) => s.status === "ENROLLED").length,
      pending: students.filter((s) => s.status === "PENDING").length,
      dropped: students.filter((s) => s.status === "DROPPED").length,
    };
  }, [students]);

  const formatSyncTime = (iso: string | null) => {
    if (!iso) return "No sync timestamp available";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "No sync timestamp available";
    return d.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
  };

  const yearOptions = ["2026-2027", "2025-2026", "2024-2025"];

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/registrar" },
          { label: "Enrollment" },
        ]}
      />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "#111827" }}>
            Enrollment Management
          </h1>
          <p style={{ color: "#6b7280" }} className="mt-1">
            Read-only view of EnrollPro-synced enrollment records
          </p>
        </div>
        <div className="w-full lg:w-[220px]">
          <Select value={selectedYear} onValueChange={(value) => setSelectedYear(value)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select School Year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border border-slate-200 rounded-2xl shadow-sm bg-white">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                {syncConnection === "connected" ? (
                  <Wifi className="w-5 h-5 text-emerald-600" />
                ) : (
                  <WifiOff className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  EnrollPro {syncConnection === "connected" ? "Connected" : "Offline/Unreachable"}
                </p>
                <p className="text-sm text-slate-600">
                  Students and enrollment data are synced from EnrollPro automatically every 5 minutes.
                </p>
                <p className="text-xs text-slate-500 mt-1">Last synced: {formatSyncTime(lastSync)}</p>
              </div>
            </div>
            <Button
              onClick={handleSyncNow}
              disabled={syncing}
              className="rounded-xl text-white"
              style={{ backgroundColor: colors.primary }}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync Now"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border" style={{ backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}20` }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${colors.primary}20` }}>
              <Users className="w-5 h-5" style={{ color: colors.primary }} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl border" style={{ backgroundColor: `${colors.secondary}10`, borderColor: `${colors.secondary}20` }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${colors.secondary}20` }}>
              <CheckCircle2 className="w-5 h-5" style={{ color: colors.secondary }} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Enrolled</p>
              <p className="text-2xl font-bold text-gray-900">{stats.enrolled}</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-red-50 border border-red-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Dropped</p>
              <p className="text-2xl font-bold text-gray-900">{stats.dropped}</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-0 shadow-xl shadow-gray-200/50 bg-white overflow-hidden rounded-2xl p-0">
        <CardHeader className="border-b border-gray-100 px-6 py-5" style={{ backgroundColor: `${colors.primary}08` }}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">Enrollment Records</CardTitle>
              <CardDescription className="text-gray-500 text-sm">S.Y. {selectedYear}</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or LRN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64 rounded-xl border-gray-200"
              />
            </div>
          </div>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-4 border-b border-gray-100">
            <TabsList className="bg-gray-100 p-1 rounded-xl">
              <TabsTrigger value="all" className="rounded-lg px-4">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="enrolled" className="rounded-lg px-4">Enrolled ({stats.enrolled})</TabsTrigger>
              <TabsTrigger value="pending" className="rounded-lg px-4">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="dropped" className="rounded-lg px-4">Dropped ({stats.dropped})</TabsTrigger>
            </TabsList>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="font-bold text-gray-700">LRN</TableHead>
                  <TableHead className="font-bold text-gray-700">Student Name</TableHead>
                  <TableHead className="font-bold text-gray-700">Grade Level</TableHead>
                  <TableHead className="font-bold text-gray-700">Section</TableHead>
                  <TableHead className="font-bold text-gray-700">Enrollment Status</TableHead>
                  <TableHead className="font-bold text-gray-700">School Year</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      Loading enrollment records...
                    </TableCell>
                  </TableRow>
                ) : filteredEnrollments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      No enrollment records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEnrollments.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono text-sm text-gray-700">{student.lrn}</TableCell>
                      <TableCell className="font-semibold text-gray-900">
                        {student.lastName}, {student.firstName} {student.middleName || ""}
                      </TableCell>
                      <TableCell>
                        <Badge style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}>
                          {gradeLevelLabels[student.gradeLevel] || student.gradeLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-gray-700">{student.sectionName || "-"}</TableCell>
                      <TableCell>
                        <Badge className={statusBadge[student.status || ""] || "bg-slate-100 text-slate-700"}>
                          {student.status || "UNKNOWN"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700">{student.schoolYear || selectedYear}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
