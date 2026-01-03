"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { isAdmin, getUserRole } from "@/lib/role-utils";

interface Message {
  id: string;
  fromUser: { username: string; role: string };
  toUser: { username: string; role: string };
  subject?: string;
  content: string;
  read?: boolean;
  readAt?: string | null;
  createdAt: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [allUsers, setAllUsers] = useState<{ id: string; username: string; role: string }[]>([]);
  
  // Compose form state
  const [toUsername, setToUsername] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchMessages(parsedUser.username);
    
    // If admin, fetch all users for dropdown
    if (parsedUser.role === "universityadmin" || parsedUser.role === "campusadmin") {
      fetchAllUsers(parsedUser.username);
    } else {
      // For staff, auto-set recipient to campus admin
      setToUsername("campusadmin");
    }
  }, [router]);
  
  const fetchAllUsers = async (currentUsername: string) => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      // Filter out the current user and only show staff users for admins
      const staffUsers = (data.users || []).filter((u: any) => 
        u.username !== currentUsername && 
        u.role !== "UNIVERSITY_ADMIN" && 
        u.role !== "CAMPUS_ADMIN"
      );
      setAllUsers(staffUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchMessages = async (username: string) => {
    try {
      // Find user ID by username
      const userRes = await fetch(`/api/users?username=${username}`);
      const userData = await userRes.json();
      
      if (userData.user) {
        const res = await fetch(`/api/messages?userId=${userData.user.id}`);
        const data = await res.json();
        // Ensure all messages have required fields
        const safeMessages = (data.messages || []).map((msg: any) => ({
          ...msg,
          read: msg.read ?? false,
          fromUser: msg.fromUser || { username: 'Unknown', role: 'UNKNOWN' },
          toUser: msg.toUser || { username: 'Unknown', role: 'UNKNOWN' },
        }));
        setMessages(safeMessages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toUsername || !content || !user) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUsername: user.username,
          toUsername,
          subject: subject || undefined,
          content,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");
      
      alert("Message sent successfully!");
      setToUsername("");
      setSubject("");
      setContent("");
      setShowCompose(false);
      fetchMessages(user.username);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMessageClick = async (message: Message) => {
    if (!message) return;
    setSelectedMessage(message);
    if (message.read === false || !message.read) {
      // Mark as read
      try {
        await fetch(`/api/messages/${message.id}`, {
          method: "PATCH",
        });
        setMessages(messages.map(m => 
          m && m.id === message.id ? { ...m, read: true } : m
        ));
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0c]">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  const isUserAdmin = isAdmin();
  const userRole = getUserRole();
  const isMaintenanceStaff = userRole === 'maintenancestaff';
  
  // Check if a message is a work request (for maintenance staff)
  const isWorkRequest = (msg: Message) => {
    return msg.content.includes('URGENT ALERT') || 
           msg.content.includes('Alert Notice') ||
           msg.content.includes('Regarding alert');
  };

  // Extract original requester from message content
  const extractOriginalRequester = (content: string): string | null => {
    const match = content.match(/\[Originally reported by: (\w+)\]/);
    return match ? match[1] : null;
  };

  // Handle "On Our Way" response for maintenance staff
  const handleOnOurWay = async (message: Message, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    setRespondingTo(message.id);
    try {
      // URGENT message
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
      fetchMessages(user.username);
    } catch (error) {
      console.error("Error sending response:", error);
      alert("Failed to send response");
    } finally {
      setRespondingTo(null);
    }
  };

  // Handle "Mark Complete" for maintenance staff
  const handleMarkComplete = async (message: Message, e: React.MouseEvent) => {
    e.stopPropagation();
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
      fetchMessages(user.username);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to mark complete");
    } finally {
      setRespondingTo(null);
    }
  };

  const unreadCount = messages.filter(m => {
    if (!m || !m.toUser) return false;
    return (m.read === false || !m.read) && m.toUser.username === user.username;
  }).length;
  const conversations = getConversations(messages, user.username);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Messages</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {isUserAdmin ? "Communicate with staff members" : "Send messages to campus admin"}
          </p>
        </div>
        <Button onClick={() => setShowCompose(!showCompose)}>
          {showCompose ? "Cancel" : "New Message"}
        </Button>
      </div>

      {showCompose && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Compose Message</h3>
            <form onSubmit={handleSendMessage} className="space-y-4">
              {isUserAdmin ? (
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    To (Staff Member)
                  </label>
                  <select
                    value={toUsername}
                    onChange={(e) => setToUsername(e.target.value)}
                    required
                    className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-[8px] px-4 py-2.5 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50"
                  >
                    <option value="">Select staff member...</option>
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.username}>
                        {u.username} ({u.role.replace(/_/g, " ").toLowerCase()})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="bg-zinc-800/30 border border-zinc-700 rounded-[8px] px-4 py-2.5">
                  <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">To</p>
                  <p className="text-white font-medium">Campus Admin</p>
                </div>
              )}
              <Input
                label="Subject (Optional)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Message subject..."
              />
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Message
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={6}
                  className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-[8px] px-4 py-2.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 resize-none"
                  placeholder="Type your message..."
                />
              </div>
              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                Send Message
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {unreadCount > 0 && (
        <div className="bg-blue-600/10 border border-blue-500/20 rounded-[16px] p-4">
          <p className="text-blue-400 text-sm">
            You have {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-zinc-500 text-center py-12">Loading messages...</div>
      ) : conversations.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {conversations.map((conv, idx) => {
            const msg = conv.latestMessage;
            if (!msg || !msg.fromUser || !msg.toUser) return null;
            
            const isUnread = (msg.read === false || !msg.read) && msg.toUser.username === user.username;
            
            return (
              <Card 
                key={idx} 
                hoverable 
                onClick={() => handleMessageClick(msg)}
                className={isUnread ? "border-blue-500/30" : ""}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-white">
                        {msg.fromUser.username === user.username 
                          ? `To: ${msg.toUser.username}`
                          : `From: ${msg.fromUser.username}`}
                      </h3>
                      <p className="text-xs text-zinc-500 capitalize mt-1">
                        {msg.fromUser.role?.replace(/_/g, " ").toLowerCase() || "unknown"}
                      </p>
                    </div>
                    {isUnread && (
                      <Badge variant="INFO">New</Badge>
                    )}
                  </div>
                  {msg.subject && (
                    <p className="text-sm font-semibold text-zinc-300 mb-2">
                      {msg.subject}
                    </p>
                  )}
                  <p className="text-sm text-zinc-400 line-clamp-2">
                    {msg.content}
                  </p>
                  <p className="text-xs text-zinc-600 mt-3">
                    {new Date(msg.createdAt).toLocaleString()}
                  </p>
                  
                  {/* Maintenance Staff Action Buttons */}
                  {isMaintenanceStaff && msg.toUser.username === user.username && isWorkRequest(msg) && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-800/50">
                      <Button
                        size="sm"
                        onClick={(e) => handleOnOurWay(msg, e)}
                        disabled={respondingTo === msg.id}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-2"
                      >
                        {respondingTo === msg.id ? 'Sending...' : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            On Our Way
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleMarkComplete(msg, e)}
                        disabled={respondingTo === msg.id}
                        className="flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Complete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-zinc-500 text-center py-12">No messages yet</div>
      )}

      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-2xl shadow-2xl">
            <div className="p-6 border-b border-zinc-800/50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {selectedMessage.subject || "Message"}
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                  {selectedMessage.fromUser.username === user.username 
                    ? `To: ${selectedMessage.toUser.username}`
                    : `From: ${selectedMessage.fromUser.username}`}
                </p>
              </div>
              <button 
                onClick={() => setSelectedMessage(null)}
                className="text-zinc-500 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CardContent className="p-6">
              <p className="text-white whitespace-pre-wrap">{selectedMessage.content}</p>
              <p className="text-xs text-zinc-600 mt-4">
                {new Date(selectedMessage.createdAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function getConversations(messages: Message[], currentUsername: string) {
  const conversationMap = new Map<string, { latestMessage: Message }>();
  
  messages.forEach(message => {
    if (!message || !message.fromUser || !message.toUser) return;
    
    const otherUser = message.fromUser.username === currentUsername 
      ? message.toUser.username 
      : message.fromUser.username;
    
    const key = otherUser;
    const existing = conversationMap.get(key);
    
    if (!existing || new Date(message.createdAt) > new Date(existing.latestMessage.createdAt)) {
      conversationMap.set(key, { latestMessage: message });
    }
  });
  
  return Array.from(conversationMap.values())
    .sort((a, b) => new Date(b.latestMessage.createdAt).getTime() - new Date(a.latestMessage.createdAt).getTime());
}

