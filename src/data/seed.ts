import { addDays, format } from 'date-fns';
import { quoteForDates } from '../domain/pricing';
import type { Booking, CarModel, Vehicle } from '../domain/types';

/**
 * The 525 catalogue, transcribed from the printed price sheets. Rates are in QAR
 * and belong to the model; the individual cars are below.
 */
export const CAR_MODELS: CarModel[] = [
  {
    id: 'cadillac-escalade-2025',
    nameEn: 'Cadillac Escalade 2025',
    nameAr: 'كاديلاك إسكاليد 2025',
    carClass: 'luxury',
    seats: 7,
    image: 'cars/cadillac-escalade-2025.png',
    rates: { daily: 1500, weekly: 7500, monthly: 15000 },
  },
  {
    id: 'lexus-lx700h',
    nameEn: 'Lexus LX 700h',
    nameAr: 'لكزس LX 700h',
    carClass: 'luxury',
    seats: 7,
    image: 'cars/lexus-lx700h.png',
    rates: { daily: 1500, weekly: 7500, monthly: 15000 },
  },
  {
    id: 'range-rover-sport-2021',
    nameEn: 'Range Rover Sport 2021',
    nameAr: 'رينج روفر سبورت 2021',
    carClass: 'luxury',
    seats: 5,
    image: 'cars/range-rover-sport-2021.png',
    rates: { daily: 900, weekly: 6000, monthly: 12000 },
  },
  {
    id: 'toyota-land-cruiser-vxr-2025',
    nameEn: 'Toyota Land Cruiser VXR 2025',
    nameAr: 'تويوتا لاند كروزر VXR 2025',
    carClass: 'suv',
    seats: 7,
    image: 'cars/toyota-land-cruiser-vxr-2025.png',
    rates: { daily: 700, weekly: 4500, monthly: 12000 },
  },
  {
    id: 'byd-leopard-5',
    nameEn: 'BYD Leopard 5',
    nameAr: 'بي واي دي ليوبارد 5',
    carClass: 'suv',
    seats: 5,
    image: 'cars/byd-leopard-5.png',
    rates: { daily: 700, weekly: 4500, monthly: 9000 },
  },
  {
    id: 'jetour-t2-2025',
    nameEn: 'Jetour T2 2025',
    nameAr: 'جيتور T2 2025',
    carClass: 'suv',
    seats: 5,
    image: 'cars/jetour-t2-2025.png',
    rates: { daily: 400, weekly: 2500, monthly: 6000 },
  },
  {
    id: 'toyota-fortuner-2025',
    nameEn: 'Toyota Fortuner 2025',
    nameAr: 'تويوتا فورتشنر 2025',
    carClass: 'suv',
    seats: 7,
    image: 'cars/toyota-fortuner-2025.png',
    rates: { daily: 300, weekly: 1800, monthly: 6000 },
  },
  {
    id: 'haval-jolion-2026',
    nameEn: 'Haval Jolion 2026',
    nameAr: 'هافال جوليون 2026',
    carClass: 'crossover',
    seats: 5,
    image: 'cars/haval-jolion-2026.png',
    rates: { daily: 170, weekly: 1000, monthly: 2700 },
  },
  {
    id: 'dengfang-mage-2026',
    nameEn: 'Dengfang Mage 2026',
    nameAr: 'دنغفانغ ماج 2026',
    carClass: 'crossover',
    seats: 5,
    image: 'cars/dengfang-mage-2026.png',
    rates: { daily: 170, weekly: 1000, monthly: 2700 },
  },
  {
    id: 'exceed-lx-2025',
    nameEn: 'Exceed LX 2025',
    nameAr: 'إكسيد LX 2025',
    carClass: 'crossover',
    seats: 5,
    image: 'cars/exceed-lx-2025.png',
    rates: { daily: 130, weekly: 700, monthly: 2400 },
  },
  {
    id: 'chery-tiggo-7',
    nameEn: 'Chery Tiggo 7',
    nameAr: 'شيري تيجو 7',
    carClass: 'crossover',
    seats: 5,
    image: 'cars/chery-tiggo-7.png',
    rates: { daily: 130, weekly: 700, monthly: 2400 },
  },
  {
    id: 'mg-zs',
    nameEn: 'MG ZS',
    nameAr: 'إم جي ZS',
    carClass: 'crossover',
    seats: 5,
    image: 'cars/mg-zs.png',
    rates: { daily: 90, weekly: 500, monthly: 1700 },
  },
  {
    id: 'byd-qin-plus',
    nameEn: 'BYD Qin Plus',
    nameAr: 'بي واي دي تشين بلس',
    carClass: 'sedan',
    seats: 5,
    image: 'cars/byd-qin-plus.png',
    rates: { daily: 130, weekly: 700, monthly: 2400 },
  },
  {
    id: 'mg-5',
    nameEn: 'MG 5',
    nameAr: 'إم جي 5',
    carClass: 'sedan',
    seats: 5,
    image: 'cars/mg-5.png',
    rates: { daily: 90, weekly: 500, monthly: 1700 },
  },
  {
    id: 'mg-3',
    nameEn: 'MG 3',
    nameAr: 'إم جي 3',
    carClass: 'hatchback',
    seats: 5,
    image: 'cars/mg-3.png',
    rates: { daily: 90, weekly: 500, monthly: 1700 },
  },
];

