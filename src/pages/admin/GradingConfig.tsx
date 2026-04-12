import { useState, useEffect } from "react";
import {
  Sliders,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Info,
  BookOpen,
  Music,
  Wrench,
  History,
  ChevronRight,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminApi } from "@/lib/api";
import type { GradingConfig as GradingConfigType } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";

const subjectTypeInfo: Record<string, { subjects: string[]; icon: React.ElementType; color: string; opacity: string }> = {
  CORE: {
    subjects: ["Filipino", "English", "Mathematics", "Science", "Araling Panlipunan", "ESP", "Mother Tongue"],
    icon: BookOpen,
    color: "theme",
    opacity: "15",
  },
  MAPEH: {
    subjects: ["Music", "Arts", "Physical Education", "Health"],
    icon: Music,
    color: "theme",
    opacity: "20",
  },
  TLE: {
    subjects: ["TLE", "Computer Education", "Home Economics", "Industrial Arts"],
    icon: Wrench,
    color: "theme",
    opacity: "25",
  },
  TVL: {
    subjects: ["Technical-Vocational-Livelihood Track Subjects"],
    icon: Wrench,
    color: "theme",
    opacity: "30",
  },
};

const subjectTypeLabels: Record<string, string> = {
  CORE: "Core Academic Subjects",
  MAPEH: "MAPEH",
  TLE: "Technology & Livelihood Education",
  TVL: "TVL Track",
};

