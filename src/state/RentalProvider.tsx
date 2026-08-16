import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { format } from 'date-fns';
import { store, type BookingChanges, type NewBooking } from '../data';
import type { Booking, CarModel, Vehicle, VehicleServiceState } from '../domain/types';

interface RentalContextValue {
  loading: boolean;
  models: CarModel[];
  vehicles: Vehicle[];
  bookings: Booking[];
  /** Today as yyyy-MM-dd, the format every date in the system uses. */
  today: string;
  modelById: (id: string) => CarModel | undefined;
  modelOf: (vehicle: Vehicle) => CarModel | undefined;
  vehicleById: (id: string) => Vehicle | undefined;
  bookingById: (id: string) => Booking | undefined;
  createBooking: (input: NewBooking) => Promise<Booking>;
  changeBooking: (id: string, changes: BookingChanges) => Promise<Booking>;
  setVehicleService: (id: string, state: VehicleServiceState, notes?: string) => Promise<void>;
  resetData: () => Promise<void>;
}

const RentalContext = createContext<RentalContextValue | null>(null);

export function RentalProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<CarModel[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const refresh = useCallback(async () => {
    const snapshot = await store.load();
    setModels(snapshot.models);
    setVehicles(snapshot.vehicles);
    setBookings(snapshot.bookings);
  }, []);

  useEffect(() => {
    void refresh().finally(() => setLoading(false));
  }, [refresh]);

  const value = useMemo<RentalContextValue>(() => {
    const modelIndex = new Map(models.map((model) => [model.id, model]));
    const vehicleIndex = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
    const bookingIndex = new Map(bookings.map((booking) => [booking.id, booking]));

    return {
      loading,
      models,
      vehicles,
      bookings,
      today: format(new Date(), 'yyyy-MM-dd'),
      modelById: (id) => modelIndex.get(id),
      modelOf: (vehicle) => modelIndex.get(vehicle.modelId),
      vehicleById: (id) => vehicleIndex.get(id),
      bookingById: (id) => bookingIndex.get(id),
      createBooking: async (input) => {
        const booking = await store.createBooking(input);
        await refresh();
        return booking;
      },
      changeBooking: async (id, changes) => {
        const booking = await store.changeBooking(id, changes);
        await refresh();
        return booking;
      },
      setVehicleService: async (id, state, notes) => {
        await store.setVehicleService(id, state, notes);
        await refresh();
      },
      resetData: async () => {
        await store.reset();
        await refresh();
      },
    };
  }, [loading, models, vehicles, bookings, refresh]);

  return <RentalContext.Provider value={value}>{children}</RentalContext.Provider>;
}

export function useRental(): RentalContextValue {
  const context = useContext(RentalContext);
  if (!context) throw new Error('useRental must be used inside RentalProvider');
  return context;
}
