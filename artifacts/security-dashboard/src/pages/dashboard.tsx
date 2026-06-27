import React, { useEffect, useState, useMemo } from "react";
import { 
  useGetDashboardStats, 
  useGetTrafficHistory, 
  useGetThreatsBySeverity,
  useGetRecentActivity,
  useGetThreats
} from "@workspace/api-client-react";
import { useSocket } from "../hooks/useSocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format } from "date-fns";
import { ShieldAlert, AlertTriangle, Info, Activity, Clock, ShieldX, ServerCrash, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { TrafficPoint } from "@workspace/api-client-react";
import ThreatMap from "@/components/ThreatMap";

const SEVERITY_COLORS = {
  critical: "hsl(var(--destructive))",
  high: "hsl(var(--warning))",
  medium: "hsl(var(--primary))",
  low: "hsl(var(--info))",
};

interface MapThreat {
  id: number | string;
  sourceIp?: string;
  severity?: string;
  title?: string;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: initialTraffic, isLoading: trafficLoading } = useGetTrafficHistory({ minutes: 30 });
  const { data: severityData, isLoading: severityLoading } = useGetThreatsBySeverity();
  const { data: recentActivity, isLoading: activityLoading } = useGetRecentActivity({ limit: 10 });
  const { data: latestThreats, isLoading: threatsLoading } = useGetThreats({ limit: 5, status: 'active' });
  const { data: allThreats } = useGetThreats({ limit: 50 });

  const [trafficData, setTrafficData] = useState<TrafficPoint[]>([]);
  const [mapThreats, setMapThreats] = useState<MapThreat[]>([]);
  const { socket } = useSocket();

  useEffect(() => {
    if (initialTraffic) {
      setTrafficData(initialTraffic);
    }
  }, [initialTraffic]);

  useEffect(() => {
    if (allThreats) {
      setMapThreats(allThreats.map(t => ({
        id: t.id,
        sourceIp: t.sourceIp,
        severity: t.severity,
        title: t.title,
      })));
    }
  }, [allThreats]);

  useEffect(() => {
    if (!socket) return;

    socket.on("traffic_update", (point: TrafficPoint) => {
      setTrafficData(prev => {
        const newData = [...prev, point];
        if (newData.length > 30) newData.shift();
        return newData;
      });
    });

    socket.on("new_threat", (threat: MapThreat) => {
      setMapThreats(prev => {
        const next = [{ ...threat, id: `live-${Date.now()}` }, ...prev];
        return next.slice(0, 50);
      });
    });

    return () => {
      socket.off("traffic_update");
      socket.off("new_threat");
    };
  }, [socket]);

  const severityChartData = useMemo(() => {
    if (!severityData) return [];
    return severityData.map(item => ({
      name: item.severity,
      value: item.count,
      color: SEVERITY_COLORS[item.severity as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.low
    }));
  }, [severityData]);

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard 
          title="ACTIVE_THREATS" 
          value={stats?.activeThreats} 
          icon={<ShieldAlert className="text-warning w-4 h-4" />} 
          loading={statsLoading} 
        />
        <StatCard 
          title="CRITICAL" 
          value={stats?.criticalThreats} 
          icon={<ShieldX className="text-destructive w-4 h-4" />} 
          loading={statsLoading} 
        />
        <StatCard 
          title="OPEN_INCIDENTS" 
          value={stats?.openIncidents} 
          icon={<AlertTriangle className="text-primary w-4 h-4" />} 
          loading={statsLoading} 
        />
        <StatCard 
          title="PKTS/SEC" 
          value={stats?.packetsPerSecond} 
          icon={<Activity className="text-info w-4 h-4" />} 
          loading={statsLoading} 
        />
        <StatCard 
          title="BLOCKED_CONN" 
          value={stats?.blockedConnections} 
          icon={<ServerCrash className="text-success w-4 h-4" />} 
          loading={statsLoading} 
        />
        <StatCard 
          title="UPTIME_HRS" 
          value={stats?.uptimeHours} 
          icon={<Clock className="text-muted-foreground w-4 h-4" />} 
          loading={statsLoading} 
        />
      </div>

      {/* Live World Threat Map */}
      <Card className="bg-card rounded-none border-border overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/30 pb-4">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            GLOBAL_THREAT_MAP
            <span className="ml-auto flex items-center gap-1.5 text-[10px] text-cyan-400/70">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse inline-block" />
              LIVE · {mapThreats.length}_SOURCES_TRACKED
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 h-[320px]">
          <ThreatMap liveThreats={mapThreats} />
        </CardContent>
      </Card>

      {/* Traffic + Severity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2 bg-card rounded-none border-border">
          <CardHeader className="border-b border-border bg-muted/30 pb-4">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              NETWORK_TRAFFIC_STREAM
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 h-[300px]">
            {trafficLoading && trafficData.length === 0 ? (
              <Skeleton className="w-full h-full rounded-none" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficData}>
                  <defs>
                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(val) => format(new Date(val), 'HH:mm:ss')} 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    fontFamily="var(--app-font-mono)"
                    tickMargin={10}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    fontFamily="var(--app-font-mono)"
                    tickFormatter={(val) => `${(val / 1024 / 1024).toFixed(1)}M`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 0 }}
                    itemStyle={{ fontFamily: 'var(--app-font-mono)' }}
                    labelStyle={{ fontFamily: 'var(--app-font-mono)', color: 'hsl(var(--muted-foreground))' }}
                    labelFormatter={(val) => format(new Date(val), 'HH:mm:ss')}
                  />
                  <Area type="monotone" dataKey="bytesIn" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorIn)" />
                  <Area type="monotone" dataKey="bytesOut" stroke="hsl(var(--info))" fillOpacity={1} fill="url(#colorOut)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card rounded-none border-border">
          <CardHeader className="border-b border-border bg-muted/30 pb-4">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-warning" />
              THREAT_SEVERITY_DIST
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 h-[300px] flex items-center justify-center">
            {severityLoading ? (
               <Skeleton className="w-[200px] h-[200px] rounded-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {severityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 0, fontFamily: 'var(--app-font-mono)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Threats + Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card rounded-none border-border overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/30 pb-4">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              ACTIVE_THREATS_LATEST
            </CardTitle>
          </CardHeader>
          <div className="divide-y divide-border">
            {threatsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4"><Skeleton className="h-6 w-full" /></div>
              ))
            ) : latestThreats?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground font-mono text-sm">NO_ACTIVE_THREATS</div>
            ) : (
              latestThreats?.map(threat => (
                <div key={threat.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`font-mono text-[10px] rounded-none ${getSeverityColor(threat.severity)}`}>
                        {threat.severity}
                      </Badge>
                      <span className="font-mono text-sm">{threat.title}</span>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      SRC: {threat.sourceIp} | PORT: {threat.port || 'ANY'}
                    </div>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">
                    {format(new Date(threat.createdAt), 'HH:mm:ss')}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="bg-card rounded-none border-border overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/30 pb-4">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Info className="w-4 h-4 text-info" />
              SYSTEM_ACTIVITY_LOG
            </CardTitle>
          </CardHeader>
          <div className="divide-y divide-border max-h-[350px] overflow-y-auto">
            {activityLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4"><Skeleton className="h-6 w-full" /></div>
              ))
            ) : recentActivity?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground font-mono text-sm">NO_ACTIVITY</div>
            ) : (
              recentActivity?.map(activity => (
                <div key={activity.id} className="p-4 flex gap-3 hover:bg-muted/50 transition-colors">
                  <div className="mt-1">
                    {activity.severity === 'critical' && <ShieldX className="w-4 h-4 text-destructive" />}
                    {activity.severity === 'high' && <AlertTriangle className="w-4 h-4 text-warning" />}
                    {activity.severity === 'medium' && <ShieldAlert className="w-4 h-4 text-primary" />}
                    {activity.severity === 'low' && <Info className="w-4 h-4 text-info" />}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="font-mono text-sm">{activity.message}</div>
                    <div className="flex justify-between items-center text-xs font-mono text-muted-foreground">
                      <span>TYPE: {activity.type}</span>
                      <span>{format(new Date(activity.timestamp), 'HH:mm:ss')}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, loading }: { title: string, value?: number, icon: React.ReactNode, loading: boolean }) {
  return (
    <Card className="bg-card rounded-none border-border">
      <CardContent className="p-4 flex flex-col items-start gap-4">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase">
          {icon}
          {title}
        </div>
        <div className="text-3xl font-mono">
          {loading ? <Skeleton className="h-9 w-16" /> : (value ?? 0).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'border-destructive text-destructive';
    case 'high': return 'border-warning text-warning';
    case 'medium': return 'border-primary text-primary';
    case 'low': return 'border-info text-info';
    default: return 'border-border text-foreground';
  }
}
