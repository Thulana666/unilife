"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";

export default function CommunityChat() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Extract year and semester from route params like "y3s2"
  const routeParam = params?.semester || "";
  let year = "1";
  let semester = "1";

  const match = routeParam.toLowerCase().match(/y(\d+)s(\d+)/);
  if (match) {
    year = match[1];
    semester = match[2];
  }

  // Auth Protection & Role Bypass
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      const userRole = session?.user?.role;
      const userYear = session?.user?.year;
      const userSemester = session?.user?.semester;

      // Only block 'student' role if they don't match the current semester room
      if (userRole === "student" && (userYear != year || userSemester != semester)) {
        router.push("/dashboard");
      }

      // Admin and Lecturers automatically bypass the block
    }
  }, [status, session, year, semester, router]);

  // Load Messages API Call & Polling mechanism
  useEffect(() => {
    if (status === "authenticated") {
      fetchMessages();
      // Poll every 5 seconds since we aren't using WebSockets
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [status, year, semester]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat?year=${year}&semester=${semester}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();

      const incomingMessages = Array.isArray(data) ? data : (data.messages || []);

      setMessages((prev) => {
        // Only update if array lengths are different to prevent react re-render flashes,
        // (A more robust solution in production would compare IDs or last message timestamps)
        if (prev.length !== incomingMessages.length) {
          return incomingMessages;
        }
        return prev;
      });

    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll to Bottom Logic
  useEffect(() => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, shouldAutoScroll, attachedFile]); // also scroll if attachment added

  // Stop auto-scrolling if user scrolls up manually
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShouldAutoScroll(isAtBottom);
  };

  // Trigger hidden file input
  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  // Handle local file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size (Optional: Limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File is too large. Maximum size is 10MB.");
      return;
    }

    setAttachedFile(file);
    setShouldAutoScroll(true);
    e.target.value = ''; // Reset input so same file can be selected again if needed
  };

  const clearAttachment = () => {
    setAttachedFile(null);
  };

  const handleSendMessage = async (e, isNoticeFlag = false) => {
    if (e) e.preventDefault();
    if ((!newMessage.trim() && !attachedFile) || !session || isUploading) return;

    const messageText = newMessage;
    const currentAttachment = attachedFile;

    setNewMessage("");
    setAttachedFile(null);
    setShouldAutoScroll(true);

    try {
      if (currentAttachment) {
        setIsUploading(true);
      } else {
        // Optimistic UI for text-only messages
        const tempMessage = {
          _id: `temp-${Date.now()}`,
          text: messageText,
          sender: session.user.name || "Student",
          email: session.user.email,
          timestamp: new Date().toISOString(),
          isNotice: isNoticeFlag,
          isOptimistic: true
        };
        setMessages(prev => [...prev, tempMessage]);
      }

      // Prepare FormData for multipart upload
      const formData = new FormData();
      formData.append("text", messageText);
      formData.append("sender", session.user.name || "Student");
      formData.append("email", session.user.email);
      formData.append("year", year);
      formData.append("semester", semester);
      formData.append("isNotice", isNoticeFlag);
      if (currentAttachment) {
        formData.append("file", currentAttachment);
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        body: formData, // fetch automatically sets multipart headers for FormData
      });

      if (res.ok) {
        fetchMessages();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!messageId) return;

    // Optional confirm prompt for safety
    if (!window.confirm("Are you sure you want to permanently delete this message?")) return;

    try {
      const res = await fetch(`/api/chat?messageId=${messageId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Optimistically remove from UI
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      } else {
        alert("Failed to delete message. Check console for details.");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  // Time formatter helper
  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isImage = (fileName = "", fileType = "") => {
    if (fileType && fileType.startsWith('image/')) return true;
    const ext = fileName?.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  };

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext)) return "📄";
    if (['doc', 'docx'].includes(ext)) return "📝";
    if (['zip', 'rar', '7z'].includes(ext)) return "🗜️";
    if (['xls', 'xlsx', 'csv'].includes(ext)) return "📊";
    return "📎";
  };


  // Views Setup based on Auth + Data Loading
  if (status === "loading" || (isLoading && messages.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="flex flex-col items-center gap-5">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-indigo-200 opacity-50"></div>
            <div className="relative animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-indigo-600"></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          </div>
          <p className="text-slate-600 font-bold tracking-wide animate-pulse">Syncing Conversation...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">

      {/* Top Navbar Header */}
      <header className="h-16 md:h-[72px] bg-white border-b border-slate-200 px-4 xl:px-8 flex items-center justify-between shrink-0 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] z-20 relative">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/dashboard" className="p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors hidden sm:flex">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </Link>

          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full z-10"></span>
            </div>

            <div className="flex flex-col justify-center">
              <h1 className="text-lg md:text-[19px] font-extrabold text-slate-800 leading-tight tracking-tight">Community Chat</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1.5 text-[11px] md:text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wide">
                  Year {year} • Sem {semester}
                </span>
                <span className="hidden sm:inline-block text-xs text-slate-400 font-medium tracking-tight">
                  <span className="mx-1">•</span> {messages.length} Messages
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center text-right mr-2">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800 leading-tight">{session.user?.name || "Student"}</span>
              <span className="text-[11px] font-medium text-slate-500">{session.user?.email}</span>
            </div>
          </div>

          <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-600 font-bold overflow-hidden">
            {session.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all ml-1"
            title="Sign Out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-hidden flex flex-col w-full bg-[#f8fafc] relative">

        {/* Chat Background Pattern (Subtle) */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%23000000\\' fill-opacity=\\'1\\'%3E%3Cpath d=\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>

        {/* Messages Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-12 lg:px-24 py-6 scroll-smooth z-10 custom-scrollbar"
        >

          {/* Welcome Banner */}
          <div className="flex flex-col items-center justify-center pb-10 pt-4 max-w-lg mx-auto text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-3xl flex items-center justify-center mb-4 transform -rotate-3 shadow-sm border border-indigo-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" /><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" /></svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">
              End-to-End Encrypted Chat
            </h2>
            <p className="text-sm font-medium text-slate-500 leading-relaxed">
              This space is for <strong className="text-indigo-600">Year {year} • Sem {semester}</strong> students. Share notes, discuss assignments, and help each other out!
            </p>
          </div>

          {/* Empty State vs Message Map */}
          {messages.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center mt-8 text-slate-400">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-5">
                <span className="text-4xl text-slate-300">👋</span>
              </div>
              <p className="text-xl font-bold text-slate-700">It&apos;s quiet in here</p>
              <p className="text-base text-slate-500 font-medium mt-1">Be the first to start the conversation.</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-w-5xl mx-auto pb-4">
              {messages.map((msg, idx) => {

                // Determine ownership
                const isMe = (msg.email && msg.email === session.user.email) || (!msg.email && msg.sender === session.user.name);

                // Check grouping logic
                const prevMsg = idx > 0 ? messages[idx - 1] : null;
                const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;

                const isConsecutivePrev = prevMsg && ((prevMsg.email && prevMsg.email === msg.email) || (!prevMsg.email && prevMsg.sender === msg.sender));
                const isConsecutiveNext = nextMsg && ((nextMsg.email && nextMsg.email === msg.email) || (!nextMsg.email && nextMsg.sender === msg.sender));

                // dynamic margins
                const blockMargin = isConsecutivePrev ? 'mt-1' : 'mt-6';

                // File parsing
                const hasAttachment = !!msg.fileUrl;
                const isMsgImage = hasAttachment && isImage(msg.fileName, msg.fileType);

                // Bubble corner radius logic
                let bubbleClass = isMe
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-white text-slate-800 shadow-sm border border-slate-200/60";

                let radiusClass = "";
                if (isMe) {
                  radiusClass = "rounded-2xl rounded-tr-sm";
                  if (isConsecutivePrev && isConsecutiveNext) radiusClass = "rounded-2xl rounded-tr-sm rounded-br-sm";
                  else if (isConsecutivePrev && !isConsecutiveNext) radiusClass = "rounded-2xl rounded-br-sm";
                  else if (!isConsecutivePrev && isConsecutiveNext) radiusClass = "rounded-2xl rounded-tr-sm";
                } else {
                  radiusClass = "rounded-2xl rounded-tl-sm";
                  if (isConsecutivePrev && isConsecutiveNext) radiusClass = "rounded-2xl rounded-tl-sm rounded-bl-sm";
                  else if (isConsecutivePrev && !isConsecutiveNext) radiusClass = "rounded-2xl rounded-bl-sm";
                  else if (!isConsecutivePrev && isConsecutiveNext) radiusClass = "rounded-2xl rounded-tl-sm";
                }

                // Render Notice Message styling
                if (msg.isNotice) {
                  return (
                    <div key={msg._id || idx} className="flex justify-center w-full my-6 relative group px-2">
                      <div className="bg-[#FFF8E6] border border-[#FFE58F] shadow-sm rounded-2xl p-4 sm:p-5 w-full max-w-[90%] sm:max-w-[75%] relative overflow-hidden flex flex-col items-center text-center">
                        <div className="absolute top-0 left-0 w-full h-1 bg-amber-400"></div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="text-amber-500 bg-amber-100 rounded-md p-1.5 flex items-center justify-center shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </div>
                          <span className="text-sm sm:text-base font-extrabold text-amber-600 tracking-widest uppercase">Special Notice</span>
                        </div>
                        <p className="text-slate-800 font-bold text-[15px] sm:text-[17px] leading-relaxed break-words whitespace-pre-wrap">
                          {msg.text}
                        </p>
                        <div className="mt-4 flex items-center text-xs font-bold text-amber-600/70 bg-amber-100/50 px-3 py-1 rounded-full gap-2 shrink-0">
                          <span>Sent by {msg.sender}</span>
                          <span className="w-1 h-1 rounded-full bg-amber-300"></span>
                          <span>{formatTime(msg.timestamp || new Date().toISOString())}</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg._id || idx} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${blockMargin} relative group`}>

                    {/* Sender Avatar Column */}
                    {!isMe && (
                      <div className="w-9 shrink-0 flex flex-col justify-end pb-1 mr-2 relative">
                        {!isConsecutiveNext && (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 text-white flex items-center justify-center text-xs font-bold shadow-sm select-none absolute bottom-0">
                            {msg.sender ? msg.sender.charAt(0).toUpperCase() : "?"}
                          </div>
                        )}
                      </div>
                    )}

                    <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-[65%] ${isMe ? 'items-end' : 'items-start'}`}>

                      {/* Sender Name label */}
                      {!isMe && !isConsecutivePrev && (
                        <span className="text-[12px] font-bold text-slate-500 ml-1 mb-1.5 tracking-tight">{msg.sender}</span>
                      )}

                      {/* Actual Chat Bubble */}
                      <div className={`relative ${hasAttachment && !msg.text ? 'p-1.5' : 'px-4 py-2.5'} text-[15px] transform transition-all 
                        ${bubbleClass} ${radiusClass} 
                        ${msg.isOptimistic ? 'opacity-70 scale-[0.98]' : 'scale-100'} break-words whitespace-pre-wrap leading-relaxed`}>

                        {/* ATTACHMENT */}
                        {hasAttachment && (
                          <div className={`overflow-hidden ${msg.text ? 'mb-2' : ''} ${isMe ? 'bg-indigo-700/40 rounded-xl' : 'bg-slate-50 rounded-xl border border-slate-100'}`}>
                            {isMsgImage ? (
                              <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="block relative group/img cursor-zoom-in">
                                <img
                                  src={msg.fileUrl}
                                  alt={msg.fileName || "Attachment"}
                                  className="max-w-full max-h-72 object-contain rounded-xl transition-all duration-300 group-hover/img:brightness-90"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                  <div className="bg-black/50 p-2 rounded-full text-white backdrop-blur-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                                  </div>
                                </div>
                              </a>
                            ) : (
                              <div className="p-3 sm:p-4 flex items-center gap-3 w-full sm:min-w-[260px]">
                                <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-xl shadow-sm ${isMe ? 'bg-indigo-500 text-white border border-indigo-400' : 'bg-white text-slate-600 border border-slate-200'}`}>
                                  {getFileIcon(msg.fileName)}
                                </div>
                                <div className="flex-1 min-w-0 pr-2">
                                  <p className={`text-[14px] leading-tight font-bold truncate ${isMe ? 'text-white' : 'text-slate-700'}`}>
                                    {msg.fileName || "Document"}
                                  </p>
                                  <a
                                    href={msg.fileUrl}
                                    target="_blank"
                                    download
                                    className={`text-[12px] font-bold hover:underline inline-flex items-center gap-1 mt-1 transition-colors ${isMe ? 'text-indigo-200 hover:text-white' : 'text-indigo-600 hover:text-indigo-800'}`}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                    Download File
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Text */}
                        {msg.text && (
                          <div className={hasAttachment ? 'px-1' : ''}>
                            {msg.text}
                          </div>
                        )}

                        {/* Timestamp & Admin Controls */}
                        <div className={`flex items-center justify-end gap-1.5 mt-1.5 -mb-0.5 select-none ${hasAttachment && !msg.text ? 'absolute bottom-3 right-3 bg-black/40 text-white px-2 py-0.5 rounded-full backdrop-blur-md' : (isMe ? 'text-indigo-200' : 'text-slate-400')}`}>
                          <span className="text-[10px] font-bold tracking-wider">
                            {formatTime(msg.timestamp || new Date().toISOString())}
                          </span>

                          {/* Admin Only Delete Hook */}
                          {session?.user?.role === "admin" && msg._id && !msg.isOptimistic && (
                            <button
                              onClick={() => handleDeleteMessage(msg._id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 text-rose-400 hover:text-rose-600 focus:outline-none"
                              title="Admin: Delete Message"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                            </button>
                          )}

                          {isMe && !msg.isOptimistic && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                          {isMe && msg.isOptimistic && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 animate-pulse">
                              <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                          )}
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Invisible anchor for scrolling */}
          <div ref={messagesEndRef} className="h-4 py-2" />
        </div>

        {/* Input Bar Area */}
        <div className="bg-white border-t border-slate-200 px-4 py-3 sm:px-6 sm:py-4 w-full z-20 shrink-0 relative">

          {/* Active File Preview */}
          {attachedFile && (
            <div className="absolute bottom-full left-0 w-full bg-white border-t border-slate-200 p-3 flex items-center justify-between shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.03)] z-10 px-4 sm:px-6">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100 shrink-0 shadow-sm text-2xl">
                  {isImage(attachedFile.name, attachedFile.type) ? "🖼️" : getFileIcon(attachedFile.name)}
                </div>
                <div className="flex flex-col overflow-hidden max-w-[200px] sm:max-w-md">
                  <span className="text-sm font-bold text-slate-800 truncate">{attachedFile.name}</span>
                  <span className="text-xs text-slate-500 font-bold tracking-tight">{(attachedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to send</span>
                </div>
              </div>
              <button
                type="button"
                onClick={clearAttachment}
                className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors shrink-0 shadow-sm"
                title="Remove attachment"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          )}

          {/* Input Form Loop */}
          <form onSubmit={(e) => handleSendMessage(e, false)} className="max-w-5xl mx-auto flex items-end gap-2 sm:gap-3 w-full bg-slate-100 p-1.5 sm:p-2 rounded-3xl border border-transparent transition-all focus-within:border-indigo-300 focus-within:bg-white focus-within:shadow-[0_2px_15px_-3px_rgba(99,102,241,0.15)] relative">

            <button
              type="button"
              onClick={handleAttachClick}
              className="p-2 sm:p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors shrink-0 outline-none"
              title="Attach File"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rotate-45 sm:w-[22px] sm:h-[22px]"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
            </button>

            {/* Hidden Input Component */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.zip,.rar"
            />

            <div className="flex-1 relative pb-1 sm:pb-1.5 pt-0.5">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if ((newMessage.trim() || attachedFile) && !isUploading) {
                      handleSendMessage(e, false);
                    }
                  }
                }}
                disabled={isUploading}
                placeholder={isUploading ? "Sending..." : "Type a message..."}
                className="w-full bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400 text-[15px] resize-none pb-0.5 pt-1.5 px-1 sm:px-2 block custom-scrollbar leading-relaxed"
                rows={Math.min(Math.max(newMessage.split('\n').length, 1), 4)}
                style={{ minHeight: '40px', maxHeight: '120px' }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center shrink-0 pr-1 pb-1 sm:pb-1.5">
              {(session?.user?.role === "lecturer" || session?.user?.role === "admin") && (
                <button
                  type="button"
                  onClick={(e) => handleSendMessage(e, true)}
                  disabled={isUploading || (!newMessage.trim() && !attachedFile)}
                  title="Send Special Notice"
                  className="p-2 sm:p-2.5 bg-amber-100 text-amber-600 hover:bg-amber-500 hover:text-white rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hidden sm:flex items-center justify-center group mr-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:animate-bounce sm:w-[22px] sm:h-[22px]"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
              )}

              <button
                type="button"
                onClick={(e) => handleSendMessage(e, false)}
                disabled={(!newMessage.trim() && !attachedFile) || isUploading}
                className={`w-10 h-10 sm:w-11 sm:h-11 shrink-0 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-sm
                  ${isUploading || (!newMessage.trim() && !attachedFile)
                    ? 'bg-slate-300 opacity-80 cursor-not-allowed scale-100'
                    : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-md hover:scale-[1.05] active:scale-95'
                  }`}
              >
                {isUploading ? (
                  <div className="relative flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 text-white absolute" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  </div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="-ml-0.5 -mt-0.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
