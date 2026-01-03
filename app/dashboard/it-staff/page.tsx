"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import MovementForm from "@/components/staff/MovementForm";
import SubmitAlertForm from "@/components/staff/SubmitAlertForm";
import InventoryChangeForm from "@/components/staff/InventoryChangeForm";
import { Button } from "@/components/ui/Button";

export default function ITStaffDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'add-item' | 'change-place' | 'send-report'>('add-item');

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(userData));
  }, [router]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0c]">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  const handleAddItemSubmit = async (data: any) => {
    const response = await fetch("/api/staff/inventory-change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        username: user.username,
      }),
    });
    if (!response.ok) throw new Error("Failed to submit");
    alert("Item added successfully!");
  };

  const handleChangePlaceSubmit = async (data: any) => {
    const response = await fetch("/api/staff/movement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        username: user.username,
      }),
    });
    if (!response.ok) throw new Error("Failed to submit movement");
    alert("Item moved successfully!");
  };

  const handleSendReportSubmit = async (data: {
    alertType: string;
    message: string;
    locationId: string;
    urgency: string;
    username?: string;
  }) => {
    const response = await fetch("/api/staff/alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        alertType: data.alertType || "EQUIPMENT_BREAKDOWN",
        username: data.username || user.username,
      }),
    });
    if (!response.ok) throw new Error("Failed to submit report");
    alert("Report sent successfully!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">IT Staff Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">Add items, change locations, and send reports.</p>
      </div>

      <div className="flex gap-2 border-b border-zinc-800/50">
        <button
          onClick={() => setActiveTab('add-item')}
          className={`px-4 py-2 text-sm font-medium rounded-t-[8px] transition-colors ${
            activeTab === 'add-item'
              ? 'bg-blue-600/10 text-blue-400 border-b-2 border-blue-500'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Add Item
        </button>
        <button
          onClick={() => setActiveTab('change-place')}
          className={`px-4 py-2 text-sm font-medium rounded-t-[8px] transition-colors ${
            activeTab === 'change-place'
              ? 'bg-blue-600/10 text-blue-400 border-b-2 border-blue-500'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Change Place
        </button>
        <button
          onClick={() => setActiveTab('send-report')}
          className={`px-4 py-2 text-sm font-medium rounded-t-[8px] transition-colors ${
            activeTab === 'send-report'
              ? 'bg-blue-600/10 text-blue-400 border-b-2 border-blue-500'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Send Report
        </button>
      </div>

      <div className="max-w-2xl">
        {activeTab === 'add-item' && (
          <InventoryChangeForm onSubmit={handleAddItemSubmit} />
        )}
        {activeTab === 'change-place' && (
          <MovementForm onSubmit={handleChangePlaceSubmit} />
        )}
        {activeTab === 'send-report' && (
          <SubmitAlertForm
            userLocationId={undefined}
            submittedBy={user.username}
            onSubmit={handleSendReportSubmit}
          />
        )}
      </div>
    </div>
  );
}

