import { copyFile, mkdir } from 'node:fs/promises';
await mkdir(new URL('../functions/shared/', import.meta.url), { recursive: true });
for (const name of ['academy-record.js', 'seminar-data.js', 'seminar-policies.js']) {
  await copyFile(new URL('../js/' + name, import.meta.url), new URL('../functions/shared/' + name, import.meta.url));
}
