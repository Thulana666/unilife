"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isBefore, startOfDay, differenceInHours } from "date-fns";
import { Calendar as CalendarIcon, CheckCircle2, Circle, Clock, Edit2, LayoutGrid, List, Plus, Trash2, X, ChevronLeft, ChevronRight, BookOpen, Loader2, AlertCircle, CheckCircle, ListTodo, BarChart3, Filter, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";


function getAssignmentUserStatus(assignment, userId) {
  let status = assignment.status || "pending";
  if (assignment.studentCompletions && Array.isArray(assignment.studentCompletions) && userId) {
    const userCompletion = assignment.studentCompletions.find(c => String(c.userId) === String(userId));
    if (userCompletion) status = userCompletion.status;
  }
  if (status !== "submitted") {
    const dueDate = parseISO(assignment.dueDate);
    const nowDate = new Date();
    if (isToday(dueDate)) {
      return dueDate.getTime() > nowDate.getTime() ? "dueToday" : "overdue";
    }
    if (dueDate.getTime() < nowDate.getTime()) {
      return "overdue";
    }
  }
  return status;
}

export default function AssignmentsPage() {
  const { data: session } = useSession();
  const params = useParams();
  
  const [isMounted, setIsMounted] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState("list");
  const [filter, setFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("23:59");
  const [course, setCourse] = useState("");

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Countdown timer
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Live countdown tick
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchAssignments() {
      if (!session?.user?.id || !params?.semester) return;
      try {
        const userYear = session.user.year || "";
        const response = await fetch(`/api/assignments?userId=${session.user.id}&semester=${params.semester}${userYear ? `&year=${userYear}` : ""}`);
        if (response.ok) {
          const data = await response.json();
          // Map MongoDB _id to id for the frontend
          const formattedData = data.map(item => ({
            ...item,
            id: item._id
          }));
          setAssignments(formattedData);
        }
      } catch (error) {
        console.error("Failed to fetch assignments:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (session?.user?.id) {
      fetchAssignments();
    } else {
      setIsLoading(false);
    }
  }, [session, params]);

  const handleOpenModal = (assignment) => {
    if (assignment) {
      setEditingId(assignment.id);
      setTitle(assignment.title);
      setDescription(assignment.description);
      const parsed = parseISO(assignment.dueDate);
      setDueDate(format(parsed, "yyyy-MM-dd"));
      setDueTime(format(parsed, "HH:mm"));
      setCourse(assignment.course);
    } else {
      setEditingId(null);
      setTitle("");
      setDescription("");
      setDueDate(format(new Date(), "yyyy-MM-dd"));
      setDueTime("23:59");
      setCourse("");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    if (!title.trim()) {
      alert("Please enter a valid title.");
      return;
    }
    if (!course.trim()) {
      alert("Please enter a valid course name.");
      return;
    }
    if (!dueDate) {
      alert("Please select a due date.");
      return;
    }

    setIsSubmitting(true);

    const dueDateTimeISO = new Date(`${dueDate}T${dueTime}`).toISOString();

    // Determine status based on due date
    let status = "pending";
    if (isBefore(new Date(dueDateTimeISO), startOfDay(new Date()))) {
      status = "overdue";
    }

    try {
      if (editingId) {
        // Update assignment via API
        const res = await fetch("/api/assignments", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            title,
            description,
            dueDate: dueDateTimeISO,
            dueTime,
            course
          })
        });

        if (!res.ok) {
          const error = await res.json();
          alert(error.error || "Failed to update assignment");
          setIsSubmitting(false);
          return;
        }

        const updated = await res.json();
        setAssignments(assignments.map(a =>
          a.id === editingId
            ? { ...updated, id: updated._id }
            : a
        ));
      } else {
        // Create new assignment in MongoDB
        // Ensure we use the semester from the URL params (e.g., "y1s1")
        if (!params?.semester) {
          alert("Semester information is missing. Please refresh the page.");
          setIsSubmitting(false);
          return;
        }

        const yearMatch = String(params.semester).match(/y(\d+)s\d+/i);
        const yearNumber = yearMatch ? yearMatch[1] : (session.user.year || "1");

        const newAssignmentData = {
          title,
          description,
          dueDate: dueDateTimeISO,
          dueTime,
          course,
          status,
          userId: session.user.id,
          createdBy: session.user.email,
          semester: params.semester,
          year: yearNumber
        };

        const res = await fetch("/api/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newAssignmentData)
        });

        if (res.ok) {
          const created = await res.json();
          setAssignments([...assignments, { ...created, id: created._id }]);
        } else {
          // Fallback to local
          const newAssignment = {
            id: Math.random().toString(36).substring(7),
            ...newAssignmentData
          };
          setAssignments([...assignments, newAssignment]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
      handleCloseModal();
    }
  };

  const proceedWithDelete = async (id) => {
    try {
      const res = await fetch("/api/assignments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || "Failed to delete assignment");
        return;
      }

      setAssignments(prev => prev.filter(a => a.id !== id));
      toast.success("Assignment deleted successfully");
    } catch (err) {
      console.error("Failed to delete from database:", err);
      toast.error("Failed to delete assignment");
    }
  };

  const handleDelete = async (id) => {
    toast.custom((t) => (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm pointer-events-auto">
        <div className={`${t.visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} transition-all duration-200 ease-in-out max-w-sm w-full bg-white shadow-2xl flex flex-col items-center text-center gap-4 p-6 rounded-3xl ring-1 ring-zinc-200`}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 bg-red-100 text-red-600">
             <Trash2 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-zinc-900 mb-1">Delete Assignment?</p>
            <p className="text-sm text-zinc-500">Are you sure you want to delete this assignment? This action cannot be undone.</p>
          </div>
          <div className="flex items-center gap-3 w-full mt-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 py-2.5 text-sm font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                proceedWithDelete(id);
              }}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const proceedWithToggle = async (id, newStatus, previousAssignments) => {
    // Optimistic update - ALWAYS update studentCompletions
    setAssignments(prev => prev.map(a => {
      if (a.id === id) {
        const completions = a.studentCompletions || [];
        const userIndex = completions.findIndex(c => String(c.userId) === String(session.user.id));
        const newCompletions = [...completions];
        if (userIndex >= 0) {
          newCompletions[userIndex] = { ...newCompletions[userIndex], status: newStatus };
        } else {
          newCompletions.push({ userId: session.user.id, status: newStatus });
        }
        return { ...a, studentCompletions: newCompletions };
      }
      return a;
    }));

    try {
      const res = await fetch("/api/assignments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus })
      });

      if (!res.ok) {
        throw new Error("Failed to update assignment status");
      }
      toast.success(newStatus === "submitted" ? "Assignment marked as done!" : "Assignment status reverted.");
    } catch (error) {
      console.error("Error updating assignment status:", error);
      // Rollback to previous state
      setAssignments(previousAssignments);
      toast.error("Failed to update assignment status. Please try again.");
    }
  };

  const handleToggleStatus = async (id) => {
    // Capture previous state for rollback
    const previousAssignments = [...assignments];
    const assignment = assignments.find(a => a.id === id);
    if (!assignment) return;

    const currentStatus = getAssignmentUserStatus(assignment, session?.user?.id);
    const newStatus = currentStatus === "submitted"
      ? (isBefore(parseISO(assignment.dueDate), startOfDay(new Date())) ? "overdue" : "pending")
      : "submitted";

    toast.custom((t) => (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm pointer-events-auto">
        <div className={`${t.visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} transition-all duration-200 ease-in-out max-w-sm w-full bg-white shadow-2xl flex flex-col items-center text-center gap-4 p-6 rounded-3xl ring-1 ring-zinc-200`}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${newStatus === 'submitted' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
             <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-zinc-900 mb-1">
              {newStatus === "submitted" ? "Mark as Done?" : "Undo Submission?"}
            </p>
            <p className="text-sm text-zinc-500">
              {newStatus === "submitted" ? "Are you sure you want to mark this complete? It will help you track your progress." : "This will revert the assignment to incomplete. You will need to complete it again to stay on track."}
            </p>
          </div>
          <div className="flex items-center gap-3 w-full mt-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
              }}
              className="flex-1 py-2.5 text-sm font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                proceedWithToggle(id, newStatus, previousAssignments);
              }}
              className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors shadow-sm ${newStatus === 'submitted' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-amber-600 hover:bg-amber-700'}`}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    ), { duration: Infinity });
  };

  // Check if the current user can edit/delete an assignment
  const canModifyAssignment = (assignment) => {
    if (!session?.user) return false;

    const isCreator = String(assignment.userId) === String(session.user.id);
    const isAdmin = session.user.role === "admin";
    const isLecturer = session.user.role === "lecturer";

    return isCreator || isAdmin || isLecturer;
  };


  // Calendar logic
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const sortedAssignments = useMemo(() => {
    return [...assignments].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [assignments]);

  const { total, pending, dueToday, submitted, overdue } = useMemo(() => {
    return {
      total: assignments.length,
      pending: assignments.filter(a => getAssignmentUserStatus(a, session?.user?.id) === 'pending').length,
      dueToday: assignments.filter(a => getAssignmentUserStatus(a, session?.user?.id) === 'dueToday').length,
      submitted: assignments.filter(a => getAssignmentUserStatus(a, session?.user?.id) === 'submitted').length,
      overdue: assignments.filter(a => getAssignmentUserStatus(a, session?.user?.id) === 'overdue').length,
    };
  }, [assignments, session]);

  const completionRate = total > 0 ? Math.round((submitted / total) * 100) : 0;

  const filteredAssignments = useMemo(() => {
    let filtered = [...assignments];
    if (filter !== "all") {
      filtered = filtered.filter(a => getAssignmentUserStatus(a, session?.user?.id) === filter);
    }
    return filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [assignments, filter, session]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-semibold text-zinc-900">Assignments</h1>
            {isLoading && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin ml-2" />}
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="bg-zinc-100 p-1 rounded-lg flex items-center">
              <button
                onClick={() => setView("list")}
                className={`px-2 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 sm:gap-2 ${view === "list" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"}`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                onClick={() => setView("calendar")}
                className={`px-2 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 sm:gap-2 ${view === "calendar" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"}`}
              >
                <CalendarIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Calendar</span>
              </button>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Assignment</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Countdown Banner for Due Today */}
        {(() => {
          const dueTodayAssignments = assignments.filter(a => isToday(parseISO(a.dueDate)) && getAssignmentUserStatus(a, session?.user?.id) !== 'submitted');
          if (dueTodayAssignments.length === 0) return null;
          return (
            <div className="mb-6 space-y-2">
              {dueTodayAssignments.map(a => {
                const due = parseISO(a.dueDate);
                const diff = due.getTime() - now.getTime();
                const isOverdue = diff <= 0;
                const absDiff = Math.abs(diff);
                const hrs = Math.floor(absDiff / (1000 * 60 * 60));
                const mins = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((absDiff % (1000 * 60)) / 1000);
                return (
                  <div key={a.id} className={`text-white rounded-xl px-5 py-3 shadow-md flex items-center justify-between gap-4 ${
                    isOverdue ? "bg-gradient-to-r from-red-600 to-rose-500" : "bg-gradient-to-r from-orange-500 to-amber-500"
                  }`}>
                    <div className="flex items-center gap-3 min-w-0">
                      {isOverdue
                        ? <AlertCircle className="w-5 h-5 shrink-0" />
                        : <Clock className="w-5 h-5 shrink-0 animate-pulse" />
                      }
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{a.title}</p>
                        <p className="text-xs text-white/80">
                          {isOverdue ? `Was due at ${format(due, "h:mm a")}` : `Due today at ${format(due, "h:mm a")}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-extrabold tabular-nums tracking-tight">
                        {isOverdue ? "-" : ""}{String(hrs).padStart(2, '0')}:{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                      </p>
                      <p className="text-[10px] text-white/70 uppercase tracking-wider font-semibold">
                        {isOverdue ? "overdue" : "remaining"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Summary Section */}
        <div className="mb-8">
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">Total</p>
                <p className="text-2xl font-semibold text-zinc-900">{total}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <ListTodo className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">Pending</p>
                <p className="text-2xl font-semibold text-zinc-900">{pending}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">Submitted</p>
                <p className="text-2xl font-semibold text-zinc-900">{submitted}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">Due Today</p>
                <p className="text-2xl font-semibold text-zinc-900">{dueToday}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">Overdue</p>
                <p className="text-2xl font-semibold text-zinc-900">{overdue}</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-zinc-700">Completion Progress</h3>
              <span className="text-sm font-semibold text-indigo-600">{completionRate}%</span>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filter === "all" ? "bg-zinc-900 text-white shadow-sm" : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filter === "pending" ? "bg-amber-100 text-amber-800 shadow-sm border-amber-200 border" : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("dueToday")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filter === "dueToday" ? "bg-orange-100 text-orange-800 shadow-sm border-orange-200 border" : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"}`}
          >
            Due Today
          </button>
          <button
            onClick={() => setFilter("submitted")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filter === "submitted" ? "bg-emerald-100 text-emerald-800 shadow-sm border-emerald-200 border" : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"}`}
          >
            Submitted
          </button>
          <button
            onClick={() => setFilter("overdue")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filter === "overdue" ? "bg-red-100 text-red-800 shadow-sm border-red-200 border" : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"}`}
          >
            Overdue
          </button>
        </div>

        {view === "list" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredAssignments.map((assignment) => {
                const isLecturer = assignment.isLecturerAssignment;
                const userStatus = getAssignmentUserStatus(assignment, session?.user?.id);
                return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={assignment.id}
                  className={`bg-white rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md flex flex-col gap-2 ${
                    isLecturer ? "border-violet-200 bg-violet-50/20" :
                    userStatus === "submitted" ? "border-emerald-200 bg-emerald-50/30" :
                    userStatus === "overdue" ? "border-red-200 bg-red-50/30" :
                    userStatus === "dueToday" ? "border-orange-200 bg-orange-50/30" : "border-zinc-200"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 self-start">
                          {assignment.course}
                        </span>
                        {userStatus === "overdue" && (
                          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 self-start">
                            <AlertCircle className="w-3 h-3" />
                            Overdue
                          </span>
                        )}
                        {userStatus === "dueToday" && (
                          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200 self-start">
                            <Clock className="w-3 h-3" />
                            Due Today
                          </span>
                        )}
                      </div>
                      {isLecturer && (
                        <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 border border-violet-200 self-start">
                          <GraduationCap className="w-3 h-3" />
                          From Lecturer
                        </span>
                      )}
                    </div>
                    {/* Only show edit/delete for student's own assignments */}
                    {!isLecturer && canModifyAssignment(assignment) && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenModal(assignment)}
                          className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(assignment.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <h3 className={`font-semibold text-lg leading-snug ${
                    userStatus === 'submitted' ? 'text-zinc-500 line-through' : 'text-zinc-900'
                  }`}>
                    {assignment.title}
                  </h3>
                  {isLecturer && assignment.createdBy && (
                    <div className="text-xs text-violet-600 font-medium">
                      {assignment.createdBy}
                    </div>
                  )}
                  <p className="text-zinc-500 text-sm line-clamp-2">
                    {assignment.description}
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-100">
                    <div className="flex flex-col gap-0.5">
                      <div className={`flex items-center gap-1.5 text-sm font-medium ${
                        userStatus === "submitted" ? "text-emerald-600" :
                        userStatus === "overdue" ? "text-red-600" :
                        (() => {
                          const hoursLeft = differenceInHours(parseISO(assignment.dueDate), new Date());
                          if (hoursLeft < 0) return "text-red-600";
                          if (hoursLeft < 10) return "text-red-600";
                          if (hoursLeft <= 72) return "text-amber-600";
                          if (hoursLeft <= 168) return "text-emerald-600";
                          return "text-zinc-600";
                        })()
                      }`}>
                        <Clock className="w-4 h-4" />
                        {format(parseISO(assignment.dueDate), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                      {userStatus !== "submitted" && (() => {
                        const dueMs = parseISO(assignment.dueDate).getTime() - new Date().getTime();
                        const absDueMs = Math.abs(dueMs);
                        const totalMins = Math.floor(absDueMs / (1000 * 60));
                        const totalHrs = Math.floor(totalMins / 60);
                        const days = Math.floor(totalHrs / 24);
                        const remainingHrs = totalHrs % 24;
                        const remainingMins = totalMins % 60;
                        
                        let label = "";
                        let colorClass = "text-zinc-500";
                        
                        const formatTime = (d, h, m) => {
                          const parts = [];
                          if (d > 0) parts.push(`${d} day${d !== 1 ? "s" : ""}`);
                          if (h > 0) parts.push(`${h} hr${h !== 1 ? "s" : ""}`);
                          if (m > 0 || (d === 0 && h === 0)) parts.push(`${m} min${m !== 1 ? "s" : ""}`);
                          return parts.join(" ");
                        };

                        const timeStr = formatTime(days, remainingHrs, remainingMins);

                        if (dueMs <= 0) {
                          // Overdue
                          label = `Overdue by ${timeStr}`;
                          colorClass = "text-red-600";
                        } else {
                          // Upcoming
                          label = `Due in ${timeStr}`;
                          if (days === 0 && totalHrs < 10) {
                            colorClass = "text-red-600";
                          } else if (days <= 3) {
                            colorClass = "text-amber-600";
                          } else if (days <= 7) {
                            colorClass = "text-emerald-600";
                          }
                        }
                        
                        if (!label || days > 7) return null; // Hide if more than 7 days
                        
                        return (
                          <div className={`text-xs ml-5 font-medium ${colorClass}`}>
                            {label}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Both student and lecturer assignments: interactive button for marking done */}
                    <button
                      onClick={() => handleToggleStatus(assignment.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        userStatus === "submitted"
                          ? isLecturer ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : isLecturer ? "bg-violet-100 text-violet-700 hover:bg-violet-200" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                      }`}
                    >
                      {userStatus === "submitted" ? (
                        <><CheckCircle2 className="w-4 h-4" />Done</>
                      ) : (
                        <><CheckCircle2 className="w-4 h-4" />Mark Done</>
                      )}
                    </button>
                  </div>
                </motion.div>
                );
              })}
            </AnimatePresence>
            {filteredAssignments.length === 0 && (
              <div className="col-span-full py-12 text-center">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-lg font-medium text-zinc-900 mb-1">No assignments found</h3>
                <p className="text-zinc-500">
                  {filter === "all" ? "Get started by adding your first assignment." : `No ${filter} assignments available.`}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-4 flex flex-col sm:flex-row items-center justify-between border-b border-zinc-200 gap-3 sm:gap-0">
              <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                <h2 className="text-lg font-semibold text-zinc-900 min-w-32">
                  {format(currentMonth, "MMMM yyyy")}
                </h2>
                <div className="flex items-center gap-1">
                  <button onClick={prevMonth} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-600 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 rounded-lg text-zinc-600 transition-colors">
                    Today
                  </button>
                  <button onClick={nextMonth} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-600 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50/50">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-2 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-fr">
              {/* Padding for first day of month */}
              {Array.from({ length: daysInMonth[0].getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[120px] border-b border-r border-zinc-100 bg-zinc-50/30" />
              ))}
              
              {daysInMonth.map((day, i) => {
                const dayAssignments = assignments.filter(a => isSameDay(parseISO(a.dueDate), day));
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[120px] p-2 border-b border-r border-zinc-100 transition-colors hover:bg-zinc-50 ${isToday(day) ? 'bg-indigo-50/30' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-indigo-600 text-white' : 'text-zinc-700'}`}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayAssignments.map(assignment => {
                        const userStatus = getAssignmentUserStatus(assignment, session?.user?.id);
                        return (
                          <div
                            key={assignment.id}
                            onClick={() => canModifyAssignment(assignment) && handleOpenModal(assignment)}
                            className={`text-xs px-2 py-1.5 rounded truncate ${canModifyAssignment(assignment) ? 'cursor-pointer' : 'cursor-default'} transition-colors font-medium border ${
                              userStatus === 'submitted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' :
                              userStatus === 'overdue' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' :
                              userStatus === 'dueToday' ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' :
                              'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                            }`}
                          >
                            {assignment.title}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              
              {/* Padding for end of month */}
              {Array.from({ length: 6 - daysInMonth[daysInMonth.length - 1].getDay() }).map((_, i) => (
                <div key={`empty-end-${i}`} className="min-h-[120px] border-b border-r border-zinc-100 bg-zinc-50/30" />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
              onClick={handleCloseModal}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-zinc-100">
                <h2 className="text-lg font-semibold text-zinc-900">
                  {editingId ? "Edit Assignment" : "New Assignment"}
                </h2>
                <button 
                  onClick={handleCloseModal}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSave} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Title</label>
                  <input
                    required
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g. Calculus Midterm Prep"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Course</label>
                  <input
                    required
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g. MATH 201"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Due Date & Time</label>
                  <div className="flex gap-2">
                    <input
                      required
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <input
                      required
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="w-32 px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    placeholder="Add any additional details or requirements..."
                  />
                </div>
                
                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingId ? "Save Changes" : "Add Assignment"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
}
