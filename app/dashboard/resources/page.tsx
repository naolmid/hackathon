"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";

interface Campus {
  id: string;
  name: string;
  resourceLocations: Location[];
}

interface Location {
  id: string;
  name: string;
  type: string;
  _count: { resources: number };
}

interface Resource {
  id: string;
  name: string;
  type: string;
  quantity: number;
  currentQuantity: number;
  daysUntilDepletion: number | null;
  isLent?: boolean;
  activeLending?: {
    borrowerName: string;
    borrowerId: string | null;
    lentDate: string;
    dueDate: string;
    status: string;
  } | null;
}

export default function ResourcesPage() {
  const [view, setView] = useState<'campus' | 'location' | 'item'>('campus');
  const [selectedCampus, setSelectedCampus] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortByName, setSortByName] = useState(true);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [resourceDetails, setResourceDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchCampuses();
  }, []);

  useEffect(() => {
    if (selectedCampus) {
      fetchLocations(selectedCampus);
      setSelectedLocation(null);
      setResources([]);
      setView('location');
    }
  }, [selectedCampus]);

  useEffect(() => {
    if (selectedLocation) {
      fetchResources(selectedLocation);
      setView('item');
    }
  }, [selectedLocation]);

  useEffect(() => {
    if (selectedResource) {
      fetchResourceDetails(selectedResource.id);
    }
  }, [selectedResource]);

  const fetchCampuses = async () => {
    try {
      const res = await fetch("/api/hierarchy/campuses");
      const data = await res.json();
      setCampuses(data.campuses || []);
    } catch (error) {
      console.error("Error fetching campuses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async (campusId: string) => {
    try {
      const res = await fetch(`/api/hierarchy/locations?campusId=${campusId}`);
      const data = await res.json();
      setLocations(data.locations || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const fetchResources = async (locationId: string) => {
    try {
      const res = await fetch(`/api/hierarchy/resources?locationId=${locationId}`);
      const data = await res.json();
      setResources(data.resources || []);
    } catch (error) {
      console.error("Error fetching resources:", error);
    }
  };

  const fetchResourceDetails = async (resourceId: string) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/resources/${resourceId}/details`);
      const data = await res.json();
      setResourceDetails(data);
    } catch (error) {
      console.error("Error fetching resource details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const breadcrumbs = [
    { name: 'University', active: view === 'campus', onClick: () => { setView('campus'); setSelectedCampus(null); setSelectedLocation(null); } },
    ...(view !== 'campus' && selectedCampus ? [{ name: campuses.find(c => c.id === selectedCampus)?.name || 'Campus', active: view === 'location', onClick: () => { setView('location'); setSelectedLocation(null); } }] : []),
    ...(view === 'item' && selectedLocation ? [{ name: locations.find(l => l.id === selectedLocation)?.name || 'Location', active: true, onClick: () => {} }] : [])
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Resource Explorer</h1>
          <nav className="flex items-center gap-2 mt-2">
            {breadcrumbs.map((bc, i) => (
              <React.Fragment key={i}>
                <button 
                  onClick={bc.onClick}
                  className={`text-xs font-medium uppercase tracking-wider transition-colors ${bc.active ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {bc.name}
                </button>
                {i < breadcrumbs.length - 1 && <span className="text-zinc-700">/</span>}
              </React.Fragment>
            ))}
          </nav>
        </div>
        <div className="flex gap-2">
           <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                placeholder="Quick search..." 
                className="bg-[#16181d] border border-zinc-800 rounded-[8px] pl-10 pr-4 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50"
              />
           </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-zinc-500">Loading...</div>
        </div>
      ) : view === 'campus' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {campuses.length > 0 ? campuses.map((campus, idx) => (
            <Card key={campus.id || idx} hoverable onClick={() => setSelectedCampus(campus.id)}>
                <div className="h-40 overflow-hidden relative">
                <img 
                  src="/campus.png" 
                  alt="Ambo University Hachalu Hundessa Campus" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#16181d] via-[#16181d]/40 to-transparent"></div>
                <div className="absolute bottom-4 left-4">
                  <Badge variant="INFO">Official Campus</Badge>
                </div>
              </div>
              <CardContent>
                <h3 className="text-xl font-bold mb-1 text-white">{campus.name}</h3>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800/50">
                  <div className="text-center">
                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Locations</p>
                    <p className="text-lg font-bold text-white">{campus.resourceLocations?.length || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Resources</p>
                    <p className="text-lg font-bold text-white">
                      {campus.resourceLocations?.reduce((sum, loc) => sum + (loc._count?.resources || 0), 0) || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="col-span-3 bg-[#16181d] border border-zinc-800 rounded-[16px] p-12 text-center">
              <p className="text-zinc-500">No campuses found</p>
            </div>
          )}
        </div>
      )}

      {view === 'location' && (
        <div className="space-y-6">
          {locations.length > 0 ? (() => {
            // Group locations intelligently
            const computerLabs = locations.filter(loc => 
              loc.name.match(/Computer Lab \d+/i)
            );
            const lectureHalls = locations.filter(loc => 
              loc.name.match(/Lecture Hall LH\d+/i)
            );
            const classrooms = locations.filter(loc => 
              loc.name.match(/Classroom CR\d+/i)
            );
            const otherLocations = locations.filter(loc => 
              !loc.name.match(/Computer Lab \d+/i) &&
              !loc.name.match(/Lecture Hall LH\d+/i) &&
              !loc.name.match(/Classroom CR\d+/i)
            );

            const groups: { title: string; locations: Location[] }[] = [];
            
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
              const otherByType = otherLocations.reduce((acc: Record<string, Location[]>, loc) => {
                const type = loc.type.replace(/_/g, " ");
                if (!acc[type]) acc[type] = [];
                acc[type].push(loc);
                return acc;
              }, {});
              Object.entries(otherByType).forEach(([type, locs]) => {
                groups.push({ title: type, locations: locs });
              });
            }

            return groups.map((group) => {
              const isExpanded = expandedGroup === group.title;
              const totalItems = group.locations.reduce((sum, loc) => sum + (loc._count?.resources || 0), 0);
              
              return (
                <div key={group.title} className="space-y-3">
                  {/* Group Card - Clickable */}
                  <Card 
                    hoverable 
                    onClick={() => setExpandedGroup(isExpanded ? null : group.title)}
                    className="cursor-pointer"
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <Badge variant="SUCCESS">Active</Badge>
                      </div>
                      <h3 className="font-bold text-lg mb-1 text-white">{group.title}</h3>
                      <p className="text-xs text-zinc-500 mb-4 capitalize">{group.locations.length} {group.locations.length === 1 ? 'location' : 'locations'}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">Total Inventory Items</span>
                        <span className="font-bold text-white">{totalItems}</span>
                      </div>
                      <div className="mt-4 pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                        <span className="text-xs text-zinc-500">
                          {isExpanded ? 'Click to collapse' : 'Click to view locations'}
                        </span>
                        <svg 
                          className={`w-5 h-5 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Locations List - Shown when expanded */}
                  {isExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                      {group.locations.map((loc, idx) => (
                        <Card key={loc.id || idx} hoverable onClick={() => setSelectedLocation(loc.id)}>
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <Badge variant="SUCCESS">Active</Badge>
                            </div>
                            <h3 className="font-bold text-lg mb-1 text-white">{loc.name}</h3>
                            <p className="text-xs text-zinc-500 mb-4 capitalize">{loc.type.replace(/_/g, " ").toLowerCase()}</p>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-zinc-400">Inventory Items</span>
                              <span className="font-bold text-white">{loc._count?.resources || 0}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              );
            });
          })() : (
            <div className="bg-[#16181d] border border-zinc-800 rounded-[16px] p-12 text-center">
              <p className="text-zinc-500">No locations found</p>
            </div>
          )}
        </div>
      )}

      {view === 'item' && (
        <div className="space-y-4">
          {/* Toggle for books sorting - only show if there are books */}
          {resources.some(r => r.type === "BOOK") && (
            <div className="flex items-center justify-end gap-3">
              <span className="text-sm text-zinc-400">Sort books by:</span>
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
          )}
          
          <div className="bg-[#16181d] border border-zinc-800 rounded-[16px] overflow-hidden">
            <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-900/50 text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Resource Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {resources.length > 0 ? (() => {
                // Sort books based on toggle, keep other resources in original order
                const sortedResources = [...resources].sort((a, b) => {
                  // Only sort if both are books
                  if (a.type === "BOOK" && b.type === "BOOK") {
                    if (sortByName) {
                      // Sort by name alphabetically
                      return a.name.localeCompare(b.name);
                    } else {
                      // Sort by number (extract number from name like #44021)
                      const getNumber = (name: string) => {
                        const match = name.match(/#(\d+)/);
                        return match ? parseInt(match[1]) : 0;
                      };
                      const numA = getNumber(a.name);
                      const numB = getNumber(b.name);
                      if (numA !== 0 || numB !== 0) {
                        return numA - numB;
                      }
                      // If no number found, sort by name
                      return a.name.localeCompare(b.name);
                    }
                  }
                  // Keep non-books in original order (books first, then others)
                  if (a.type === "BOOK" && b.type !== "BOOK") return -1;
                  if (a.type !== "BOOK" && b.type === "BOOK") return 1;
                  return 0;
                });
                return sortedResources;
              })().map((resource, i) => (
                <tr key={resource.id || i} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{resource.name}</td>
                  <td className="px-6 py-4 text-zinc-400 text-sm capitalize">{resource.type.replace(/_/g, " ").toLowerCase()}</td>
                  <td className="px-6 py-4 text-zinc-300">{resource.currentQuantity} / {resource.quantity}</td>
                  <td className="px-6 py-4">
                    {resource.type === "BOOK" && resource.isLent ? (
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                        <span className="text-sm text-orange-400 font-medium">LENT</span>
                      </div>
                    ) : resource.daysUntilDepletion !== null && resource.daysUntilDepletion <= 7 ? (
                      <Badge variant="CRITICAL">Low Stock</Badge>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span className="text-sm text-zinc-400">Available</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedResource(resource)}
                      className="text-blue-400 hover:text-blue-300 text-xs font-bold uppercase tracking-widest"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    No resources found in this location
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Resource Detail Modal */}
      <Modal
        isOpen={selectedResource !== null}
        onClose={() => {
          setSelectedResource(null);
          setResourceDetails(null);
        }}
        title={selectedResource?.name || "Resource Details"}
      >
        {loadingDetails ? (
          <div className="text-center py-8 text-zinc-500">Loading details...</div>
        ) : resourceDetails ? (
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Resource Name</p>
                  <p className="text-white font-medium">{resourceDetails.name}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Category</p>
                  <p className="text-white font-medium capitalize">{resourceDetails.type.replace(/_/g, " ").toLowerCase()}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Total Quantity</p>
                  <p className="text-white font-medium">{resourceDetails.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Current Quantity</p>
                  <p className="text-white font-medium">{resourceDetails.currentQuantity}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Location</p>
                  <p className="text-white font-medium">{resourceDetails.location?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Status</p>
                  {resourceDetails.type === "BOOK" && resourceDetails.isLent ? (
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">LENT</Badge>
                  ) : (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Available</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Lending Information (for books) */}
            {resourceDetails.type === "BOOK" && resourceDetails.activeLending && (
              <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Current Lending</h3>
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-[8px] p-4 space-y-2">
                  {resourceDetails.activeLending.borrowerId && (
                    <div className="flex justify-between">
                      <span className="text-xs text-zinc-500">Borrower ID</span>
                      <span className="text-white font-medium">{resourceDetails.activeLending.borrowerId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-xs text-zinc-500">Lent Date</span>
                    <span className="text-white font-medium">{new Date(resourceDetails.activeLending.lentDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-zinc-500">Due Date</span>
                    <span className="text-white font-medium">{new Date(resourceDetails.activeLending.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Lending History (for books) */}
            {resourceDetails.type === "BOOK" && resourceDetails.lendingHistory && resourceDetails.lendingHistory.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Lending History</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {resourceDetails.lendingHistory.map((lending: any, idx: number) => (
                    <div key={idx} className="bg-zinc-800/30 border border-zinc-800 rounded-[8px] p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-white font-medium text-sm">{lending.borrowerName}</p>
                        </div>
                        <Badge className={lending.status === "LENT" ? "bg-orange-500/20 text-orange-400" : "bg-emerald-500/20 text-emerald-400"}>
                          {lending.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-zinc-500">Lent: </span>
                          <span className="text-white">{new Date(lending.lentDate).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Due: </span>
                          <span className="text-white">{new Date(lending.dueDate).toLocaleDateString()}</span>
                        </div>
                        {lending.returnDate && (
                          <div>
                            <span className="text-zinc-500">Returned: </span>
                            <span className="text-white">{new Date(lending.returnDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Usage Statistics */}
            {resourceDetails._count && (
              <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Statistics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-zinc-800/30 rounded-[8px] p-3 text-center">
                    <p className="text-xs text-zinc-500 mb-1">Total Lendings</p>
                    <p className="text-2xl font-bold text-white">{resourceDetails._count.bookLendings || 0}</p>
                  </div>
                  <div className="bg-zinc-800/30 rounded-[8px] p-3 text-center">
                    <p className="text-xs text-zinc-500 mb-1">Usage Records</p>
                    <p className="text-2xl font-bold text-white">{resourceDetails._count.usageHistory || 0}</p>
                  </div>
                  <div className="bg-zinc-800/30 rounded-[8px] p-3 text-center">
                    <p className="text-xs text-zinc-500 mb-1">Requisitions</p>
                    <p className="text-2xl font-bold text-white">{resourceDetails._count.requisitions || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-500">No details available</div>
        )}
      </Modal>
    </div>
  );
}
