import { bookingsBlocking } from '../domain/availability';
import { quoteForDates } from '../domain/pricing';
import type { Booking, CarModel, Vehicle, VehicleServiceState } from '../domain/types';
import { CAR_MODELS, seedBookings, seedVehicles } from './seed';
import { BookingConflictError, type BookingChanges, type NewBooking, type RentalStore, type Snapshot } from './store';

const STORAGE_KEY = 'rental-525/v2';

interface Persisted {
  vehicles: Vehicle[];
  bookings: Booking[];
}

/**
 * Keeps the operation in the browser it is running in.
 *
 * This is the version-one adapter: it lets the whole system be used and judged
 * with no accounts and nothing to pay for. The catalogue itself is code rather
 * than stored data, so corrections to the price sheets ship with the app.
 */
export class LocalRentalStore implements RentalStore {
  private cache: Persisted | null = null;

  async load(): Promise<Snapshot> {
    const { vehicles, bookings } = this.read();
    return { models: CAR_MODELS, vehicles, bookings };
  }

  async createBooking(input: NewBooking): Promise<Booking> {
    const data = this.read();

    const clashes = bookingsBlocking(
      input.vehicleId,
      { start: input.startDate, end: input.endDate },
      data.bookings,
    );
    if (clashes.length > 0) throw new BookingConflictError(clashes);

    const vehicle = data.vehicles.find((candidate) => candidate.id === input.vehicleId);
    if (!vehicle) throw new Error(`No such vehicle: ${input.vehicleId}`);
    const model = modelFor(vehicle);

    const today = new Date().toISOString().slice(0, 10);
    const booking: Booking = {
      id: `b-${crypto.randomUUID()}`,
      reference: nextReference(data.bookings),
      vehicleId: input.vehicleId,
      renter: input.renter,
      startDate: input.startDate,
      endDate: input.endDate,
      status: input.startDate <= today ? 'active' : 'reserved',
      quote: quoteForDates(input.startDate, input.endDate, model.rates),
      deposit: input.deposit,
      notes: input.notes,
      createdAt: new Date().toISOString(),
    };

    this.write({ ...data, bookings: [...data.bookings, booking] });
    return booking;
  }

  async changeBooking(id: string, changes: BookingChanges): Promise<Booking> {
    const data = this.read();
    const existing = data.bookings.find((booking) => booking.id === id);
    if (!existing) throw new Error(`No such booking: ${id}`);

    let updated: Booking = { ...existing, ...changes };

    // Extending re-prices the whole rental, since a longer stay can cross into a
    // cheaper tier. The car must still be free for the added days.
    if (changes.endDate && changes.endDate !== existing.endDate) {
      const clashes = bookingsBlocking(
        existing.vehicleId,
        { start: existing.startDate, end: changes.endDate },
        data.bookings,
        id,
      );
      if (clashes.length > 0) throw new BookingConflictError(clashes);

      const vehicle = data.vehicles.find((candidate) => candidate.id === existing.vehicleId);
      if (!vehicle) throw new Error(`No such vehicle: ${existing.vehicleId}`);
      updated = {
        ...updated,
        quote: quoteForDates(existing.startDate, changes.endDate, modelFor(vehicle).rates),
      };
    }

    this.write({
      ...data,
      bookings: data.bookings.map((booking) => (booking.id === id ? updated : booking)),
    });
    return updated;
  }

  async setVehicleService(id: string, state: VehicleServiceState, notes?: string): Promise<Vehicle> {
    const data = this.read();
    const existing = data.vehicles.find((vehicle) => vehicle.id === id);
    if (!existing) throw new Error(`No such vehicle: ${id}`);

    const updated: Vehicle = {
      ...existing,
      status: state,
      notes: state === 'maintenance' ? notes : undefined,
    };
    this.write({
      ...data,
      vehicles: data.vehicles.map((vehicle) => (vehicle.id === id ? updated : vehicle)),
    });
    return updated;
  }

  async reset(): Promise<Snapshot> {
    window.localStorage.removeItem(STORAGE_KEY);
    this.cache = null;
    return this.load();
  }

  private read(): Persisted {
    if (this.cache) return this.cache;

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.cache = JSON.parse(stored) as Persisted;
        return this.cache;
      } catch {
        // Unreadable data is worth less than a clean start.
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    const vehicles = seedVehicles();
    const fresh: Persisted = { vehicles, bookings: seedBookings(vehicles) };
    this.write(fresh);
    return fresh;
  }

  private write(data: Persisted): void {
    this.cache = data;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

function modelFor(vehicle: Vehicle): CarModel {
  const model = CAR_MODELS.find((candidate) => candidate.id === vehicle.modelId);
  if (!model) throw new Error(`No such model: ${vehicle.modelId}`);
  return model;
}

function nextReference(bookings: Booking[]): string {
  const highest = bookings.reduce((max, booking) => {
    const number = Number.parseInt(booking.reference.replace('525-', ''), 10);
    return Number.isNaN(number) ? max : Math.max(max, number);
  }, 1000);
  return `525-${highest + 1}`;
}
