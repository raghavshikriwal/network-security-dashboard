import React, { useState } from "react";
import { useGetIncidents, useUpdateIncident, useCreateIncident } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Activity, Plus, FileText, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetIncidentsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { IncidentInputSeverity } from "@workspace/api-client-react";

const createIncidentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  severity: z.enum(["critical", "high", "medium", "low"]),
  description: z.string().optional(),
  affectedSystems: z.string().optional(),
  assignedTo: z.string().optional(),
});

type CreateIncidentForm = z.infer<typeof createIncidentSchema>;

export default function Incidents() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: incidents, isLoading } = useGetIncidents();
  const updateIncident = useUpdateIncident();
  const createIncident = useCreateIncident();

  const form = useForm<CreateIncidentForm>({
    resolver: zodResolver(createIncidentSchema),
    defaultValues: {
      title: "",
      severity: "medium",
      description: "",
      affectedSystems: "",
      assignedTo: "",
    }
  });

  const handleStatusChange = async (id: number, newStatus: "in_progress" | "closed") => {
    try {
      await updateIncident.mutateAsync({
        id,
        data: { status: newStatus }
      });
      queryClient.invalidateQueries({ queryKey: getGetIncidentsQueryKey() });
      toast.success(`Incident status updated to ${newStatus.toUpperCase()}`);
    } catch (err) {
      toast.error("Failed to update incident status");
    }
  };

  const onSubmit = async (data: CreateIncidentForm) => {
    try {
      await createIncident.mutateAsync({ data: data as any });
      queryClient.invalidateQueries({ queryKey: getGetIncidentsQueryKey() });
      toast.success("Incident created successfully");
      setIsDialogOpen(false);
      form.reset();
    } catch (err) {
      toast.error("Failed to create incident");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-mono font-bold flex items-center gap-3">
          <Activity className="w-6 h-6 text-primary" />
          INCIDENT_LOGS
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-none font-mono tracking-widest text-xs h-9">
              <Plus className="w-4 h-4 mr-2" />
              NEW_INCIDENT
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none border-border bg-card max-w-2xl">
            <DialogHeader className="border-b border-border pb-4">
              <DialogTitle className="font-mono flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-primary" />
                CREATE_INCIDENT_REPORT
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="font-mono text-xs">TITLE</FormLabel>
                        <FormControl>
                          <Input {...field} className="rounded-none font-mono bg-background border-border" />
                        </FormControl>
                        <FormMessage className="font-mono text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs">SEVERITY</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-none font-mono bg-background border-border">
                              <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-none font-mono border-border">
                            <SelectItem value="critical">CRITICAL</SelectItem>
                            <SelectItem value="high">HIGH</SelectItem>
                            <SelectItem value="medium">MEDIUM</SelectItem>
                            <SelectItem value="low">LOW</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="font-mono text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs">ASSIGNED_TO</FormLabel>
                        <FormControl>
                          <Input {...field} className="rounded-none font-mono bg-background border-border" />
                        </FormControl>
                        <FormMessage className="font-mono text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="affectedSystems"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="font-mono text-xs">AFFECTED_SYSTEMS (comma separated)</FormLabel>
                        <FormControl>
                          <Input {...field} className="rounded-none font-mono bg-background border-border" />
                        </FormControl>
                        <FormMessage className="font-mono text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="font-mono text-xs">DESCRIPTION</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="rounded-none font-mono bg-background border-border min-h-[100px]" />
                        </FormControl>
                        <FormMessage className="font-mono text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter className="pt-4 border-t border-border">
                  <Button type="submit" disabled={createIncident.isPending} className="rounded-none font-mono text-xs">
                    {createIncident.isPending ? "SUBMITTING..." : "SUBMIT_REPORT"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card rounded-none border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50 border-b-border">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-mono text-xs w-[100px]">ID</TableHead>
                <TableHead className="font-mono text-xs">SEVERITY</TableHead>
                <TableHead className="font-mono text-xs">TITLE</TableHead>
                <TableHead className="font-mono text-xs">ASSIGNED</TableHead>
                <TableHead className="font-mono text-xs">UPDATED</TableHead>
                <TableHead className="font-mono text-xs">STATUS</TableHead>
                <TableHead className="font-mono text-xs text-right">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell><Skeleton className="h-5 w-12 rounded-none" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-none" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48 rounded-none" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-none" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32 rounded-none" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-none" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 rounded-none ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : incidents?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 font-mono text-muted-foreground text-sm">
                    NO_INCIDENTS_FOUND
                  </TableCell>
                </TableRow>
              ) : (
                incidents?.map((incident) => (
                  <TableRow key={incident.id} className="border-border hover:bg-muted/30">
                    <TableCell className="font-mono text-xs text-muted-foreground">INC-{incident.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-mono text-[10px] rounded-none ${getSeverityColor(incident.severity)}`}>
                        {incident.severity.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm max-w-[300px] truncate" title={incident.title}>
                      {incident.title}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {incident.assignedTo || 'UNASSIGNED'}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {format(new Date(incident.updatedAt || incident.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-mono text-[10px] rounded-none ${getStatusColor(incident.status)}`}>
                        {incident.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {incident.status === 'open' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-[10px] font-mono rounded-none border-warning text-warning hover:bg-warning/10"
                          onClick={() => handleStatusChange(incident.id, 'in_progress')}
                          disabled={updateIncident.isPending}
                        >
                          <Activity className="w-3 h-3 mr-1" />
                          START
                        </Button>
                      )}
                      {(incident.status === 'open' || incident.status === 'in_progress') && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-[10px] font-mono rounded-none border-success text-success hover:bg-success/10"
                          onClick={() => handleStatusChange(incident.id, 'closed')}
                          disabled={updateIncident.isPending}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          CLOSE
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
    case 'open': return 'border-destructive text-destructive bg-destructive/10';
    case 'in_progress': return 'border-warning text-warning bg-warning/10';
    case 'closed': return 'border-success text-success bg-success/10';
    default: return 'border-border text-foreground';
  }
}
