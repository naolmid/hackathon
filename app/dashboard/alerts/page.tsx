"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { isAdmin } from "@/lib/role-utils";
import { getUrgencyGroup, getUrgencyLabel } from "@/lib/alert-categorizer";

type Urgency = 'URGENT' | 'SERIOUS' | 'DAY_TO_DAY' | 'READ';

interface Alert {
  id: string;
  type: string;
  location: string;
  message: string;
  urgency: string;
  status: string;
  submittedAt: string;
  submittedBy?: string;
  isRead?: boolean;
}

interface User {
  id: string;
  username: string;
  role: string;
  name?: string;
}

interface MessageRecipient {
  id: string;
  userId: string;
  username: string;
  message: string;
  expanded: boolean;
  category: 'URGENT_ALERT' | 'NON_URGENT';
}

export default function AlertsPage() {
  const [filter, setFilter] = useState<Urgency | 'ALL'>('ALL');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  
  // Respond modal state
  const [respondingToAlert, setRespondingToAlert] = useState<Alert | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [recipients, setRecipients] = useState<MessageRecipient[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setIsUserAdmin(isAdmin());
    fetchAlerts();
    fetchUsers();
  }, []);

  const fetchAlerts = async () => {
    try {
      const endpoint = isAdmin() ? "/api/admin/alerts-grouped" : "/api/alerts";
      const res = await fetch(endpoint);
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const openRespondModal = (alert: Alert) => {
    setRespondingToAlert(alert);
    
    // Find maintenance user as default
    const maintenanceUser = users.find(u => 
      u.role === 'MAINTENANCE' || 
      u.username.toLowerCase().includes('maintenance') ||
      u.role === 'FACILITIES'
    ) || users.find(u => u.role !== 'CAMPUS_ADMIN' && u.role !== 'UNIVERSITY_ADMIN');
    
    // Default category based on alert urgency
    const defaultCategory = getUrgencyGroup(alert.urgency) === 'urgent' ? 'URGENT_ALERT' : 'NON_URGENT';
    
    // Initialize with maintenance worker as first recipient
    // Include original submitter info so maintenance can notify them
    const originalSubmitterLine = alert.submittedBy 
      ? `\n\n[Originally reported by: ${alert.submittedBy}]`
      : '';
    
    setRecipients([{
      id: crypto.randomUUID(),
      userId: maintenanceUser?.id || '',
      username: maintenanceUser?.username || '',
      message: `Regarding alert: "${alert.message}" at ${alert.location}\n\nPlease investigate and take necessary action.${originalSubmitterLine}`,
      expanded: true,
      category: defaultCategory as 'URGENT_ALERT' | 'NON_URGENT'
    }]);
  };

  const closeRespondModal = () => {
    setRespondingToAlert(null);
    setRecipients([]);
  };

  const addRecipient = () => {
    const alertCategory = respondingToAlert 
      ? (getUrgencyGroup(respondingToAlert.urgency) === 'urgent' ? 'URGENT_ALERT' : 'NON_URGENT')
      : 'NON_URGENT';
    
    setRecipients([...recipients, {
      id: crypto.randomUUID(),
      userId: '',
      username: '',
      message: respondingToAlert 
        ? `Regarding alert: "${respondingToAlert.message}"\n\n` 
        : '',
      expanded: true,
      category: alertCategory as 'URGENT_ALERT' | 'NON_URGENT'
    }]);
  };

  const removeRecipient = (id: string) => {
    setRecipients(recipients.filter(r => r.id !== id));
  };

  const updateRecipient = (id: string, field: keyof MessageRecipient, value: string | boolean) => {
    setRecipients(recipients.map(r => {
      if (r.id === id) {
        if (field === 'userId') {
          const selectedUser = users.find(u => u.id === value);
          return { ...r, userId: value as string, username: selectedUser?.username || '' };
        }
        return { ...r, [field]: value };
      }
      return r;
    }));
  };

  const toggleRecipientExpanded = (id: string) => {
    setRecipients(recipients.map(r => 
      r.id === id ? { ...r, expanded: !r.expanded } : r
    ));
  };

  const sendAllMessages = async () => {
    if (recipients.length === 0 || !respondingToAlert) return;
    
    setSending(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      for (const recipient of recipients) {
        if (!recipient.userId || !recipient.message.trim()) continue;
        
        const categoryPrefix = recipient.category === 'URGENT_ALERT' ? '🚨 URGENT ALERT: ' : '📋 Alert Notice: ';
        
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromUsername: user.username,
            toUsername: recipient.username,
            content: categoryPrefix + recipient.message,
          }),
        });
      }
      
      // Mark alert as acknowledged
      await fetch(`/api/admin/alerts/${respondingToAlert.id}/acknowledge`, {
        method: "POST",
      });
      
      alert("All messages sent successfully!");
      closeRespondModal();
      fetchAlerts();
    } catch (error) {
      console.error("Error sending messages:", error);
      alert("Failed to send some messages");
    } finally {
      setSending(false);
    }
  };

  // Mark alert as read
  const handleMarkAsRead = async (alertId: string) => {
    try {
      await fetch(`/api/admin/alerts/${alertId}/acknowledge`, {
        method: "POST",
      });
      // Update local state
      setAlerts(alerts.map(a => 
        a.id === alertId ? { ...a, isRead: true, status: 'ACKNOWLEDGED' } : a
      ));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const filteredAlerts = filter === 'ALL' 
    ? alerts.filter(a => !a.isRead && a.status !== 'ACKNOWLEDGED')
    : filter === 'READ'
    ? alerts.filter(a => a.isRead || a.status === 'ACKNOWLEDGED')
    : alerts.filter(a => {
        if (a.isRead || a.status === 'ACKNOWLEDGED') return false;
        const urgencyUpper = a.urgency.toUpperCase();
        if (filter === 'URGENT') {
          return urgencyUpper === 'URGENT' || urgencyUpper === 'CRITICAL';
        }
        if (filter === 'SERIOUS') {
          return urgencyUpper === 'SERIOUS' || urgencyUpper === 'HIGH' || urgencyUpper === 'MEDIUM';
        }
        if (filter === 'DAY_TO_DAY') {
          return urgencyUpper === 'DAY_TO_DAY' || urgencyUpper === 'DAY-TO-DAY' || urgencyUpper === 'LOW';
        }
        return false;
      });

  // Group alerts by urgency for admin view (respecting filter)
  const getFilteredGroupedAlerts = () => {
    if (!isUserAdmin) return null;
    
    // Filter out read alerts for non-READ views
    const unreadAlerts = alerts.filter(a => !a.isRead && a.status !== 'ACKNOWLEDGED');
    const readAlerts = alerts.filter(a => a.isRead || a.status === 'ACKNOWLEDGED');
    
    const urgentAlerts = unreadAlerts.filter(a => getUrgencyGroup(a.urgency) === 'urgent');
    const seriousAlerts = unreadAlerts.filter(a => getUrgencyGroup(a.urgency) === 'serious');
    const dayToDayAlerts = unreadAlerts.filter(a => getUrgencyGroup(a.urgency) === 'day-to-day');
    
    if (filter === 'URGENT') {
      return { urgent: urgentAlerts, serious: [], 'day-to-day': [], read: [] };
    }
    if (filter === 'SERIOUS') {
      return { urgent: [], serious: seriousAlerts, 'day-to-day': [], read: [] };
    }
    if (filter === 'DAY_TO_DAY') {
      return { urgent: [], serious: [], 'day-to-day': dayToDayAlerts, read: [] };
    }
    if (filter === 'READ') {
      return { urgent: [], serious: [], 'day-to-day': [], read: readAlerts };
    }
    
    // ALL - show all unread groups
    return {
      urgent: urgentAlerts,
      serious: seriousAlerts,
      'day-to-day': dayToDayAlerts,
      read: [],
    };
  };
  
  const groupedAlerts = getFilteredGroupedAlerts();

  // Staff users for dropdown (exclude admins)
  const staffUsers = users.filter(u => 
    u.role !== 'CAMPUS_ADMIN' && u.role !== 'UNIVERSITY_ADMIN'
  );

  const renderAlertCard = (alert: Alert, colorClass: string, bgClass: string, borderClass: string) => (
    <Card key={alert.id} className={`relative overflow-hidden group ${borderClass}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorClass}`}></div>
      <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex gap-6 items-start">
          <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0 ${bgClass}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-bold text-lg text-white">{alert.message}</h3>
              <Badge variant={alert.urgency as any}>{getUrgencyLabel(alert.urgency)}</Badge>
            </div>
            <p className="text-sm text-zinc-500 font-medium">{alert.location}</p>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">
                {new Date(alert.submittedAt).toLocaleDateString()}
              </span>
              <span className={`text-[10px] uppercase font-bold tracking-widest ${
                alert.status === 'ACKNOWLEDGED' ? 'text-emerald-500' : 'text-zinc-500'
              }`}>
                {alert.status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleMarkAsRead(alert.id)}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Mark Read
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => openRespondModal(alert)}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Respond
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">System Alerts</h1>
          <p className="text-zinc-500 text-sm mt-1">Real-time notification system for critical resource events.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pb-4">
        {(['ALL', 'URGENT', 'SERIOUS', 'DAY_TO_DAY', 'READ'] as const).map((lvl) => (
          <button
            key={lvl}
            onClick={() => setFilter(lvl)}
            className={`
              px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-[8px] border transition-all
              ${filter === lvl 
                ? lvl === 'URGENT' 
                  ? 'bg-red-600/10 border-red-500/50 text-red-400'
                  : lvl === 'SERIOUS'
                  ? 'bg-orange-600/10 border-orange-500/50 text-orange-400'
                  : lvl === 'DAY_TO_DAY'
                  ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                  : lvl === 'READ'
                  ? 'bg-emerald-600/10 border-emerald-500/50 text-emerald-400'
                  : 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'}
            `}
          >
            {lvl === 'DAY_TO_DAY' ? 'DAY-TO-DAY' : lvl}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-zinc-500">Loading...</div>
        </div>
      ) : isUserAdmin && groupedAlerts ? (
        // Admin view: Grouped by urgency
        <div className="space-y-6">
          {groupedAlerts.urgent.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-red-500 mb-3 uppercase tracking-wider">Urgent</h3>
              <div className="space-y-2">
                {groupedAlerts.urgent.map((alert) => 
                  renderAlertCard(alert, 'bg-red-500', 'bg-red-500/10 text-red-500', 'border-red-500/30')
                )}
              </div>
            </div>
          )}

          {groupedAlerts.serious.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-orange-500 mb-3 uppercase tracking-wider">Serious</h3>
              <div className="space-y-2">
                {groupedAlerts.serious.map((alert) => 
                  renderAlertCard(alert, 'bg-orange-500', 'bg-orange-500/10 text-orange-500', 'border-orange-500/30')
                )}
              </div>
            </div>
          )}

          {groupedAlerts['day-to-day'].length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-blue-500 mb-3 uppercase tracking-wider">Day-to-Day</h3>
              <div className="space-y-2">
                {groupedAlerts['day-to-day'].map((alert) => 
                  renderAlertCard(alert, 'bg-blue-500', 'bg-blue-500/10 text-blue-500', 'border-blue-500/30')
                )}
              </div>
            </div>
          )}

          {groupedAlerts.read && groupedAlerts.read.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-emerald-500 mb-3 uppercase tracking-wider">Read</h3>
              <div className="space-y-2">
                {groupedAlerts.read.map((alert) => 
                  renderAlertCard(alert, 'bg-emerald-500', 'bg-emerald-500/10 text-emerald-500', 'border-emerald-500/30')
                )}
              </div>
            </div>
          )}

          {groupedAlerts.urgent.length === 0 && groupedAlerts.serious.length === 0 && groupedAlerts['day-to-day'].length === 0 && (!groupedAlerts.read || groupedAlerts.read.length === 0) && (
            <div className="bg-[#16181d] border border-zinc-800 rounded-[16px] p-12 text-center">
              <p className="text-zinc-500">No alerts found</p>
            </div>
          )}
        </div>
      ) : filteredAlerts.length > 0 ? (
        // Staff view: Filtered list
        <div className="grid grid-cols-1 gap-4">
          {filteredAlerts.map((alert) => {
            const urgencyGroup = getUrgencyGroup(alert.urgency);
            return renderAlertCard(
              alert,
              urgencyGroup === 'urgent' ? 'bg-red-500' : urgencyGroup === 'serious' ? 'bg-orange-500' : 'bg-blue-500',
              urgencyGroup === 'urgent' ? 'bg-red-500/10 text-red-500' : urgencyGroup === 'serious' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500',
              urgencyGroup === 'urgent' ? 'border-red-500/30' : urgencyGroup === 'serious' ? 'border-orange-500/30' : 'border-blue-500/30'
            );
          })}
        </div>
      ) : (
        <div className="bg-[#16181d] border border-zinc-800 rounded-[16px] p-12 text-center">
          <p className="text-zinc-500">No alerts found</p>
        </div>
      )}

      {/* Respond Modal */}
      {respondingToAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#16181d] border border-zinc-800 rounded-[16px] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Respond to Alert</h2>
                <p className="text-sm text-zinc-500 mt-1">{respondingToAlert.message}</p>
              </div>
              <button
                onClick={closeRespondModal}
                className="w-10 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Alert Info */}
            <div className="px-6 py-4 bg-zinc-900/50 border-b border-zinc-800">
              <div className="flex items-center gap-4">
                <Badge variant={respondingToAlert.urgency as any}>
                  {getUrgencyLabel(respondingToAlert.urgency)}
                </Badge>
                <span className="text-sm text-zinc-400">{respondingToAlert.location}</span>
                <span className="text-xs text-zinc-600">
                  {new Date(respondingToAlert.submittedAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Recipients List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                  Send Messages ({recipients.length})
                </h3>
                <span className="text-xs text-zinc-500">
                  Default: Maintenance Workers
                </span>
              </div>

              {recipients.map((recipient, index) => (
                <div 
                  key={recipient.id}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-[12px] overflow-hidden"
                >
                  {/* Collapsible Header */}
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50 transition-colors"
                    onClick={() => toggleRecipientExpanded(recipient.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        recipient.category === 'URGENT_ALERT' 
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {recipient.username || 'Select recipient...'}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {recipient.category === 'URGENT_ALERT' ? '🚨 Urgent Alert' : '📋 Non-Urgent Notice'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {recipients.length > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeRecipient(recipient.id); }}
                          className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                      <svg 
                        className={`w-5 h-5 text-zinc-500 transition-transform ${recipient.expanded ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Collapsible Content */}
                  {recipient.expanded && (
                    <div className="p-4 pt-0 space-y-4 border-t border-zinc-800">
                      {/* Recipient Selector */}
                      <div>
                        <label className="block text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">
                          Recipient
                        </label>
                        <select
                          value={recipient.userId}
                          onChange={(e) => updateRecipient(recipient.id, 'userId', e.target.value)}
                          className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-[8px] px-4 py-2.5 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50"
                        >
                          <option value="">Select staff member...</option>
                          {staffUsers.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.username} ({user.role.replace(/_/g, ' ')})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Category Toggle */}
                      <div>
                        <label className="block text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">
                          Alert Category
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateRecipient(recipient.id, 'category', 'URGENT_ALERT')}
                            className={`flex-1 px-4 py-2.5 rounded-[8px] text-sm font-bold uppercase tracking-wider border transition-all ${
                              recipient.category === 'URGENT_ALERT'
                                ? 'bg-red-500/20 border-red-500/50 text-red-400'
                                : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-red-500/30'
                            }`}
                          >
                            🚨 Urgent Alert
                          </button>
                          <button
                            onClick={() => updateRecipient(recipient.id, 'category', 'NON_URGENT')}
                            className={`flex-1 px-4 py-2.5 rounded-[8px] text-sm font-bold uppercase tracking-wider border transition-all ${
                              recipient.category === 'NON_URGENT'
                                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                                : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-blue-500/30'
                            }`}
                          >
                            📋 Non-Urgent
                          </button>
                        </div>
                      </div>

                      {/* Message */}
                      <div>
                        <label className="block text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">
                          Message
                        </label>
                        <textarea
                          value={recipient.message}
                          onChange={(e) => updateRecipient(recipient.id, 'message', e.target.value)}
                          rows={4}
                          className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-[8px] px-4 py-3 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 resize-none"
                          placeholder="Enter your message..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Recipient Button */}
              <button
                onClick={addRecipient}
                className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-[12px] text-zinc-500 hover:text-blue-400 hover:border-blue-500/30 transition-all flex items-center justify-center gap-2 text-sm font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Another Recipient
              </button>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/30">
              <div className="text-sm text-zinc-500">
                {recipients.filter(r => r.userId && r.message.trim()).length} message(s) ready to send
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={closeRespondModal}>
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={sendAllMessages}
                  disabled={sending || recipients.filter(r => r.userId && r.message.trim()).length === 0}
                >
                  {sending ? 'Sending...' : `Send All Messages`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
