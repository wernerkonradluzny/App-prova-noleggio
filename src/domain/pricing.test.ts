import { describe, expect, it } from 'vitest';
import { quoteFor, quoteForDates, rentalDays } from './pricing';
import type { Rates } from './types';

/** Toyota Land Cruiser VXR 2025, from the 525 price sheet. */
const landCruiser: Rates = { daily: 700, weekly: 4500, monthly: 12000 };
/** MG 3, the cheapest car in the fleet. */
const mg3: Rates = { daily: 90, weekly: 500, monthly: 1700 };
/** Cadillac Escalade 2025, where a month costs exactly two weeks. */
const escalade: Rates = { daily: 1500, weekly: 7500, monthly: 15000 };

describe('rentalDays', () => {
  it('counts whole days between pickup and return', () => {
    expect(rentalDays('2026-03-01', '2026-03-11')).toBe(10);
  });

  it('treats a same-day return as a full day', () => {
    expect(rentalDays('2026-03-01', '2026-03-01')).toBe(1);
  });
});

describe('quoteFor', () => {
  it('charges a single day at the daily rate', () => {
    expect(quoteFor(1, landCruiser).total).toBe(700);
  });

  it('prefers daily when the week has not been earned yet', () => {
    // Six days at 700 is 4,200, under the 4,500 weekly rate.
    const quote = quoteFor(6, landCruiser);
    expect(quote.total).toBe(4200);
    expect(quote.lines).toEqual([{ tier: 'day', quantity: 6, unitRate: 700, amount: 4200 }]);
  });

  it('switches to the weekly rate the moment it is cheaper', () => {
    expect(quoteFor(7, landCruiser).total).toBe(4500);
  });

  it('combines a week and loose days rather than billing all days', () => {
    const quote = quoteFor(10, landCruiser);
    expect(quote.total).toBe(6600);
    expect(quote.dailyTotal).toBe(7000);
    expect(quote.saving).toBe(400);
    expect(quote.lines).toEqual([
      { tier: 'week', quantity: 1, unitRate: 4500, amount: 4500 },
      { tier: 'day', quantity: 3, unitRate: 700, amount: 2100 },
    ]);
  });

  it('bills a month when that beats a shorter combination', () => {
    // Three weeks plus four days is 16,300; a single month is 12,000.
    const quote = quoteFor(25, landCruiser);
    expect(quote.total).toBe(12000);
    expect(quote.lines).toEqual([{ tier: 'month', quantity: 1, unitRate: 12000, amount: 12000 }]);
    expect(quote.chargedDays).toBe(30);
    expect(quote.days).toBe(25);
  });

  it('tops a month up with days instead of jumping to a second week', () => {
    // 35 days: a month plus five days is 15,500, against a month plus a week at 16,500.
    const quote = quoteFor(35, landCruiser);
    expect(quote.total).toBe(15500);
    expect(quote.lines).toEqual([
      { tier: 'month', quantity: 1, unitRate: 12000, amount: 12000 },
      { tier: 'day', quantity: 5, unitRate: 700, amount: 3500 },
    ]);
  });

  it('describes a tie with the tighter combination', () => {
    // Two Escalade weeks and one Escalade month are both 15,000. Say two weeks.
    const quote = quoteFor(14, escalade);
    expect(quote.total).toBe(15000);
    expect(quote.chargedDays).toBe(14);
    expect(quote.lines).toEqual([{ tier: 'week', quantity: 2, unitRate: 7500, amount: 15000 }]);
  });

  it('works the same way on the cheapest car in the fleet', () => {
    const quote = quoteFor(10, mg3);
    expect(quote.total).toBe(770);
    expect(quote.dailyTotal).toBe(900);
  });

  it('never charges more than the plain daily rate would', () => {
    for (let days = 1; days <= 400; days += 1) {
      for (const rates of [landCruiser, mg3, escalade]) {
        expect(quoteFor(days, rates).total).toBeLessThanOrEqual(days * rates.daily);
      }
    }
  });

  it('always covers at least the days requested', () => {
    for (let days = 1; days <= 200; days += 1) {
      expect(quoteFor(days, landCruiser).chargedDays).toBeGreaterThanOrEqual(days);
    }
  });

  it('never gets cheaper by keeping the car for less time', () => {
    let previous = 0;
    for (let days = 1; days <= 200; days += 1) {
      const total = quoteFor(days, landCruiser).total;
      expect(total).toBeGreaterThanOrEqual(previous);
      previous = total;
    }
  });

  it('lines always add up to the total', () => {
    for (let days = 1; days <= 120; days += 1) {
      const quote = quoteFor(days, mg3);
      const sum = quote.lines.reduce((acc, line) => acc + line.amount, 0);
      expect(sum).toBe(quote.total);
    }
  });
});

describe('quoteForDates', () => {
  it('prices a real pair of dates', () => {
    expect(quoteForDates('2026-03-01', '2026-03-11', landCruiser).total).toBe(6600);
  });
});
