import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { Quote, QuoteLine, RateTier, Rates } from './types';

const TIER_LENGTH: Record<RateTier, number> = {
  month: 30,
  week: 7,
  day: 1,
};

/** Longest first, so a tie in price resolves to the tidiest description. */
const TIERS: RateTier[] = ['month', 'week', 'day'];

export function rateFor(tier: RateTier, rates: Rates): number {
  if (tier === 'month') return rates.monthly;
  if (tier === 'week') return rates.weekly;
  return rates.daily;
}

/** Whole days between pickup and return. A same-day return still counts as one day. */
export function rentalDays(startDate: string, endDate: string): number {
  const days = differenceInCalendarDays(parseISO(endDate), parseISO(startDate));
  return Math.max(1, days);
}

/**
 * Price a rental as the cheapest combination of the daily, weekly and monthly
 * rates, including combinations that cover more days than the customer asked for.
 *
 * That last part is what a spreadsheet gets wrong. On a Land Cruiser at
 * 700/4500/12000, twenty-five days billed as three weeks plus four days comes to
 * 16,300 - but billing it as a single month is 12,000, cheaper despite covering
 * longer. Because the table below is filled by looking back at most one tier
 * length and clamping at zero, those over-covering options are considered
 * automatically.
 *
 * Ties are broken towards the combination that covers the fewest days, so a
 * fortnight on a car whose month costs the same as two weeks is still described
 * as two weeks.
 */
export function quoteFor(days: number, rates: Rates): Quote {
  const span = Math.max(1, Math.round(days));

  const cost = new Array<number>(span + 1).fill(Number.POSITIVE_INFINITY);
  const covered = new Array<number>(span + 1).fill(0);
  const chosen = new Array<RateTier | null>(span + 1).fill(null);
  cost[0] = 0;

  for (let day = 1; day <= span; day += 1) {
    for (const tier of TIERS) {
      const from = Math.max(0, day - TIER_LENGTH[tier]);
      const candidateCost = cost[from] + rateFor(tier, rates);
      const candidateCovered = covered[from] + TIER_LENGTH[tier];

      const cheaper = candidateCost < cost[day];
      const sameCostButTighter = candidateCost === cost[day] && candidateCovered < covered[day];

      if (cheaper || sameCostButTighter) {
        cost[day] = candidateCost;
        covered[day] = candidateCovered;
        chosen[day] = tier;
      }
    }
  }

  const counts: Record<RateTier, number> = { month: 0, week: 0, day: 0 };
  for (let day = span; day > 0; ) {
    const tier = chosen[day];
    if (!tier) break;
    counts[tier] += 1;
    day = Math.max(0, day - TIER_LENGTH[tier]);
  }

  const lines: QuoteLine[] = TIERS.filter((tier) => counts[tier] > 0).map((tier) => ({
    tier,
    quantity: counts[tier],
    unitRate: rateFor(tier, rates),
    amount: counts[tier] * rateFor(tier, rates),
  }));

  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  const dailyTotal = span * rates.daily;

  return {
    days: span,
    chargedDays: covered[span],
    lines,
    total,
    dailyTotal,
    saving: dailyTotal - total,
  };
}

export function quoteForDates(startDate: string, endDate: string, rates: Rates): Quote {
  return quoteFor(rentalDays(startDate, endDate), rates);
}

/**
 * Latin digits in both languages. Plates, dates and money then read the same way
 * on a contract as they do on screen, which is how the trade actually works here.
 */
export function formatQAR(amount: number, locale = 'en'): string {
  const digits = new Intl.NumberFormat(locale === 'ar' ? 'ar-QA-u-nu-latn' : 'en-QA', {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${digits} ${locale === 'ar' ? 'ر.ق' : 'QAR'}`;
}
