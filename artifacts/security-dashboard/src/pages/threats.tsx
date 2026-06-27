import React, { useState } from "react";
import { useGetThreats, useUpdateThreat } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ShieldAlert, CheckCircle, Search, ShieldHalf } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { getGetThreatsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { GetThreatsStatus, GetThreatsSeverity } from "@workspace/api-client-react";

export default function Threats() {
  const [status, setStatus] = useState<GetThreatsStatus | "all">("all");
  const [severity, setSeverity] = useState<GetThreatsSeverity | "all">("all");

  const queryClient = useQueryClient();

  const { data: threats, isLoading } = useGetThreats({
    status: status === "all" ? undefined : status as GetThreatsStatus,
    severity: severity === "all" ? undefined : severity as GetThreatsSeverity,
  });

  const updateThreat = useUpdateThreat();

  const handleStatusChange = async (id: number, newStatus: "resolved" | "investigating") => {
    try {
      await updateThreat.mutateAsync({
        id,
        data: { status: newStatus }
      });
      queryClient.invalidateQueries({ queryKey: getGetThreatsQueryKey() });
      toast.success(`Threat status updated to ${newStatus.toUpperCase()}`);
    } catch (err) {
      toast.error("Failed to update threat status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-mono font-bold flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-warning" />
          THREAT_ALERTS
        </h1>
      </div>

      <Card className="bg-card rounded-none border-border">
        <CardHeader className="border-b border-border bg-muted/30 py-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Search className="w-4 h-4" />
            FILTER_PARAMETERS
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">SEVERITY:</span>
              <Select value={severity} onValueChange={(v) => setSeverity(v as GetThreatsSeverity | "all")}>
                <SelectTrigger className="w-[120px] h-8 rounded-none font-mono text-xs border-border bg-background">
                  <SelectValue placeholder="ALL" />
                </SelectTrigger>
                <SelectContent className="rounded-none font-mono text-xs border-border">
                  <SelectItem value="all">ALL</SelectItem>
                  <SelectItem value="critical">CRITICAL</SelectItem>
                  <SelectItem value="high">HIGH</SelectItem>
                  <SelectItem value="medium">MEDIUM</SelectItem>
                  <SelectItem value="low">LOW</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">STATUS:</span>
              <Select value={status} onValueChange={(v) => setStatus(v as GetThreatsStatus | "all")}>
                <SelectTrigger className="w-[140px] h-8 rounded-none font-mono text-xs border-border bg-background">
                  <SelectValue placeholder="ALL" />
                </SelectTrigger>
                <SelectContent className="rounded-none font-mono text-xs border-border">
                  <SelectItem value="all">ALL</SelectItem>
                  <SelectItem value="active">ACTIVE</SelectItem>
                  <SelectItem value="investigating">INVESTIGATING</SelectItem>
                  <SelectItem value="resolved">RESOLVED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50 border-b-border">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-mono text-xs">SEVERITY</TableHead>
                <TableHead className="font-mono text-xs">TITLE</TableHead>
                <TableHead className="font-mono text-xs">SOURCE_IP</TableHead>
                <TableHead className="font-mono text-xs">TYPE</TableHead>
                <TableHead className="font-mono text-xs">TIMESTAMP</TableHead>
                <TableHead className="font-mono text-xs">STATUS</TableHead>
                <TableHead className="font-mono text-xs text-right">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell><Skeleton className="h-5 w-16 rounded-none" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48 rounded-none" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-none" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-none" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32 rounded-none" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-none" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 rounded-none ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : threats?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 font-mono text-muted-foreground text-sm">
                    NO_THREATS_FOUND
                  </TableCell>
                </TableRow>
              ) : (
                threats?.map((threat) => (
                  <TableRow key={threat.id} className="border-border hover:bg-muted/30">
                    <TableCell>
                      <Badge variant="outline" className={`font-mono text-[10px] rounded-none ${getSeverityColor(threat.severity)}`}>
                        {threat.severity.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm max-w-[300px] truncate" title={threat.title}>
                      {threat.title}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{threat.sourceIp}</TableCell>
                    <TableCell className="font-mono text-sm">{threat.type}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {format(new Date(threat.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-mono text-[10px] rounded-none ${getStatusColor(threat.status)}`}>
                        {threat.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {threat.status === 'active' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-[10px] font-mono rounded-none border-primary text-primary hover:bg-primary/10"
                          onClick={() => handleStatusChange(threat.id, 'investigating')}
                          disabled={updateThreat.isPending}
                        >
                          <ShieldHalf className="w-3 h-3 mr-1" />
                          INVESTIGATE
                        </Button>
                      )}
                      {(threat.status === 'active' || threat.status === 'investigating') && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-[10px] font-mono rounded-none border-success text-success hover:bg-success/10"
                          onClick={() => handleStatusChange(threat.id, 'resolved')}
                          disabled={updateThreat.isPending}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          RESOLVE
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
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

function getStatusColor(status: string) {
  switch (status) {
    case 'active': return 'border-destructive text-destructive bg-destructive/10';
    case 'investigating': return 'border-warning text-warning bg-warning/10';
    case 'resolved': return 'border-success text-success bg-success/10';
    default: return 'border-border text-foreground';
  }
}
