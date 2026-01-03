"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface LocationBreakdown {
  name: string;
  count: number;
  campus: string;
}

interface CategoryDetail {
  category: string;
  total: number;
  locations: LocationBreakdown[];
  recentAlerts: any[];
}

export default function CategoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const category = params.category as string;
  const [data, setData] = useState<CategoryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoryData();
  }, [category]);

  const fetchCategoryData = async () => {
    try {
      const response = await fetch(`/api/admin/resources-by-category?category=${category}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching category data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0c]">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0c]">
        <div className="text-zinc-500">Category not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <button
          onClick={() => router.back()}
          className="text-blue-400 hover:text-blue-300 text-sm mb-4 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold tracking-tight text-white capitalize">{data.category}</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {data.total} total items across {data.locations.length} locations
        </p>
      </div>

      {/* Total Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 uppercase tracking-wider font-bold">Total Count</p>
              <p className="text-4xl font-bold text-white mt-2">{data.total}</p>
            </div>
            <div className="w-16 h-16 rounded-[16px] bg-blue-600/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Breakdown */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Location Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.locations.map((location, idx) => (
            <Card key={idx}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white">{location.name}</h3>
                  <Badge variant="INFO">{location.campus}</Badge>
                </div>
                <p className="text-2xl font-bold text-blue-400">{location.count}</p>
                <p className="text-xs text-zinc-500 mt-1">items</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Alerts */}
      {data.recentAlerts && data.recentAlerts.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Recent Alerts</h2>
          <div className="space-y-2">
            {data.recentAlerts.map((alert, idx) => (
              <Card key={idx}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-white font-semibold">{alert.message}</p>
                      <p className="text-xs text-zinc-500 mt-1">{alert.location}</p>
                    </div>
                    <Badge variant={alert.urgency as any}>{alert.urgency}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

