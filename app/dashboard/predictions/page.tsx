"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type Urgency = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

interface Prediction {
  resourceId: string;
  resourceName: string;
  currentQuantity: number;
  daysUntilDepletion: number | null;
  urgency: Urgency;
  location: string;
}

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      const res = await fetch("/api/predictions");
      const data = await res.json();
      setPredictions(data.predictions || []);
    } catch (error) {
      console.error("Error fetching predictions:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-500">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-white">Burn Rate Predictions</h1>
        <p className="text-zinc-500 mt-2 max-w-2xl">
          Using historical consumption patterns, our system predicts when specific resources will reach zero. 
          Automated purchase requisitions are triggered when days remaining fall below 7.
        </p>
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-zinc-500">Loading...</div>
        </div>
      ) : predictions.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {predictions.map((p) => (
              <Card key={p.resourceId} className="group border-zinc-800 hover:border-blue-500/30">
                <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{p.resourceName}</h3>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Location: {p.location}</p>
                    </div>
                    <Badge variant={p.urgency}>{p.urgency}</Badge>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Estimated Depletion</span>
                        <span className={`text-4xl font-bold ${p.urgency === 'CRITICAL' ? 'text-red-500' : 'text-white'}`}>
                          {p.daysUntilDepletion || 'N/A'} <span className="text-sm font-medium text-zinc-500 uppercase">Days</span>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Current Stock</span>
                        <span className="text-xl font-bold text-zinc-300">{p.currentQuantity}</span>
                      </div>
                    </div>

                    {p.daysUntilDepletion !== null && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] uppercase font-bold tracking-tighter">
                          <span className="text-zinc-500">Usage Probability</span>
                          <span className="text-blue-400">92% Match</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${
                              p.urgency === 'CRITICAL' ? 'bg-red-500' : 
                              p.urgency === 'HIGH' ? 'bg-orange-500' : 
                              'bg-blue-600'
                            }`}
                            style={{ width: `${Math.max(10, 100 - ((p.daysUntilDepletion || 0) / 30) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-[10px] text-zinc-400 uppercase font-bold">Active Tracking</span>
                       </div>
                       <button className="text-xs text-blue-400 font-bold hover:underline">Requisition Now</button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border-blue-500/20">
            <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h2 className="text-2xl font-bold mb-2 text-white">Configure Automated Requisitions</h2>
                <p className="text-zinc-400 text-sm max-w-lg">
                  Allow the system to automatically generate and send purchase requests to the financial department 
                  based on these predictions.
                </p>
              </div>
              <Button variant="primary" size="lg" className="whitespace-nowrap">
                Launch Auto-Purchasing
              </Button>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="bg-[#16181d] border border-zinc-800 rounded-[16px] p-12 text-center">
          <p className="text-zinc-500">No predictions available</p>
        </div>
      )}
    </div>
  );
}
