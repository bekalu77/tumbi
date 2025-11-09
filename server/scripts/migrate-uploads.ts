import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const oldUploads = path.join(repoRoot, 'server', 'uploads');
const newUploads = path.join(repoRoot, 'data', 'uploads');

if (!fs.existsSync(oldUploads)) {
  console.log('No server/uploads directory found — nothing to do.');
  process.exit(0);
}

if (!fs.existsSync(newUploads)) {
  fs.mkdirSync(newUploads, { recursive: true });
}

const files = fs.readdirSync(oldUploads);
files.forEach((file) => {
  const src = path.join(oldUploads, file);
  const dest = path.join(newUploads, file);
  try {
    fs.renameSync(src, dest);
    console.log(`moved ${file}`);
  } catch (err) {
    console.error(`failed to move ${file}:`, err);
  }
});

console.log('Done.');
