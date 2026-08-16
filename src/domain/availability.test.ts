import { describe, expect, it } from 'vitest';
import { derivedStatus, freeVehicles, isVehicleFree, overlaps } from './availability';
import type { Booking, Quote, Vehicle } from './types';

const emptyQuote: Quote = {
  days: 1,
  chargedDays: 1,
  lines: [],
  total: 0,
  dailyTotal: 0,
  saving: 0,
};

function vehicle(id: string, status: Vehicle['status'] = 'available'): Vehicle {
  return {
    id,
    modelId: 'model-1',
    plateNumber: id,
    colourEn: 'White',
    colourAr: 'أبيض',
    status,
    mileage: 10_000,
  };
}

function booking(id: string, vehicleId: string, start: string, end: string, status: Booking['status'] = 'reserved'): Booking {
  return {
    id,
    reference: id,
    vehicleId,
    renter: { name: 'Test', phone: '', idNumber: '', licenceNumber: '' },
    startDate: start,
    endDate: end,
    status,
    quote: emptyQuote,
    deposit: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('overlaps', () => {
  it('sees a clash when the ranges cross', () => {
    expect(overlaps({ start: '2026-03-05', end: '2026-03-10' }, { start: '2026-03-08', end: '2026-03-12' })).toBe(true);
  });

  it('lets a car go out again the day it comes back', () => {
    expect(overlaps({ start: '2026-03-10', end: '2026-03-14' }, { start: '2026-03-05', end: '2026-03-10' })).toBe(false);
  });

  it('catches a range fully inside another', () => {
    expect(overlaps({ start: '2026-03-06', end: '2026-03-07' }, { start: '2026-03-01', end: '2026-03-31' })).toBe(true);
  });
});

describe('isVehicleFree', () => {
  const range = { start: '2026-03-05', end: '2026-03-10' };

  it('is free with nothing booked', () => {
    expect(isVehicleFree(vehicle('a'), range, [])).toBe(true);
  });

  it('is taken when a reservation clashes', () => {
    expect(isVehicleFree(vehicle('a'), range, [booking('b1', 'a', '2026-03-07', '2026-03-12')])).toBe(false);
  });

  it('ignores cancelled and returned bookings', () => {
    const history = [
      booking('b1', 'a', '2026-03-07', '2026-03-12', 'cancelled'),
      booking('b2', 'a', '2026-03-06', '2026-03-08', 'returned'),
    ];
    expect(isVehicleFree(vehicle('a'), range, history)).toBe(true);
  });

  it('ignores clashes on a different car', () => {
    expect(isVehicleFree(vehicle('a'), range, [booking('b1', 'z', '2026-03-07', '2026-03-12')])).toBe(true);
  });

  it('is never free while in the workshop', () => {
    expect(isVehicleFree(vehicle('a', 'maintenance'), range, [])).toBe(false);
  });

  it('can disregard the booking being edited', () => {
    const existing = [booking('b1', 'a', '2026-03-05', '2026-03-10')];
    expect(isVehicleFree(vehicle('a'), range, existing, 'b1')).toBe(true);
  });
});

describe('freeVehicles', () => {
  it('returns only the cars actually available', () => {
    const fleet = [vehicle('a'), vehicle('b'), vehicle('c', 'maintenance')];
    const held = [booking('b1', 'b', '2026-03-01', '2026-03-20')];
    const free = freeVehicles(fleet, { start: '2026-03-05', end: '2026-03-10' }, held);
    expect(free.map((v) => v.id)).toEqual(['a']);
  });
});

describe('derivedStatus', () => {
  const today = '2026-03-06';

  it('reads as rented while a live rental is running', () => {
    expect(derivedStatus(vehicle('a'), [booking('b1', 'a', '2026-03-05', '2026-03-10', 'active')], today)).toBe('rented');
  });

  it('reads as reserved when the booking has not started', () => {
    expect(derivedStatus(vehicle('a'), [booking('b1', 'a', '2026-03-05', '2026-03-10', 'reserved')], today)).toBe('reserved');
  });

  it('frees up on the return date itself', () => {
    expect(derivedStatus(vehicle('a'), [booking('b1', 'a', '2026-03-01', '2026-03-06', 'active')], today)).toBe('available');
  });

  it('lets a manual workshop flag override everything', () => {
    expect(derivedStatus(vehicle('a', 'maintenance'), [booking('b1', 'a', '2026-03-05', '2026-03-10', 'active')], today)).toBe(
      'maintenance',
    );
  });
});
