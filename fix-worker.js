const fs = require('fs');
const path = './kelmah-frontend/src/modules/worker/pages/WorkerDashboardPage.jsx';
let content = fs.readFileSync(path, 'utf8');

const heroDesktopStart = content.indexOf('<Box sx={{ mt: { xs: 2, sm: 3 } }}>');
const gridContainer = content.indexOf('</Grid>', heroDesktopStart);

console.log(heroDesktopStart, gridContainer);
