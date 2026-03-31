import { useEffect, useState } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Users,
  Settings,
  Shield,
  Activity,
  Sliders,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UserData {
  id: string;
  username: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "User Management", href: "/admin/users", icon: Users },
  { name: "Audit Logs", href: "/admin/logs", icon: Activity },
  { name: "Grading Config", href: "/admin/grading", icon: Sliders },
  { name: "System Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }
    const user = JSON.parse(storedUser);
    if (user.role !== "ADMIN") {
      navigate("/login");
      return;
    }
    setUserData(user);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-violet-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const userInitials = userData.firstName && userData.lastName
    ? `${userData.firstName[0]}${userData.lastName[0]}`
    : userData.username.substring(0, 2).toUpperCase();

  const displayName = userData.firstName && userData.lastName
    ? `${userData.firstName} ${userData.lastName}`
    : userData.username;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/50 via-white to-violet-50/50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-gray-100 shadow-xl shadow-gray-200/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="font-bold text-xl" style={{ color: '#111827' }}>SMART</h1>
              <p className="text-xs text-gray-500 font-medium">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Main Menu
            </p>
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== "/admin" && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                    isActive
                      ? "bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/30"
                      : "text-gray-600 hover:bg-purple-50 hover:text-purple-700"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform group-hover:scale-110",
                    isActive ? "text-white" : "text-gray-400 group-hover:text-purple-600"
                  )} />
                  <span className="flex-1">{item.name}</span>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-white/70" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Help Card */}
          <div className="p-4 mt-auto">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <HelpCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm" style={{ color: '#111827' }}>Need Help?</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Access admin documentation</p>
                </div>
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
              <Avatar className="h-10 w-10 ring-2 ring-purple-100 group-hover:ring-purple-200 transition-all">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-violet-600 text-white font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: '#111827' }}>{displayName}</p>
                <p className="text-xs text-gray-500">System Administrator</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-6 h-6 text-gray-700" />
              </button>
              <div className="hidden sm:block">
                <h2 className="font-semibold" style={{ color: '#111827' }}>
                  {navItems.find(item => 
                    location.pathname === item.href || 
                    (item.href !== "/admin" && location.pathname.startsWith(item.href))
                  )?.name || "Dashboard"}
                </h2>
                <p className="text-sm text-gray-500">System Administration</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-purple-100 text-purple-700 border-0 font-semibold">
                S.Y. 2025-2026
              </Badge>
              <button className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <div className="lg:hidden">
                <Avatar className="h-9 w-9 ring-2 ring-purple-100">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-violet-600 text-white text-sm font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
