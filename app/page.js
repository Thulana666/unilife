"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  // Parallax background movement
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -200]);

  // Handle sticky navbar scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const navHeight = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navHeight;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  // Stagger variants for scroll reveals
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  return (
    <div className="font-sans text-slate-900 bg-white selection:bg-indigo-100 selection:text-indigo-800 overflow-x-hidden relative min-h-screen">

      {/* 1. Transparent Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? "bg-white/90 backdrop-blur-xl shadow-sm border-b border-slate-200 py-4" : "bg-transparent py-6"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0 flex items-center gap-3 cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-slate-900">
                UniLife<span className="text-indigo-600">.</span>
              </span>
            </motion.div>

            {/* Page Navigation */}
            <div className="hidden sm:flex items-center gap-6">
              <button onClick={() => scrollToSection('features')} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
                Features
              </button>
              <button onClick={() => scrollToSection('roles')} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
                Roles
              </button>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3 sm:gap-4">
              <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 px-4 py-2 transition-colors">
                Login
              </Link>
              <Link href="/register" className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 border border-indigo-700/20 shadow-md shadow-indigo-200 transition-all hover:scale-105 active:scale-95">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Animated Background */}
      <div className="absolute top-0 inset-0 overflow-hidden pointer-events-none z-0 min-h-screen">
        <motion.div style={{ y: y1 }} className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-indigo-100 blur-[120px] opacity-60"></motion.div>
        <motion.div style={{ y: y2 }} className="absolute top-[10%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-purple-100 blur-[120px] opacity-60"></motion.div>
        <motion.div style={{ y: y1 }} className="absolute -bottom-[20%] left-[20%] w-[45vw] h-[45vw] rounded-full bg-sky-100 blur-[120px] opacity-60"></motion.div>
      </div>

      {/* 2. Hero Section */}
      <div className="relative z-10 pt-40 pb-20 sm:pt-48 sm:pb-32 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl min-h-[90vh] flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-8 overflow-visible">

        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 w-full flex flex-col items-center text-center lg:items-start lg:text-left pt-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[13px] font-bold tracking-wide mb-8">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400"></span>
            </span>
            Smart Student Productivity Platform
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
            UniLife <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500">Redefined.</span>
          </h1>

          <p className="mt-4 text-lg md:text-xl text-slate-600 max-w-xl mb-10 leading-relaxed font-medium">
            All-in-one system to manage assignments, study plans, notes, and university communication seamlessly in one organized workspace.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link href="/register">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-full text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 shadow-xl shadow-indigo-500/20 transition-all border border-indigo-400/20">
                Get Started
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </motion.button>
            </Link>
            <Link href="/login">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 border border-slate-200 text-base font-bold rounded-full text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all">
                Login
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Right Animated Cards */}
        <div className="flex-1 w-full relative h-[500px] hidden lg:block perspective-[1000px]">
          {/* Assignment Card */}
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[5%] left-[5%] z-30"
          >
            <div className="w-64 bg-white border border-slate-200 p-5 rounded-3xl shadow-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /><path d="m16 13 2 2 4-4" /></svg>
              </div>
              <div>
                <p className="text-slate-900 font-bold text-sm">Assignment</p>
                <p className="text-slate-500 text-xs mt-0.5">Due in 2 days</p>
              </div>
            </div>
          </motion.div>

          {/* Chat Card */}
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: [20, 0, 20] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-[18%] right-[0%] z-20"
          >
            <div className="w-80 bg-white border border-slate-200 p-5 rounded-3xl shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 text-xs font-bold">L</div>
                <p className="text-slate-600 text-xs font-semibold">Prof. Sarah announced:</p>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                <p className="text-indigo-700 text-[13px] font-medium leading-relaxed">Tomorrow&apos;s lecture is moved to Room 302. Please review chapter 4 beforehand.</p>
              </div>
            </div>
          </motion.div>

          {/* Study Planner Card */}
          <motion.div
            initial={{ y: -10 }}
            animate={{ y: [-10, 15, -10] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute bottom-[20%] left-[25%] z-40"
          >
            <div className="w-64 bg-white border border-slate-200 p-5 rounded-3xl shadow-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
              </div>
              <div>
                <p className="text-slate-900 font-bold text-sm">Study Block</p>
                <p className="text-emerald-700 text-xs font-semibold bg-emerald-100 inline-block px-2 py-0.5 rounded-full mt-1">Active Now</p>
              </div>
            </div>
          </motion.div>

          {/* Notes Card */}
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className="absolute top-[52%] right-[0%] z-50"
          >
            <div className="w-60 bg-white border border-slate-200 p-4 rounded-3xl shadow-lg flex items-center gap-4 opacity-90">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              </div>
              <div>
                <p className="text-slate-900 font-bold text-sm line-clamp-1">Chapter_4_Notes.pdf</p>
                <p className="text-slate-500 text-xs mt-0.5">Added by Alice</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 4. Features Section */}
      <div id="features" className="py-24 sm:py-32 relative z-10 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <h2 className="text-indigo-600 font-bold tracking-widest uppercase text-xs sm:text-sm mb-4">Core Engine</h2>
            <p className="text-3xl font-extrabold text-slate-900 sm:text-5xl tracking-tight leading-tight">
              Everything you need to excel.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
          >

            {/* Feature 1 */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white rounded-[2rem] p-8 border border-slate-100 hover:border-blue-200 hover:shadow-[0_8px_30px_rgba(59,130,246,0.12)] transition-all duration-300 relative overflow-hidden group shadow-sm"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-8 ring-1 ring-blue-500/20 shadow-inner shadow-blue-500/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /><path d="m16 13 2 2 4-4" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Assignment Tracker</h3>
              <p className="text-slate-500 leading-relaxed text-[15px]">Track deadlines and manage assignments easily. Never miss another important project submission.</p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white rounded-[2rem] p-8 border border-slate-100 hover:border-emerald-200 hover:shadow-[0_8px_30px_rgba(16,185,129,0.12)] transition-all duration-300 relative overflow-hidden group shadow-sm"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-8 ring-1 ring-emerald-500/20 shadow-inner shadow-emerald-500/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Study Planner</h3>
              <p className="text-slate-500 leading-relaxed text-[15px]">Organize your weekly study schedule with clear visual timelines and dedicated focus blocks to maximize efficiency.</p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white rounded-[2rem] p-8 border border-slate-100 hover:border-amber-200 hover:shadow-[0_8px_30px_rgba(245,158,11,0.12)] transition-all duration-300 relative overflow-hidden group shadow-sm"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mb-8 ring-1 ring-amber-500/20 shadow-inner shadow-amber-500/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-3a2 2 0 0 1-2-2V2" /><path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2Z" /><path d="M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Notes Sharing</h3>
              <p className="text-slate-500 leading-relaxed text-[15px]">Access and share study materials seamlessly in the cloud. Store and retrieve vital lecture notes instantly.</p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white rounded-[2rem] p-8 border border-slate-100 hover:border-violet-200 hover:shadow-[0_8px_30px_rgba(139,92,246,0.12)] transition-all duration-300 relative overflow-hidden group shadow-sm"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="w-16 h-16 bg-violet-500/10 text-violet-400 rounded-2xl flex items-center justify-center mb-8 ring-1 ring-violet-500/20 shadow-inner shadow-violet-500/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M13 8H7" /><path d="M17 12H7" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Community Chat</h3>
              <p className="text-slate-500 leading-relaxed text-[15px]">Chat with students and lecturers in real-time within dedicated academic semester rooms.</p>
            </motion.div>

          </motion.div>
        </div>
      </div>

      {/* 5. Roles Section */}
      <div id="roles" className="py-24 sm:py-32 relative z-10 overflow-hidden bg-white border-t border-slate-100">
        {/* Light abstract bg decoration */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[40rem] h-[40rem] rounded-full bg-indigo-50 blur-3xl opacity-60 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-indigo-600 font-bold tracking-widest uppercase text-xs sm:text-sm mb-4">Access Control</h2>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900 mb-4">Role-Based Granular Permissions</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">Securely scopes operational permissions dynamically based on user identity, enabling fluid collaboration tailored to your position.</p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 text-left"
          >
            {/* Student */}
            <motion.div
              variants={itemVariants}
              className="bg-slate-50 border border-slate-100 rounded-[2rem] p-10 hover:bg-white hover:shadow-md hover:border-slate-200 transition-all"
            >
              <div className="w-14 h-14 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center mb-6 ring-1 ring-sky-500/20 shadow-inner shadow-sky-500/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Student</h3>
              <p className="text-slate-500 leading-relaxed text-[15px]">Manage assignments, planner, notes, chat. Participate intimately in live semester chat rooms and track personal deadlines.</p>
            </motion.div>

            {/* Lecturer */}
            <motion.div
              variants={itemVariants}
              className="bg-slate-50 border border-slate-100 rounded-[2rem] p-10 hover:bg-white hover:shadow-md hover:border-slate-200 transition-all"
            >
              <div className="w-14 h-14 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6 ring-1 ring-purple-500/20 shadow-inner shadow-purple-500/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Lecturer</h3>
              <p className="text-slate-500 leading-relaxed text-[15px]">Send high-level broadcast notices, manage notes remotely, communicate with students effectively across semesters.</p>
            </motion.div>

            {/* Admin */}
            <motion.div
              variants={itemVariants}
              className="bg-slate-50 border border-slate-100 rounded-[2rem] p-10 relative overflow-hidden hover:bg-white hover:shadow-md hover:border-slate-200 transition-all"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-[100px]"></div>
              <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6 ring-1 ring-amber-500/20 shadow-inner shadow-amber-500/10 relative z-10">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path></svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3 relative z-10 tracking-tight">Admin</h3>
              <p className="text-slate-500 leading-relaxed text-[15px] relative z-10">Manage system, users, semesters, and individual features. Oversee all global chat spaces and purge restrictive content.</p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* 6. Call To Action Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="py-24 sm:py-32 relative overflow-hidden w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 rounded-[3rem] p-12 md:p-20 text-center border border-white/20 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -translate-x-1/2 translate-y-1/2"></div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-8 relative z-10 leading-tight">
            Start Your UniLife <br className="hidden sm:block" /> Journey Today
          </h2>
          <Link href="/register" className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold rounded-full text-indigo-900 bg-white hover:bg-slate-50 shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all hover:scale-105 active:scale-95 relative z-10">
            Create Account
          </Link>
        </div>
      </motion.div>

      {/* 7. Footer */}
      <footer className="border-t border-slate-200 py-12 relative z-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <p className="text-sm font-medium text-slate-400">
            &copy; {new Date().getFullYear()} UniLife Team. All rights reserved.
          </p>
        </div>
      </footer>

    </div >
  );
}
