"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ManageUsers() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteStatus, setDeleteStatus] = useState({ show: false, message: "", type: "" });
  const [activeTab, setActiveTab] = useState("all");
  const [userToDelete, setUserToDelete] = useState(null);

  // Auth Protection
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  // Fetch Users
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      fetchUsers();
    }
  }, [status, session]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();

      // Assume API returns { users: [...] } or just [...]
      const usersList = Array.isArray(data) ? data : (data.users || []);
      setUsers(usersList);
      setFilteredUsers(usersList);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter Users
  useEffect(() => {
    if (activeTab === "all") {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter(user => user.role === activeTab));
    }
  }, [activeTab, users]);

  // Delete Handler
  const confirmDelete = (user) => {
    setUserToDelete(user);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    // Optimistic UI update could go here, but we'll wait for API for safety
    try {
      const res = await fetch(`/api/admin/users/delete?id=${userToDelete._id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete user");

      // Success
      setDeleteStatus({ show: true, message: `Successfully deleted ${userToDelete.name}`, type: "success" });
      setUsers(users.filter(u => u._id !== userToDelete._id));

      // Hide message after 3 seconds
      setTimeout(() => setDeleteStatus({ show: false, message: "", type: "" }), 3000);

    } catch (err) {
      setDeleteStatus({ show: true, message: err.message || "Error deleting user", type: "error" });
      setTimeout(() => setDeleteStatus({ show: false, message: "", type: "" }), 3000);
    } finally {
      setUserToDelete(null);
    }
  };

  // Utility to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: 'numeric', month: 'short', day: 'numeric'
    }).format(date);
  };

  // Get Role Badge Styling
  const getRoleBadge = (role) => {
    const badges = {
      admin: "bg-indigo-100 text-indigo-800 border-indigo-200",
      lecturer: "bg-emerald-100 text-emerald-800 border-emerald-200",
      student: "bg-amber-100 text-amber-800 border-amber-200"
    };
    return badges[role] || "bg-slate-100 text-slate-800 border-slate-200";
  };


  if (status === "loading" || (isLoading && users.length === 0 && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading Directory...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Back Navigation */}
        <div>
          <Link
            href="/dashboard/admin"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to Admin Dashboard
          </Link>
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">User Management</h1>
            <p className="text-slate-500 mt-2 text-lg">
              View, filter, and manage all platform users
            </p>
          </div>
          <Link
            href="/dashboard/admin/create-user"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add New User
          </Link>
        </div>

        {/* Status Alerts */}
        {deleteStatus.show && (
          <div className={`px-4 py-3 rounded-xl flex items-start gap-3 border ${deleteStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              {deleteStatus.type === 'success'
                ? <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                : <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              }
            </svg>
            <span>{deleteStatus.message}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            {error}
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">

          {/* Filter Tabs */}
          <div className="border-b border-slate-200 bg-slate-50/50 px-4 sm:px-6 py-3 flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Users' },
              { id: 'student', label: 'Students' },
              { id: 'lecturer', label: 'Lecturers' },
              { id: 'admin', label: 'Admins' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id
                    ? 'bg-white shadow-sm border border-slate-200 text-indigo-600'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent'
                  }`}
              >
                {tab.label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                  {tab.id === 'all' ? users.length : users.filter(u => u.role === tab.id).length}
                </span>
              </button>
            ))}
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4 font-semibold">User Details</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold md:table-cell hidden">Academic Info</th>
                  <th className="px-6 py-4 font-semibold lg:table-cell hidden">Joined Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">

                {isLoading && users.length > 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                      <div className="animate-pulse flex items-center justify-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-indigo-400"></div>
                        <div className="w-4 h-4 rounded-full bg-indigo-400 animation-delay-200"></div>
                        <div className="w-4 h-4 rounded-full bg-indigo-400 animation-delay-400"></div>
                      </div>
                    </td>
                  </tr>
                )}

                {!isLoading && filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                      </div>
                      <p className="font-medium text-lg text-slate-900">No users found</p>
                      <p className="text-sm mt-1">There are currently no {activeTab === 'all' ? '' : activeTab} users in the directory.</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id || user.email} className="hover:bg-slate-50/80 transition-colors group">

                      {/* Name & Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0">
                            {user.name ? user.name.charAt(0).toUpperCase() : "?"}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{user.name}</div>
                            <div className="text-sm text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${getRoleBadge(user.role)}`}>
                          {user.role}
                        </span>
                      </td>

                      {/* Academic Info (Year/Sem) */}
                      <td className="px-6 py-4 md:table-cell hidden">
                        {user.role === 'student' ? (
                          <div className="text-sm">
                            <div className="font-medium text-slate-700">Year {user.year || "N/A"}</div>
                            <div className="text-slate-500">Semester {user.semester || "N/A"}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm italic">-</span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4 lg:table-cell hidden text-sm text-slate-500">
                        {user.createdAt ? formatDate(user.createdAt) : "N/A"}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => confirmDelete(user)}
                          disabled={user.email === session?.user?.email} // Prevent self-deletion
                          className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={user.email === session?.user?.email ? "Cannot delete active session" : "Delete User"}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer (Pagination stub) */}
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Showing <span className="font-medium text-slate-900">{filteredUsers.length}</span> users
            </span>
          </div>

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100 overflow-hidden transform transition-all translate-y-0 opacity-100 scale-100 animate-in fade-in zoom-in-95 duration-200">

            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>

            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Delete User Account</h3>
            <p className="text-center text-slate-500 mb-6">
              Are you sure you want to delete <strong className="text-slate-700">{userToDelete.name}</strong>? This action cannot be undone and will permanently remove their data from UniLife.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors focus:ring-4 focus:ring-red-100"
              >
                Yes, Delete
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}