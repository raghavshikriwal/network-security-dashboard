import React, { useState } from "react";
import { useLookupIp } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Globe, ShieldAlert, Network, Server, MapPin, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function IpLookup() {
  const [searchInput, setSearchInput] = useState("");
  const [ipToLookup, setIpToLookup] = useState<string | null>(null);

  const { data: ipInfo, isLoading, isError, error } = useLookupIp(
    ipToLookup ? { ip: ipToLookup } : { ip: "" },
    { query: { enabled: !!ipToLookup, retry: false } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setIpToLookup(searchInput.trim());
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-mono font-bold flex items-center gap-3">
          <Search className="w-6 h-6 text-primary" />
          IP_LOOKUP_TOOL
        </h1>
      </div>

      <Card className="bg-card rounded-none border-border">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Network className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="ENTER IP ADDRESS (E.G. 192.168.1.1)"
                className="pl-9 font-mono rounded-none border-border bg-background h-12"
              />
            </div>
            <Button type="submit" className="h-12 rounded-none font-mono tracking-widest px-8" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              EXECUTE_SCAN
            </Button>
          </form>
        </CardContent>
      </Card>

      {isError && (
        <div className="bg-destructive/10 text-destructive text-sm font-mono p-4 border border-destructive/20">
          [SCAN_FAILED]: {(error as any)?.message || "UNABLE TO RESOLVE IP ADDRESS"}
        </div>
      )}

      {ipInfo && !isLoading && (
        <Card className="bg-card rounded-none border-border overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/30 pb-4">
            <CardTitle className="text-sm font-mono flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                TARGET_ANALYSIS_COMPLETE: {ipInfo.ip}
              </span>
              <div className="flex gap-2">
                {ipInfo.isVpn && <Badge variant="outline" className="border-warning text-warning rounded-none font-mono text-[10px]">VPN_DETECTED</Badge>}
                {ipInfo.isProxy && <Badge variant="outline" className="border-warning text-warning rounded-none font-mono text-[10px]">PROXY_DETECTED</Badge>}
                {ipInfo.isTor && <Badge variant="outline" className="border-destructive text-destructive rounded-none font-mono text-[10px]">TOR_NODE</Badge>}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-mono text-muted-foreground mb-4">GEOLOCATION_DATA</h3>
                  <div className="space-y-4">
                    <InfoRow icon={<Globe className="w-4 h-4" />} label="COUNTRY" value={`${ipInfo.country || 'UNKNOWN'} ${ipInfo.countryCode ? `[${ipInfo.countryCode}]` : ''}`} />
                    <InfoRow icon={<MapPin className="w-4 h-4" />} label="REGION/CITY" value={`${ipInfo.region || 'UNKNOWN'} / ${ipInfo.city || 'UNKNOWN'}`} />
                    <InfoRow icon={<MapPin className="w-4 h-4" />} label="COORDINATES" value={`${ipInfo.latitude?.toFixed(4) || '???'}, ${ipInfo.longitude?.toFixed(4) || '???'}`} />
                    <InfoRow icon={<Globe className="w-4 h-4" />} label="TIMEZONE" value={ipInfo.timezone || 'UNKNOWN'} />
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-mono text-muted-foreground mb-4">NETWORK_DATA</h3>
                  <div className="space-y-4">
                    <InfoRow icon={<Network className="w-4 h-4" />} label="ISP" value={ipInfo.isp || 'UNKNOWN'} />
                    <InfoRow icon={<Server className="w-4 h-4" />} label="ORGANIZATION" value={ipInfo.org || 'UNKNOWN'} />
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-muted/10 space-y-8">
                <div>
                  <h3 className="text-xs font-mono text-muted-foreground mb-4">THREAT_INTELLIGENCE</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between font-mono text-sm">
                      <span>RISK_SCORE</span>
                      <span className={`${getRiskColor(ipInfo.riskScore || 0)}`}>{ipInfo.riskScore || 0}/100</span>
                    </div>
                    <Progress value={ipInfo.riskScore || 0} className="h-2 rounded-none bg-muted" indicatorClassName={`${getRiskProgressColor(ipInfo.riskScore || 0)} rounded-none`} />
                  </div>
                </div>

                <Card className="bg-background border-border rounded-none">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="bg-muted p-3">
                      <ShieldAlert className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                      <div className="text-xs font-mono text-muted-foreground">HISTORICAL_THREATS</div>
                      <div className="text-2xl font-mono">{ipInfo.threatHistory || 0}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <div className="text-[10px] font-mono text-muted-foreground">{label}</div>
        <div className="font-mono text-sm break-all">{value}</div>
      </div>
    </div>
  );
}

function getRiskColor(score: number) {
  if (score >= 80) return "text-destructive";
  if (score >= 40) return "text-warning";
  return "text-success";
}

function getRiskProgressColor(score: number) {
  if (score >= 80) return "bg-destructive";
  if (score >= 40) return "bg-warning";
  return "bg-success";
}
