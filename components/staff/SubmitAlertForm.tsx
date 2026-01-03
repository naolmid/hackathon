"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface SubmitAlertFormProps {
  userLocationId?: string;
  submittedBy?: string;
  onSubmit: (data: {
    alertType: string;
    message: string;
    locationId: string;
    urgency: string;
    username?: string;
  }) => Promise<void>;
}

export default function SubmitAlertForm({ userLocationId, submittedBy, onSubmit }: SubmitAlertFormProps) {
  const [alertType, setAlertType] = useState<string>("");
  const [message, setMessage] = useState("");
  const [locationId, setLocationId] = useState(userLocationId || "");
  const [urgency, setUrgency] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      // Get user role from localStorage
      const userData = localStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;
      const role = user?.role?.toUpperCase() || "";
      
      // Determine location type based on role
      let locationType = "";
      if (role === "CAFETERIA") locationType = "CAFETERIA";
      else if (role === "LIBRARIAN") locationType = "LIBRARY";
      else if (role === "PRINT_PERSONNEL") locationType = "PRINT_HOUSE";
      else if (role === "LAB_MANAGER") locationType = "LAB";
      else if (role === "IT_STAFF") locationType = "LAB"; // IT staff can access labs
      
      const url = locationType 
        ? `/api/hierarchy/locations?type=${locationType}`
        : "/api/hierarchy/locations";
      
      const res = await fetch(url);
      const data = await res.json();
      let filteredLocations = data.locations || [];
      
      // For cafeteria, ONLY show Hachalu Campus cafeteria - STRICT FILTER BY ID
      if (role === "CAFETERIA") {
        filteredLocations = filteredLocations.filter((loc: any) => 
          loc.id === 'loc-hachalu-cafeteria'
        );
      }
      
      setLocations(filteredLocations);
      if (filteredLocations.length > 0 && !userLocationId) {
        setLocationId(filteredLocations[0].id);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertType || !message || !urgency) return;

    setIsSubmitting(true);
    
    try {
      await onSubmit({
        alertType,
        message,
        locationId: locationId || "",
        urgency,
        username: submittedBy,
      });
      // Reset form
      setAlertType("");
      setMessage("");
      setLocationId(userLocationId || "");
      setUrgency("");
    } catch (error) {
      console.error("Error submitting alert:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-bold text-white mb-4">Submit Alert</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Alert Type
            </label>
            <select
              value={alertType}
              onChange={(e) => setAlertType(e.target.value)}
              required
              className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-[8px] px-4 py-2.5 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50"
            >
              <option value="">Select type...</option>
              <option value="EQUIPMENT_BREAKDOWN">Equipment Breakdown</option>
              <option value="MAINTENANCE">Maintenance Needed</option>
              <option value="URGENT_NEED">Urgent Need</option>
              <option value="FACILITY_ISSUE">Facility Issue</option>
              <option value="DEPLETION">Depletion Alert</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Location
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              required
              className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-[8px] px-4 py-2.5 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50"
            >
              <option value="">
                {locations.length === 0 ? "⚠️ No locations - seed database at /seed" : "Select location..."}
              </option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Urgency Level
            </label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              required
              className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-[8px] px-4 py-2.5 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50"
            >
              <option value="">Select urgency...</option>
              <option value="URGENT">Urgent (Red)</option>
              <option value="SERIOUS">Serious (Orange)</option>
              <option value="DAY_TO_DAY">Day-to-Day (Blue)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-[8px] px-4 py-2.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 resize-none"
              placeholder="Describe the issue or alert..."
            />
          </div>

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Submit Alert
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

