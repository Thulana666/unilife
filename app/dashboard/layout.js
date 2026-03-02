"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    // Sidebar state management
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
        // Note: We don't perform role-to-dashboard redirects here
        // because that's now handled by individual page components
        // and layout needs to be flexible enough to render routes like /dashboard/admin
    }, [status, router]);

    // Handle responsive auto-collapse on window resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) { // Tailwind's 'lg' breakpoint
                setIsCollapsed(true);
            } else {
                setIsCollapsed(false);
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (status === "loading" || !session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Loading workspace...</p>
                </div>
            </div>
        );
    }

    const role = session.user?.role || "student";
    const year = session.user?.year || 1;
    const semester = session.user?.semester || 1;

    // Define navigation items based on role
    // This centralizes the menu structure for easy updates
    const navigation = {
        common: [
            { name: "Dashboard", href: role === "admin" ? "/dashboard/admin" : role === "lecturer" ? "/dashboard/lecturer" : "/dashboard", icon: "LayoutDashboard" },
        ],
        student: [
            { name: "Assignments", href: "/dashboard/assignments", icon: "BookOpenCheck" },
            { name: "Study Planner", href: "/dashboard/planner", icon: "Calendar" },
            { name: "Notes", href: "/dashboard/notes", icon: "Files" },
            { name: "Community Chat", href: `/dashboard/chat/y${year}s${semester}`, icon: "MessageSquareText" },
        ],
        lecturer: [
            { name: "Manage Notes", href: "/dashboard/lecturer/notes", icon: "Library" },
            { name: "Manage Assignments", href: "/dashboard/lecturer/assignments", icon: "FileSignature" },
            { name: "Community Chat", href: "/dashboard/lecturer/chat", icon: "MessageSquareText" },
        ],
        admin: [
            { name: "Manage Assignments", href: "/dashboard/admin/assignments", icon: "BookOpenCheck" },
            { name: "Manage Planner", href: "/dashboard/admin/planner", icon: "Calendar" },
            { name: "Manage Notes", href: "/dashboard/admin/notes", icon: "Files" },
            { name: "System Chat", href: "/dashboard/admin/semesters", icon: "MessageSquareText" },
            { name: "Create User", href: "/dashboard/admin/create-user", icon: "UserPlus" },
            { name: "Manage Users", href: "/dashboard/admin/users", icon: "Users" },
        ]
    };

    const getRoleNavItems = () => {
        let items = [...navigation.common];
        if (role === "student") items = [...items, ...navigation.student];
        if (role === "lecturer") items = [...items, ...navigation.lecturer];
        if (role === "admin") items = [...items, ...navigation.admin];
        return items;
    };

    const navItems = getRoleNavItems();

    // Simple icon renderer helper without importing lucide-react yet
    const renderIcon = (iconName) => {
        switch (iconName) {
            case "LayoutDashboard": return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>;
            case "BookOpenCheck": return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /><path d="m16 13 2 2 4-4" /></svg>;
            case "Calendar": return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>;
            case "Files": return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-3a2 2 0 0 1-2-2V2" /><path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2Z" /><path d="M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8" /></svg>;
            case "MessageSquareText": return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M13 8H7" /><path d="M17 12H7" /></svg>;
            case "Library": return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6 4 14" /><path d="M12 6v14" /><path d="M8 8v12" /><path d="M4 4v16" /></svg>;
            case "FileSignature": return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 19.5v.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8.5L18 5.5" /><path d="M8 18h1" /><path d="M18.42 9.61a2.1 2.1 0 1 1 2.97 2.97L16.95 17 13 18l.99-3.95 4.43-4.44Z" /></svg>;
            case "UserPlus": return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" /></svg>;
            case "Users": return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
            case "Activity": return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>;
            default: return null;
        }
    }

    return (
        <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">

            {/* Mobile Sidebar Overlay */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-slate-900/60 z-20 backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar Navigation */}
            <aside
                className={`bg-slate-900 text-white flex-shrink-0 flex flex-col z-30 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${isCollapsed ? "w-[76px]" : "w-64"}
        ${isMobileOpen ? "translate-x-0 fixed inset-y-0 left-0" : "-translate-x-full lg:translate-x-0 relative"}`}
            >
                {/* Brand / Logo Area */}
                <div className={`h-16 flex items-center border-b border-white/10 shrink-0 ${isCollapsed ? 'justify-center' : 'px-6'}`}>
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-sm transform -rotate-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
                    </div>
                    <span
                        className={`font-bold text-xl tracking-wide text-indigo-50 ml-3 transition-opacity duration-300 whitespace-nowrap
            ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}
                    >
                        UniLife
                    </span>
                </div>

                {/* Sidebar Links */}
                <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-1 custom-scrollbar overflow-x-hidden">
                    <p className={`text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 transition-all duration-300 whitespace-nowrap
            ${isCollapsed ? 'px-0 text-center scale-90' : 'px-6'}`}>
                        {isCollapsed ? '---' : 'Menu'}
                    </p>

                    <nav className="space-y-1 px-3">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    title={isCollapsed ? item.name : ""} // Tooltip when collapsed
                                    className={`flex items-center rounded-lg font-medium transition-all group py-2.5 relative
                    ${isCollapsed ? 'justify-center px-0 w-12 mx-auto' : 'px-3 gap-3'}
                    ${isActive
                                            ? "bg-indigo-500/15 text-indigo-400"
                                            : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
                                        }`}
                                >
                                    {/* Left active indicator line */}
                                    {isActive && (
                                        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-500 rounded-r-md"></div>
                                    )}

                                    <span className={`flex-shrink-0 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100 transition-opacity'}`}>
                                        {renderIcon(item.icon)}
                                    </span>

                                    <span className={`transition-all duration-300 whitespace-nowrap
                    ${isCollapsed ? 'opacity-0 w-0 absolute' : 'opacity-100'}
                    ${isActive ? 'font-semibold' : ''}`}
                                    >
                                        {item.name}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Sidebar Footer (Logout) */}
                <div className="p-4 border-t border-white/10 shrink-0">
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        title={isCollapsed ? "Logout" : ""}
                        className={`flex items-center rounded-lg font-medium text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors group py-2.5
              ${isCollapsed ? 'justify-center px-0 w-12 mx-auto' : 'px-3 gap-3 w-full'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 opacity-70 group-hover:opacity-100"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        <span className={`transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'opacity-0 w-0 absolute' : 'opacity-100'}`}>
                            Logout
                        </span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50 relative h-screen overflow-hidden">

                {/* Topbar Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0 shadow-sm z-10 sticky top-0">

                    {/* Left section: Toggle + Brand (mobile) / Welcome (desktop) */}
                    <div className="flex items-center gap-4">
                        {/* Desktop Collapse Toggle */}
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="hidden lg:flex items-center justify-center p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            aria-label="Toggle Sidebar"
                        >
                            {isCollapsed ? (
                                // Hamburger Menu
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                            ) : (
                                // Sidebar Collapse Icon
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><line x1="9" x2="9" y1="3" y2="21" /></svg>
                            )}
                        </button>

                        {/* Mobile Expand Toggle */}
                        <button
                            onClick={() => setIsMobileOpen(true)}
                            className="lg:hidden flex items-center justify-center p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                        </button>

                        {/* Desktop Welcome Text */}
                        <div className="hidden lg:block lg:ml-2">
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Welcome back, {session.user?.name || "User"}</h2>
                            <p className="text-sm text-slate-500 font-medium">Here&apos;s what is happening with your academic life today.</p>
                        </div>

                        {/* Mobile Brand Name */}
                        <div className="lg:hidden font-bold text-lg text-slate-800 tracking-tight">UniLife</div>
                    </div>

                    {/* Right section: Role + Avatar */}
                    <div className="flex items-center gap-3 md:gap-4 shrink-0">

                        {/* Role Badge */}
                        <div className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 shadow-sm border whitespace-nowrap
              ${role === 'admin' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                role === 'lecturer' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                    'bg-sky-50 text-sky-700 border-sky-200'
                            }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${role === 'admin' ? 'bg-amber-500' : role === 'lecturer' ? 'bg-purple-500' : 'bg-sky-500'}`}></div>
                            <span className="hidden sm:inline">{role}</span>
                            <span className="sm:hidden">{role.charAt(0)}</span>
                        </div>

                        {/* User Profile Avatar */}
                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold shadow-sm cursor-pointer hover:bg-indigo-200 transition-colors shrink-0">
                            {(session.user?.name || "?").charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* Page Content Viewport */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto w-full p-4 md:p-6 lg:p-8 custom-scrollbar">
                    <div className="mx-auto max-w-7xl h-full">
                        {children}
                    </div>
                </main>
            </div>

        </div>
    );
}
