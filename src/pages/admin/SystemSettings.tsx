import { useState } from "react";
import {
  Settings,
  Save,
  School,
  Calendar,
  Shield,
  Database,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface SystemSettings {
  schoolName: string;
  schoolId: string;
  division: string;
  region: string;
  academicYear: string;
  currentQuarter: string;
  timezone: string;
  dateFormat: string;
  gradingSystem: string;
  maintenanceMode: boolean;
  backupFrequency: string;
  sessionTimeout: string;
}

const initialSettings: SystemSettings = {
  schoolName: "Sample National High School",
  schoolId: "301234",
  division: "Division of Sample City",
  region: "Region IV-A (CALABARZON)",
  academicYear: "2025-2026",
  currentQuarter: "Q3",
  timezone: "Asia/Manila",
  dateFormat: "MM/DD/YYYY",
  gradingSystem: "K-12 BEC",
  maintenanceMode: false,
  backupFrequency: "daily",
  sessionTimeout: "30",
};

const settingsSections = [
  {
    id: "school",
    title: "School Information",
    description: "Basic school details and DepEd identification",
    icon: School,
    color: "blue",
  },
  {
    id: "academic",
    title: "Academic Settings",
    description: "School year and grading configuration",
    icon: Calendar,
    color: "purple",
  },
  {
    id: "system",
    title: "System Configuration",
    description: "Technical settings and preferences",
    icon: Settings,
    color: "emerald",
  },
  {
    id: "security",
    title: "Security & Backup",
    description: "Security policies and data backup",
    icon: Shield,
    color: "amber",
  },
];

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleChange = (field: keyof SystemSettings, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const handleSave = () => {
    console.log("Saving settings:", settings);
    setHasChanges(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#111827' }}>
            System Settings
          </h1>
          <p style={{ color: '#6b7280' }} className="mt-1">
            Configure system-wide settings and preferences
          </p>
        </div>
        <Button
          className="gap-2 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 w-fit"
          onClick={handleSave}
          disabled={!hasChanges}
        >
          <Save className="w-4 h-4" />
          Save Settings
        </Button>
      </div>

      {/* Status Alert */}
      {saveSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <p className="text-sm font-medium text-emerald-700">System settings saved successfully!</p>
        </div>
      )}

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {settingsSections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className={`p-4 rounded-xl border border-gray-100 hover:border-${section.color}-200 hover:bg-${section.color}-50/50 transition-all group cursor-pointer`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-${section.color}-100 text-${section.color}-600 group-hover:bg-${section.color}-200 transition-colors`}>
                <section.icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm" style={{ color: '#111827' }}>{section.title}</h4>
                <p className="text-xs text-gray-500">{section.description}</p>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* School Information */}
      <Card id="school" className="border-0 shadow-xl shadow-gray-200/50 rounded-2xl bg-white">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-blue-50/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
              <School className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg" style={{ color: '#111827' }}>School Information</CardTitle>
              <CardDescription>Basic school details for DepEd records</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="schoolName" className="text-sm font-semibold text-gray-700">
                School Name
              </Label>
              <Input
                id="schoolName"
                value={settings.schoolName}
                onChange={(e) => handleChange("schoolName", e.target.value)}
                className="rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolId" className="text-sm font-semibold text-gray-700">
                School ID
              </Label>
              <Input
                id="schoolId"
                value={settings.schoolId}
                onChange={(e) => handleChange("schoolId", e.target.value)}
                className="rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="division" className="text-sm font-semibold text-gray-700">
                Division
              </Label>
              <Input
                id="division"
                value={settings.division}
                onChange={(e) => handleChange("division", e.target.value)}
                className="rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region" className="text-sm font-semibold text-gray-700">
                Region
              </Label>
              <Select value={settings.region} onValueChange={(val) => val && handleChange("region", val)}>
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue>{settings.region}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Region IV-A (CALABARZON)">Region IV-A (CALABARZON)</SelectItem>
                  <SelectItem value="NCR">NCR</SelectItem>
                  <SelectItem value="Region III (Central Luzon)">Region III (Central Luzon)</SelectItem>
                  <SelectItem value="Region I (Ilocos Region)">Region I (Ilocos Region)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic Settings */}
      <Card id="academic" className="border-0 shadow-xl shadow-gray-200/50 rounded-2xl bg-white">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-purple-50/50 to-purple-50/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg" style={{ color: '#111827' }}>Academic Settings</CardTitle>
              <CardDescription>School year and quarter configuration</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="academicYear" className="text-sm font-semibold text-gray-700">
                Academic Year
              </Label>
              <Select value={settings.academicYear} onValueChange={(val) => val && handleChange("academicYear", val)}>
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue>{settings.academicYear}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025-2026">2025-2026</SelectItem>
                  <SelectItem value="2024-2025">2024-2025</SelectItem>
                  <SelectItem value="2026-2027">2026-2027</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentQuarter" className="text-sm font-semibold text-gray-700">
                Current Quarter
              </Label>
              <Select value={settings.currentQuarter} onValueChange={(val) => val && handleChange("currentQuarter", val)}>
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue>
                    {settings.currentQuarter === "Q1" && "1st Quarter"}
                    {settings.currentQuarter === "Q2" && "2nd Quarter"}
                    {settings.currentQuarter === "Q3" && "3rd Quarter"}
                    {settings.currentQuarter === "Q4" && "4th Quarter"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Q1">1st Quarter</SelectItem>
                  <SelectItem value="Q2">2nd Quarter</SelectItem>
                  <SelectItem value="Q3">3rd Quarter</SelectItem>
                  <SelectItem value="Q4">4th Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gradingSystem" className="text-sm font-semibold text-gray-700">
                Grading System
              </Label>
              <Select value={settings.gradingSystem} onValueChange={(val) => val && handleChange("gradingSystem", val)}>
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue>{settings.gradingSystem}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="K-12 BEC">K-12 BEC (DepEd)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Configuration */}
      <Card id="system" className="border-0 shadow-xl shadow-gray-200/50 rounded-2xl bg-white">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-emerald-50/50 to-emerald-50/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg" style={{ color: '#111827' }}>System Configuration</CardTitle>
              <CardDescription>General system preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="timezone" className="text-sm font-semibold text-gray-700">
                Timezone
              </Label>
              <Select value={settings.timezone} onValueChange={(val) => val && handleChange("timezone", val)}>
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue>{settings.timezone}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Manila">Asia/Manila (PHT, UTC+8)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFormat" className="text-sm font-semibold text-gray-700">
                Date Format
              </Label>
              <Select value={settings.dateFormat} onValueChange={(val) => val && handleChange("dateFormat", val)}>
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue>{settings.dateFormat}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & Backup */}
      <Card id="security" className="border-0 shadow-xl shadow-gray-200/50 rounded-2xl bg-white">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-amber-50/50 to-amber-50/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-100 text-amber-600">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg" style={{ color: '#111827' }}>Security & Backup</CardTitle>
              <CardDescription>Security policies and data protection</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout" className="text-sm font-semibold text-gray-700">
                Session Timeout (minutes)
              </Label>
              <Select value={settings.sessionTimeout} onValueChange={(val) => val && handleChange("sessionTimeout", val)}>
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue>{settings.sessionTimeout} minutes</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="120">120 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="backupFrequency" className="text-sm font-semibold text-gray-700">
                Backup Frequency
              </Label>
              <Select value={settings.backupFrequency} onValueChange={(val) => val && handleChange("backupFrequency", val)}>
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue>
                    {settings.backupFrequency === "daily" && "Daily"}
                    {settings.backupFrequency === "weekly" && "Weekly"}
                    {settings.backupFrequency === "monthly" && "Monthly"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Database className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: '#111827' }}>Last Backup</p>
                <p className="text-xs text-gray-500">Mar 31, 2026 at 3:00 AM</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl gap-2">
              <RefreshCw className="w-4 h-4" />
              Backup Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
