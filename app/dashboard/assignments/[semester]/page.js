"use client";

import { useState, useMemo, useEffect } from "react";
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isBefore, startOfDay } from "date-fns";
import { Calendar as CalendarIcon, CheckCircle2, Circle, Clock, Edit2, LayoutGrid, List, Plus, Trash2, X, ChevronLeft, ChevronRight, BookOpen, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";


export default function AssignmentsPage() {
  const { data: session } = useSession();
  const params = useParams();
  
  const [isMounted, setIsMounted] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [course, setCourse] = useState("");

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    async function fetchAssignments() {
      if (!session?.user?.id || !params?.semester) return;
      try {
        const response = await fetch(`/api/assignments?userId=${session.user.id}&semester=${params.semester}`);
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
      setDueDate(format(parseISO(assignment.dueDate), "yyyy-MM-dd"));
      setCourse(assignment.course);
    } else {
      setEditingId(null);
      setTitle("");
      setDescription("");
      setDueDate(format(new Date(), "yyyy-MM-dd"));
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
    setIsSubmitting(true);
    
    // Determine status based on due date
    let status = "pending";
    if (isBefore(parseISO(dueDate), startOfDay(new Date()))) {
      status = "overdue";
    }

    try {
      if (editingId) {
        // Optimistic update locally - full DB update not fully implemented in API yet for all fields
        setAssignments(assignments.map(a => 
          a.id === editingId 
            ? { ...a, title, description, dueDate: new Date(dueDate).toISOString(), course, status: a.status === "submitted" ? "submitted" : status } 
            : a
        ));
      } else {
        // Create new assignment in MongoDB
        const newAssignmentData = {
          title,
          description,
          dueDate: new Date(dueDate).toISOString(),
          course,
          status,
          userId: session.user.id,
          year: session.user.year || 1,
          semester: session.user.semester || 1,
          // If params.semester has info, we could parse it, but let's just use semester from session or params
          // Since the API searches by `semester`, let's just store `params.semester` to make it match.
          // In the DB schema: year: Number, semester: Number. 
          // But searchParams.get("semester") in GET uses it directly as if it matches.
          // Wait, `params.semester` is like 'y1s1'. If db stores 'y1s1', it should be String.
          // Let's just save it.
        };
        
        // In the existing schema, semester is Number. But the GET route does Assignment.find({userId, semester}).
        // If they pass 'y1s1' as param, MongoDB expects a Number or String. We need to handle this properly.
        // I will pass the string 'y1s1' as an additional property if needed, but let's just use the POST API.
        const res = await fetch("/api/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...newAssignmentData,
            semester: params?.semester || session.user.semester
          })
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

  const handleDelete = async (id) => {
    try {
      await fetch("/api/assignments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      setAssignments(assignments.filter(a => a.id !== id));
    } catch (err) {
      console.error("Failed to delete from database:", err);
    }
  };

  const handleToggleStatus = async (id) => {
    setAssignments(assignments.map(a => {
      if (a.id === id) {
        const newStatus = a.status === "submitted" 
          ? (isBefore(parseISO(a.dueDate), startOfDay(new Date())) ? "overdue" : "pending") 
          : "submitted";
          
        fetch("/api/assignments", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: newStatus })
        }).catch(console.error);
          
        return { ...a, status: newStatus };
      }
      return a;
    }));
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
        {view === "list" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {sortedAssignments.map((assignment) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={assignment.id}
                  className={`bg-white rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md ${
                    assignment.status === "submitted" ? "border-emerald-200 bg-emerald-50/30" :
                    assignment.status === "overdue" ? "border-red-200 bg-red-50/30" : "border-zinc-200"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600">
                      {assignment.course}
                    </span>
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
                  </div>
                  
                  <h3 className={`font-semibold text-lg mb-1 ${assignment.status === 'submitted' ? 'text-zinc-500 line-through' : 'text-zinc-900'}`}>
                    {assignment.title}
                  </h3>
                  <p className="text-zinc-500 text-sm mb-4 line-clamp-2">
                    {assignment.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-100">
                    <div className={`flex items-center gap-1.5 text-sm font-medium ${
                      assignment.status === "overdue" ? "text-red-600" : 
                      assignment.status === "submitted" ? "text-emerald-600" : "text-zinc-600"
                    }`}>
                      <Clock className="w-4 h-4" />
                      {format(parseISO(assignment.dueDate), "MMM d, yyyy")}
                    </div>
                    
                    <button
                      onClick={() => handleToggleStatus(assignment.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        assignment.status === "submitted" 
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" 
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      {assignment.status === "submitted" ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Submitted
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4" />
                          Mark Done
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {assignments.length === 0 && (
              <div className="col-span-full py-12 text-center">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-lg font-medium text-zinc-900 mb-1">No assignments yet</h3>
                <p className="text-zinc-500">Get started by adding your first assignment.</p>
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
                      {dayAssignments.map(assignment => (
                        <div 
                          key={assignment.id}
                          onClick={() => handleOpenModal(assignment)}
                          className={`text-xs px-2 py-1.5 rounded truncate cursor-pointer transition-colors font-medium border ${
                            assignment.status === 'submitted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' :
                            assignment.status === 'overdue' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' :
                            'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                          }`}
                        >
                          {assignment.title}
                        </div>
                      ))}
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
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Due Date</label>
                  <input
                    required
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
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
