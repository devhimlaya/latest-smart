import { Link } from "react-router-dom";
import {
  Users,
  GraduationCap,
  UserCheck,
  Activity,
  ChevronRight,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Trash2,
  Plus,
  LogIn,
  Settings,
  TrendingUp,
  Server,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock data for admin dashboard
const mockStats = {
  totalUsers: 920,
  totalTeachers: 45,
  totalStudents: 850,
  totalAdmins: 3,
  activeUsers: 156,
  todayLogins: 89,
  pendingActions: 5,
  systemUptime: "99.9%",
};

interface AuditLog {
  id: string;
  action: "create" | "update" | "delete" | "login";
  user: string;
  target: string;
  details: string;
  timestamp: string;
  severity: "info" | "warning" | "critical";
}

const recentLogs: AuditLog[] = [
  { id: "1", action: "update", user: "Maria Cruz", target: "Grades", details: "Updated grades for English 7 - Rizal", timestamp: "2 minutes ago", severity: "info" },
  { id: "2", action: "login", user: "John Santos", target: "System", details: "Teacher login from new device", timestamp: "5 minutes ago", severity: "info" },
  { id: "3", action: "delete", user: "Admin User", target: "Student", details: "Removed duplicate student record", timestamp: "15 minutes ago", severity: "warning" },
  { id: "4", action: "create", user: "Registrar", target: "Enrollment", details: "New student enrollment - Grade 7", timestamp: "30 minutes ago", severity: "info" },
  { id: "5", action: "update", user: "System", target: "Grading Config", details: "Updated grading weights for MAPEH", timestamp: "1 hour ago", severity: "critical" },
  { id: "6", action: "login", user: "Maria Cruz", target: "System", details: "Failed login attempt (wrong password)", timestamp: "2 hours ago", severity: "warning" },
];

const quickActions = [
  { name: "Manage Users", description: "Add, edit, or deactivate users", icon: Users, href: "/admin/users", color: "purple" },
  { name: "View Audit Logs", description: "See all system activities", icon: Activity, href: "/admin/logs", color: "blue" },
  { name: "Grading Config", description: "Modify grading weights", icon: Settings, href: "/admin/grading", color: "amber" },
  { name: "System Settings", description: "Configure system options", icon: Server, href: "/admin/settings", color: "emerald" },
];

const getActionIcon = (action: AuditLog["action"]) => {
  switch (action) {
    case "create": return <Plus className="w-3.5 h-3.5" />;
    case "update": return <Edit3 className="w-3.5 h-3.5" />;
    case "delete": return <Trash2 className="w-3.5 h-3.5" />;
    case "login": return <LogIn className="w-3.5 h-3.5" />;
  }
};

const getActionColor = (action: AuditLog["action"]) => {
  switch (action) {
    case "create": return "bg-emerald-100 text-emerald-700";
    case "update": return "bg-blue-100 text-blue-700";
    case "delete": return "bg-red-100 text-red-700";
    case "login": return "bg-purple-100 text-purple-700";
  }
};

const getSeverityBadge = (severity: AuditLog["severity"]) => {
  switch (severity) {
    case "info": return <Badge className="bg-gray-100 text-gray-600 border-0 text-xs">Info</Badge>;
    case "warning": return <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Warning</Badge>;
    case "critical": return <Badge className="bg-red-100 text-red-700 border-0 text-xs">Critical</Badge>;
  }
};

export default function AdminDashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#111827' }}>
            Admin Dashboard
          </h1>
          <p style={{ color: '#6b7280' }} className="mt-1">
            System overview and administration
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-100 text-emerald-700 border-0 font-semibold flex items-center gap-1.5 px-3 py-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            System Online
          </Badge>
          <Button className="gap-2 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25">
            <Activity className="w-4 h-4" />
            View All Logs
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: "Total\nUsers", value: mockStats.totalUsers, icon: Users, color: "purple", gradient: "from-purple-500 to-violet-600" },
          { label: "Total\nTeachers", value: mockStats.totalTeachers, icon: UserCheck, color: "blue", gradient: "from-blue-500 to-indigo-600" },
          { label: "Total\nStudents", value: mockStats.totalStudents, icon: GraduationCap, color: "emerald", gradient: "from-emerald-500 to-teal-600" },
          { label: "Active\nToday", value: mockStats.activeUsers, icon: Activity, color: "amber", gradient: "from-amber-500 to-orange-600" },
        ].map((stat) => (
          <Card 
            key={stat.label} 
            className="group border-0 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300 bg-white overflow-hidden"
          >
            <CardContent className="p-6 h-full flex flex-col">
              <div className="flex items-start justify-between flex-1">
                <div>
                  <p className="text-sm font-medium text-gray-500 whitespace-pre-line leading-tight">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2" style={{ color: '#111827' }}>
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center text-sm text-gray-500">
                <TrendingUp className="w-4 h-4 mr-1 text-emerald-500" />
                <span className="text-emerald-600 font-medium">Live</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg shadow-gray-200/50 rounded-xl bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-100">
                  <Server className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">System Uptime</p>
                  <p className="text-xl font-bold text-emerald-600">{mockStats.systemUptime}</p>
                </div>
              </div>
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg shadow-gray-200/50 rounded-xl bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100">
                  <LogIn className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Today's Logins</p>
                  <p className="text-xl font-bold text-blue-600">{mockStats.todayLogins}</p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg shadow-gray-200/50 rounded-xl bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending Actions</p>
                  <p className="text-xl font-bold text-amber-600">{mockStats.pendingActions}</p>
                </div>
              </div>
              <Badge className="bg-amber-100 text-amber-700 border-0">Review</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 border-0 shadow-xl shadow-gray-200/50 rounded-2xl bg-white overflow-hidden">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-purple-50/50 to-violet-50/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2" style={{ color: '#111827' }}>
                  <Activity className="w-5 h-5 text-purple-600" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest system events and user actions</CardDescription>
              </div>
              <Link to="/admin/logs">
                <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg">
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[380px]">
              <div className="divide-y divide-gray-100">
                {recentLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm" style={{ color: '#111827' }}>{log.user}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-600 capitalize">{log.action}d {log.target}</span>
                          {getSeverityBadge(log.severity)}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{log.details}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {log.timestamp}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-xl shadow-gray-200/50 rounded-2xl bg-white">
          <CardHeader className="border-b border-gray-100 px-6 py-4">
            <CardTitle className="text-lg" style={{ color: '#111827' }}>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {quickActions.map((action) => (
                <Link key={action.name} to={action.href}>
                  <div className={`p-4 rounded-xl border border-gray-100 hover:border-${action.color}-200 hover:bg-${action.color}-50/50 transition-all cursor-pointer group`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl bg-${action.color}-100 text-${action.color}-600 group-hover:bg-${action.color}-200 transition-colors`}>
                        <action.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm" style={{ color: '#111827' }}>{action.name}</h4>
                        <p className="text-xs text-gray-500">{action.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Distribution */}
      <Card className="border-0 shadow-xl shadow-gray-200/50 bg-gradient-to-br from-purple-600 via-purple-500 to-violet-600 overflow-hidden rounded-2xl text-white">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">User Distribution</h3>
              <p className="text-purple-100 max-w-xl">
                Overview of all registered users in the system by role type.
              </p>
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="bg-white/10 rounded-xl px-4 py-2">
                  <span className="text-purple-200 text-sm">Teachers</span>
                  <p className="text-xl font-bold">{mockStats.totalTeachers}</p>
                </div>
                <div className="bg-white/10 rounded-xl px-4 py-2">
                  <span className="text-purple-200 text-sm">Students</span>
                  <p className="text-xl font-bold">{mockStats.totalStudents}</p>
                </div>
                <div className="bg-white/10 rounded-xl px-4 py-2">
                  <span className="text-purple-200 text-sm">Admins</span>
                  <p className="text-xl font-bold">{mockStats.totalAdmins}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/admin/users">
                <Button className="bg-white text-purple-600 hover:bg-purple-50 font-semibold rounded-xl px-6">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
