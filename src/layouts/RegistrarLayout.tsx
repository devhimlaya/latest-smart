import { useEffect, useState } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  FileText,
  Users,
  ClipboardList,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
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
  { name: "Dashboard", href: "/registrar", icon: LayoutDashboard },
  { name: "Student Records", href: "/registrar/students", icon: Users },
  { name: "Enrollment", href: "/registrar/enrollment", icon: ClipboardList },
  { name: "School Forms", href: "/registrar/forms", icon: FolderOpen },
];

export default function RegistrarLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('registrarSidebarCollapsed');
    return saved === 'true';
  });
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
    if (parsedUser.role !== "REGISTRAR") {
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

  const toggleSidebarCollapse = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('registrarSidebarCollapsed', String(newState));
  };

  const getCurrentPageTitle = () => {
    const currentNav = navigation.find(nav => 
      location.pathname === nav.href || 
      (nav.href !== "/registrar" && location.pathname.startsWith(nav.href))
    );
    return currentNav?.name || "Dashboard";
  };

  if (!user) return null;

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
          "fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transform transition-all duration-300 ease-out flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          sidebarCollapsed ? "lg:w-[70px] w-[280px]" : "w-[280px]"
        )}
      >
        {/* Logo Header */}
        <div className={cn(
          "h-20 flex items-center border-b border-slate-100 transition-all duration-300",
          sidebarCollapsed ? "lg:justify-center lg:px-3 px-6" : "justify-between px-6"
        )}>
          <div className={cn(
            "flex items-center gap-3 transition-all duration-300",
            sidebarCollapsed && "lg:flex-col lg:gap-0"
          )}>
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
                <FileText className="w-6 h-6 text-white" />
              )}
            </div>
            <div className={cn(
              "transition-all duration-300",
              sidebarCollapsed && "lg:hidden"
            )}>
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

        {/* Toggle Button for Desktop */}
        <div className={cn(
          "hidden lg:flex border-b border-slate-100 transition-all duration-300",
          sidebarCollapsed ? "justify-center px-3 py-2" : "justify-end px-4 py-2"
        )}>
          <button
            onClick={toggleSidebarCollapse}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== "/registrar" && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200",
                    sidebarCollapsed ? "lg:justify-center lg:px-3 px-4 py-3" : "px-4 py-3"
                  )}
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
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className={cn(
                    "transition-all duration-300",
                    sidebarCollapsed && "lg:hidden"
                  )}>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Profile at Bottom */}
        <div className="p-4 border-t border-slate-100">
          <div className={cn(
            "flex items-center gap-3 px-2 py-2 transition-all duration-300",
            sidebarCollapsed && "lg:flex-col lg:gap-2 lg:px-0"
          )}>
            <Avatar className="w-11 h-11 flex-shrink-0">
              <AvatarFallback className="bg-slate-200 text-slate-700 font-semibold text-sm">
                {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className={cn(
              "flex-1 min-w-0 transition-all duration-300",
              sidebarCollapsed && "lg:hidden"
            )}>
              <p className="text-sm font-semibold text-slate-900 truncate">{userDisplayName}</p>
              <p className="text-xs text-slate-500 truncate">{userEmail}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300",
        sidebarCollapsed ? "lg:pl-[70px]" : "lg:pl-[280px]"
      )}>
        {/* Top navbar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200">
          <div className="h-full px-4 lg:px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
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
