"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRoleDashboardPath } from "@/lib/role-utils";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    
    // Redirect to role-specific dashboard
    const dashboardPath = getRoleDashboardPath();
    router.push(dashboardPath);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0c]">
      <div className="text-zinc-400">Redirecting...</div>
    </div>
  );
}
