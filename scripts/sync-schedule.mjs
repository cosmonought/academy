import { readFile, writeFile } from 'node:fs/promises';
import { scheduleLabels } from '../js/session-schedule.js';

const path = new URL('../sex-and-or-love.html', import.meta.url);
const source = await readFile(path, 'utf8');
let updated = source;
for (const { attribute, id, text } of scheduleLabels()) {
  const pattern = new RegExp(`(<span[^>]*${attribute}="${id}"[^>]*>)[^<]*(</span>)`);
  if (!pattern.test(updated)) throw new Error(`Missing schedule field: ${attribute}=${id}`);
  updated = updated.replace(pattern, (_, open, close) => open + text + close);
}
if (process.argv.includes('--check')) {
  if (source !== updated) throw new Error('Static dates are out of sync. Run npm run sync:schedule.');
  console.log('Static schedule matches the canonical data.');
} else {
  await writeFile(path, updated);
  console.log('Updated static schedule dates.');
}