const COLOURS: Record<string, [string, string]> = {
  black: ['Black', 'أسود'],
  white: ['White', 'أبيض'],
  silver: ['Silver', 'فضي'],
  grey: ['Grey', 'رمادي'],
  blue: ['Blue', 'أزرق'],
};

/** modelId, plate, colour, starting mileage. */
const FLEET: Array<[string, string, keyof typeof COLOURS, number]> = [
  ['cadillac-escalade-2025', '525 101', 'black', 12480],
  ['lexus-lx700h', '525 102', 'black', 8320],
  ['range-rover-sport-2021', '525 103', 'black', 61240],
  ['toyota-land-cruiser-vxr-2025', '525 110', 'white', 22150],
  ['toyota-land-cruiser-vxr-2025', '525 111', 'white', 18740],
  ['byd-leopard-5', '525 115', 'black', 9600],
  ['jetour-t2-2025', '525 120', 'grey', 14300],
  ['jetour-t2-2025', '525 121', 'grey', 11980],
  ['toyota-fortuner-2025', '525 130', 'white', 31450],
  ['toyota-fortuner-2025', '525 131', 'white', 27860],
  ['haval-jolion-2026', '525 140', 'black', 6210],
  ['haval-jolion-2026', '525 141', 'black', 5480],
  ['haval-jolion-2026', '525 142', 'black', 7130],
  ['dengfang-mage-2026', '525 145', 'blue', 4890],
  ['dengfang-mage-2026', '525 146', 'blue', 3970],
  ['exceed-lx-2025', '525 150', 'white', 15620],
  ['exceed-lx-2025', '525 151', 'white', 13440],
  ['chery-tiggo-7', '525 155', 'black', 24310],
  ['chery-tiggo-7', '525 156', 'black', 19870],
  ['chery-tiggo-7', '525 157', 'black', 21540],
  ['mg-zs', '525 160', 'silver', 33200],
  ['mg-zs', '525 161', 'silver', 29840],
  ['mg-zs', '525 162', 'silver', 36150],
  ['byd-qin-plus', '525 170', 'white', 11230],
  ['byd-qin-plus', '525 171', 'white', 9840],
  ['mg-5', '525 180', 'silver', 41250],
  ['mg-5', '525 181', 'silver', 38470],
  ['mg-5', '525 182', 'silver', 44890],
  ['mg-5', '525 183', 'silver', 35620],
  ['mg-3', '525 190', 'grey', 47310],
  ['mg-3', '525 191', 'grey', 52480],
  ['mg-3', '525 192', 'grey', 43790],
];

