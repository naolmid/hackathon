"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type NotificationPreference = 'URGENT_ONLY' | 'URGENT_AND_SERIOUS' | 'OFF';

export default function SettingsPage() {
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [preference, setPreference] = useState<NotificationPreference>('URGENT_ONLY');
  const [connectionLink, setConnectionLink] = useState<string | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [linkExpiry, setLinkExpiry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [savingPreference, setSavingPreference] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      fetchTelegramStatus(parsed.username);
    }
  }, []);

  const fetchTelegramStatus = async (username: string) => {
    try {
      const res = await fetch(`/api/telegram/preferences?username=${username}`);
      const data = await res.json();
      setTelegramConnected(data.connected || false);
      setPreference(data.preference || 'URGENT_ONLY');
    } catch (error) {
      console.error("Error fetching status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    if (!user) return;
    
    setGenerating(true);
    try {
      const res = await fetch("/api/telegram/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setConnectionLink(data.link);
        setDeepLink(data.deepLink);
        setLinkExpiry(data.expiresAt);
      } else {
        alert("Failed to generate link: " + data.error);
      }
    } catch (error) {
      console.error("Error generating link:", error);
      alert("Failed to generate link");
    } finally {
      setGenerating(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;
    
    if (!confirm("Are you sure you want to disconnect Telegram? You will no longer receive notifications.")) {
      return;
    }
    
    setDisconnecting(true);
    try {
      const res = await fetch("/api/telegram/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setTelegramConnected(false);
        setConnectionLink(null);
        alert("Telegram disconnected successfully!");
      } else {
        alert("Failed to disconnect: " + data.error);
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
      alert("Failed to disconnect");
    } finally {
      setDisconnecting(false);
    }
  };

  const handlePreferenceChange = async (newPreference: NotificationPreference) => {
    if (!user) return;
    
    setSavingPreference(true);
    try {
      const res = await fetch("/api/telegram/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: user.username,
          preference: newPreference,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setPreference(newPreference);
      } else {
        alert("Failed to save preference: " + data.error);
      }
    } catch (error) {
      console.error("Error saving preference:", error);
      alert("Failed to save preference");
    } finally {
      setSavingPreference(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your notification preferences</p>
      </div>

      {/* Telegram Connection Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-blue-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
              </div>
              Telegram Notifications
            </CardTitle>
            {telegramConnected ? (
              <Badge variant="SUCCESS">Connected</Badge>
            ) : (
              <Badge variant="LOW">Not Connected</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {telegramConnected ? (
            <>
              <p className="text-zinc-400 text-sm">
                Your Telegram account is connected. You will receive notifications based on your preferences below.
              </p>
              
              {/* Notification Preferences */}
              <div className="space-y-3">
                <label className="block text-xs text-zinc-500 font-bold uppercase tracking-wider">
                  Notification Preference
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handlePreferenceChange('URGENT_ONLY')}
                    disabled={savingPreference}
                    className={`p-4 rounded-[12px] border text-left transition-all ${
                      preference === 'URGENT_ONLY'
                        ? 'bg-red-500/10 border-red-500/50 text-red-400'
                        : 'bg-zinc-800/30 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                    }`}
                  >
                    <div className="font-bold mb-1">🚨 Urgent Only</div>
                    <p className="text-xs opacity-70">Only receive critical alerts</p>
                  </button>
                  
                  <button
                    onClick={() => handlePreferenceChange('URGENT_AND_SERIOUS')}
                    disabled={savingPreference}
                    className={`p-4 rounded-[12px] border text-left transition-all ${
                      preference === 'URGENT_AND_SERIOUS'
                        ? 'bg-orange-500/10 border-orange-500/50 text-orange-400'
                        : 'bg-zinc-800/30 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                    }`}
                  >
                    <div className="font-bold mb-1">⚠️ Urgent + Serious</div>
                    <p className="text-xs opacity-70">Receive urgent and serious alerts</p>
                  </button>
                  
                  <button
                    onClick={() => handlePreferenceChange('OFF')}
                    disabled={savingPreference}
                    className={`p-4 rounded-[12px] border text-left transition-all ${
                      preference === 'OFF'
                        ? 'bg-zinc-500/10 border-zinc-500/50 text-zinc-300'
                        : 'bg-zinc-800/30 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                    }`}
                  >
                    <div className="font-bold mb-1">🔇 Off</div>
                    <p className="text-xs opacity-70">Pause all notifications</p>
                  </button>
                </div>
                {savingPreference && (
                  <p className="text-xs text-blue-400">Saving...</p>
                )}
              </div>

              {/* Disconnect Button */}
              <div className="pt-4 border-t border-zinc-800">
                <Button
                  variant="danger"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                >
                  {disconnecting ? "Disconnecting..." : "Disconnect Telegram"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-zinc-400 text-sm">
                Connect your Telegram account to receive instant notifications for alerts and messages.
              </p>

              {connectionLink ? (
                <div className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-[12px] p-4">
                    <p className="text-sm text-blue-400 mb-3">
                      Click the button below to open Telegram and connect your account:
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Deep link for mobile/desktop app */}
                      <a
                        href={deepLink || connectionLink}
                        className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-[8px] font-medium transition-colors"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                        </svg>
                        Open in Telegram App
                      </a>
                      
                      {/* Web link fallback */}
                      <a
                        href={connectionLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-3 rounded-[8px] font-medium transition-colors"
                      >
                        Open in Browser
                      </a>
                    </div>
                    
                    {linkExpiry && (
                      <p className="text-xs text-zinc-500 mt-3">
                        This link expires in 10 minutes
                      </p>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={handleGenerateLink}
                    disabled={generating}
                  >
                    Generate New Link
                  </Button>
                </div>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleGenerateLink}
                  disabled={generating}
                  className="flex items-center gap-2"
                >
                  {generating ? (
                    "Generating..."
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                      </svg>
                      Connect Telegram
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Username</p>
              <p className="text-white font-medium">{user?.username}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Role</p>
              <p className="text-white font-medium capitalize">{user?.role.replace(/_/g, ' ')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

