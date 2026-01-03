"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface MovementFormProps {
  onSubmit: (data: {
    resourceId: string;
    resourceName: string;
    fromLocationId: string;
    toLocationId: string;
    reason?: string;
  }) => Promise<void>;
}

export default function MovementForm({ onSubmit }: MovementFormProps) {
  const [resourceId, setResourceId] = useState("");
  const [resourceName, setResourceName] = useState("");
  const [fromLocationId, setFromLocationId] = useState("");
  const [toLocationId, setToLocationId] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState<{ id: string; name: string; type: string }[]>([]);
  const [fromLocationType, setFromLocationType] = useState<string>("");
  const [availableToLocations, setAvailableToLocations] = useState<{ id: string; name: string }[]>([]);
  const [availableResources, setAvailableResources] = useState<{ id: string; name: string; type: string }[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    // When from location changes, filter to locations to only show same type
    if (fromLocationType && locations.length > 0) {
      const sameTypeLocations = locations
        .filter(loc => loc.type === fromLocationType && loc.id !== fromLocationId)
        .map(loc => ({ id: loc.id, name: loc.name }));
      setAvailableToLocations(sameTypeLocations);
    } else {
      setAvailableToLocations([]);
    }
  }, [fromLocationId, fromLocationType, locations]);

  useEffect(() => {
    // When from location changes, fetch resources from that location
    if (fromLocationId) {
      fetchResourcesFromLocation(fromLocationId);
    } else {
      setAvailableResources([]);
      setResourceId("");
      setResourceName("");
    }
  }, [fromLocationId]);

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
      else if (role === "IT_STAFF") locationType = "LAB";
      
      const url = locationType 
        ? `/api/hierarchy/locations?type=${locationType}`
        : "/api/hierarchy/locations";
      
      const res = await fetch(url);
      const data = await res.json();
      // Include location type in the data
      let locationsWithType = (data.locations || []).map((loc: any) => ({
        id: loc.id,
        name: loc.name,
        type: loc.type || locationType,
      }));
      
      // For LAB_MANAGER, filter to only show computer labs (exclude Biology Lab)
      if (role === "LAB_MANAGER") {
        locationsWithType = locationsWithType.filter((loc: any) => 
          loc.name.toLowerCase().includes("computer lab")
        );
      }
      
      setLocations(locationsWithType);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const fetchResourcesFromLocation = async (locationId: string) => {
    setLoadingResources(true);
    try {
      const res = await fetch(`/api/resources/by-location?locationId=${locationId}`);
      const data = await res.json();
      
      if (data.resources && Array.isArray(data.resources)) {
        setAvailableResources(data.resources);
      } else {
        setAvailableResources([]);
      }
    } catch (error) {
      console.error("Error fetching resources:", error);
      setAvailableResources([]);
    } finally {
      setLoadingResources(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceName || !fromLocationId || !toLocationId) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        resourceId,
        resourceName,
        fromLocationId,
        toLocationId,
        reason,
      });
      // Reset form
      setResourceId("");
      setResourceName("");
      setFromLocationId("");
      setToLocationId("");
      setReason("");
    } catch (error) {
      console.error("Error submitting movement:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-bold text-white mb-4">Report Resource Movement</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Resource Name
            </label>
            <select
              value={resourceName}
              onChange={(e) => {
                const selected = availableResources.find(r => r.name === e.target.value);
                setResourceName(e.target.value);
                setResourceId(selected?.id || "");
              }}
              required
              disabled={!fromLocationId || loadingResources || availableResources.length === 0}
              className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-[8px] px-4 py-2.5 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {!fromLocationId 
                  ? "Select 'From Location' first" 
                  : loadingResources
                  ? "Loading resources..."
                  : availableResources.length === 0 
                  ? "⚠️ No resources available in this location" 
                  : "Select resource..."}
              </option>
              {availableResources.map((resource) => (
                <option key={resource.id} value={resource.name}>
                  {resource.name} ({resource.type.replace(/_/g, " ").toLowerCase()})
                </option>
              ))}
            </select>
            {fromLocationId && availableResources.length === 0 && !loadingResources && (
              <p className="text-xs text-orange-400 mt-1">
                ⚠️ No resources available in this location
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              From Location
            </label>
            <select
              value={fromLocationId}
              onChange={(e) => {
                const selected = locations.find(loc => loc.id === e.target.value);
                setFromLocationId(e.target.value);
                setFromLocationType(selected?.type || "");
                setToLocationId(""); // Reset to location when from changes
              }}
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
              To Location {fromLocationType && <span className="text-zinc-600">(same type only)</span>}
            </label>
            <select
              value={toLocationId}
              onChange={(e) => setToLocationId(e.target.value)}
              required
              disabled={!fromLocationId || availableToLocations.length === 0}
              className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-[8px] px-4 py-2.5 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {!fromLocationId 
                  ? "Select 'From Location' first" 
                  : availableToLocations.length === 0 
                  ? "⚠️ No locations of same type available" 
                  : "Select location..."}
              </option>
              {availableToLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
            {fromLocationId && availableToLocations.length === 0 && (
              <p className="text-xs text-orange-400 mt-1">
                ⚠️ No other {fromLocationType.toLowerCase()} locations available for movement
              </p>
            )}
          </div>

          <Input
            label="Reason (Optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this being moved?"
          />

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Submit Movement
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

