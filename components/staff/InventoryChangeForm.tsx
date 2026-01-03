"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface InventoryChangeFormProps {
  onSubmit: (data: {
    itemName: string;
    locationId: string;
    quantityChange: number;
    reason?: string;
  }) => Promise<void>;
}

export default function InventoryChangeForm({ onSubmit }: InventoryChangeFormProps) {
  const [itemName, setItemName] = useState("");
  const [locationId, setLocationId] = useState("");
  const [quantityChange, setQuantityChange] = useState<number>(0);
  const [reason, setReason] = useState("");
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
      else if (role === "IT_STAFF") locationType = "LAB";
      
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
      if (filteredLocations.length > 0) {
        setLocationId(filteredLocations[0].id);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !locationId) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        itemName,
        locationId,
        quantityChange,
        reason,
      });
      // Reset form
      setItemName("");
      setLocationId("");
      setQuantityChange(0);
      setReason("");
    } catch (error) {
      console.error("Error submitting inventory change:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-bold text-white mb-4">Report Inventory Change</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Item Name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="e.g., big dish preparing pots"
            required
          />

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
              Quantity Change
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setQuantityChange(quantityChange - 1)}
                className="w-10 h-10 rounded-[8px] border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 text-zinc-400"
              >
                -
              </button>
              <Input
                type="number"
                value={quantityChange}
                onChange={(e) => setQuantityChange(parseInt(e.target.value) || 0)}
                className="flex-1"
                required
              />
              <button
                type="button"
                onClick={() => setQuantityChange(quantityChange + 1)}
                className="w-10 h-10 rounded-[8px] border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 text-zinc-400"
              >
                +
              </button>
            </div>
          </div>

          <Input
            label="Reason (Optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is the quantity changing?"
          />

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Submit Change
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

