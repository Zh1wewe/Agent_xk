const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Colors replacement matrix for Deep/Light mode mapping
const replacements = [
  // Backgrounds
  { from: /\bbg-zinc-950\b/g, to: 'bg-slate-50 dark:bg-zinc-950' },
  { from: /\bbg-zinc-900\b/g, to: 'bg-white dark:bg-zinc-900' },
  { from: /\bbg-zinc-800\b/g, to: 'bg-slate-100 dark:bg-zinc-800' },
  { from: /\bbg-zinc-700\b/g, to: 'bg-slate-200 dark:bg-zinc-700' },
  
  // Text Colors
  { from: /\btext-zinc-200\b/g, to: 'text-slate-800 dark:text-zinc-200' },
  { from: /\btext-zinc-300\b/g, to: 'text-slate-700 dark:text-zinc-300' },
  { from: /\btext-zinc-400\b/g, to: 'text-slate-600 dark:text-zinc-400' },
  { from: /\btext-zinc-500\b/g, to: 'text-slate-500 dark:text-zinc-500' },
  { from: /\btext-zinc-600\b/g, to: 'text-slate-400 dark:text-zinc-600' },
  
  // Borders
  { from: /\bborder-zinc-800\b/g, to: 'border-slate-200 dark:border-zinc-800' },
  { from: /\bborder-zinc-700\b/g, to: 'border-slate-300 dark:border-zinc-700' },
  
  // Special overrides for White text that should be dark in light mode
  { from: /\btext-white\b/g, to: 'text-slate-900 dark:text-white' },
];

for (const rep of replacements) {
  code = code.replace(rep.from, rep.to);
}

// "核心色为科技蓝 (#4F46E5)" (indigo-600)
// Let's modify the master header to use Tech Blue and add subtle indigo accents to backgrounds
// Change the main top header from border-slate-200 dark:border-zinc-800 to something with tech blue
code = code.replace(/<header className="p-4 border-b border-slate-200 dark:border-zinc-800/g, '<header className="p-4 border-b border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20 dark:border-indigo-500/20');
code = code.replace(/text-slate-900 dark:text-white font-bold flex items-center gap-2"/g, 'text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-2"');

// Modify the logo/icon color to tech blue
code = code.replace(/<Terminal className="w-5 h-5" \/>/g, '<Terminal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />');

// "主干强调色：极客绿 (Emerald Green)" -- already well-represented by emerald-500 throughout, 
// let's just make sure "保存UI" buttons are really popping with the right classes
// Right now we have: `bg-emerald-500 text-black`
// We'll replace it with a more vibrant green and adapt it to the theme where needed, but emerald-500 is `#10b981` which exactly matches Geek Green setup!

fs.writeFileSync('src/App.tsx', code);
