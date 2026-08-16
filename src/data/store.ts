import type { Booking, BookingStatus, CarModel, Renter, Vehicle, VehicleServiceState } from '../domain/types';

export interface Snapshot {
  models: CarModel[];
  vehicles: Vehicle[];
  bookings: Booking[];
}

export interface NewBooking {
  vehicleId: string;
  renter: Renter;
  startDate: string;
  endDate: string;
  deposit: number;
  notes?: string;
}

export interface BookingChanges {
  status?: BookingStatus;
  endDate?: string;
  notes?: string;
  deposit?: number;
}

/**
 * Everything the screens are allowed to do to the data.
 *
 * Deliberately small and entirely asynchronous. The browser-backed
 * implementation resolves immediately today; a hosted Postgres implementation
 * can drop into the same shape later without a single screen changing.
 */
export interface RentalStore {
  load(): Promise<Snapshot>;
  createBooking(input: NewBooking): Promise<Booking>;
  changeBooking(id: string, changes: BookingChanges): Promise<Booking>;
  setVehicleService(id: string, state: VehicleServiceState, notes?: string): Promise<Vehicle>;
  reset(): Promise<Snapshot>;
}

/** Raised when a car is asked to be in two places at once. */
export class BookingConflictError extends Error {
  constructor(public readonly conflicting: Booking[]) {
    super('That car is already booked for those dates');
    this.name = 'BookingConflictError';
  }
}
