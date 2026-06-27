import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../../contexts/AuthContext";
import { 
  ShieldAlert, 
  Activity, 
  Search, 
  LayoutDashboard, 
  LogOut,
  Terminal
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/threats", label: "Threat Alerts", icon: ShieldAlert },
    { href: "/incidents", label: "Incident Logs", icon: Activity },
    { href: "/iplookup", label: "IP Lookup", icon: Search },
  ];

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3 border-b border-sidebar-border">
        <Terminal className="text-primary w-6 h-6" />
        <span className="font-mono font-bold tracking-tight text-sidebar-foreground uppercase">
          SOC_CMD_CTR
        </span>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {links.map((link) => {
          const isActive = location === link.href;
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} className={`flex items-center gap-3 px-3 py-2 text-sm font-medium font-mono uppercase border transition-colors ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-accent-border' : 'text-sidebar-foreground border-transparent hover:border-sidebar-border hover:bg-muted'}`}>
              <Icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full text-left text-sm font-medium font-mono uppercase text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Terminate Session
        </button>
      </div>
    </div>
  );
}
