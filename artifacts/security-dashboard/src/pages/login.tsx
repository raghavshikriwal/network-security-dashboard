import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Terminal, Lock, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Redirect } from "wouter";

export default function Login() {
  const { login, user } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (user) {
    return <Redirect to="/" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login({ username, password });
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <Terminal className="w-12 h-12 text-primary mb-2" />
          <h1 className="text-2xl font-mono font-bold uppercase tracking-widest text-foreground">
            SOC_CMD_CTR
          </h1>
          <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
            Restricted Access
          </p>
        </div>

        <Card className="bg-card border-border rounded-none">
          <CardHeader className="border-b border-border bg-muted/30 pb-4">
            <CardTitle className="text-sm font-mono font-normal flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              AUTHENTICATION_REQUIRED
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm font-mono p-3 border border-destructive/20 rounded-none">
                  [ERROR]: {error}
                </div>
              )}
              <div className="space-y-2">
                <Label className="font-mono text-xs text-muted-foreground uppercase">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-9 font-mono rounded-none border-border bg-background focus-visible:ring-primary"
                    placeholder="admin"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs text-muted-foreground uppercase">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 font-mono rounded-none border-border bg-background focus-visible:ring-primary"
                    placeholder="admin123"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full font-mono uppercase rounded-none tracking-widest"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isLoading ? "AUTHENTICATING..." : "INITIALIZE_UPLINK"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
