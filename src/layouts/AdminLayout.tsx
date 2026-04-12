import { useEffect, useState } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Users,
  Settings,
  Shield,
  Activity,
  Sliders,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, getAcronym } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { SERVER_URL } from "@/lib/api";

interface UserData {
  id: string;
  username: string;
  role: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "User Management", href: "/admin/users", icon: Users },
  { name: "Audit Logs", href: "/admin/logs", icon: Activity },
  { name: "Grading Config", href: "/admin/grading", icon: Sliders },
  { name: "System Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { colors, logoUrl, schoolName } = useTheme();
  const acronym = getAcronym(schoolName);

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    const token = sessionStorage.getItem("token");

    if (!token || !userData) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "ADMIN") {
      navigate("/login");
      return;
    }

    setUser(parsedUser);
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/login");
  };

  const getCurrentPageTitle = () => {
    const currentNav = navigation.find(nav => 
      location.pathname === nav.href || 
      (nav.href !== "/admin" && location.pathname.startsWith(nav.href))
    );
    return currentNav?.name || "Dashboard";
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const userEmail = user.email || `${user.username}@school.edu.ph`;
  const userDisplayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.username;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] bg-white border-r border-slate-200 transform transition-transform duration-300 ease-out lg:translate-x-0 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ backgroundColor: logoUrl ? 'white' : colors.primary, boxShadow: `0 0 0 2px ${colors.primary}40` }}
            >
              {logoUrl ? (
                <img 
                  src={logoUrl.startsWith("http") ? logoUrl : `${SERVER_URL}${logoUrl}`}
                  alt="School Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Shield className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <span className="font-bold text-slate-900 text-lg block">{acronym}</span>
            </div>
          </div>
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== "/admin" && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    backgroundColor: isActive ? colors.primary : undefined,
                    color: isActive ? "white" : undefined,
                    boxShadow: isActive ? "0 4px 6px -1px rgb(0 0 0 / 0.1)" : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = `${colors.primary}20`;
                      e.currentTarget.style.color = colors.primary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "";
                      e.currentTarget.style.color = "";
                    }
                  }}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Profile at Bottom */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar className="w-11 h-11">
              <AvatarFallback className="bg-slate-200 text-slate-700 font-semibold text-sm">
                {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{userDisplayName}</p>
              <p className="text-xs text-slate-500 truncate">{userEmail}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-[280px]">
        {/* Top navbar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200">
          <div className="h-full px-4 lg:px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              
              {/* Page Title */}
              <span className="text-sm font-semibold text-slate-900">
                {getCurrentPageTitle()}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* User Avatar and Name */}
              <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-slate-200 text-slate-700 text-sm font-medium">
                    {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-semibold text-slate-900">
                  {user.firstName || user.username}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
