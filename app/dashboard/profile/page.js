"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilePage() {
    const { data: session, status, update: updateSession } = useSession();
    const router = useRouter();

    // Profile state
    const [profile, setProfile] = useState({ name: "", email: "", role: "", year: null, semester: null });
    const [profileForm, setProfileForm] = useState({ name: "", email: "", year: "", semester: "" });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState("");
    const [profileSuccess, setProfileSuccess] = useState("");

    // Password state
    const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [pwLoading, setPwLoading] = useState(false);
    const [pwError, setPwError] = useState("");
    const [pwSuccess, setPwSuccess] = useState("");

    const [pageLoading, setPageLoading] = useState(true);

    // Toggle states
    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    // Fetch profile on mount
    useEffect(() => {
        if (status !== "authenticated") return;
        fetch("/api/profile")
            .then((r) => r.json())
            .then((data) => {
                setProfile(data);
                setProfileForm({ name: data.name || "", email: data.email || "", year: data.year || "", semester: data.semester || "" });
            })
            .catch(() => { })
            .finally(() => setPageLoading(false));
    }, [status]);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileError("");
        setProfileSuccess("");

        const emailRegex = /^[A-Za-z0-9._%+-]+@my\.sliit\.lk$/;
        if (!profileForm.name.trim()) return setProfileError("Name is required.");
        if (!emailRegex.test(profileForm.email)) return setProfileError("Email must be a valid @my.sliit.lk address.");

        setProfileLoading(true);
        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: profileForm.name.trim(), email: profileForm.email, year: profileForm.year, semester: profileForm.semester }),
            });
            const data = await res.json();
            if (!res.ok) return setProfileError(data.error || "Failed to update profile.");
            setProfile((prev) => ({ ...prev, name: data.name, email: data.email, year: data.year, semester: data.semester }));
            setProfileForm({ name: data.name, email: data.email, year: data.year || "", semester: data.semester || "" });
            setProfileSuccess("Profile updated successfully!");
            setIsEditing(false);
            await updateSession();
            setTimeout(() => setProfileSuccess(""), 4000);
        } catch {
            setProfileError("Something went wrong. Please try again.");
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPwError("");
        setPwSuccess("");

        if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword)
            return setPwError("All fields are required.");
        if (pwForm.newPassword.length < 6)
            return setPwError("New password must be at least 6 characters.");
        if (pwForm.newPassword !== pwForm.confirmPassword)
            return setPwError("New passwords do not match.");

        setPwLoading(true);
        try {
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pwForm),
            });
            const data = await res.json();
            if (!res.ok) return setPwError(data.error || "Failed to change password.");
            setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setPwSuccess("Password changed successfully!");
            setShowPassword(false);
            setTimeout(() => setPwSuccess(""), 4000);
        } catch {
            setPwError("Something went wrong. Please try again.");
        } finally {
            setPwLoading(false);
        }
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setProfileError("");
        setProfileForm({ name: profile.name || "", email: profile.email || "", year: profile.year || "", semester: profile.semester || "" });
    };

    const roleBadge = {
        admin: "bg-amber-100 text-amber-700 border-amber-200",
        lecturer: "bg-purple-100 text-purple-700 border-purple-200",
        student: "bg-sky-100 text-sky-700 border-sky-200",
    };

    if (status === "loading" || pageLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" />
                    <p className="text-slate-500 font-medium animate-pulse">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!session) return null;

    const avatarLetter = (profile.name || session.user?.name || "U").charAt(0).toUpperCase();

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-12">

            {/* Page Header */}
            <div className="mb-2">
                <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 font-semibold mb-2 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                    Back
                </button>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My Profile</h1>
                <p className="text-slate-500 mt-1 text-sm font-medium">View and manage your account information.</p>
            </div>

            {/* Success banner (shows after save) */}
            {profileSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 text-green-700 text-sm rounded-xl font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    {profileSuccess}
                </div>
            )}
            {pwSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 text-green-700 text-sm rounded-xl font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    {pwSuccess}
                </div>
            )}

            {/* ─── Profile Details Card ──────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                {/* Gradient banner */}
                <div className="h-20 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600" />

                <div className="px-6 pb-6 relative z-10">
                    {/* Avatar */}
                    <div className="-mt-8 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-extrabold shadow-lg border-4 border-white">
                            {avatarLetter}
                        </div>
                    </div>

                    {/* ── VIEW MODE (default) ── */}
                    {!isEditing ? (
                        <div>
                            {/* Name + Role */}
                            <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-1.5 rounded-full text-xs font-bold border capitalize ${roleBadge[profile.role] || roleBadge.student}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                                {profile.role}
                            </span>

                            {/* Details list */}
                            <div className="mt-5 space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Email</p>
                                        <p className="text-sm font-semibold text-slate-800">{profile.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 1 0-16 0" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Role</p>
                                        <p className="text-sm font-semibold text-slate-800 capitalize">{profile.role}</p>
                                    </div>
                                </div>
                                {profile.role === "student" && profile.year && (
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="w-8 h-8 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Academic</p>
                                            <p className="text-sm font-semibold text-slate-800">Year {profile.year} · Semester {profile.semester}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Edit Profile button */}
                            <button
                                onClick={() => { setIsEditing(true); setProfileError(""); setProfileSuccess(""); }}
                                className="mt-5 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                Edit Profile
                            </button>
                        </div>
                    ) : (
                        /* ── EDIT MODE ── */
                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">Edit Information</h3>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={profileForm.name}
                                    onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                                    placeholder="John Doe"
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={profileForm.email}
                                    onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                                    placeholder="you@my.sliit.lk"
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                                />
                                <p className="text-[11px] text-slate-400 mt-1 font-medium">Only @my.sliit.lk addresses are accepted.</p>
                            </div>

                            {/* Year & Semester — students only */}
                            {profile.role === "student" && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Year</label>
                                        <select
                                            value={profileForm.year}
                                            onChange={(e) => setProfileForm((p) => ({ ...p, year: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                                        >
                                            <option value="">Select Year</option>
                                            <option value="1">Year 1</option>
                                            <option value="2">Year 2</option>
                                            <option value="3">Year 3</option>
                                            <option value="4">Year 4</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Semester</label>
                                        <select
                                            value={profileForm.semester}
                                            onChange={(e) => setProfileForm((p) => ({ ...p, semester: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                                        >
                                            <option value="">Select Semester</option>
                                            <option value="1">Semester 1</option>
                                            <option value="2">Semester 2</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {profileError && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                    {profileError}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button type="button" onClick={cancelEdit} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all active:scale-[0.98] text-sm">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={profileLoading}
                                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 text-sm"
                                >
                                    {profileLoading ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                            Saving...
                                        </>
                                    ) : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* ─── Change Password Card ──────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <button
                    type="button"
                    onClick={() => { setShowPassword(!showPassword); setPwError(""); setPwSuccess(""); }}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-slate-800 text-sm">Change Password</h3>
                            <p className="text-xs text-slate-500 font-medium">Update your security credentials</p>
                        </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-slate-400 transition-transform ${showPassword ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
                </button>

                {showPassword && (
                    <form onSubmit={handlePasswordSubmit} className="px-6 pb-5 space-y-4 border-t border-slate-100 pt-4">
                        {[
                            { label: "Current Password", key: "currentPassword", placeholder: "••••••••" },
                            { label: "New Password", key: "newPassword", placeholder: "Min. 6 characters" },
                            { label: "Confirm New Password", key: "confirmPassword", placeholder: "Repeat new password" },
                        ].map(({ label, key, placeholder }) => (
                            <div key={key}>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
                                <input
                                    type="password"
                                    value={pwForm[key]}
                                    onChange={(e) => setPwForm((p) => ({ ...p, [key]: e.target.value }))}
                                    placeholder={placeholder}
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-400 transition-all"
                                />
                            </div>
                        ))}

                        {pwError && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                {pwError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={pwLoading}
                            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 text-sm"
                        >
                            {pwLoading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    Updating...
                                </>
                            ) : "Change Password"}
                        </button>
                    </form>
                )}
            </div>

        </div>
    );
}
