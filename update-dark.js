const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'app');

const replacements = [
  // Backgrounds
  { regex: /(?<!dark:)(bg-white)(?!\s*dark:bg-slate-900)/g, replacement: 'bg-white dark:bg-slate-900/50' }, 
  { regex: /(?<!dark:)(bg-slate-50)(?!\s*dark:bg-slate-900)/g, replacement: 'bg-slate-50 dark:bg-slate-900' },
  { regex: /(?<!dark:)(bg-slate-100)(?!\s*dark:bg-slate-800)/g, replacement: 'bg-slate-100 dark:bg-slate-800' },
  { regex: /(?<!dark:)(bg-slate-200)(?!\s*dark:bg-slate-700)/g, replacement: 'bg-slate-200 dark:bg-slate-700' },
  { regex: /(?<!dark:)(bg-slate-900)(?!\s*dark:bg-slate-800)/g, replacement: 'bg-slate-900 dark:bg-slate-800' }, // Sidebar etc.

  // Text
  { regex: /(?<!dark:)(text-slate-900)(?!\s*dark:text-white)/g, replacement: 'text-slate-900 dark:text-white' },
  { regex: /(?<!dark:)(text-slate-800)(?!\s*dark:text-slate-200)/g, replacement: 'text-slate-800 dark:text-slate-200' },
  { regex: /(?<!dark:)(text-slate-700)(?!\s*dark:text-slate-300)/g, replacement: 'text-slate-700 dark:text-slate-300' },
  { regex: /(?<!dark:)(text-slate-600)(?!\s*dark:text-slate-400)/g, replacement: 'text-slate-600 dark:text-slate-400' },
  { regex: /(?<!dark:)(text-slate-500)(?!\s*dark:text-slate-400)/g, replacement: 'text-slate-500 dark:text-slate-400' },

  // Borders
  { regex: /(?<!dark:)(border-slate-100)(?!\s*dark:border-slate-800)/g, replacement: 'border-slate-100 dark:border-slate-800/50' },
  { regex: /(?<!dark:)(border-slate-200)(?!\s*dark:border-slate-700)/g, replacement: 'border-slate-200 dark:border-slate-700/50' },
  { regex: /(?<!dark:)(border-slate-300)(?!\s*dark:border-slate-600)/g, replacement: 'border-slate-300 dark:border-slate-600/50' },

  // Hovers
  { regex: /(?<!dark:)(hover:bg-slate-50)(?!\s*dark:hover:bg-slate-800)/g, replacement: 'hover:bg-slate-50 dark:hover:bg-slate-800' },
  { regex: /(?<!dark:)(hover:bg-slate-100)(?!\s*dark:hover:bg-slate-700)/g, replacement: 'hover:bg-slate-100 dark:hover:bg-slate-700' },
  
  // Inputs
  { regex: /(?<!dark:)(bg-slate-50 focus:outline)/g, replacement: 'bg-slate-50 dark:bg-slate-900/50 dark:text-white focus:outline' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      replacements.forEach(({ regex, replacement }) => {
        // We only want to replace inside className strings
        // To be safe we will just replace the exact class anywhere it occurs, since these classes are rarely used outside of strings
        // And we use lookbehinds and lookaheads in the regex to avoid matching things inside words
        const originalContent = content;
        
        // This is a more robust way to replace whole words only
        const wordBoundaryRegex = new RegExp(`(?<![a-zA-Z0-9:-])(${regex.source})(?![a-zA-Z0-9:-])`, 'g');
        
        content = content.replace(wordBoundaryRegex, replacement);
        if (originalContent !== content) {
          modified = true;
        }
      });

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

console.log('Starting dark mode class update...');
processDirectory(directoryPath);
console.log('Finished.');