export default function GradingConfig() {
  const [configs, setConfigs] = useState<GradingConfigType[]>([]);
  const [originalConfigs, setOriginalConfigs] = useState<GradingConfigType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [configHistory, setConfigHistory] = useState<Array<{ date: string; user: string; change: string }>>([]);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getGradingConfig();
      setConfigs(response.data.configs);
      setOriginalConfigs(response.data.configs);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch grading config:", err);
      setError("Failed to load grading configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  // Check if there are changes by comparing configs deeply
  useEffect(() => {
    if (originalConfigs.length === 0) return;
    
    const hasAnyChange = configs.some((config) => {
      const original = originalConfigs.find(c => c.subjectType === config.subjectType);
      if (!original) return true;
      return (
        config.writtenWorkWeight !== original.writtenWorkWeight ||
        config.performanceTaskWeight !== original.performanceTaskWeight ||
        config.quarterlyAssessWeight !== original.quarterlyAssessWeight
      );
    });
    setHasChanges(hasAnyChange);
  }, [configs, originalConfigs]);

  const handleWeightChange = (
    subjectType: string,
    field: "writtenWorkWeight" | "performanceTaskWeight" | "quarterlyAssessWeight",
    value: string
  ) => {
    const numValue = parseInt(value) || 0;
    setConfigs((prev) =>
      prev.map((c) => {
        if (c.subjectType === subjectType) {
          return { ...c, [field]: numValue, isDepEdDefault: false };
        }
        return c;
      })
    );
    setSaveSuccess(false);
  };

  const validateWeights = (config: GradingConfigType): boolean => {
    return config.writtenWorkWeight + config.performanceTaskWeight + config.quarterlyAssessWeight === 100;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Update each changed config
      for (const config of configs) {
        const original = originalConfigs.find(c => c.subjectType === config.subjectType);
        if (!original) continue;
        
        const hasChanged = 
          config.writtenWorkWeight !== original.writtenWorkWeight ||
          config.performanceTaskWeight !== original.performanceTaskWeight ||
          config.quarterlyAssessWeight !== original.quarterlyAssessWeight;
        
        if (hasChanged) {
          await adminApi.updateGradingConfig(config.subjectType, {
            writtenWorkWeight: config.writtenWorkWeight,
            performanceTaskWeight: config.performanceTaskWeight,
            quarterlyAssessWeight: config.quarterlyAssessWeight,
          });
        }
      }
      
      // Refresh configs from server
      const response = await adminApi.getGradingConfig();
      setConfigs(response.data.configs);
      setOriginalConfigs(response.data.configs);
      
      setHasChanges(false);
      setSaveSuccess(true);
      
      // Add to history
      setConfigHistory(prev => [{
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        user: 'Admin',
        change: 'Updated grading weights'
      }, ...prev.slice(0, 4)]);
      
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save grading config:", err);
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setResetting(true);
      const response = await adminApi.resetGradingConfig();
      setConfigs(response.data.configs);
      setOriginalConfigs(response.data.configs);
      setHasChanges(false);
      setSaveSuccess(true);
      
      // Add to history
      setConfigHistory(prev => [{
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        user: 'Admin',
        change: 'Reset all weights to DepEd default values'
      }, ...prev.slice(0, 4)]);
      
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to reset grading config:", err);
      alert("Failed to reset to defaults");
    } finally {
      setResetting(false);
    }
  };

  const allValid = configs.every(validateWeights);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
          <p className="text-gray-500">Loading grading configuration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500" />
          <p className="text-gray-700 font-medium">{error}</p>
          <Button onClick={fetchConfigs} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#111827' }}>
            Grading Configuration
          </h1>
          <p style={{ color: '#6b7280' }} className="mt-1">
            Configure grading component weights for different subject types
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2 rounded-xl border-gray-200"
            onClick={handleReset}
            disabled={!hasChanges && configs.every(c => c.isDepEdDefault) || resetting}
          >
            {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            Reset to Default
          </Button>
          <Button
            className="gap-2 text-white font-semibold rounded-xl shadow-lg"
            style={{ backgroundColor: colors.primary }}
            onClick={handleSave}
            disabled={!hasChanges || !allValid || saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Status Alerts */}
      {saveSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}30` }}>
          <CheckCircle2 className="w-5 h-5" style={{ color: colors.primary }} />
          <p className="text-sm font-medium" style={{ color: colors.primary }}>Grading configuration saved successfully!</p>
        </div>
      )}

      {hasChanges && !allValid && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <p className="text-sm font-medium text-amber-700">Component weights must add up to 100% for each subject type.</p>
        </div>
      )}

      {/* DepEd Guidelines Info */}
      <Card className="border-0 shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden" style={{ backgroundColor: `${colors.primary}08` }}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl" style={{ backgroundColor: `${colors.primary}15` }}>
              <Info className="w-6 h-6" style={{ color: colors.primary }} />
            </div>
            <div>
              <h3 className="font-bold mb-1" style={{ color: '#111827' }}>DepEd Grading Guidelines (DO 8, s. 2015)</h3>
              <p className="text-sm text-gray-600 mb-3">
                The Department of Education prescribes specific weights for each grading component based on subject type.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="bg-white/80 rounded-lg px-4 py-2">
                  <span className="text-xs text-gray-500 font-medium">Core Subjects</span>
                  <p className="text-sm font-semibold" style={{ color: '#111827' }}>WW 30% | PT 50% | QA 20%</p>
                </div>
                <div className="bg-white/80 rounded-lg px-4 py-2">
                  <span className="text-xs text-gray-500 font-medium">MAPEH & TLE</span>
                  <p className="text-sm font-semibold" style={{ color: '#111827' }}>WW 20% | PT 60% | QA 20%</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grading Weight Cards */}
      <div className="space-y-6">
        {configs.map((config) => {
          const isValid = validateWeights(config);
          const total = config.writtenWorkWeight + config.performanceTaskWeight + config.quarterlyAssessWeight;
          const info = subjectTypeInfo[config.subjectType] || { subjects: [], icon: BookOpen, color: "theme", opacity: "15" };
          const Icon = info.icon;

          return (
            <Card key={config.id} className="border-0 shadow-xl shadow-gray-200/50 rounded-2xl bg-white overflow-hidden">
              <CardHeader className="border-b border-gray-100" style={{ backgroundColor: `${colors.primary}${info.opacity}` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl" style={{ backgroundColor: `${colors.primary}25`, color: colors.primary }}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg" style={{ color: '#111827' }}>{subjectTypeLabels[config.subjectType] || config.subjectType}</CardTitle>
                      <CardDescription className="flex flex-wrap gap-1 mt-1">
                        {info.subjects.map((subject) => (
                          <Badge key={subject} variant="outline" className="text-xs">
                            {subject}
                          </Badge>
                        ))}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {config.isDepEdDefault && (
                      <Badge className="border-0 font-medium" style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        DepEd Default
                      </Badge>
                    )}
                    {!isValid && (
                      <Badge className="bg-red-100 text-red-700 border-0 font-medium">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Invalid ({total}%)
                      </Badge>
                    )}
                    {isValid && !config.isDepEdDefault && (
                      <Badge className="border-0 font-medium" style={{ backgroundColor: `${colors.accent}25`, color: colors.accent }}>
                        Custom
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Written Work */}
                  <div className="space-y-3">
                    <Label htmlFor={`${config.id}-ww`} className="text-sm font-semibold text-gray-700">
                      Written Work (WW)
                    </Label>
                    <div className="relative">
                      <Input
                        id={`${config.id}-ww`}
                        type="number"
                        min="0"
                        max="100"
                        value={config.writtenWorkWeight}
                        onChange={(e) => handleWeightChange(config.subjectType, "writtenWorkWeight", e.target.value)}
                        className="pr-8 text-lg font-semibold rounded-xl border-gray-200"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Quizzes, Unit Tests, Long Tests, Essays
                    </p>
                  </div>

                  {/* Performance Task */}
                  <div className="space-y-3">
                    <Label htmlFor={`${config.id}-pt`} className="text-sm font-semibold text-gray-700">
                      Performance Task (PT)
                    </Label>
                    <div className="relative">
                      <Input
                        id={`${config.id}-pt`}
                        type="number"
                        min="0"
                        max="100"
                        value={config.performanceTaskWeight}
                        onChange={(e) => handleWeightChange(config.subjectType, "performanceTaskWeight", e.target.value)}
                        className="pr-8 text-lg font-semibold rounded-xl border-gray-200"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Projects, Performances, Outputs
                    </p>
                  </div>

                  {/* Quarterly Assessment */}
                  <div className="space-y-3">
                    <Label htmlFor={`${config.id}-qa`} className="text-sm font-semibold text-gray-700">
                      Quarterly Assessment (QA)
                    </Label>
                    <div className="relative">
                      <Input
                        id={`${config.id}-qa`}
                        type="number"
                        min="0"
                        max="100"
                        value={config.quarterlyAssessWeight}
                        onChange={(e) => handleWeightChange(config.subjectType, "quarterlyAssessWeight", e.target.value)}
                        className="pr-8 text-lg font-semibold rounded-xl border-gray-200"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Quarterly Examination
                    </p>
                  </div>
                </div>

                {/* Total Bar */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700">Total Weight Distribution</span>
                    <span className={`text-lg font-bold ${isValid ? "" : "text-red-600"}`} style={isValid ? { color: colors.primary } : undefined}>
                      {total}%
                    </span>
                  </div>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
                    <div
                      className="transition-all duration-300"
                      style={{ width: `${config.writtenWorkWeight}%`, backgroundColor: colors.primary }}
                    />
                    <div
                      className="transition-all duration-300"
                      style={{ width: `${config.performanceTaskWeight}%`, backgroundColor: colors.secondary }}
                    />
                    <div
                      className="transition-all duration-300"
                      style={{ width: `${config.quarterlyAssessWeight}%`, backgroundColor: colors.accent }}
                    />
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.primary }} />
                      <span className="text-xs text-gray-600">WW ({config.writtenWorkWeight}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.secondary }} />
                      <span className="text-xs text-gray-600">PT ({config.performanceTaskWeight}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.accent }} />
                      <span className="text-xs text-gray-600">QA ({config.quarterlyAssessWeight}%)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Change History */}
      <Card className="border-0 shadow-xl shadow-gray-200/50 rounded-2xl bg-white">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg flex items-center gap-2" style={{ color: '#111827' }}>
            <History className="w-5 h-5" style={{ color: colors.primary }} />
            Recent Configuration Changes
          </CardTitle>
          <CardDescription>History of grading configuration updates</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {configHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No configuration changes recorded yet</p>
              </div>
            ) : (
              configHistory.map((log, index) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${colors.primary}15` }}>
                    <Sliders className="w-4 h-4" style={{ color: colors.primary }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: '#111827' }}>{log.change}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{log.date}</span>
                      <span>•</span>
                      <span>by {log.user}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
