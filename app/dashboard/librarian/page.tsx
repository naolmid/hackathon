"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LibrarianDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'add-item' | 'return-book' | 'send-report'>('add-item');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Book lending form state
  const [studentId, setStudentId] = useState("");
  const [bookId, setBookId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  // Book return form state
  const [returnBookId, setReturnBookId] = useState("");
  const [returnBorrowerId, setReturnBorrowerId] = useState("");

  // Book issue form state
  const [issueBookId, setIssueBookId] = useState("");
  const [issueType, setIssueType] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [issueLocationId, setIssueLocationId] = useState("");
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(userData));
    fetchLocations();
  }, [router]);

  const fetchLocations = async () => {
    try {
      const res = await fetch("/api/hierarchy/locations?type=LIBRARY");
      const data = await res.json();
      if (data.locations && data.locations.length > 0) {
        setLocations(data.locations);
        setIssueLocationId(data.locations[0].id);
      } else {
        // If no libraries, get all locations
        const allRes = await fetch("/api/hierarchy/locations");
        const allData = await allRes.json();
        setLocations(allData.locations || []);
        if (allData.locations && allData.locations.length > 0) {
          setIssueLocationId(allData.locations[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0c]">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  const handleBookLendingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !bookId || !dueDate) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/staff/book-lending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          bookId,
          dueDate,
          notes,
          username: user.username,
        }),
      });
      if (!response.ok) throw new Error("Failed to submit book lending");
      alert("Book lending recorded successfully!");
      setStudentId("");
      setBookId("");
      setDueDate("");
      setNotes("");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to submit book lending");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnBookId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/staff/book-return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: returnBookId,
          borrowerId: returnBorrowerId || undefined,
          username: user.username,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to return book");
      }
      
      const result = await response.json();
      alert(result.message || "Book returned successfully!");
      setReturnBookId("");
      setReturnBorrowerId("");
    } catch (error: any) {
      console.error("Error:", error);
      alert(`Failed to return book: ${error.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueBookId || !issueType || !issueDescription || !issueLocationId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/staff/alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertType: "FACILITY_ISSUE",
          message: `Book Issue: ${issueType} - ${issueDescription}`,
          locationId: issueLocationId,
          urgency: "SERIOUS",
          username: user.username,
        }),
      });
      if (!response.ok) throw new Error("Failed to submit book issue");
      alert("Book issue reported successfully!");
      setIssueBookId("");
      setIssueType("");
      setIssueDescription("");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to submit book issue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Librarian Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">Add items, change locations, and send reports.</p>
      </div>

      <div className="flex gap-2 border-b border-zinc-800/50">
        <button
          onClick={() => setActiveTab('add-item')}
          className={`px-4 py-2 text-sm font-medium rounded-t-[8px] transition-colors ${
            activeTab === 'add-item'
              ? 'bg-blue-600/10 text-blue-400 border-b-2 border-blue-500'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Add Item
        </button>
        <button
          onClick={() => setActiveTab('return-book')}
          className={`px-4 py-2 text-sm font-medium rounded-t-[8px] transition-colors ${
            activeTab === 'return-book'
              ? 'bg-blue-600/10 text-blue-400 border-b-2 border-blue-500'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Return Book
        </button>
        <button
          onClick={() => setActiveTab('send-report')}
          className={`px-4 py-2 text-sm font-medium rounded-t-[8px] transition-colors ${
            activeTab === 'send-report'
              ? 'bg-blue-600/10 text-blue-400 border-b-2 border-blue-500'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Send Report
        </button>
      </div>

      <div className="max-w-2xl">
        {activeTab === 'add-item' && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Track Book Lending</h3>
              <form onSubmit={handleBookLendingSubmit} className="space-y-4">
                <Input
                  label="Student ID"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g., ugr/5680/17"
                  required
                />
                <Input
                  label="Book ID/Label"
                  value={bookId}
                  onChange={(e) => setBookId(e.target.value)}
                  placeholder="e.g., hashtag44021"
                  required
                />
                <Input
                  label="Due Date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
                <Input
                  label="Notes (Optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes..."
                />
                <Button type="submit" className="w-full" isLoading={isSubmitting}>
                  Record Lending
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === 'return-book' && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Return Book</h3>
              <form onSubmit={handleBookReturnSubmit} className="space-y-4">
                <Input
                  label="Book ID/Label"
                  value={returnBookId}
                  onChange={(e) => setReturnBookId(e.target.value)}
                  placeholder="e.g., hashtag44021 or book name"
                  required
                />
                <Input
                  label="Borrower ID (Optional)"
                  value={returnBorrowerId}
                  onChange={(e) => setReturnBorrowerId(e.target.value)}
                  placeholder="e.g., ugr/5680/17"
                />
                <Button type="submit" className="w-full" isLoading={isSubmitting}>
                  Return Book
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
        {activeTab === 'send-report' && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Send Report</h3>
              <form onSubmit={handleBookIssueSubmit} className="space-y-4">
                <Input
                  label="Book ID"
                  value={issueBookId}
                  onChange={(e) => setIssueBookId(e.target.value)}
                  placeholder="e.g., hashtag44021"
                  required
                />
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Location
                  </label>
                  <select
                    value={issueLocationId}
                    onChange={(e) => setIssueLocationId(e.target.value)}
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
                    Issue Type
                  </label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    required
                    className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-[8px] px-4 py-2.5 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50"
                  >
                    <option value="">Select type...</option>
                    <option value="damaged">Damaged</option>
                    <option value="lost">Lost</option>
                    <option value="overdue">Overdue</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    required
                    rows={4}
                    className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-[8px] px-4 py-2.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 resize-none"
                    placeholder="Describe the issue..."
                  />
                </div>
                <Button type="submit" className="w-full" isLoading={isSubmitting}>
                  Report Issue
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


