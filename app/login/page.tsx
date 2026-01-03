"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import GearIcon from "@/components/GearIcon";

const DEMO_CREDENTIALS = {
  universityadmin: "university admin",
  campusadmin: "campus admin",
  librarian: "librarian",
  printpersonnel: "print personnel",
  financestaff: "finance staff",
  labmanager: "lab manager",
  itstaff: "it staff",
  facilities: "facilities",
  security: "security",
  investigator: "investigator",
  maintenancestaff: "maintenance staff",
  cafeteria: "cafeteria",
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const normalizedUsername = username.toLowerCase().trim();
    const expectedPassword = DEMO_CREDENTIALS[normalizedUsername as keyof typeof DEMO_CREDENTIALS];

    if (expectedPassword && password === expectedPassword) {
      setTimeout(() => {
        localStorage.setItem("user", JSON.stringify({ username: normalizedUsername, role: normalizedUsername }));
        router.push("/dashboard");
      }, 800);
    } else {
      setIsLoading(false);
      setError("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0c] relative overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8">
          <img 
            src="/university.png" 
            alt="Ambo University" 
            className="w-20 h-20 object-contain mb-4"
          />
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">ResourceMaster</h1>
          <p className="text-zinc-500 text-sm">Ambo University Management System</p>
        </div>

        <Card className="border-zinc-800/50 backdrop-blur-sm bg-zinc-900/40">
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <Input 
                label="Username" 
                placeholder="Enter your administrative ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
              />
              <Input 
                label="Password" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={error}
                required 
              />
              <Button 
                type="submit" 
                className="w-full" 
                isLoading={isLoading}
              >
                Sign In to Platform
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-zinc-800/50">
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Demo Access</span>
                <p className="text-xs text-zinc-400">campusadmin / campus admin</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center mt-8 text-zinc-600 text-[10px] uppercase tracking-[0.2em]">
          Powered by Group 8
        </p>
      </div>
    </div>
  );
}
