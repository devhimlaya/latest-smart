import { useState } from "react";
import {
  Activity,
  Search,
  Download,
  Clock,
  Plus,
  Edit3,
  Trash2,
  LogIn,
  LogOut,
  Settings,
  UserPlus,
  AlertTriangle,
  Info,
  Calendar,
  User,
  FileText,
  Database,
  RefreshCw,
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

interface AuditLog {
  id: string;
  action: "create" | "update" | "delete" | "login" | "logout" | "config";
  user: string;
  userRole: string;
  target: string;
  targetType: string;
  details: string;
  ipAddress: string;
  timestamp: string;
  date: string;
  severity: "info" | "warning" | "critical";
}

const mockLogs: AuditLog[] = [
  { id: "LOG001", action: "update", user: "Maria Cruz", userRole: "TEACHER", target: "Student Grades", targetType: "Grades", details: "Updated Q3 grades for English 7 - Rizal section (45 students)", ipAddress: "192.168.1.105", timestamp: "08:45 AM", date: "Mar 31, 2026", severity: "info" },
  { id: "LOG002", action: "login", user: "John Santos", userRole: "TEACHER", target: "System", targetType: "Auth", details: "Successful login from new device (Chrome on Windows)", ipAddress: "192.168.1.120", timestamp: "08:30 AM", date: "Mar 31, 2026", severity: "info" },
  { id: "LOG003", action: "config", user: "Admin", userRole: "ADMIN", target: "Grading Weights", targetType: "Config", details: "Updated MAPEH grading weights: WW 20%, PT 60%, QA 20%", ipAddress: "192.168.1.1", timestamp: "08:15 AM", date: "Mar 31, 2026", severity: "critical" },
  { id: "LOG004", action: "delete", user: "Registrar", userRole: "REGISTRAR", target: "Student Record", targetType: "Student", details: "Removed duplicate record for Juan Dela Cruz (LRN: 123456789012)", ipAddress: "192.168.1.102", timestamp: "08:00 AM", date: "Mar 31, 2026", severity: "warning" },
  { id: "LOG005", action: "create", user: "Registrar", userRole: "REGISTRAR", target: "Enrollment", targetType: "Student", details: "New enrollment: Anna Garcia - Grade 7 Rizal", ipAddress: "192.168.1.102", timestamp: "07:45 AM", date: "Mar 31, 2026", severity: "info" },
  { id: "LOG006", action: "login", user: "Maria Cruz", userRole: "TEACHER", target: "System", targetType: "Auth", details: "Failed login attempt - incorrect password (2nd attempt)", ipAddress: "192.168.1.105", timestamp: "07:30 AM", date: "Mar 31, 2026", severity: "warning" },
  { id: "LOG007", action: "update", user: "Pedro Garcia", userRole: "TEACHER", target: "Class Record", targetType: "Grades", details: "Modified Written Work scores for Math 8 - Bonifacio", ipAddress: "192.168.1.108", timestamp: "05:30 PM", date: "Mar 30, 2026", severity: "info" },
  { id: "LOG008", action: "logout", user: "John Santos", userRole: "TEACHER", target: "System", targetType: "Auth", details: "User logged out", ipAddress: "192.168.1.120", timestamp: "05:00 PM", date: "Mar 30, 2026", severity: "info" },
  { id: "LOG009", action: "create", user: "Admin", userRole: "ADMIN", target: "User Account", targetType: "User", details: "Created new teacher account: Rosa Navarro", ipAddress: "192.168.1.1", timestamp: "04:30 PM", date: "Mar 30, 2026", severity: "info" },
  { id: "LOG010", action: "update", user: "Admin", userRole: "ADMIN", target: "System Settings", targetType: "Config", details: "Updated academic year settings to S.Y. 2025-2026", ipAddress: "192.168.1.1", timestamp: "04:00 PM", date: "Mar 30, 2026", severity: "critical" },
  { id: "LOG011", action: "delete", user: "Admin", userRole: "ADMIN", target: "User Account", targetType: "User", details: "Deactivated account: Old Teacher (resigned)", ipAddress: "192.168.1.1", timestamp: "03:30 PM", date: "Mar 30, 2026", severity: "warning" },
  { id: "LOG012", action: "update", user: "Luz Bautista", userRole: "TEACHER", target: "Student Grades", targetType: "Grades", details: "Updated Performance Task scores for Science 9", ipAddress: "192.168.1.112", timestamp: "03:00 PM", date: "Mar 30, 2026", severity: "info" },
];

const actionLabels: Record<string, string> = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  login: "Login",
  logout: "Logout",
  config: "Configured",
};

const actionColors: Record<string, string> = {
  create: "bg-emerald-100 text-emerald-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
  login: "bg-purple-100 text-purple-700",
  logout: "bg-gray-100 text-gray-600",
  config: "bg-amber-100 text-amber-700",
};

const actionIcons: Record<string, React.ReactNode> = {
  create: <Plus className="w-3.5 h-3.5" />,
  update: <Edit3 className="w-3.5 h-3.5" />,
  delete: <Trash2 className="w-3.5 h-3.5" />,
  login: <LogIn className="w-3.5 h-3.5" />,
  logout: <LogOut className="w-3.5 h-3.5" />,
  config: <Settings className="w-3.5 h-3.5" />,
};

const severityConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  info: { icon: <Info className="w-3.5 h-3.5" />, color: "bg-gray-100 text-gray-600", label: "Info" },
  warning: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "bg-amber-100 text-amber-700", label: "Warning" },
  critical: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "bg-red-100 text-red-700", label: "Critical" },
};

const targetTypeIcons: Record<string, React.ReactNode> = {
  Grades: <FileText className="w-4 h-4" />,
  Auth: <LogIn className="w-4 h-4" />,
  Config: <Settings className="w-4 h-4" />,
  Student: <User className="w-4 h-4" />,
  User: <UserPlus className="w-4 h-4" />,
};

export default function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");

  const filteredLogs = mockLogs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = selectedAction === "all" || log.action === selectedAction;
    const matchesSeverity = selectedSeverity === "all" || log.severity === selectedSeverity;
    return matchesSearch && matchesAction && matchesSeverity;
  });

  const logCounts = {
    total: mockLogs.length,
    creates: mockLogs.filter((l) => l.action === "create").length,
    updates: mockLogs.filter((l) => l.action === "update").length,
    deletes: mockLogs.filter((l) => l.action === "delete").length,
    logins: mockLogs.filter((l) => l.action === "login" || l.action === "logout").length,
    critical: mockLogs.filter((l) => l.severity === "critical").length,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#111827' }}>
            Audit Logs
          </h1>
          <p style={{ color: '#6b7280' }} className="mt-1">
            Track all system activities and changes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 rounded-xl border-gray-200">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25">
            <Download className="w-4 h-4" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="border-0 shadow-lg shadow-gray-200/50 rounded-xl bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Logs</p>
                <p className="text-2xl font-bold" style={{ color: '#111827' }}>{logCounts.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg shadow-gray-200/50 rounded-xl bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Creates</p>
                <p className="text-2xl font-bold text-emerald-600">{logCounts.creates}</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-100">
                <Plus className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg shadow-gray-200/50 rounded-xl bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Updates</p>
                <p className="text-2xl font-bold text-blue-600">{logCounts.updates}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Edit3 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg shadow-gray-200/50 rounded-xl bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Deletes</p>
                <p className="text-2xl font-bold text-red-600">{logCounts.deletes}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-100">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg shadow-gray-200/50 rounded-xl bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Auth Events</p>
                <p className="text-2xl font-bold text-purple-600">{logCounts.logins}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <LogIn className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg shadow-gray-200/50 rounded-xl bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Critical</p>
                <p className="text-2xl font-bold text-red-600">{logCounts.critical}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card className="border-0 shadow-xl shadow-gray-200/50 rounded-2xl bg-white">
        <CardHeader className="border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2" style={{ color: '#111827' }}>
                <Database className="w-5 h-5 text-purple-600" />
                Activity History
              </CardTitle>
              <CardDescription>Complete log of all system activities</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64 rounded-xl border-gray-200"
                />
              </div>
              <Select value={selectedAction} onValueChange={(val) => val && setSelectedAction(val)}>
                <SelectTrigger className="w-36 rounded-xl border-gray-200">
                  <SelectValue>
                    {selectedAction === "all" ? "All Actions" : actionLabels[selectedAction]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Created</SelectItem>
                  <SelectItem value="update">Updated</SelectItem>
                  <SelectItem value="delete">Deleted</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="config">Configured</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedSeverity} onValueChange={(val) => val && setSelectedSeverity(val)}>
                <SelectTrigger className="w-32 rounded-xl border-gray-200">
                  <SelectValue>
                    {selectedSeverity === "all" ? "All Severity" : severityConfig[selectedSeverity].label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
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
                  <TableHead className="font-bold text-gray-700 w-24">Log ID</TableHead>
                  <TableHead className="font-bold text-gray-700">Action</TableHead>
                  <TableHead className="font-bold text-gray-700">User</TableHead>
                  <TableHead className="font-bold text-gray-700">Target</TableHead>
                  <TableHead className="font-bold text-gray-700">Details</TableHead>
                  <TableHead className="font-bold text-gray-700">Severity</TableHead>
                  <TableHead className="font-bold text-gray-700">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-mono text-xs text-purple-600 font-semibold">
                      {log.id}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${actionColors[log.action]} border-0 font-medium flex items-center gap-1 w-fit`}>
                        {actionIcons[log.action]}
                        {actionLabels[log.action]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: '#111827' }}>{log.user}</p>
                        <p className="text-xs text-gray-500">{log.userRole}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gray-100 text-gray-600">
                          {targetTypeIcons[log.targetType]}
                        </div>
                        <span className="text-sm text-gray-700">{log.target}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-gray-600 truncate" title={log.details}>
                        {log.details}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${severityConfig[log.severity].color} border-0 font-medium flex items-center gap-1 w-fit`}>
                        {severityConfig[log.severity].icon}
                        {severityConfig[log.severity].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1 font-medium" style={{ color: '#111827' }}>
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {log.timestamp}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {log.date}
                        </div>
                      </div>
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
