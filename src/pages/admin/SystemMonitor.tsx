import { useEffect, useMemo, useState } from "react";
import { Activity, RefreshCw, Server, Database, Link2, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminApi, type AdminAuditLog, type SystemStatusResponse } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";

export default function SystemMonitor() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SystemStatusResponse | null>(null);
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [statusRes, logsRes] = await Promise.all([
        adminApi.getSystemStatus(),
        adminApi.getLogs({ limit: 500 }),
      ]);
      setStatus(statusRes.data);
      setLogs(logsRes.data.logs || []);
    } catch (error) {
      console.error("Failed to fetch system monitor data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getExternalBadge = (system: any) => {
    if (!system || system.status === "not_configured") {
      return <Badge className="bg-gray-100 text-gray-700">Not Configured</Badge>;
    }
    if (system.status === "reachable") {
      return <Badge className="bg-emerald-100 text-emerald-700">Connected</Badge>;
    }
    return <Badge className="bg-red-100 text-red-700">Unreachable</Badge>;
  };

  const auditChartData = useMemo(() => {
    const today = new Date();
    const days: Array<{ key: string; label: string; info: number; warning: number; critical: number }> = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        key,
        label: d.toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
        info: 0,
        warning: 0,
        critical: 0,
      });
    }

    for (const log of logs) {
      const created = new Date(log.createdAt || log.timestamp);
      const key = created.toISOString().slice(0, 10);
      const day = days.find((d) => d.key === key);
      if (!day) continue;
      if (log.severity === "critical") day.critical += 1;
      else if (log.severity === "warning") day.warning += 1;
      else day.info += 1;
    }

    return days;
  }, [logs]);

  if (loading || !status) {
    return (
      <div className="space-y-6">
        <Card className="rounded-2xl border-0 shadow-lg">
          <CardContent className="p-8 text-center text-gray-600">Loading system monitor...</CardContent>
        </Card>
      </div>
    );
  }

  const systems = [
    { key: "enrollpro", name: "EnrollPro", description: "Student enrollment and advisory data" },
    { key: "atlas", name: "ATLAS", description: "Teaching load and assignment source" },
    { key: "aims", name: "AIMS", description: "Academic information management source" },
  ] as const;

  const handleTriggerSync = async (system: "atlas" | "enrollpro") => {
    try {
      if (system === "atlas") await adminApi.triggerAtlasSync();
      else await adminApi.triggerEnrollProSync();
    } catch (error) {
      console.error(`Failed to trigger ${system} sync:`, error);
    } finally {
      fetchData();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Monitor</h1>
          <p className="text-gray-600 mt-1">Real-time health of the server, database, and connected external systems</p>
        </div>
        <Button onClick={fetchData} className="rounded-xl text-white" style={{ backgroundColor: colors.primary }}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="rounded-2xl border-0 shadow-md"><CardContent className="p-4"><p className="text-xs text-slate-500">Uptime</p><p className="text-xl font-black">{status.server.uptimeFormatted}</p></CardContent></Card>
        <Card className="rounded-2xl border-0 shadow-md"><CardContent className="p-4"><p className="text-xs text-slate-500">Memory</p><p className="text-xl font-black">{status.server.memoryUsedMB} MB</p><p className="text-xs text-slate-500">Heap {status.server.memoryHeapMB} MB</p></CardContent></Card>
        <Card className="rounded-2xl border-0 shadow-md"><CardContent className="p-4"><p className="text-xs text-slate-500">Node.js</p><p className="text-xl font-black">{status.server.nodeVersion}</p></CardContent></Card>
        <Card className="rounded-2xl border-0 shadow-md"><CardContent className="p-4"><p className="text-xs text-slate-500">Environment</p><Badge className={status.server.environment === "production" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>{status.server.environment}</Badge></CardContent></Card>
        <Card className="rounded-2xl border-0 shadow-md"><CardContent className="p-4"><p className="text-xs text-slate-500">Database</p><Badge className={status.database.status === "connected" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>{status.database.status === "connected" ? `Connected ${status.database.latencyMs}ms` : "Error"}</Badge></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {systems.map((systemInfo) => {
          const system = status.externalSystems[systemInfo.key];
          const isAtlas = systemInfo.key === "atlas";
          const isEnrollPro = systemInfo.key === "enrollpro";
          return (
            <Card key={systemInfo.key} className="rounded-2xl border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><Link2 className="w-4 h-4" />{systemInfo.name}</span>
                  {getExternalBadge(system)}
                </CardTitle>
                <CardDescription>{systemInfo.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-slate-600">Latency: {typeof system?.latencyMs === "number" ? `${system.latencyMs}ms` : "N/A"}</p>
                <p className="text-xs text-slate-500">Last checked: {system?.checkedAt ? new Date(system.checkedAt).toLocaleString("en-PH") : "N/A"}</p>
                {system?.status === "unreachable" && (
                  <p className="text-xs text-amber-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Offline/Unreachable is handled gracefully.</p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={fetchData} className="rounded-lg">Ping Now</Button>
                  {(isAtlas || isEnrollPro) && (
                    <Button
                      size="sm"
                      className="rounded-lg text-white"
                      style={{ backgroundColor: colors.primary }}
                      onClick={() => handleTriggerSync(isAtlas ? "atlas" : "enrollpro")}
                    >
                      Trigger Sync
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-2xl border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Server className="w-4 h-4" />Sync Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">System</th>
                  <th className="text-left py-2">Last Sync</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-right py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">ATLAS Teaching Load</td>
                  <td className="py-2">{status.sync.atlas.lastSyncAt ? new Date(status.sync.atlas.lastSyncAt).toLocaleString("en-PH") : "Never"}</td>
                  <td className="py-2 text-xs text-slate-700">{JSON.stringify(status.sync.atlas.result || {})}</td>
                  <td className="py-2 text-right"><Button size="sm" variant="outline" className="rounded-lg" onClick={() => handleTriggerSync("atlas")}>Run Now</Button></td>
                </tr>
                <tr>
                  <td className="py-2">EnrollPro Advisory</td>
                  <td className="py-2">{status.sync.enrollpro.lastSyncAt ? new Date(status.sync.enrollpro.lastSyncAt).toLocaleString("en-PH") : "Never"}</td>
                  <td className="py-2 text-xs text-slate-700">{JSON.stringify(status.sync.enrollpro.result || {})}</td>
                  <td className="py-2 text-right"><Button size="sm" variant="outline" className="rounded-lg" onClick={() => handleTriggerSync("enrollpro")}>Run Now</Button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Database className="w-4 h-4" />7-day Audit Activity</CardTitle>
        </CardHeader>
        <CardContent style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={auditChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="info" stackId="a" fill={colors.primary} />
              <Bar dataKey="warning" stackId="a" fill="#f59e0b" />
              <Bar dataKey="critical" stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
