import { LocalRentalStore } from './localStore';
import type { RentalStore } from './store';

/**
 * The one place that decides where 525's data lives.
 *
 * Today every branch of the business would be looking at its own browser. When
 * the hosted database is set up, add a SupabaseRentalStore alongside this and
 * choose it here; nothing above this line needs to know.
 */
export const store: RentalStore = new LocalRentalStore();

export * from './store';
