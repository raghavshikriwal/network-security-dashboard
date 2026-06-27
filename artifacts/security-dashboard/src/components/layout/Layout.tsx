import React from "react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../../contexts/AuthContext";
import { Redirect } from "wouter";
import { Activity } from "lucide-react";
import { useSocket } from "../../hooks/useSocket";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const { isConnected } = useSocket();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-primary font-mono">
        INITIALIZING SECURE CONNECTION...
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur flex items-center px-6 justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-destructive'}`}></span>
              {isConnected ? 'UPLINK_SECURE' : 'UPLINK_DISCONNECTED'}
            </span>
            <span className="opacity-50">|</span>
            <span>SYS_OP: {user.username}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <Activity className="w-3 h-3 text-primary" />
            LIVE_DATA_STREAM: ACTIVE
          </div>
        </header>
        <div className="p-6 flex-1 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
