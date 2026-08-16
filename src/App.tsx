import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Availability } from './pages/Availability';
import { Bookings } from './pages/Bookings';
import { Dashboard } from './pages/Dashboard';
import { Fleet } from './pages/Fleet';
import { NewBooking } from './pages/NewBooking';
import { VehicleDetail } from './pages/VehicleDetail';
import { useRental } from './state/RentalProvider';

export default function App() {
  const { loading } = useRental();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950">
        <span className="font-display text-4xl tracking-[0.3em] text-brass-300">525</span>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/fleet" element={<Fleet />} />
        <Route path="/fleet/:vehicleId" element={<VehicleDetail />} />
        <Route path="/availability" element={<Availability />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/bookings/new" element={<NewBooking />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </Layout>
  );
}
