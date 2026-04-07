import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, LogIn, User, Lock, AlertCircle, CheckCircle, GraduationCap, BookOpen, Sparkles, Shield, BarChart3 } from "lucide-react";
import axios from "axios";

const API_URL = "http://localhost:3000/api";

interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: string;
    username: string;
    role: "TEACHER" | "ADMIN" | "REGISTRAR";
  };
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<LoginResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post<LoginResponse>(`${API_URL}/auth/login`, {
        username,
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      setSuccess(response.data);

      setTimeout(() => {
        switch (response.data.user.role) {
          case "TEACHER":
            navigate("/teacher");
            break;
          case "ADMIN":
            navigate("/admin");
            break;
          case "REGISTRAR":
            navigate("/registrar");
            break;
          default:
            navigate("/");
        }
      }, 1000);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || "Login failed");
      } else {
        setError("Unable to connect to server. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/20 overflow-hidden">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-3/5 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 animate-gradient" style={{ backgroundSize: '200% 200%' }} />
        
        {/* Decorative patterns */}
        <div className="absolute inset-0">
          {/* Floating orbs */}
          <div className="absolute top-20 left-20 w-96 h-96 rounded-full bg-white/10 blur-3xl animate-float" />
          <div className="absolute bottom-32 right-16 w-80 h-80 rounded-full bg-cyan-300/20 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-emerald-200/15 blur-2xl animate-float" style={{ animationDelay: '4s' }} />
          
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
          
          {/* Gradient mesh */}
          <div className="absolute -top-1/2 -right-1/4 w-full h-full bg-gradient-radial from-white/5 to-transparent rounded-full" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white w-full">
          {/* Logo section */}
          <div className="flex items-center gap-4 mb-16">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">SMART</h1>
              <p className="text-emerald-100/90 text-sm font-medium tracking-wide">Academic Records Management</p>
            </div>
          </div>

          {/* Main heading with better typography */}
          <div className="space-y-4 mb-16">
            <h2 className="text-5xl xl:text-6xl font-bold leading-[1.1] tracking-tight">
              Modern Education
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-cyan-200 to-white">
                Management System
              </span>
            </h2>
            
            <p className="text-lg text-white/70 max-w-lg leading-relaxed mt-6">
              Streamline your academic workflow with our comprehensive K-12 grading system, fully aligned with DepEd standards.
            </p>
          </div>

          {/* Feature cards - Modern glass design */}
          <div className="grid gap-4">
            {[
              { icon: BookOpen, title: "DepEd-Compliant", desc: "K-12 curriculum aligned" },
              { icon: BarChart3, title: "Real-time Analytics", desc: "Instant grade computations" },
              { icon: Shield, title: "Secure Platform", desc: "Role-based access control" }
            ].map((feature, i) => (
              <div 
                key={i}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-300 hover:bg-white/10 hover:border-white/20 group"
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-emerald-100/70 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer attribution */}
        <div className="absolute bottom-8 left-12 xl:left-20 flex items-center gap-3 text-white/50 text-sm">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <span>Department of Education • Philippines</span>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-[45%] xl:w-2/5 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">SMART</span>
              <p className="text-xs text-gray-500">Academic Records</p>
            </div>
          </div>

          {/* Login card with premium styling */}
          <Card className="border-0 shadow-2xl shadow-gray-200/60 bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardHeader className="space-y-1 text-center pt-5 pb-0 px-6">
              <div className="w-11 h-11 mx-auto rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900 pt-2">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-gray-600 text-sm">
                Sign in to continue to your dashboard
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-6 pb-5 pt-4">
              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-100 flex items-center gap-2.5 animate-scale-in">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-sm font-medium text-red-700">{error}</span>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 flex items-center gap-2.5 animate-scale-in">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">Login successful!</p>
                    <p className="text-xs text-emerald-600">Redirecting...</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Username Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-gray-800 font-semibold text-sm pl-1">
                    Username
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center pointer-events-none z-10">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 group-focus-within:bg-emerald-100 flex items-center justify-center transition-colors duration-200">
                        <User className="w-4 h-4 text-gray-500 group-focus-within:text-emerald-600 transition-colors duration-200" />
                      </div>
                    </div>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-12 h-11 bg-gray-50/80 border-gray-200 hover:border-gray-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl transition-all duration-200 placeholder:text-gray-400 text-gray-900 font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-gray-800 font-semibold text-sm pl-1">
                    Password
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center pointer-events-none z-10">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 group-focus-within:bg-emerald-100 flex items-center justify-center transition-colors duration-200">
                        <Lock className="w-4 h-4 text-gray-500 group-focus-within:text-emerald-600 transition-colors duration-200" />
                      </div>
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 pr-11 h-11 bg-gray-50/80 border-gray-200 hover:border-gray-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl transition-all duration-200 placeholder:text-gray-400 text-gray-900 font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                      />
                      <div className="w-4 h-4 rounded border-2 border-gray-300 peer-checked:border-emerald-500 peer-checked:bg-emerald-500 transition-all duration-200 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 peer-checked:[&]:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <span className="text-gray-600 group-hover:text-gray-900 transition-colors font-medium text-sm">Remember me</span>
                  </label>
                  <a href="#" className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors hover:underline underline-offset-4 decoration-2 decoration-emerald-200 text-sm">
                    Forgot password?
                  </a>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-3">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-3">
                      <LogIn className="w-5 h-5" />
                      Sign In
                    </span>
                  )}
                </Button>
              </form>

              {/* Demo credentials - Integrated */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <p className="text-xs font-semibold text-gray-600">Quick Demo Access</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { role: 'Teacher', user: 'teacher', pass: 'teacher123', color: 'emerald' },
                    { role: 'Admin', user: 'admin', pass: 'admin123', color: 'blue' },
                    { role: 'Registrar', user: 'registrar', pass: 'registrar123', color: 'purple' }
                  ].map((demo) => (
                    <button 
                      key={demo.role}
                      type="button"
                      className={`text-center py-2 px-2 rounded-lg bg-gradient-to-br from-${demo.color}-50 to-${demo.color}-100/50 border border-${demo.color}-100 hover:scale-105 transition-transform cursor-pointer`}
                      onClick={() => { setUsername(demo.user); setPassword(demo.pass); }}
                    >
                      <p className={`font-bold text-${demo.color}-700 text-xs`}>{demo.role}</p>
                      <p className="text-gray-500 text-[10px] mt-0.5 font-mono">{demo.user}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <p className="text-[10px] text-gray-400 text-center mt-4 leading-relaxed">
                By signing in, you agree to our{' '}
                <a href="#" className="text-emerald-600 hover:underline">Terms</a>
                {' '}and{' '}
                <a href="#" className="text-emerald-600 hover:underline">Privacy Policy</a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
