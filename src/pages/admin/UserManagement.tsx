import { useState } from "react";
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit,
  MoreHorizontal,
  Shield,
  UserCheck,
  GraduationCap,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Mail,
  Calendar,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "TEACHER" | "REGISTRAR" | "STUDENT";
  status: "Active" | "Inactive";
  lastLogin: string;
  createdAt: string;
}

const mockUsers: User[] = [
  { id: "1", username: "admin", firstName: "System", lastName: "Admin", email: "admin@school.edu.ph", role: "ADMIN", status: "Active", lastLogin: "Mar 31, 2026 08:00 AM", createdAt: "Jan 1, 2025" },
  { id: "2", username: "mcruz", firstName: "Maria", lastName: "Cruz", email: "mcruz@school.edu.ph", role: "TEACHER", status: "Active", lastLogin: "Mar 31, 2026 07:45 AM", createdAt: "Jun 15, 2025" },
  { id: "3", username: "jreyes", firstName: "Juan", lastName: "Reyes", email: "jreyes@school.edu.ph", role: "TEACHER", status: "Active", lastLogin: "Mar 30, 2026 04:30 PM", createdAt: "Jun 15, 2025" },
  { id: "4", username: "registrar", firstName: "Ana", lastName: "Santos", email: "registrar@school.edu.ph", role: "REGISTRAR", status: "Active", lastLogin: "Mar 31, 2026 08:15 AM", createdAt: "Jan 5, 2025" },
  { id: "5", username: "pgarcia", firstName: "Pedro", lastName: "Garcia", email: "pgarcia@school.edu.ph", role: "TEACHER", status: "Inactive", lastLogin: "Feb 15, 2026 03:00 PM", createdAt: "Jun 20, 2025" },
  { id: "6", username: "lbautista", firstName: "Luz", lastName: "Bautista", email: "lbautista@school.edu.ph", role: "TEACHER", status: "Active", lastLogin: "Mar 31, 2026 07:30 AM", createdAt: "Jun 15, 2025" },
  { id: "7", username: "rnavarro", firstName: "Rosa", lastName: "Navarro", email: "rnavarro@school.edu.ph", role: "REGISTRAR", status: "Active", lastLogin: "Mar 30, 2026 05:00 PM", createdAt: "Aug 1, 2025" },
  { id: "8", username: "admin2", firstName: "Jose", lastName: "Mendoza", email: "jmendoza@school.edu.ph", role: "ADMIN", status: "Active", lastLogin: "Mar 29, 2026 02:00 PM", createdAt: "Jan 1, 2025" },
];

const roleLabels: Record<string, string> = {
  ADMIN: "Administrator",
  TEACHER: "Teacher",
  REGISTRAR: "Registrar",
  STUDENT: "Student",
};

const roleColors: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  TEACHER: "bg-emerald-100 text-emerald-700",
  REGISTRAR: "bg-blue-100 text-blue-700",
  STUDENT: "bg-amber-100 text-amber-700",
};

const roleIcons: Record<string, React.ReactNode> = {
  ADMIN: <Shield className="w-3.5 h-3.5" />,
  TEACHER: <UserCheck className="w-3.5 h-3.5" />,
  REGISTRAR: <ClipboardList className="w-3.5 h-3.5" />,
  STUDENT: <GraduationCap className="w-3.5 h-3.5" />,
};

const roleGradients: Record<string, string> = {
  ADMIN: "from-purple-500 to-violet-600",
  TEACHER: "from-emerald-500 to-teal-600",
  REGISTRAR: "from-blue-500 to-indigo-600",
  STUDENT: "from-amber-500 to-orange-600",
};

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    const matchesStatus = selectedStatus === "all" || user.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const userCounts = {
    total: mockUsers.length,
    admin: mockUsers.filter((u) => u.role === "ADMIN").length,
    teacher: mockUsers.filter((u) => u.role === "TEACHER").length,
    registrar: mockUsers.filter((u) => u.role === "REGISTRAR").length,
    active: mockUsers.filter((u) => u.status === "Active").length,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#111827' }}>
            User Management
          </h1>
          <p style={{ color: '#6b7280' }} className="mt-1">
            Manage system users and their access permissions
          </p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 w-fit">
          <Plus className="w-4 h-4" />
          Add New User
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-lg shadow-gray-200/50 rounded-xl bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold" style={{ color: '#111827' }}>{userCounts.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-gray-100">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg shadow-gray-200/50 rounded-xl bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Admins</p>
                <p className="text-2xl font-bold text-purple-600">{userCounts.admin}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg shadow-gray-200/50 rounded-xl bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Teachers</p>
                <p className="text-2xl font-bold text-emerald-600">{userCounts.teacher}</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-100">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg shadow-gray-200/50 rounded-xl bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Registrars</p>
                <p className="text-2xl font-bold text-blue-600">{userCounts.registrar}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <ClipboardList className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg shadow-gray-200/50 rounded-xl bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Active</p>
                <p className="text-2xl font-bold text-emerald-600">{userCounts.active}</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="border-0 shadow-xl shadow-gray-200/50 rounded-2xl bg-white">
        <CardHeader className="border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg" style={{ color: '#111827' }}>All Users</CardTitle>
              <CardDescription>View and manage all system users</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64 rounded-xl border-gray-200"
                />
              </div>
              <Select value={selectedRole} onValueChange={(val) => val && setSelectedRole(val)}>
                <SelectTrigger className="w-36 rounded-xl border-gray-200">
                  <SelectValue>
                    {selectedRole === "all" ? "All Roles" : roleLabels[selectedRole]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                  <SelectItem value="TEACHER">Teacher</SelectItem>
                  <SelectItem value="REGISTRAR">Registrar</SelectItem>
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
                  <TableHead className="font-bold text-gray-700">User</TableHead>
                  <TableHead className="font-bold text-gray-700">Username</TableHead>
                  <TableHead className="font-bold text-gray-700">Role</TableHead>
                  <TableHead className="font-bold text-gray-700">Status</TableHead>
                  <TableHead className="font-bold text-gray-700">Last Login</TableHead>
                  <TableHead className="font-bold text-gray-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className={`h-10 w-10 ring-2 ring-offset-2 ring-${user.role === "ADMIN" ? "purple" : user.role === "TEACHER" ? "emerald" : "blue"}-100`}>
                          <AvatarFallback className={`bg-gradient-to-br ${roleGradients[user.role]} text-white font-semibold`}>
                            {user.firstName[0]}{user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold" style={{ color: '#111827' }}>{user.firstName} {user.lastName}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-gray-600">
                      {user.username}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${roleColors[user.role]} border-0 font-medium flex items-center gap-1 w-fit`}>
                        {roleIcons[user.role]}
                        {roleLabels[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.status === "Active" ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0 font-medium">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-600 border-0 font-medium">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {user.lastLogin}
                      </div>
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
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg text-amber-600">
                            {user.status === "Active" ? (
                              <>
                                <XCircle className="w-4 h-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Activate
                              </>
                            )}
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
