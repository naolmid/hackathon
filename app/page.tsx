"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import GearIcon from "@/components/GearIcon";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0a0c] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 blur-[150px] rounded-full"></div>
      <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full"></div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12 lg:px-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <GearIcon size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">ResourceMaster</span>
        </div>
        <Button 
          onClick={() => router.push("/login")}
          variant="outline"
          size="sm"
        >
          Sign In
        </Button>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-32 md:pt-32 md:pb-40">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-blue-400 text-sm font-medium">Ambo University Management System</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            University Resource
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Planning Engine
            </span>
          </h1>

          {/* Description */}
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            A unified platform for tracking resources, managing alerts, and coordinating 
            campus operations across Hachalu Hundesa Campus. From library books to lab equipment, 
            everything in one place.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              onClick={() => router.push("/login")}
              size="lg"
              className="px-8 py-4 text-lg"
            >
              Get Started →
            </Button>
            <Button 
              onClick={() => router.push("/login")}
              variant="ghost"
              size="lg"
              className="text-zinc-400 hover:text-white"
            >
              View Demo
            </Button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl w-full">
          <FeatureCard 
            icon="📦"
            title="Resource Tracking"
            description="Track 474+ resources across 34 locations including labs, libraries, and cafeterias."
          />
          <FeatureCard 
            icon="🚨"
            title="Real-time Alerts"
            description="Instant notifications for urgent issues, from equipment breakdowns to low stock warnings."
          />
          <FeatureCard 
            icon="📱"
            title="Telegram Integration"
            description="Get alerts directly on Telegram. Never miss critical updates even when you're away."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 border-t border-zinc-800/50">
        <p className="text-zinc-600 text-sm">
          Powered by <span className="text-zinc-400 font-medium">Group 8</span> • Ambo University
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      <p className="text-zinc-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
