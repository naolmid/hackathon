"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getUrgencyGroup, getUrgencyLabel, categorizeUrgency } from "@/lib/alert-categorizer";

type Urgency = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type AlertStatus = 'PENDING' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';
type AlertType = 'DEPLETION' | 'MAINTENANCE' | 'URGENT_NEED' | 'EQUIPMENT_BREAKDOWN' | 'FACILITY_ISSUE' | 'INVENTORY_CHANGE' | 'RESOURCE_MOVEMENT' | 'BOOK_LENDING';

interface Alert {
  id: string;
  alertType: AlertType;
  message: string;
  location: string;
  urgency: Urgency;
  status: AlertStatus;
  submittedBy: string;
  createdAt: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export default function AdminAlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [urgencyFilter, setUrgencyFilter] = useState<Urgency | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<AlertType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'ALL'>('ALL');

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    fetchAlerts();
  }, [router]);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/admin/alerts-grouped");
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      const res = await fetch(`/api/admin/alerts/${alertId}/acknowledge`, {
        method: "POST",
      });
      if (res.ok) {
        fetchAlerts();
      }
    } catch (error) {
      console.error("Error acknowledging alert:", error);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      const res = await fetch(`/api/admin/alerts/${alertId}/resolve`, {
        method: "POST",
      });
      if (res.ok) {
        fetchAlerts();
      }
    } catch (error) {
      console.error("Error resolving alert:", error);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (urgencyFilter !== 'ALL' && alert.urgency !== urgencyFilter) return false;
    if (typeFilter !== 'ALL' && alert.alertType !== typeFilter) return false;
    if (statusFilter !== 'ALL' && alert.status !== statusFilter) return false;
    return true;
  });

  const urgencyColors: Record<Urgency, string> = {
    'CRITICAL': 'bg-red-500/10 text-red-400 border-red-500/30',
    'HIGH': 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    'MEDIUM': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    'LOW': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  };

  const statusColors: Record<AlertStatus, string> = {
    'PENDING': 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
    'ACKNOWLEDGED': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'IN_PROGRESS': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    'RESOLVED': 'bg-green-500/10 text-green-400 border-green-500/30',
    'DISMISSED': 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Alert Management</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage and track all system alerts with filtering and assignment workflow.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-zinc-500 font-bold uppercase tracking-wider self-center">Urgency:</span>
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setUrgencyFilter(lvl)}
              className={`
                px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-[8px] border transition-all
                ${urgencyFilter === lvl 
                  ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' 
                  : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'}
              `}
            >
              {lvl}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-zinc-500 font-bold uppercase tracking-wider self-center">Type:</span>
          {(['ALL', 'DEPLETION', 'MAINTENANCE', 'URGENT_NEED', 'EQUIPMENT_BREAKDOWN', 'FACILITY_ISSUE', 'INVENTORY_CHANGE', 'RESOURCE_MOVEMENT', 'BOOK_LENDING'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`
                px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-[8px] border transition-all
                ${typeFilter === type 
                  ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' 
                  : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'}
              `}
            >
              {type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-zinc-500 font-bold uppercase tracking-wider self-center">Status:</span>
          {(['ALL', 'PENDING', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`
                px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-[8px] border transition-all
                ${statusFilter === status 
                  ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' 
                  : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'}
              `}
            >
              {status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-zinc-500">Loading alerts...</div>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-zinc-500">No alerts found matching the selected filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <Card key={alert.id} className="relative overflow-hidden group">
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${urgencyColors[alert.urgency].split(' ')[0]}`}></div>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={urgencyColors[alert.urgency]}>
                            {getUrgencyLabel(alert.urgency)}
                          </Badge>
                          <Badge className={statusColors[alert.status]}>
                            {alert.status}
                          </Badge>
                          <span className="text-xs text-zinc-500 uppercase tracking-wider">
                            {alert.alertType.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-white font-medium mb-1">{alert.message}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                          <span>📍 {alert.location}</span>
                          <span>👤 {alert.submittedBy}</span>
                          <span>🕐 {new Date(alert.createdAt).toLocaleString()}</span>
                          {alert.acknowledgedBy && (
                            <span>✓ Acknowledged by {alert.acknowledgedBy}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 shrink-0">
                    {alert.status === 'PENDING' && (
                      <Button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Acknowledge
                      </Button>
                    )}
                    {alert.status !== 'RESOLVED' && alert.status !== 'DISMISSED' && (
                      <>
                        <Button
                          onClick={() => router.push(`/dashboard/admin/alerts/${alert.id}/assign`)}
                          className="bg-zinc-800 hover:bg-zinc-700 text-white"
                        >
                          Assign
                        </Button>
                        <Button
                          onClick={() => handleResolve(alert.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Resolve
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

