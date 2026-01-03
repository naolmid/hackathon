"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function SeedProductionPage() {
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSeed = async () => {
    setIsLoading(true);
    setStatus("Seeding database...");
    setResult(null);

    try {
      const response = await fetch("/api/seed-production", {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        setStatus("✅ " + data.message);
        setResult(data.data);
      } else {
        setStatus("❌ Error: " + data.error);
      }
    } catch (error: any) {
      setStatus("❌ Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0c]">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Seed Production Database</h1>
          <p className="text-zinc-400 mb-6">
            This will populate the Turso database with sample data.
          </p>
          
          <Button 
            onClick={handleSeed} 
            isLoading={isLoading}
            className="w-full mb-4"
          >
            🌱 Seed Database
          </Button>

          {status && (
            <p className={`text-sm ${status.includes("✅") ? "text-green-400" : status.includes("❌") ? "text-red-400" : "text-zinc-400"}`}>
              {status}
            </p>
          )}

          {result && (
            <div className="mt-4 text-left bg-zinc-900 rounded-lg p-4">
              <p className="text-zinc-300 text-sm">Campus: {result.campus}</p>
              <p className="text-zinc-300 text-sm">Locations: {result.locations}</p>
              <p className="text-zinc-300 text-sm">Users: {result.users}</p>
              <p className="text-zinc-300 text-sm">Resources: {result.resources}</p>
              <p className="text-zinc-300 text-sm">Book Lendings: {result.bookLendings}</p>
              <p className="text-zinc-300 text-sm">Alerts: {result.alerts}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

