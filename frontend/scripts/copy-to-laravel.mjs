// `npm run build:laravel` — React বিল্ডকে Laravel এর public ফোল্ডারে কপি করে
// (index.html → app.html, কারণ public/index.php কে বাদ দিয়ে index.html সার্ভ হলে Laravel কাজ করবে না)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const pub = path.join(root, '..', 'backend', 'public');

if (!fs.existsSync(dist)) { console.error('আগে `npm run build` চালান'); process.exit(1); }
if (!fs.existsSync(pub)) { console.error('../backend/public পাওয়া যায়নি'); process.exit(1); }

fs.rmSync(path.join(pub, 'assets'), { recursive: true, force: true });
fs.cpSync(path.join(dist, 'assets'), path.join(pub, 'assets'), { recursive: true });
fs.copyFileSync(path.join(dist, 'index.html'), path.join(pub, 'app.html'));
for (const f of fs.readdirSync(dist)) {
  if (!['assets', 'index.html'].includes(f)) fs.cpSync(path.join(dist, f), path.join(pub, f), { recursive: true });
}
console.log('✅ ফ্রন্টএন্ড কপি হয়েছে → backend/public (app.html + assets/)');
