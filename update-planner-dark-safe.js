const fs = require('fs');

const path = 'app/dashboard/planner/[semester]/page.js';
let content = fs.readFileSync(path, 'utf8');

// Inject useTheme
if (!content.includes('useTheme')) {
    content = content.replace('import { useSession } from "next-auth/react";', 'import { useSession } from "next-auth/react";\nimport { useTheme } from "../../../../context/ThemeContext";');
    content = content.replace('const currentUserEmail = session?.user?.email;', 'const currentUserEmail = session?.user?.email;\n  const { resolvedTheme } = useTheme();\n  const isDark = resolvedTheme === "dark";');
}

// Convert PRIORITY object to a function hook
if (content.includes('const PRIORITY = {')) {
    content = content.replace(/const PRIORITY = \{[\s\S]*?\};\n/, ''); // remove old priority
    
    // Add getPriority function right before StudyPlanner component
    const getPriorityStr = `
const getPriority = (isDark) => ({
  High: { color: isDark ? "#FCA5A5" : "#EF4444", bg: isDark ? "#7F1D1D40" : "#FEF2F2", border: isDark ? "#991B1B50" : "#FECACA", label: "High", dot: "#EF4444", tasks: "Exam · Presentation · Viva", icon: "🔴" },
  Medium: { color: isDark ? "#FCD34D" : "#F59E0B", bg: isDark ? "#78350F40" : "#FFFBEB", border: isDark ? "#92400E50" : "#FDE68A", label: "Medium", dot: "#F59E0B", tasks: "Lab Test · Quiz", icon: "🟡" },
  Low: { color: isDark ? "#6EE7B7" : "#10B981", bg: isDark ? "#064E3B40" : "#ECFDF5", border: isDark ? "#065F4650" : "#A7F3D0", label: "Low", dot: "#10B981", tasks: "Revision", icon: "🟢" },
});
`;
    content = content.replace('export default function StudyPlanner', getPriorityStr + '\nexport default function StudyPlanner');
    
    // Replace PRIORITY with PRIORITY_DATA internally
    content = content.replace(/PRIORITY\[/g, 'PRIORITY_DATA[');
    content = content.replace(/Object\.entries\(PRIORITY\)/g, 'Object.entries(PRIORITY_DATA)');
    
    // inject PRIORITY_DATA instatiation
    content = content.replace('const currentUserEmail = session?.user?.email;\n  const { resolvedTheme } = useTheme();\n  const isDark = resolvedTheme === "dark";', 'const currentUserEmail = session?.user?.email;\n  const { resolvedTheme } = useTheme();\n  const isDark = resolvedTheme === "dark";\n  const PRIORITY_DATA = getPriority(isDark);');
}

// Add CSS variables to the root wrapper
content = content.replace(
    /style=\{\{ fontFamily: "'Inter', 'Segoe UI', sans-serif", minHeight: "100vh", background: "#F8FAFC" \}\}/,
    `style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", minHeight: "100vh", background: isDark ? "#020617" : "#F8FAFC" }}`
);

// We replace string literals inside style objects safely
content = content.replace(/style=\{\{([^}]+)\}\}/g, (match, inner) => {
    let replaced = inner;
    replaced = replaced.replace(/"white"/g, 'isDark ? "#0F172A" : "white"');
    replaced = replaced.replace(/"#F8FAFC"/gi, 'isDark ? "#020617" : "#F8FAFC"');
    replaced = replaced.replace(/"#F1F5F9"/gi, 'isDark ? "#1E293B" : "#F1F5F9"');
    replaced = replaced.replace(/"#E2E8F0"/gi, 'isDark ? "#334155" : "#E2E8F0"');
    replaced = replaced.replace(/"#CBD5E1"/gi, 'isDark ? "#475569" : "#CBD5E1"');
    
    // Text colors
    replaced = replaced.replace(/"#0F172A"/gi, 'isDark ? "#F8FAFC" : "#0F172A"');
    replaced = replaced.replace(/"#1E293B"/gi, 'isDark ? "#E2E8F0" : "#1E293B"');
    replaced = replaced.replace(/"#374151"/gi, 'isDark ? "#CBD5E1" : "#374151"');
    replaced = replaced.replace(/"#64748B"/gi, 'isDark ? "#94A3B8" : "#64748B"');
    replaced = replaced.replace(/"#94A3B8"/gi, 'isDark ? "#64748B" : "#94A3B8"');
    replaced = replaced.replace(/"black"/g, 'isDark ? "white" : "black"');
    
    // Extra elements
    replaced = replaced.replace(/"#FAFAFA"/gi, 'isDark ? "#0f172a" : "#FAFAFA"'); // For inputs
    replaced = replaced.replace(/"#F0FDF4"/gi, 'isDark ? "#064E3B" : "#F0FDF4"'); // Completed background
    replaced = replaced.replace(/"#EEF2FF"/gi, 'isDark ? "#1E1B4B" : "#EEF2FF"'); // Today's background
    
    return `style={{${replaced}}}`;
});

// Since we replaced "white", we need to make sure we didn't destroy specific edge cases 
// like progress bar glow or linear gradients which use strings directly in JS. 
// Wait, linear gradients are string literals `linear-gradient(...)`! We didn't touch those with the regex above because we matched literal `"white"`, not `"linear-gradient(..., white)"` unless it WAS exactly `"white"`.
// However, the progress bar linear gradient is: "linear-gradient(90deg, rgba(255,255,255,0.9) 0%, white 60%, #C4B5FD 100%)" which does NOT get matched by `"white"` global because it's inside a larger string! That's actually correct.

fs.writeFileSync(path, content, 'utf8');
console.log("Planner safely themed.");