export function seedVehicles(): Vehicle[] {
  return FLEET.map(([modelId, plateNumber, colour, mileage], index) => ({
    id: `v-${index + 1}`,
    modelId,
    plateNumber,
    colourEn: COLOURS[colour][0],
    colourAr: COLOURS[colour][1],
    // One car is in the workshop so the availability rules are visible from the start.
    status: plateNumber === '525 161' ? 'maintenance' : 'available',
    mileage,
    notes: plateNumber === '525 161' ? 'Service due - front brake pads' : undefined,
  }));
}

/** plate, renter, phone, QID, licence, day offset from today, length in days, status. */
const SAMPLE_RENTALS: Array<[string, string, string, string, string, number, number, Booking['status']]> = [
  ['525 101', 'Abdulla Al Marri', '+974 5512 4408', '28563401192', 'QA-4471902', -10, 30, 'active'],
  ['525 110', 'Sarah Nakamura', '+974 3391 7742', '29874512067', 'QA-5580341', -3, 7, 'active'],
  ['525 155', 'Mohammed Rashid', '+974 6644 2019', '27736548821', 'QA-3319875', -5, 5, 'active'],
  ['525 180', 'Priya Menon', '+974 7708 3356', '29112447790', 'QA-6642108', -14, 30, 'active'],
  ['525 160', 'James Okoro', '+974 5023 9917', '28840173365', 'QA-2298416', -6, 6, 'active'],
  ['525 130', 'Fatima Al Kuwari', '+974 3345 8801', '29650028834', 'QA-7734029', 0, 30, 'reserved'],
  ['525 156', 'Ahmed Barakat', '+974 6690 1123', '28217769043', 'QA-1105572', 0, 3, 'reserved'],
  ['525 190', 'Linh Tran', '+974 7754 6620', '29338840175', 'QA-8846613', 1, 7, 'reserved'],
  ['525 102', 'Khalid Al Sulaiti', '+974 5567 3390', '27994412208', 'QA-9920047', 2, 10, 'reserved'],
  ['525 140', 'Grace Mwangi', '+974 3312 7708', '29775530149', 'QA-4408821', 4, 25, 'reserved'],
  ['525 170', 'Yousef Haddad', '+974 6621 4498', '28450093317', 'QA-3327756', 6, 14, 'reserved'],
  ['525 120', 'Elena Petrova', '+974 7719 2264', '29008847712', 'QA-6613390', -25, 12, 'returned'],
  ['525 181', 'Omar Zaid', '+974 5548 1170', '28773029945', 'QA-2214408', -40, 30, 'returned'],
  ['525 150', 'Aisha Rahman', '+974 3367 9925', '29441170882', 'QA-5573301', -18, 6, 'returned'],
];

export function seedBookings(vehicles: Vehicle[], today = new Date()): Booking[] {
  const byPlate = new Map(vehicles.map((vehicle) => [vehicle.plateNumber, vehicle]));
  const models = new Map(CAR_MODELS.map((model) => [model.id, model]));

  return SAMPLE_RENTALS.flatMap(
    ([plate, name, phone, idNumber, licenceNumber, offset, length, status], index) => {
      const vehicle = byPlate.get(plate);
      if (!vehicle) return [];
      const model = models.get(vehicle.modelId);
      if (!model) return [];

      const startDate = format(addDays(today, offset), 'yyyy-MM-dd');
      const endDate = format(addDays(today, offset + length), 'yyyy-MM-dd');
      const quote = quoteForDates(startDate, endDate, model.rates);

      return [
        {
          id: `b-${index + 1}`,
          reference: `525-${1001 + index}`,
          vehicleId: vehicle.id,
          renter: { name, phone, idNumber, licenceNumber },
          startDate,
          endDate,
          status,
          quote,
          deposit: Math.round(model.rates.daily * 2),
          createdAt: addDays(today, offset - 2).toISOString(),
        },
      ];
    },
  );
}
