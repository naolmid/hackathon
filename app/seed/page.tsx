"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/seed", {
        method: "POST",
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server error: ${text.substring(0, 200)}`);
      }

      if (!response.ok) {
        const errorMsg = data.details || data.error || "Failed to seed database";
        console.error("Seed API Error:", data);
        throw new Error(errorMsg);
      }

      setResult(data);
    } catch (err: any) {
      console.error("Seed error:", err);
      setError(err.message || "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold text-white mb-4">Seed Database</h1>
          <p className="text-zinc-400 text-sm mb-6">
            This will populate the database with sample data including campuses, locations, users, resources, alerts, and more.
          </p>

          <Button
            onClick={handleSeed}
            isLoading={loading}
            className="w-full mb-4"
          >
            {loading ? "Seeding..." : "Seed Database"}
          </Button>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-[8px] text-red-400 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-[8px] text-green-400 text-sm">
              <strong>Success!</strong>
              <div className="mt-2 space-y-1">
                <div>Campuses: {result.stats?.campuses}</div>
                <div>Locations: {result.stats?.locations}</div>
                <div>Users: {result.stats?.users}</div>
                <div>Resources: {result.stats?.resources}</div>
                <div>Alerts: {result.stats?.alerts}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

