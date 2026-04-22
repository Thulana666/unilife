"use client";

import { useState, useMemo, useEffect } from "react";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, isBefore, startOfDay, differenceInHours } from "date-fns";
import {
  Calendar as CalendarIcon, CheckCircle2, Clock, Edit2, List, Plus, Trash2, X,
  ChevronLeft, ChevronRight, BookOpen, Loader2, AlertCircle, CheckCircle,
  ListTodo, BarChart3, Users, Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";


const semesterLabel = (sem) => {
  const map = { y1s1: "Y1 S1", y1s2: "Y1 S2", y2s1: "Y2 S1", y2s2: "Y2 S2", y3s1: "Y3 S1", y3s2: "Y3 S2", y4s1: "Y4 S1", y4s2: "Y4 S2" };
  return map[sem] || sem;
};

const AssignmentCard = ({ assignment, handleOpenModal, handleDelete }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      key={assignment.id}
      className={`bg-white dark:bg-slate-900/50 rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md flex flex-col gap-3 ${
        isToday(parseISO(assignment.dueDate)) ? "border-amber-200 dark:border-amber-800/50 bg-amber-50/20 dark:bg-amber-900/20" :
        differenceInHours(parseISO(assignment.dueDate), new Date()) < 0 ? "border-red-200 dark:border-red-800/50 bg-red-50/20 dark:bg-red-900/20" : "border-zinc-200 dark:border-zinc-700/80"
      }`}
    >
      {/* Top: course badge + actions */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 self-start">
            {assignment.course}
          </span>
          {assignment.semester && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 self-start">
              {assignment.semester.toUpperCase().replace(/Y(\d)S(\d)/i, 'Y$1 S$2')}
            </span>
          )}
        </div>
        <div className="flex gap-1 -mt-1 -mr-1">
          <button
            onClick={() => handleOpenModal(assignment)}
            className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(assignment.id)}
            className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <h3 className="font-semibold text-base leading-snug text-zinc-900 dark:text-white">
        {assignment.title}
      </h3>

      {/* Created by */}
      {assignment.createdBy && (
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <Users className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{assignment.createdBy}</span>
        </div>
      )}

      {/* Description */}
      {assignment.description && (
        <p className="text-zinc-500 dark:text-zinc-400 text-sm line-clamp-2">{assignment.description}</p>
      )}

      {/* Footer: due date + status badge */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800 mt-auto">
        <div className="flex flex-col gap-0.5">
          <div className={`flex items-center gap-1.5 text-sm font-medium ${
            (() => {
              const dueMs = parseISO(assignment.dueDate).getTime() - new Date().getTime();
              if (dueMs <= 0) return "text-red-600 dark:text-red-400";
              const h = Math.floor(dueMs / (1000 * 60 * 60));
              if (h < 10) return "text-red-600 dark:text-red-400";
              if (h <= 72) return "text-amber-600 dark:text-amber-400";
              return "text-zinc-600 dark:text-zinc-400";
            })()
          }`}>
            <Clock className="w-4 h-4" />
            {format(parseISO(assignment.dueDate), "MMM d, yyyy 'at' h:mm a")}
          </div>
          {(() => {
            const dueMs = parseISO(assignment.dueDate).getTime() - new Date().getTime();
            const absDueMs = Math.abs(dueMs);
            const totalMins = Math.floor(absDueMs / (1000 * 60));
            const totalHrs = Math.floor(totalMins / 60);
            const days = Math.floor(totalHrs / 24);
            const remainingHrs = totalHrs % 24;
            const remainingMins = totalMins % 60;
            
            let label = "";
            let colorClass = "text-zinc-500 dark:text-zinc-400";
            
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
              colorClass = "text-red-600 dark:text-red-400";
            } else {
              // Upcoming
              label = `Due in ${timeStr}`;
              if (days === 0 && totalHrs < 10) {
                colorClass = "text-red-600 dark:text-red-400";
              } else if (days <= 3) {
                colorClass = "text-amber-600 dark:text-amber-400";
              } else if (days <= 7) {
                colorClass = "text-emerald-600 dark:text-emerald-400";
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

        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
          (() => {
            const d = parseISO(assignment.dueDate);
            if (d.getTime() <= new Date().getTime()) return "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300";
            if (isToday(d)) return "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300";
            return "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300";
          })()
        }`}>
          {(() => {
            const d = parseISO(assignment.dueDate);
            if (d.getTime() <= new Date().getTime()) return <><AlertCircle className="w-3.5 h-3.5" /> Past Due</>;
            if (isToday(d)) return <><Clock className="w-3.5 h-3.5" /> Due Today</>;
            return <><Clock className="w-3.5 h-3.5" /> Upcoming</>;
          })()}
        </span>
      </div>


    </motion.div>
  );
};

export default function LecturerAssignmentsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState("list");
  const [filter, setFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [studentFilter, setStudentFilter] = useState("");
  const [groupByStudent, setGroupByStudent] = useState(false);

  // Form: combined year+semester for the assignment being created/edited (e.g. "y1s1")
  const [formCohort, setFormCohort] = useState("y1s1");

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

  // Redirect non-lecturers
  useEffect(() => {
    if (session && session.user.role !== "lecturer" && session.user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [session, router]);

  useEffect(() => {
    async function fetchAssignments() {
      if (!session?.user?.id) return;
      setIsLoading(true);
      try {
        const semParam = selectedSemester !== "all" ? `&semester=${selectedSemester}` : "";
        const response = await fetch(`/api/assignments?viewAll=true${semParam}`);
        if (response.ok) {
          const data = await response.json();
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
  }, [session, selectedSemester]);

  const handleOpenModal = (assignment) => {
    if (assignment) {
      setEditingId(assignment.id);
      setTitle(assignment.title);
      setDescription(assignment.description || "");
      const parsed = parseISO(assignment.dueDate);
      setDueDate(format(parsed, "yyyy-MM-dd"));
      setDueTime(format(parsed, "HH:mm"));
      setCourse(assignment.course);
      // Pre-fill cohort from existing assignment
      if (assignment.semester && String(assignment.semester).match(/y\d+s\d+/)) {
        setFormCohort(String(assignment.semester));
      } else {
        setFormCohort("y1s1");
      }
    } else {
      setEditingId(null);
      setTitle("");
      setDescription("");
      setDueDate(format(new Date(), "yyyy-MM-dd"));
      setDueTime("23:59");
      setCourse("");
      // Default from the filter selection
      if (selectedSemester !== "all") {
        setFormCohort(selectedSemester);
      } else {
        setFormCohort("y1s1");
      }
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

    let status = "pending";
    if (isBefore(new Date(dueDateTimeISO), startOfDay(new Date()))) {
      status = "overdue";
    }

    try {
      if (editingId) {
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
          a.id === editingId ? { ...updated, id: updated._id } : a
        ));
      } else {
        // Build semester string and extract year from the selected cohort
        const semesterString = formCohort; // e.g. "y1s1"
        const yearMatch = formCohort.match(/y(\d+)/);
        const yearNumber = yearMatch ? yearMatch[1] : "1";

        const newAssignmentData = {
          title,
          description,
          dueDate: dueDateTimeISO,
          dueTime,
          course,
          status,
          userId: session.user.id,
          createdBy: session.user.email,
          year: yearNumber,
          semester: semesterString,
          isLecturerAssignment: true,  // Mark so students in this cohort can see it
        };

        const res = await fetch("/api/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newAssignmentData)
        });

        if (res.ok) {
          const created = await res.json();
          setAssignments([...assignments, { ...created, id: created._id }]);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save assignment");
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
      console.error("Failed to delete:", err);
      toast.error("Failed to delete assignment");
    }
  };

  const handleDelete = async (id) => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-slate-900/50 shadow-xl flex items-center gap-3 ring-1 ring-zinc-200 dark:ring-zinc-700/80 p-4 rounded-2xl pointer-events-auto`}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
           <Trash2 className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">Delete Assignment?</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">Are you sure you want to delete this assignment?</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              proceedWithDelete(id);
            }}
            className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
          >
            Delete
          </button>
        </div>
      </div>
    ), { duration: 4000, position: 'top-center' });
  };



  // Calendar logic
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const { total, upcoming, dueToday, pastDue } = useMemo(() => {
    const now = new Date();
    return {
      total: assignments.length,
      upcoming: assignments.filter(a => {
        const d = parseISO(a.dueDate);
        return d.getTime() > now.getTime() && !isToday(d);
      }).length,
      dueToday: assignments.filter(a => {
        const d = parseISO(a.dueDate);
        return d.getTime() > now.getTime() && isToday(d);
      }).length,
      pastDue: assignments.filter(a => {
        const d = parseISO(a.dueDate);
        return d.getTime() <= now.getTime();
      }).length,
    };
  }, [assignments]);

  // Apply status + student email filters
  const filteredAssignments = useMemo(() => {
    let filtered = [...assignments];
    if (filter !== "all") {
      const now = new Date();
      if (filter === "upcoming") {
        filtered = filtered.filter(a => {
          const d = parseISO(a.dueDate);
          return d.getTime() > now.getTime() && !isToday(d);
        });
      } else if (filter === "dueToday") {
        filtered = filtered.filter(a => {
          const d = parseISO(a.dueDate);
          return d.getTime() > now.getTime() && isToday(d);
        });
      } else if (filter === "pastDue") {
        filtered = filtered.filter(a => parseISO(a.dueDate).getTime() <= now.getTime());
      }
    }
    if (studentFilter.trim()) {
      const q = studentFilter.trim().toLowerCase();
      filtered = filtered.filter(a => (a.createdBy || "").toLowerCase().includes(q));
    }
    return filtered.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [assignments, filter, studentFilter]);

  // Group by student email
  const groupedAssignments = useMemo(() => {
    if (!groupByStudent) return null;
    const groups = {};
    filteredAssignments.forEach(a => {
      const key = a.createdBy || "Unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredAssignments, groupByStudent]);


  if (!session || (session.user.role !== "lecturer" && session.user.role !== "admin")) return null;

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900/50 border-b border-zinc-200 dark:border-zinc-700/80 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Assignment Management</h1>
            {isLoading && <Loader2 className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-spin ml-1" />}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Semester Selector */}
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-3 py-2 border border-zinc-300 dark:border-zinc-600/80 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white dark:bg-slate-900/50"
            >
              <option value="all">All Semesters</option>
              <option value="y1s1">Year 1 Sem 1</option>
              <option value="y1s2">Year 1 Sem 2</option>
              <option value="y2s1">Year 2 Sem 1</option>
              <option value="y2s2">Year 2 Sem 2</option>
              <option value="y3s1">Year 3 Sem 1</option>
              <option value="y3s2">Year 3 Sem 2</option>
              <option value="y4s1">Year 4 Sem 1</option>
              <option value="y4s2">Year 4 Sem 2</option>
            </select>

            {/* View toggle */}
            <div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg flex items-center">
              <button
                onClick={() => setView("list")}
                className={`px-2 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 sm:gap-2 ${view === "list" ? "bg-white dark:bg-slate-900/50 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"}`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                onClick={() => setView("calendar")}
                className={`px-2 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 sm:gap-2 ${view === "calendar" ? "bg-white dark:bg-slate-900/50 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"}`}
              >
                <CalendarIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Calendar</span>
              </button>
            </div>

            <button
              onClick={() => handleOpenModal()}
              className="bg-rose-600 hover:bg-rose-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Assignment</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">


        <div className="mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total", value: total, icon: BarChart3, color: "rose" },
              { label: "Upcoming", value: upcoming, icon: ListTodo, color: "emerald" },
              { label: "Due Today", value: dueToday, icon: Clock, color: "amber" },
              { label: "Past Due", value: pastDue, icon: AlertCircle, color: "red" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white dark:bg-slate-900/50 rounded-xl border border-zinc-200 dark:border-zinc-700/80 p-4 shadow-sm flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg bg-${color}-50 flex items-center justify-center text-${color}-600`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
                  <p className="text-2xl font-semibold text-zinc-900 dark:text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Toolbar: Filters + Search + Group toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          {/* Status filters */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-shrink-0">
            {["all", "upcoming", "dueToday", "pastDue"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === f
                    ? f === "all" ? "bg-zinc-900 dark:bg-zinc-950 text-white shadow-sm"
                    : f === "upcoming" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/50"
                    : f === "dueToday" ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50"
                    : "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800/50"
                    : "bg-white dark:bg-slate-900/50 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                }`}
              >
                {f === "pastDue" ? "Past Due" : f === "dueToday" ? "Due Today" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Student email search */}
          <div className="flex items-center gap-2 flex-1 bg-white dark:bg-slate-900/50 border border-zinc-200 dark:border-zinc-700/80 rounded-lg px-3 py-2 min-w-0">
            <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
            <input
              type="text"
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              placeholder="Filter by student email..."
              className="flex-1 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none min-w-0 bg-transparent"
            />
            {studentFilter && (
              <button onClick={() => setStudentFilter("")} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Group by student toggle */}
          <button
            onClick={() => setGroupByStudent(!groupByStudent)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap flex-shrink-0 ${
              groupByStudent
                ? "bg-rose-600 text-white border-rose-600 hover:bg-rose-700"
                : "bg-white dark:bg-slate-900/50 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            }`}
          >
            <Users className="w-4 h-4" />
            Group by Student
          </button>
        </div>

        {/* Result count */}
        {!isLoading && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Showing <span className="font-semibold text-zinc-700 dark:text-zinc-300">{filteredAssignments.length}</span> assignment{filteredAssignments.length !== 1 ? "s" : ""}
            {studentFilter ? ` for "${studentFilter}"` : ""}
          </p>
        )}

        {/* List view */}
        {view === "list" ? (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-rose-600 dark:text-rose-400 animate-spin" />
              </div>
            ) : groupByStudent && groupedAssignments ? (
              /* Grouped by student */
              <div className="space-y-8">
                {groupedAssignments.length === 0 ? (
                  <EmptyState filter={filter} />
                ) : (
                  groupedAssignments.map(([email, asgns]) => (
                    <div key={email}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
                          <Users className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        </div>
                        <h2 className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">{email}</h2>
                        <span className="ml-1 text-xs text-zinc-400 dark:text-zinc-500 font-medium">{asgns.length} assignment{asgns.length !== 1 ? "s" : ""}</span>
                        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800/50 ml-2" />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <AnimatePresence>
                          {asgns.map(a => <AssignmentCard key={a.id} assignment={a} handleOpenModal={handleOpenModal} handleDelete={handleDelete} />)}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Flat list */
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {filteredAssignments.map(a => <AssignmentCard key={a.id} assignment={a} handleOpenModal={handleOpenModal} handleDelete={handleDelete} />)}
                </AnimatePresence>
                {filteredAssignments.length === 0 && <EmptyState filter={filter} />}
              </div>
            )}
          </>
        ) : (
          /* Calendar view */
          <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-zinc-200 dark:border-zinc-700/80 shadow-sm overflow-hidden">
            <div className="p-4 flex flex-col sm:flex-row items-center justify-between border-b border-zinc-200 dark:border-zinc-700/80 gap-3 sm:gap-0">
              <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white min-w-32">
                  {format(currentMonth, "MMMM yyyy")}
                </h2>
                <div className="flex items-center gap-1">
                  <button onClick={prevMonth} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 transition-colors">
                    Today
                  </button>
                  <button onClick={nextMonth} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/50 dark:bg-zinc-900">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="py-2 text-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-fr">
              {Array.from({ length: daysInMonth[0].getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900" />
              ))}
              {daysInMonth.map((day) => {
                const dayAssignments = filteredAssignments.filter(a => isSameDay(parseISO(a.dueDate), day));
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[100px] p-2 border-b border-r border-zinc-100 dark:border-zinc-800 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 ${isToday(day) ? "bg-rose-50/30 dark:bg-rose-900/20" : ""}`}
                  >
                    <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${isToday(day) ? "bg-rose-600 text-white" : "text-zinc-700 dark:text-zinc-300"}`}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayAssignments.map(a => (
                        <div
                          key={a.id}
                          onClick={() => handleOpenModal(a)}
                          className={`text-xs px-2 py-1 rounded truncate cursor-pointer font-medium border transition-colors ${
                            isToday(parseISO(a.dueDate)) ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/40" :
                            differenceInHours(parseISO(a.dueDate), new Date()) < 0 ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/40" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                          }`}
                          title={`${a.title} — ${a.createdBy || "Unknown"}`}
                        >
                          {a.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {Array.from({ length: 6 - daysInMonth[daysInMonth.length - 1].getDay() }).map((_, i) => (
                <div key={`empty-end-${i}`} className="min-h-[100px] border-b border-r border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900" />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Edit/Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-900/40 dark:bg-zinc-950 backdrop-blur-sm"
              onClick={handleCloseModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900/50 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {editingId ? "Edit Assignment" : "New Assignment"}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Title</label>
                  <input
                    required
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600/80 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    placeholder="e.g. Calculus Midterm Prep"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Course</label>
                  <input
                    required
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600/80 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    placeholder="e.g. MATH 201"
                  />
                </div>

                {/* Combined Year + Semester selector */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Target Cohort (Year &amp; Semester)</label>
                  <select
                    required
                    value={formCohort}
                    onChange={(e) => setFormCohort(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600/80 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white dark:bg-slate-900/50"
                  >
                    <option value="y1s1">Year 1 — Semester 1</option>
                    <option value="y1s2">Year 1 — Semester 2</option>
                    <option value="y2s1">Year 2 — Semester 1</option>
                    <option value="y2s2">Year 2 — Semester 2</option>
                    <option value="y3s1">Year 3 — Semester 1</option>
                    <option value="y3s2">Year 3 — Semester 2</option>
                    <option value="y4s1">Year 4 — Semester 1</option>
                    <option value="y4s2">Year 4 — Semester 2</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Due Date & Time</label>
                  <div className="flex gap-2">
                    <input
                      required
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600/80 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    />
                    <input
                      required
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="w-32 px-3 py-2 border border-zinc-300 dark:border-zinc-600/80 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600/80 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 resize-none"
                    placeholder="Add any additional details or requirements..."
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
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

function EmptyState({ filter }) {
  return (
    <div className="col-span-full py-16 text-center">
      <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <BookOpen className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
      </div>
      <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-1">No assignments found</h3>
      <p className="text-zinc-500 dark:text-zinc-400">
        {filter === "all" ? "No assignments available for this selection." : `No ${filter} assignments found.`}
      </p>
    </div>
  );
}
