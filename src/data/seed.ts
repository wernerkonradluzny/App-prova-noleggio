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

/** modelId, plate, colour, starting mileage. One physical car per model. */
const FLEET: Array<[string, string, keyof typeof COLOURS, number]> = [
  ['cadillac-escalade-2025', '525 101', 'black', 12480],
  ['lexus-lx700h', '525 102', 'black', 8320],
  ['range-rover-sport-2021', '525 103', 'black', 61240],
  ['toyota-land-cruiser-vxr-2025', '525 110', 'white', 22150],
  ['byd-leopard-5', '525 115', 'black', 9600],
  ['jetour-t2-2025', '525 120', 'grey', 14300],
  ['toyota-fortuner-2025', '525 130', 'white', 31450],
  ['haval-jolion-2026', '525 140', 'black', 6210],
  ['dengfang-mage-2026', '525 145', 'blue', 4890],
  ['exceed-lx-2025', '525 150', 'white', 15620],
  ['chery-tiggo-7', '525 155', 'black', 24310],
  ['mg-zs', '525 160', 'silver', 33200],
  ['byd-qin-plus', '525 170', 'white', 11230],
  ['mg-5', '525 180', 'silver', 41250],
  ['mg-3', '525 190', 'grey', 47310],
];

export function seedVehicles(): Vehicle[] {
  return FLEET.map(([modelId, plateNumber, colour, mileage], index) => ({
    id: `v-${index + 1}`,
    modelId,
    plateNumber,
    colourEn: COLOURS[colour][0],
    colourAr: COLOURS[colour][1],
    status: 'available',
    mileage,
  }));
}

export function seedBookings(_vehicles: Vehicle[], _today = new Date()): Booking[] {
  return [];
}
