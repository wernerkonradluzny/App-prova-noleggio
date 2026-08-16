/**
 * Walks the running app and saves a screenshot of every screen, so the layout
 * can be checked without clicking through by hand.
 *
 * Usage:  npm run dev   (in one terminal)
 *         node scripts/screenshot.mjs [baseUrl]
 */

import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:5173';
// fileURLToPath, not .pathname: this project's folder has a space in its name.
const OUT = fileURLToPath(new URL('../screenshots/', import.meta.url));

const SCREENS = [
  ['dashboard', '/#/'],
  ['fleet', '/#/fleet'],
  ['availability', '/#/availability'],
  ['bookings', '/#/bookings'],
  ['new-booking', '/#/bookings/new'],
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });

const problems = [];
page.on('console', (message) => {
  if (message.type() === 'error') problems.push(`console: ${message.text()}`);
});
page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));

for (const [name, path] of SCREENS) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}${name}.png`, fullPage: true });
  console.log(`saved ${name}`);
}

// The same pages read right to left in Arabic, which is where layout bugs hide.
await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'العربية' }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}dashboard-ar.png`, fullPage: true });
await page.goto(`${BASE}/#/bookings/new`, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}new-booking-ar.png`, fullPage: true });
console.log('saved arabic');

await page.setViewportSize({ width: 420, height: 900 });
await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'English' }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}mobile-dashboard.png`, fullPage: true });
console.log('saved mobile');

await browser.close();

if (problems.length) {
  console.log('\nBrowser reported:');
  for (const problem of [...new Set(problems)]) console.log(` - ${problem}`);
  process.exitCode = 1;
} else {
  console.log('\nNo console or page errors.');
}
