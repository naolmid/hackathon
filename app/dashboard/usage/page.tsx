"use client";

import { useState, useEffect } from "react";

interface UsageData {
  id: string;
  resourceId: string;
  resource: {
    name: string;
    type: string;
  };
  usageRate: number;
  submittedAt: string;
}

export default function UsageTrackingPage() {
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchUsageData();
    fetchResources();
  }, []);

  const fetchUsageData = async () => {
    try {
      const res = await fetch("/api/usage");
      const data = await res.json();
      setUsageData(data.usageData || []);
    } catch (error) {
      console.error("Error fetching usage data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      setResources(data.resources || []);
    } catch (error) {
      console.error("Error fetching resources:", error);
    }
  };

  const handleSubmitUsage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId: formData.get("resourceId"),
          usageRate: parseFloat(formData.get("usageRate") as string),
          estimatedDaysUntilDepletion: parseInt(formData.get("estimatedDays") as string),
        }),
      });

      if (res.ok) {
        setShowForm(false);
        fetchUsageData();
      }
    } catch (error) {
      console.error("Error submitting usage data:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-foreground">
            Usage Tracking
          </h1>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 hover:shadow-medium transition-all text-sm font-medium"
          >
            + Submit Usage Data
          </button>
        </div>

        {showForm && (
          <div className="bg-surface border border-border rounded-lg p-6 mb-6 shadow-medium">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Submit Usage Data
            </h2>
            <form onSubmit={handleSubmitUsage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Resource
                </label>
                <select
                  name="resourceId"
                  required
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-sm"
                >
                  <option value="">Select a resource</option>
                  {resources.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name} ({resource.type})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Usage Rate (units per day)
                </label>
                <input
                  name="usageRate"
                  type="number"
                  step="0.01"
                  required
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Estimated Days Until Depletion
                </label>
                <input
                  name="estimatedDays"
                  type="number"
                  required
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-sm"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 hover:shadow-medium transition-all text-sm font-medium"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 bg-surface border border-border text-foreground rounded-lg hover:bg-background hover:shadow-soft transition-all text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-secondary">Loading...</div>
          </div>
        ) : usageData.length > 0 ? (
          <div className="space-y-4">
            {usageData.map((usage) => (
              <div
                key={usage.id}
                className="bg-surface border border-border rounded-lg p-6 hover:shadow-medium transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {usage.resource.name}
                    </h3>
                    <p className="text-secondary text-sm mb-1">
                      Type: {usage.resource.type}
                    </p>
                    <p className="text-secondary text-sm">
                      Usage Rate: {usage.usageRate} units/day
                    </p>
                    <p className="text-secondary text-xs mt-2">
                      Submitted: {new Date(usage.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-lg p-12 text-center shadow-soft">
            <p className="text-secondary">No usage data submitted yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

