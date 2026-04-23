const fs = require('fs');
let text = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = text.split('\n');
const fixedLines = lines.map(line => {
  if (line.includes('核心服')) {
    return "                          <Network className=\"w-3 h-3\" /> {settings.lang === 'zh' ? '核心服务商' : 'Provider'}\n                        </label>\n                        <select ";
  }
  return line;
});
fs.writeFileSync('src/App.tsx', fixedLines.join('\n'));
