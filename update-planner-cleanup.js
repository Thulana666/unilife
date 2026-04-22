const fs = require('fs');

const path = 'app/dashboard/planner/[semester]/page.js';
let content = fs.readFileSync(path, 'utf8');

// The regex we used before missed instances where hexes were inside backticks or larger text blocks.
// Let's globally replace specific combinations that weren't hit!

content = content.replace(
    /border: "1px solid #E2E8F0"/g,
    'border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`'
);

content = content.replace(
    /border: "1\.5px solid #E2E8F0"/g,
    'border: `1.5px solid ${isDark ? "#334155" : "#E2E8F0"}`'
);

content = content.replace(
    /border: "2px dashed #E2E8F0"/g,
    'border: `2px dashed ${isDark ? "#334155" : "#E2E8F0"}`'
);

content = content.replace(
    /borderBottom: "1px solid #E2E8F0"/g,
    'borderBottom: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`'
);

// 7-day card
content = content.replace(
    /background: t.status === "Completed" \? "#F0FDF4" : "white"/g,
    'background: t.status === "Completed" ? (isDark ? "#064e3b" : "#F0FDF4") : (isDark ? "#0f172a" : "white")'
);

// Today pill
content = content.replace(
    /background: isToday \? isDark \? "#1e1b4b" : "#EEF2FF" : isDark \? "#0f172a" : "white"/g,
    'background: isToday ? (isDark ? "#1e1b4b" : "#EEF2FF") : (isDark ? "#0f172a" : "white")'
);

// Fixed Done badge
content = content.replace(
    /background: "#ECFDF5", color: "#16A34A", border: "1px solid #BBF7D0"/g,
    'background: isDark ? "#064e3b" : "#ECFDF5", color: isDark ? "#6ee7b7" : "#16A34A", border: `1px solid ${isDark ? "#065f46" : "#BBF7D0"}`'
);

// Cancel Delete Button text color fallback (it was isDark ? "white" : "white")
content = content.replace(
    /color: isDark \? "white" : "white"/g,
    'color: "white"'
);

// Modal Backgrounds
content = content.replace(
    /background: isDark \? "#0f172a" : "#FAFAFA"/g,
    'background: isDark ? "#1e293b" : "#FAFAFA"'
);

fs.writeFileSync(path, content, 'utf8');
console.log("Secondary cleanup complete");
