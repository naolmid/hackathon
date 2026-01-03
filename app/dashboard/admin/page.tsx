"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getUrgencyGroup, getUrgencyLabel } from "@/lib/alert-categorizer";

interface ResourceCategory {
  name: string;
  total: number;
  locations: { name: string; count: number }[];
}

interface LocationResource {
  locationId: string;
  locationName: string;
  locationType: string;
  campusName: string;
  resources: {
    name: string;
    type: string;
    quantity: number;
    currentQuantity: number;
  }[];
  totalItems: number;
  resourceTypes?: Record<string, number>;
}

interface Alert {
  id: string;
  alertType: string;
  message: string;
  location: string;
  urgency: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [locationResources, setLocationResources] = useState<LocationResource[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortByName, setSortByName] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(userData));
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const [categoriesRes, locationsRes, alertsRes] = await Promise.all([
        fetch("/api/admin/resources-by-category"),
        fetch("/api/admin/resources-by-location"),
        fetch("/api/admin/alerts-grouped"),
      ]);
      
      const categoriesData = await categoriesRes.json();
      const locationsData = await locationsRes.json();
      const alertsData = await alertsRes.json();
      
      setCategories(categoriesData.categories || []);
      setLocationResources(locationsData.locations || []);
      setAlerts(alertsData.alerts || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0c]">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  const groupedAlerts = {
    urgent: alerts.filter(a => getUrgencyGroup(a.urgency as any) === 'urgent'),
    serious: alerts.filter(a => getUrgencyGroup(a.urgency as any) === 'serious'),
    'day-to-day': alerts.filter(a => getUrgencyGroup(a.urgency as any) === 'day-to-day'),
  };

  const categoryIcons: Record<string, string> = {
    'Library': 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    'Labs': 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    'Cafeteria': 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7',
    'Classrooms': 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-blue-500 mb-2">Admin Dashboard</h2>
          <h1 className="text-4xl font-bold tracking-tight text-white">Resource Overview</h1>
          <p className="text-zinc-500 mt-2 max-w-xl">
            Monitor all resources across campuses and manage alerts grouped by urgency.
          </p>
        </div>
      </section>

      {/* Alerts by Urgency - Show at top */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Alerts by Urgency</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Urgent Alerts */}
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-red-400">Urgent</h4>
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  {groupedAlerts.urgent.length}
                </Badge>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {groupedAlerts.urgent.length === 0 ? (
                  <p className="text-zinc-500 text-sm">No urgent alerts</p>
                ) : (
                  groupedAlerts.urgent.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="p-3 bg-red-500/10 border border-red-500/20 rounded-[8px]">
                      <p className="text-white text-sm font-medium mb-1">{alert.message}</p>
                      <p className="text-red-300/70 text-xs">{alert.location}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Serious Alerts */}
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-orange-400">Serious</h4>
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                  {groupedAlerts.serious.length}
                </Badge>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {groupedAlerts.serious.length === 0 ? (
                  <p className="text-zinc-500 text-sm">No serious alerts</p>
                ) : (
                  groupedAlerts.serious.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-[8px]">
                      <p className="text-white text-sm font-medium mb-1">{alert.message}</p>
                      <p className="text-orange-300/70 text-xs">{alert.location}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Day-to-Day Alerts */}
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-blue-400">Day-to-Day</h4>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {groupedAlerts['day-to-day'].length}
                </Badge>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {groupedAlerts['day-to-day'].length === 0 ? (
                  <p className="text-zinc-500 text-sm">No day-to-day alerts</p>
                ) : (
                  groupedAlerts['day-to-day'].slice(0, 5).map((alert) => (
                    <div key={alert.id} className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-[8px]">
                      <p className="text-white text-sm font-medium mb-1">{alert.message}</p>
                      <p className="text-blue-300/70 text-xs">{alert.location}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resources by Location - SHOW FIRST */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Resources by Location</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">Sort by:</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={sortByName}
                onChange={(e) => setSortByName(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-zinc-300">
                {sortByName ? "Name" : "Number"}
              </span>
            </label>
          </div>
        </div>
        {loading ? (
          <div className="text-zinc-500 text-center py-8">Loading resources...</div>
        ) : locationResources.length > 0 ? (
          <div className="space-y-6">
            {/* Group locations intelligently */}
            {(() => {
              // Group Computer Labs
              const computerLabs = locationResources.filter(loc => 
                loc.locationName.match(/Computer Lab \d+/i)
              );
              // Group Lecture Halls
              const lectureHalls = locationResources.filter(loc => 
                loc.locationName.match(/Lecture Hall LH\d+/i)
              );
              // Group Classrooms
              const classrooms = locationResources.filter(loc => 
                loc.locationName.match(/Classroom CR\d+/i)
              );
              // Everything else
              const otherLocations = locationResources.filter(loc => 
                !loc.locationName.match(/Computer Lab \d+/i) &&
                !loc.locationName.match(/Lecture Hall LH\d+/i) &&
                !loc.locationName.match(/Classroom CR\d+/i)
              );

              const groups: { title: string; locations: LocationResource[] }[] = [];
              
              if (computerLabs.length > 0) {
                groups.push({ title: 'Computer Labs', locations: computerLabs });
              }
              if (lectureHalls.length > 0) {
                groups.push({ title: 'Lecture Halls', locations: lectureHalls });
              }
              if (classrooms.length > 0) {
                groups.push({ title: 'Classrooms', locations: classrooms });
              }
              if (otherLocations.length > 0) {
                // Group other locations by type
                const otherByType = otherLocations.reduce((acc: Record<string, LocationResource[]>, loc) => {
                  const type = loc.locationType.replace(/_/g, " ");
                  if (!acc[type]) acc[type] = [];
                  acc[type].push(loc);
                  return acc;
                }, {});
                Object.entries(otherByType).forEach(([type, locs]) => {
                  groups.push({ title: type, locations: locs });
                });
              }

              return groups.map((group) => (
                <div key={group.title} className="space-y-3">
                  <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                    {group.title}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.locations.map((loc) => (
                    <Card key={loc.locationId} hoverable>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h5 className="text-lg font-bold text-white mb-1">{loc.locationName}</h5>
                            <p className="text-xs text-zinc-500">{loc.campusName}</p>
                          </div>
                          <Badge variant="INFO">{loc.totalItems}</Badge>
                        </div>
                        
                        {/* Resource Type Summary - Show counts like "25 computers", "30 desks" */}
                        {loc.resourceTypes && Object.keys(loc.resourceTypes).length > 0 && (
                          <div className="mb-4 pb-4 border-b border-zinc-800">
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(loc.resourceTypes)
                                .sort((a, b) => b[1] - a[1]) // Sort by count descending
                                .map(([type, count]) => (
                                <span key={type} className="text-xs px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-[6px] border border-blue-500/20 font-medium">
                                  {count} {type}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(() => {
                            // Sort resources based on toggle
                            const sortedResources = [...loc.resources].sort((a, b) => {
                              if (sortByName) {
                                // Sort by name alphabetically
                                return a.name.localeCompare(b.name);
                              } else {
                                // Sort by number (extract number from name or use currentQuantity)
                                const getNumber = (name: string) => {
                                  const match = name.match(/#(\d+)/);
                                  return match ? parseInt(match[1]) : 0;
                                };
                                const numA = getNumber(a.name);
                                const numB = getNumber(b.name);
                                if (numA !== 0 || numB !== 0) {
                                  return numA - numB;
                                }
                                // If no number found, sort by currentQuantity
                                return b.currentQuantity - a.currentQuantity;
                              }
                            });
                            return sortedResources;
                          })().slice(0, 8).map((resource, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-zinc-800/30 rounded-[6px]">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{resource.name}</p>
                                <p className="text-xs text-zinc-500 capitalize">{resource.type.replace(/_/g, " ").toLowerCase()}</p>
                              </div>
                              <div className="text-right ml-2">
                                <p className="text-sm font-bold text-blue-400">{resource.currentQuantity}</p>
                                <p className="text-xs text-zinc-600">of {resource.quantity}</p>
                              </div>
                            </div>
                          ))}
                          {loc.resources.length > 8 && (
                            <p className="text-xs text-zinc-500 text-center pt-2">
                              +{loc.resources.length - 8} more items
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        ) : (
          <div className="text-zinc-500 text-center py-8">No resources found</div>
        )}
      </div>

      {/* Resource Categories */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Resource Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-4 text-zinc-500 text-center py-8">Loading categories...</div>
          ) : categories.length > 0 ? (
            categories.map((category, idx) => (
              <Link key={idx} href={`/dashboard/admin/category/${category.name.toLowerCase()}`}>
                <Card hoverable className="group">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-[12px] flex items-center justify-center mb-4 bg-blue-600/10 text-blue-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d={categoryIcons[category.name] || categoryIcons['Classrooms']} />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-white mb-1">{category.name}</h4>
                    <p className="text-2xl font-bold text-blue-400">{category.total}</p>
                    <p className="text-xs text-zinc-500 mt-1">Total items</p>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-4 text-zinc-500 text-center py-8">No categories found</div>
          )}
        </div>
      </div>
    </div>
  );
}

