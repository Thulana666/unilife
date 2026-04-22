const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'app');

function getDarkVariant(cls) {
    if (cls.startsWith('dark:')) return null;

    const parts = cls.split(':');
    const baseClass = parts[parts.length - 1]; 
    const prefix = parts.slice(0, -1).join(':'); 
    const darkPrefix = prefix ? `dark:${prefix}:` : 'dark:';

    const matchColor = baseClass.match(/^(bg|text|border|ring|divide)-([a-z]+)-(\d+)(?:\/(\d+))?$/);
    if (matchColor) {
        const type = matchColor[1];
        const color = matchColor[2];
        const shade = parseInt(matchColor[3]);
        const opacityStr = matchColor[4] ? `/${matchColor[4]}` : '';

        if (['slate', 'gray', 'zinc', 'neutral', 'stone'].includes(color)) {
            if (type === 'bg') {
                if (shade === 50) return `${darkPrefix}${type}-${color}-900`;
                if (shade === 100) return `${darkPrefix}${type}-${color}-800`;
                if (shade === 200) return `${darkPrefix}${type}-${color}-800/50`;
                if (shade === 800) return `${darkPrefix}${type}-${color}-200`;
                if (shade === 900) return `${darkPrefix}${type}-${color}-950`;
            } else if (type === 'text') {
                if (shade === 900) return `${darkPrefix}text-white`;
                if (shade === 800) return `${darkPrefix}${type}-${color}-200`;
                if (shade === 700) return `${darkPrefix}${type}-${color}-300`;
                if (shade === 600) return `${darkPrefix}${type}-${color}-400`;
                if (shade === 500) return `${darkPrefix}${type}-${color}-400`;
                if (shade === 400) return `${darkPrefix}${type}-${color}-500`;
            } else if (type === 'border' || type === 'ring' || type === 'divide') {
                if (shade === 100) return `${darkPrefix}${type}-${color}-800`;
                if (shade === 200) return `${darkPrefix}${type}-${color}-700/80`;
                if (shade === 300) return `${darkPrefix}${type}-${color}-600/80`;
            }
        } else {
            // Colors (emerald, blue, indigo, red, etc)
            if (type === 'bg') {
                if (shade === 50) return `${darkPrefix}${type}-${color}-900/20`;
                if (shade === 100) return `${darkPrefix}${type}-${color}-900/40`;
            } else if (type === 'text') {
                if (shade === 600) return `${darkPrefix}${type}-${color}-400`;
                if (shade === 700) return `${darkPrefix}${type}-${color}-300`;
                if (shade === 800) return `${darkPrefix}${type}-${color}-200`;
                if (shade === 500) return `${darkPrefix}${type}-${color}-400`;
            } else if (type === 'border' || type === 'ring') {
                if (shade === 100) return `${darkPrefix}${type}-${color}-900/50`;
                if (shade === 200) return `${darkPrefix}${type}-${color}-800/50`;
                if (shade === 300) return `${darkPrefix}${type}-${color}-700/50`;
            }
        }
    }

    if (baseClass === 'bg-white') return `${darkPrefix}bg-slate-900/50`;
    if (baseClass === 'bg-black') return `${darkPrefix}bg-white`;
    if (baseClass === 'border-white') return `${darkPrefix}border-slate-800`;
    if (baseClass === 'text-black') return `${darkPrefix}text-white`;
    
    return null;
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // 1. Remove ALL existing dark classes to avoid duplicates/mess from my previous attempts
            // Regex matches " dark:bg-slate-900/50", "dark:text-white" etc.
            content = content.replace(/(^|\s)dark:[a-zA-Z0-9\-\/\:\[\]\_%]+/g, '');

            // 2. Identify tailwind classes and append their dark variant
            // We match words that look like interesting tailwind classes
            content = content.replace(/([a-zA-Z0-9\-\/\:\[\]\_]+)/g, (match) => {
                if (!match.match(/^(?:hover:|focus:|active:|group-hover:)?(?:bg|text|border|ring|divide)-/)) {
                    return match;
                }
                const darkVariant = getDarkVariant(match);
                if (darkVariant) {
                    return `${match} ${darkVariant}`;
                }
                return match;
            });

            if (originalContent !== content) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

console.log('Starting exact dark variant generation...');
processDirectory(directoryPath);
console.log('Done.');
