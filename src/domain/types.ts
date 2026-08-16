export type CarClass = 'luxury' | 'suv' | 'crossover' | 'sedan' | 'hatchback';

/** What a car looks like today, worked out from its bookings. */
export type VehicleStatus = 'available' | 'reserved' | 'rented' | 'maintenance';

/**
 * The only status stored against a car. Reserved and rented are never written
 * down, because they are facts about the bookings rather than about the car.
 */
export type VehicleServiceState = 'available' | 'maintenance';

export type BookingStatus = 'reserved' | 'active' | 'returned' | 'cancelled';

export type RateTier = 'month' | 'week' | 'day';

export interface Rates {
  daily: number;
  weekly: number;
  monthly: number;
}

/** A model in the catalogue. Rates live here, not on the individual cars. */
export interface CarModel {
  id: string;
  nameEn: string;
  nameAr: string;
  carClass: CarClass;
  seats: number;
  image: string;
  rates: Rates;
}

/** One physical car on the forecourt, identified by its plate. */
export interface Vehicle {
  id: string;
  modelId: string;
  plateNumber: string;
  colourEn: string;
  colourAr: string;
  status: VehicleServiceState;
  mileage: number;
  notes?: string;
}

/** Who is taking the car. Captured on the booking until a customer module exists. */
export interface Renter {
  name: string;
  phone: string;
  idNumber: string;
  licenceNumber: string;
  nationality?: string;
}

export interface QuoteLine {
  tier: RateTier;
  quantity: number;
  unitRate: number;
  amount: number;
}

export interface Quote {
  /** Days the customer actually keeps the car. */
  days: number;
  /** Days paid for, which exceeds `days` when a longer tier works out cheaper. */
  chargedDays: number;
  lines: QuoteLine[];
  total: number;
  /** What straight daily pricing would have cost, for comparison. */
  dailyTotal: number;
  saving: number;
}

export interface Booking {
  id: string;
  reference: string;
  vehicleId: string;
  renter: Renter;
  /** Inclusive pickup day, ISO yyyy-MM-dd. */
  startDate: string;
  /** Return day, ISO yyyy-MM-dd. The car is free again from this date. */
  endDate: string;
  status: BookingStatus;
  /** Frozen at the time of booking so later rate changes never rewrite history. */
  quote: Quote;
  deposit: number;
  notes?: string;
  createdAt: string;
}

export interface DateRange {
  start: string;
  end: string;
}
