import type { Booking, BookingStatus, DateRange, Vehicle } from './types';

/** Bookings in these states hold a car; the others release it. */
const HOLDING_STATUSES: BookingStatus[] = ['reserved', 'active'];

export function holdsVehicle(booking: Booking): boolean {
  return HOLDING_STATUSES.includes(booking.status);
}

/**
 * Two rentals clash when each starts before the other ends. Touching ranges do
 * not clash: a car returned on the 10th can go straight back out on the 10th.
 */
export function overlaps(a: DateRange, b: DateRange): boolean {
  return a.start < b.end && a.end > b.start;
}

export function bookingsBlocking(
  vehicleId: string,
  range: DateRange,
  bookings: Booking[],
  ignoreBookingId?: string,
): Booking[] {
  return bookings.filter(
    (booking) =>
      booking.vehicleId === vehicleId &&
      booking.id !== ignoreBookingId &&
      holdsVehicle(booking) &&
      overlaps(range, { start: booking.startDate, end: booking.endDate }),
  );
}

export function isVehicleFree(
  vehicle: Vehicle,
  range: DateRange,
  bookings: Booking[],
  ignoreBookingId?: string,
): boolean {
  if (vehicle.status === 'maintenance') return false;
  return bookingsBlocking(vehicle.id, range, bookings, ignoreBookingId).length === 0;
}

export function freeVehicles(
  vehicles: Vehicle[],
  range: DateRange,
  bookings: Booking[],
  ignoreBookingId?: string,
): Vehicle[] {
  return vehicles.filter((vehicle) => isVehicleFree(vehicle, range, bookings, ignoreBookingId));
}

/** The booking that has a car right now, if any. */
export function currentBooking(vehicleId: string, bookings: Booking[], today: string): Booking | undefined {
  return bookings.find(
    (booking) =>
      booking.vehicleId === vehicleId &&
      holdsVehicle(booking) &&
      booking.startDate <= today &&
      booking.endDate > today,
  );
}

/**
 * What a car's status should be today, derived from its bookings. Maintenance is
 * set by hand and always wins.
 */
export function derivedStatus(vehicle: Vehicle, bookings: Booking[], today: string) {
  if (vehicle.status === 'maintenance') return 'maintenance' as const;
  const now = currentBooking(vehicle.id, bookings, today);
  if (now) return now.status === 'active' ? ('rented' as const) : ('reserved' as const);
  return 'available' as const;
}
