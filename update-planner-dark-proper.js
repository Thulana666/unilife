const fs = require('fs');

const path = 'app/dashboard/planner/[semester]/page.js';
let content = fs.readFileSync(path, 'utf8');

// Inject useTheme
if (!content.includes('useTheme')) {
    content = content.replace('import { useSession } from "next-auth/react";', 'import { useSession } from "next-auth/react";\nimport { useTheme } from "../../../../context/ThemeContext";');
    content = content.replace('const currentUserEmail = session?.user?.email;', 'const currentUserEmail = session?.user?.email;\n  const { resolvedTheme } = useTheme();\n  const isDark = resolvedTheme === "dark";');
}

if (content.includes('const PRIORITY = {')) {
    content = content.replace(/const PRIORITY = \{[\s\S]*?\};\n/, ''); 
    const getPriorityStr = `
const getPriority = (isDark) => ({
  High: { color: isDark ? "#FCA5A5" : "#EF4444", bg: isDark ? "#7F1D1D40" : "#FEF2F2", border: isDark ? "#991B1B50" : "#FECACA", label: "High", dot: "#EF4444", tasks: "Exam · Presentation · Viva", icon: "🔴" },
  Medium: { color: isDark ? "#FCD34D" : "#F59E0B", bg: isDark ? "#78350F40" : "#FFFBEB", border: isDark ? "#92400E50" : "#FDE68A", label: "Medium", dot: "#F59E0B", tasks: "Lab Test · Quiz", icon: "🟡" },
  Low: { color: isDark ? "#6EE7B7" : "#10B981", bg: isDark ? "#064E3B40" : "#ECFDF5", border: isDark ? "#065F4650" : "#A7F3D0", label: "Low", dot: "#10B981", tasks: "Revision", icon: "🟢" },
});
`;
    content = content.replace('export default function StudyPlanner', getPriorityStr + '\nexport default function StudyPlanner');
    content = content.replace(/PRIORITY\[/g, 'PRIORITY_DATA[');
    content = content.replace(/Object\.entries\(PRIORITY\)/g, 'Object.entries(PRIORITY_DATA)');
    content = content.replace('const currentUserEmail = session?.user?.email;\n  const { resolvedTheme } = useTheme();\n  const isDark = resolvedTheme === "dark";', 'const currentUserEmail = session?.user?.email;\n  const { resolvedTheme } = useTheme();\n  const isDark = resolvedTheme === "dark";\n  const PRIORITY_DATA = getPriority(isDark);');
}

// Global container background
content = content.replace(
    /style=\{\{ fontFamily: "'Inter', 'Segoe UI', sans-serif", minHeight: "100vh", background: "#F8FAFC" \}\}/,
    `style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", minHeight: "100vh", background: isDark ? "#020617" : "#F8FAFC" }}`
);

// Map of replacements. Order does not matter because we use placeholders.
const mapping = [
    { target: /"white"/g, repl: 'isDark ? "#0f172a" : "white"' },
    { target: /"#F8FAFC"/gi, repl: 'isDark ? "#020617" : "#F8FAFC"' },
    { target: /"#F1F5F9"/gi, repl: 'isDark ? "#1e293b" : "#F1F5F9"' },
    { target: /"#E2E8F0"/gi, repl: 'isDark ? "#334155" : "#E2E8F0"' },
    { target: /"#CBD5E1"/gi, repl: 'isDark ? "#475569" : "#CBD5E1"' },
    { target: /"#0F172A"/gi, repl: 'isDark ? "#f8fafc" : "#0F172A"' },
    { target: /"#1E293B"/gi, repl: 'isDark ? "#e2e8f0" : "#1E293B"' },
    { target: /"#374151"/gi, repl: 'isDark ? "#cbd5e1" : "#374151"' },
    { target: /"#64748B"/gi, repl: 'isDark ? "#94a3b8" : "#64748B"' },
    { target: /"#94A3B8"/gi, repl: 'isDark ? "#64748b" : "#94A3B8"' },
    { target: /"black"/g, repl: 'isDark ? "white" : "black"' },
    { target: /"#FAFAFA"/gi, repl: 'isDark ? "#0f172a" : "#FAFAFA"' },
    { target: /"#F0FDF4"/gi, repl: 'isDark ? "#064e3b" : "#F0FDF4"' },
    { target: /"#EEF2FF"/gi, repl: 'isDark ? "#1e1b4b" : "#EEF2FF"' }
];

content = content.replace(/style=\{\{([^}]+)\}\}/g, (match, inner) => {
    let replaced = inner;
    let placeholders = [];
    
    // 1. Replace all matched strings with a unique placeholder
    mapping.forEach((item, index) => {
        replaced = replaced.replace(item.target, () => {
            return `__PLACEHOLDER_${index}__`;
        });
    });

    // 2. Replace placeholders back with their true replacement values
    mapping.forEach((item, index) => {
        const regex = new RegExp(`__PLACEHOLDER_${index}__`, 'g');
        replaced = replaced.replace(regex, item.repl);
    });

    return `style={{${replaced}}}`;
});

fs.writeFileSync(path, content, 'utf8');
console.log("Planner safely properly themed.");
