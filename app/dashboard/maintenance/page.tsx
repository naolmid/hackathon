"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface Message {
  id: string;
  fromUser: { username: string; role: string };
  toUser: { username: string; role: string };
  content: string;
  createdAt: string;
  read: boolean;
}

export default function MaintenanceDashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [user, setUser] = useState<{ username: string } | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      fetchMessages(parsed.username);
    }
  }, []);

  const fetchMessages = async (username: string) => {
    try {
      const userRes = await fetch(`/api/users?username=${username}`);
      const userData = await userRes.json();
      
      if (userData.user) {
        const res = await fetch(`/api/messages?userId=${userData.user.id}`);
        const data = await res.json();
        
        // Filter to only work requests (incoming messages)
        const workRequests = (data.messages || [])
          .filter((msg: Message) => msg.toUser?.username === username)
          .map((msg: any) => ({
            ...msg,
            read: msg.read ?? false,
            fromUser: msg.fromUser || { username: 'Unknown', role: 'UNKNOWN' },
            toUser: msg.toUser || { username: 'Unknown', role: 'UNKNOWN' },
          }));
        
        setMessages(workRequests);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Extract original requester from message content (format: [Originally reported by: username])
  const extractOriginalRequester = (content: string): string | null => {
    const match = content.match(/\[Originally reported by: (\w+)\]/);
    return match ? match[1] : null;
  };

  const handleOnOurWay = async (message: Message) => {
    if (!user) return;
    
    setRespondingTo(message.id);
    try {
      // URGENT message to admin
      const onOurWayMessage = `🚨 URGENT: 🔧 [MAINTENANCE] On our way! We are responding now.`;
      
      // Send URGENT to the admin who sent the request
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUsername: user.username,
          toUsername: message.fromUser.username,
          content: onOurWayMessage,
        }),
      });
      
      // Also send URGENT to campus admin if sender wasn't already campus admin
      if (message.fromUser.username !== 'campusadmin') {
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromUsername: user.username,
            toUsername: 'campusadmin',
            content: `🚨 URGENT: 🔧 [MAINTENANCE] On our way to handle request!`,
          }),
        });
      }
      
      // ALSO send URGENT to the original requester (the staff who submitted the alert)
      const originalRequester = extractOriginalRequester(message.content);
      if (originalRequester && originalRequester !== message.fromUser.username && originalRequester !== 'campusadmin') {
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromUsername: user.username,
            toUsername: originalRequester,
            content: `🚨 URGENT: 🔧 [MAINTENANCE] On our way! Your reported issue is being addressed NOW.`,
          }),
        });
      }
      
      // Mark original message as read
      await fetch(`/api/messages/${message.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
      
      alert("✅ URGENT response sent to admin and requester!");
      if (user) fetchMessages(user.username);
    } catch (error) {
      console.error("Error sending response:", error);
      alert("Failed to send response");
    } finally {
      setRespondingTo(null);
    }
  };

  const handleMarkComplete = async (message: Message) => {
    if (!user) return;
    
    setRespondingTo(message.id);
    try {
      const completeMessage = `✅ [MAINTENANCE COMPLETE] Task finished!`;
      
      // Send to the admin who sent the request
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUsername: user.username,
          toUsername: message.fromUser.username,
          content: completeMessage,
        }),
      });
      
      // Also notify campus admin
      if (message.fromUser.username !== 'campusadmin') {
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromUsername: user.username,
            toUsername: 'campusadmin',
            content: `✅ [MAINTENANCE COMPLETE] Task from ${message.fromUser.username} finished.`,
          }),
        });
      }
      
      // ALSO notify the original requester
      const originalRequester = extractOriginalRequester(message.content);
      if (originalRequester && originalRequester !== message.fromUser.username && originalRequester !== 'campusadmin') {
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromUsername: user.username,
            toUsername: originalRequester,
            content: `✅ [MAINTENANCE COMPLETE] Your reported issue has been fixed!`,
          }),
        });
      }
      
      alert("✅ Task marked as complete!");
      if (user) fetchMessages(user.username);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to mark complete");
    } finally {
      setRespondingTo(null);
    }
  };

  const pendingCount = messages.filter(m => !m.read).length;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Work Requests</h1>
        <p className="text-zinc-500 text-sm mt-1">Incoming maintenance tasks from admins</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[12px] bg-red-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{pendingCount}</p>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[12px] bg-blue-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{messages.length}</p>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Work Requests List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-zinc-500">Loading...</div>
        </div>
      ) : messages.length > 0 ? (
        <div className="space-y-4">
          {messages.map((request) => (
            <Card 
              key={request.id} 
              className={`relative overflow-hidden ${!request.read ? 'border-red-500/30' : ''}`}
            >
              {!request.read && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
              )}
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-white">
                        {request.fromUser.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">{request.fromUser.username}</p>
                        <p className="text-xs text-zinc-500">
                          {new Date(request.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!request.read && (
                        <Badge variant="URGENT">New</Badge>
                      )}
                      {request.content.includes('URGENT ALERT') && (
                        <Badge variant="CRITICAL">Urgent</Badge>
                      )}
                    </div>
                    
                    <div className="bg-zinc-900/50 rounded-[8px] p-4 mt-3">
                      <p className="text-zinc-300 text-sm whitespace-pre-wrap">
                        {request.content}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:min-w-[180px]">
                    <Button
                      variant="primary"
                      onClick={() => handleOnOurWay(request)}
                      disabled={respondingTo === request.id}
                      className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500"
                    >
                      {respondingTo === request.id ? (
                        'Sending...'
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          On Our Way
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleMarkComplete(request)}
                      disabled={respondingTo === request.id}
                      className="flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Complete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-1">No Work Requests</h3>
            <p className="text-zinc-500 text-sm">You&apos;re all caught up! No pending tasks.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
