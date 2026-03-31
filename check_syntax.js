const fs = require('fs');
const { parse } = require('@babel/parser');

const code = fs.readFileSync('D:/afwin/frontend/src/pages/AdminDashboard.tsx', 'utf-8');

try {
  parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });
  console.log('No Syntax Errors Found by Babel!');
} catch (e) {
  console.error('Syntax Error:', e.message);
  console.log('Line:', e.loc.line, 'Column:', e.loc.column);
}
