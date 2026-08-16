/**
 * Drives the running app the way a member of staff would: takes a booking, then
 * checks the car it just took is no longer offered for the same dates.
 *
 * Usage:  npm run dev   (in one terminal)
 *         node scripts/smoke.mjs [baseUrl]
 */

import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:5173';
const PICKUP = '2027-04-05';
const RETURN = '2027-04-15';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

const failures = [];
page.on('pageerror', (error) => failures.push(`page error: ${error.message}`));

function check(description, condition) {
  console.log(`${condition ? 'ok  ' : 'FAIL'}  ${description}`);
  if (!condition) failures.push(description);
}

async function openNewBooking() {
  await page.goto(`${BASE}/#/bookings/new`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const dates = page.locator('input[type="date"]');
  await dates.nth(0).fill(PICKUP);
  await dates.nth(1).fill(RETURN);
  await page.waitForTimeout(300);
}

await openNewBooking();

check('ten day rental is recognised', await page.getByText('10 day rental').isVisible());

// Take the first Land Cruiser on offer, so the price is one we can check by hand.
const card = page.getByRole('button').filter({ hasText: 'Toyota Land Cruiser VXR 2025' }).first();
await card.scrollIntoViewIfNeeded();
await card.click();
await page.waitForTimeout(200);

const plateChip = page.getByRole('button').filter({ hasText: /^525 11\d$/ }).first();
const takenPlate = (await plateChip.textContent())?.trim();
await plateChip.click();

// 10 days on 700/4500/12000 is a week plus three days: 4,500 + 2,100 = 6,600.
const summary = page.locator('aside');
check('price is the cheapest tier combination', (await summary.getByText('6,600 QAR').count()) > 0);
check('breakdown names the week', (await summary.getByText('1 week').count()) > 0);
check('breakdown names the loose days', (await summary.getByText('3 days').count()) > 0);
check('saving against daily is shown', (await summary.getByText(/Saves 400 QAR/).count()) > 0);

await page.getByLabel('Full name').fill('Smoke Test Customer');
await page.getByLabel('Phone').fill('+974 3000 0000');
await page.getByLabel('QID or passport number').fill('29999999999');

await page.getByRole('button', { name: 'Confirm booking' }).click();
await page.waitForTimeout(600);

const confirmation = await page.getByText(/Booking 525-\d+ created/).textContent();
check('booking is confirmed', Boolean(confirmation));
const reference = confirmation?.match(/525-\d+/)?.[0];

await page.goto(`${BASE}/#/bookings`, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.getByPlaceholder('Search reference, renter or plate').fill('Smoke Test');
await page.waitForTimeout(300);
check(`booking ${reference} is listed`, (await page.getByText('Smoke Test Customer').count()) > 0);
check('listed at the same price', (await page.getByText('6,600 QAR').count()) > 0);

// The whole point of the availability rules: that car is now spoken for.
await openNewBooking();
check(
  `${takenPlate} is no longer offered for those dates`,
  (await page.locator('button', { hasText: new RegExp(`^${takenPlate}$`) }).count()) === 0,
);

await page.goto(`${BASE}/#/availability`, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
check('availability screen still renders', (await page.getByText('Every car, day by day').count()) > 0);

await browser.close();

if (failures.length) {
  console.log(`\n${failures.length} problem(s):`);
  for (const failure of failures) console.log(` - ${failure}`);
  process.exitCode = 1;
} else {
  console.log('\nAll checks passed.');
}
