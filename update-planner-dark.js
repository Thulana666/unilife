const fs = require('fs');

const path = 'app/dashboard/planner/[semester]/page.js';
let content = fs.readFileSync(path, 'utf8');

// Replace hex codes in style objects with css variables
// Only inside style={{...}}
content = content.replace(/style=\{\{([^}]+)\}\}/g, (match, inner) => {
    let replaced = inner;
    replaced = replaced.replace(/"white"/g, 'isDark ? "#1e293b" : "white"');
    replaced = replaced.replace(/"#F8FAFC"/gi, 'isDark ? "#0f172a" : "#F8FAFC"');
    replaced = replaced.replace(/"#F1F5F9"/gi, 'isDark ? "#334155" : "#F1F5F9"');
    replaced = replaced.replace(/"#E2E8F0"/gi, 'isDark ? "#334155" : "#E2E8F0"');
    replaced = replaced.replace(/"#CBD5E1"/gi, 'isDark ? "#475569" : "#CBD5E1"');
    replaced = replaced.replace(/"#0F172A"/gi, 'isDark ? "#f8fafc" : "#0F172A"');
    replaced = replaced.replace(/"#1E293B"/gi, 'isDark ? "#e2e8f0" : "#1E293B"');
    replaced = replaced.replace(/"#374151"/gi, 'isDark ? "#cbd5e1" : "#374151"');
    replaced = replaced.replace(/"#64748B"/gi, 'isDark ? "#94a3b8" : "#64748B"');
    replaced = replaced.replace(/"#94A3B8"/gi, 'isDark ? "#64748b" : "#94A3B8"');
    replaced = replaced.replace(/"black"/g, 'isDark ? "white" : "black"');
    replaced = replaced.replace(/"#FAFAFA"/gi, 'isDark ? "#020617" : "#FAFAFA"');
    replaced = replaced.replace(/"#EEF2FF"/gi, 'isDark ? "#1e1b4b" : "#EEF2FF"');
    replaced = replaced.replace(/"#F0FDF4"/gi, 'isDark ? "#064e3b" : "#F0FDF4"');
    
    return `style={{${replaced}}}`;
});

// We need to inject useTheme
if (!content.includes('useTheme')) {
    content = content.replace('import { useSession } from "next-auth/react";', 'import { useSession } from "next-auth/react";\nimport { useTheme } from "../../../../context/ThemeContext";');
    content = content.replace('const currentUserEmail = session?.user?.email;', 'const currentUserEmail = session?.user?.email;\n  const { resolvedTheme } = useTheme();\n  const isDark = resolvedTheme === "dark";');
}

// Global container background
content = content.replace(/background:\s*"#F8FAFC"/, 'background: isDark ? "#020617" : "#F8FAFC"');

fs.writeFileSync(path, content, 'utf8');
console.log("Planner themed.");
