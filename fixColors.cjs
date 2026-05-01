const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace hardcoded dark root backgrounds
code = code.replace(/bg-\[#0a0a0a\]/g, 'bg-slate-100 dark:bg-[#0a0a0a]');

// Re-enforce Geek Green (#10B981) via Tailwind's emerald-500 everywhere there's a primary button. 
// "保存配置" (Save UI / Init) and Success state
code = code.replace(/text-black font-bold text-sm rounded-lg hover:bg-emerald-400/g, 'text-black font-bold text-sm rounded-lg shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] hover:bg-emerald-400');
code = code.replace(/text-black font-bold text-xs rounded-lg hover:bg-emerald-400/g, 'text-black font-bold text-xs rounded-lg shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] hover:bg-emerald-400');

// "辅助警示色：橙红/深红，用于敏感操作（如文件删除权限）和报错日志展示" -> use rose-600 / red-500
// Replace Trash2 colors and critical states
code = code.replace(/text-rose-500/g, 'text-rose-600 dark:text-rose-500');
code = code.replace(/bg-rose-500/g, 'bg-rose-600 dark:bg-rose-500');
code = code.replace(/text-rose-400/g, 'text-rose-500 dark:text-rose-400');

// The ReadOnly selector / property modification context menu logic
// We need to ensure that the readOnly switch looks like a strict warning color when toggling things to R/W
// In the current context menu, there's "w-full text-left px-3 py-2 text-xs text-rose-500 font-bold... Delete File" 
code = code.replace(/text-rose-500 hover:text-white/g, 'text-red-500 dark:text-rose-500 hover:bg-red-500 hover:text-white dark:hover:bg-rose-500');

fs.writeFileSync('src/App.tsx', code);
