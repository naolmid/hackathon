"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

interface Resource {
  id: string;
  name: string;
  type: string;
  quantity: number;
  currentQuantity: number;
  locationId: string;
}

export default function InventoryPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchResources();
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      // Get user role from localStorage
      const userData = localStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;
      const role = user?.role?.toUpperCase() || "";
      
      // Admins can see all locations, staff see only their type
      let locationType = "";
      if (role !== "UNIVERSITY_ADMIN" && role !== "CAMPUS_ADMIN") {
        if (role === "CAFETERIA") locationType = "CAFETERIA";
        else if (role === "LIBRARIAN") locationType = "LIBRARY";
        else if (role === "PRINT_PERSONNEL") locationType = "PRINT_HOUSE";
        else if (role === "LAB_MANAGER") locationType = "LAB";
        else if (role === "IT_STAFF") locationType = "LAB";
      }
      
      const url = locationType 
        ? `/api/hierarchy/locations?type=${locationType}`
        : "/api/hierarchy/locations";
      
      const res = await fetch(url);
      const data = await res.json();
      setLocations(data.locations || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const fetchResources = async () => {
    try {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      setResources(data.resources || []);
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (id: string, delta: number) => {
    const resource = resources.find(r => r.id === id);
    if (!resource) return;

    const newQuantity = Math.max(0, resource.currentQuantity + delta);
    
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentQuantity: newQuantity }),
      });

      if (res.ok) {
        setResources(resources.map(r => r.id === id ? { ...r, currentQuantity: newQuantity } : r));
      }
    } catch (error) {
      console.error("Error updating resource:", error);
    }
  };

  const handleAddResource = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          type: formData.get("type"),
          quantity: parseInt(formData.get("quantity") as string),
          currentQuantity: parseInt(formData.get("currentQuantity") as string),
          locationId: formData.get("locationId"),
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchResources();
      }
    } catch (error) {
      console.error("Error adding resource:", error);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Inventory Management</h1>
          <p className="text-zinc-500 text-sm mt-1">Direct control over resource availability and stock levels.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Resource
        </Button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-800/50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Add Resource</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CardContent className="space-y-4 p-8">
              <form onSubmit={handleAddResource} className="space-y-4">
                <Input label="Resource Name" name="name" placeholder="e.g. Printer Toner" className="col-span-2" required />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">Category</label>
                    <select
                      name="type"
                      required
                      className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-[8px] px-4 py-2.5 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50"
                    >
                      <option value="BOOK">Book</option>
                      <option value="PAPER">Paper</option>
                      <option value="INK">Ink</option>
                      <option value="EQUIPMENT">Equipment</option>
                    </select>
                  </div>
                  <Input label="Initial Quantity" name="quantity" type="number" placeholder="0" required />
                </div>
                <Input label="Current Quantity" name="currentQuantity" type="number" placeholder="0" required />
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Location
                  </label>
                  <select
                    name="locationId"
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
                <div className="pt-6 flex gap-3">
                  <Button type="submit" className="flex-1">Save Resource</Button>
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-zinc-500">Loading...</div>
        </div>
      ) : (
        <div className="bg-[#16181d] border border-zinc-800 rounded-[16px] overflow-hidden">
          <div className="p-6 border-b border-zinc-800/50 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <Badge variant="INFO">Total: {resources.length} Items</Badge>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-1 text-xs border border-zinc-800 rounded-[8px] hover:bg-zinc-800 transition-colors text-zinc-400">Export CSV</button>
              <button className="px-4 py-1 text-xs border border-zinc-800 rounded-[8px] hover:bg-zinc-800 transition-colors text-zinc-400">Print Labels</button>
            </div>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-900/50 text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Resource</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Stock Level</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Quick Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {resources.length > 0 ? resources.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-800/20 group transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-white">{item.name}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">ID: {item.id.slice(0, 8)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-zinc-400 text-sm capitalize">{item.type.replace(/_/g, " ").toLowerCase()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-lg font-mono font-bold text-blue-400">{item.currentQuantity} <span className="text-[10px] text-zinc-600 uppercase">units</span></span>
                      <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.currentQuantity < item.quantity * 0.2 ? 'bg-red-500' : 'bg-cyan-500'}`}
                          style={{ width: `${Math.min(100, (item.currentQuantity / item.quantity) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {item.currentQuantity < item.quantity * 0.2 ? (
                      <Badge variant="CRITICAL">Low Stock</Badge>
                    ) : (
                      <Badge variant="SUCCESS">Healthy</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 rounded-[8px] border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 hover:text-red-500 transition-colors text-zinc-400"
                      >
                        -
                      </button>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 rounded-[8px] border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 hover:text-emerald-500 transition-colors text-zinc-400"
                      >
                        +
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    No resources found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
