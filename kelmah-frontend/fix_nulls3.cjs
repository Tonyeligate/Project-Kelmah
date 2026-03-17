const fs = require('fs');

const p = 'C:/Users/OS/Desktop/Project-Kelmah-main/kelmah-frontend/src/modules/hirer/pages/HirerDashboardPage.jsx';
let buf = fs.readFileSync(p);

let buf2 = [];
for(let i=0; i<buf.length; i++) {
   if(buf[i] !== 0) buf2.push(buf[i]);
}

let code = Buffer.from(buf2).toString('utf8');

code = code.replace(/boxShadow:\s*theme\.palette\.mode\s*===\s*'dark'\s*\?\s*8px\s*25px\s*\{alpha\(card\.tone,\s*0\.25\)\}\s*:\s*8px\s*25px\s*rgba\(0,0,0,0\.15\),/gm, "boxShadow: theme.palette.mode === 'dark' ? `0 8px 25px ${alpha(card.tone, 0.25)}` : '0 8px 25px rgba(0,0,0,0.15)',");

fs.writeFileSync(p, code);
console.log("Done");
