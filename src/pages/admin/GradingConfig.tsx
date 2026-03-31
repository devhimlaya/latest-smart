import { useState } from "react";
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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GradingWeight {
  id: string;
  subjectType: string;
  subjects: string[];
  icon: React.ElementType;
  color: string;
  writtenWork: number;
  performanceTask: number;
  quarterlyAssessment: number;
  isDepEdDefault: boolean;
}

const initialGradingWeights: GradingWeight[] = [
  {
    id: "core",
    subjectType: "Core Academic Subjects",
    subjects: ["Filipino", "English", "Mathematics", "Science", "Araling Panlipunan", "ESP", "Mother Tongue"],
    icon: BookOpen,
    color: "blue",
    writtenWork: 30,
    performanceTask: 50,
    quarterlyAssessment: 20,
    isDepEdDefault: true,
  },
  {
    id: "mapeh",
    subjectType: "MAPEH",
    subjects: ["Music", "Arts", "Physical Education", "Health"],
    icon: Music,
    color: "purple",
    writtenWork: 20,
    performanceTask: 60,
    quarterlyAssessment: 20,
    isDepEdDefault: true,
  },
  {
    id: "tle",
    subjectType: "Technology & Livelihood Education",
    subjects: ["TLE", "Computer Education", "Home Economics", "Industrial Arts"],
    icon: Wrench,
    color: "amber",
    writtenWork: 20,
    performanceTask: 60,
    quarterlyAssessment: 20,
    isDepEdDefault: true,
  },
];

export default function GradingConfig() {
  const [weights, setWeights] = useState<GradingWeight[]>(initialGradingWeights);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleWeightChange = (
    id: string,
    field: "writtenWork" | "performanceTask" | "quarterlyAssessment",
    value: string
  ) => {
    const numValue = parseInt(value) || 0;
    setWeights((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const updated = { ...w, [field]: numValue, isDepEdDefault: false };
          return updated;
        }
        return w;
      })
    );
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const validateWeights = (weight: GradingWeight): boolean => {
    return weight.writtenWork + weight.performanceTask + weight.quarterlyAssessment === 100;
  };

  const handleSave = () => {
    // In real app, this would call an API
    console.log("Saving weights:", weights);
    setHasChanges(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    setWeights(initialGradingWeights);
    setHasChanges(false);
  };

  const allValid = weights.every(validateWeights);

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
            disabled={!hasChanges}
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </Button>
          <Button
            className="gap-2 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25"
            onClick={handleSave}
            disabled={!hasChanges || !allValid}
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Status Alerts */}
      {saveSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <p className="text-sm font-medium text-emerald-700">Grading configuration saved successfully!</p>
        </div>
      )}

      {hasChanges && !allValid && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <p className="text-sm font-medium text-amber-700">Component weights must add up to 100% for each subject type.</p>
        </div>
      )}

      {/* DepEd Guidelines Info */}
      <Card className="border-0 shadow-lg shadow-gray-200/50 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-purple-100">
              <Info className="w-6 h-6 text-purple-600" />
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
        {weights.map((weight) => {
          const isValid = validateWeights(weight);
          const total = weight.writtenWork + weight.performanceTask + weight.quarterlyAssessment;

          return (
            <Card key={weight.id} className="border-0 shadow-xl shadow-gray-200/50 rounded-2xl bg-white overflow-hidden">
              <CardHeader className={`border-b border-gray-100 bg-gradient-to-r from-${weight.color}-50/50 to-${weight.color}-50/30`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-${weight.color}-100 text-${weight.color}-600`}>
                      <weight.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg" style={{ color: '#111827' }}>{weight.subjectType}</CardTitle>
                      <CardDescription className="flex flex-wrap gap-1 mt-1">
                        {weight.subjects.map((subject) => (
                          <Badge key={subject} variant="outline" className="text-xs">
                            {subject}
                          </Badge>
                        ))}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {weight.isDepEdDefault && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-0 font-medium">
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
                    {isValid && !weight.isDepEdDefault && (
                      <Badge className="bg-amber-100 text-amber-700 border-0 font-medium">
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
                    <Label htmlFor={`${weight.id}-ww`} className="text-sm font-semibold text-gray-700">
                      Written Work (WW)
                    </Label>
                    <div className="relative">
                      <Input
                        id={`${weight.id}-ww`}
                        type="number"
                        min="0"
                        max="100"
                        value={weight.writtenWork}
                        onChange={(e) => handleWeightChange(weight.id, "writtenWork", e.target.value)}
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
                    <Label htmlFor={`${weight.id}-pt`} className="text-sm font-semibold text-gray-700">
                      Performance Task (PT)
                    </Label>
                    <div className="relative">
                      <Input
                        id={`${weight.id}-pt`}
                        type="number"
                        min="0"
                        max="100"
                        value={weight.performanceTask}
                        onChange={(e) => handleWeightChange(weight.id, "performanceTask", e.target.value)}
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
                    <Label htmlFor={`${weight.id}-qa`} className="text-sm font-semibold text-gray-700">
                      Quarterly Assessment (QA)
                    </Label>
                    <div className="relative">
                      <Input
                        id={`${weight.id}-qa`}
                        type="number"
                        min="0"
                        max="100"
                        value={weight.quarterlyAssessment}
                        onChange={(e) => handleWeightChange(weight.id, "quarterlyAssessment", e.target.value)}
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
                    <span className={`text-lg font-bold ${isValid ? "text-emerald-600" : "text-red-600"}`}>
                      {total}%
                    </span>
                  </div>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
                    <div
                      className={`bg-blue-500 transition-all duration-300`}
                      style={{ width: `${weight.writtenWork}%` }}
                    />
                    <div
                      className={`bg-purple-500 transition-all duration-300`}
                      style={{ width: `${weight.performanceTask}%` }}
                    />
                    <div
                      className={`bg-amber-500 transition-all duration-300`}
                      style={{ width: `${weight.quarterlyAssessment}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-xs text-gray-600">WW ({weight.writtenWork}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span className="text-xs text-gray-600">PT ({weight.performanceTask}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-xs text-gray-600">QA ({weight.quarterlyAssessment}%)</span>
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
            <History className="w-5 h-5 text-purple-600" />
            Recent Configuration Changes
          </CardTitle>
          <CardDescription>History of grading configuration updates</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[
              { date: "Mar 30, 2026", user: "Admin", change: "Updated MAPEH weights to WW 20%, PT 60%, QA 20%" },
              { date: "Jan 15, 2026", user: "Admin", change: "Reset all weights to DepEd default values" },
              { date: "Aug 1, 2025", user: "System", change: "Initial grading configuration set based on DO 8, s. 2015" },
            ].map((log, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Sliders className="w-4 h-4 text-purple-600" />
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
