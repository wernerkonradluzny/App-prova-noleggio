import { useTranslation } from 'react-i18next';
import type { BookingStatus, VehicleStatus } from '../domain/types';

const TONES: Record<VehicleStatus | BookingStatus, string> = {
  available: 'bg-emerald-500/12 text-emerald-300 ring-emerald-400/25',
  reserved: 'bg-sky-500/12 text-sky-300 ring-sky-400/25',
  rented: 'bg-brass-400/12 text-brass-300 ring-brass-400/30',
  active: 'bg-brass-400/12 text-brass-300 ring-brass-400/30',
  maintenance: 'bg-rose-500/12 text-rose-300 ring-rose-400/25',
  returned: 'bg-ink-600/40 text-mist-400 ring-ink-500/40',
  cancelled: 'bg-ink-600/30 text-mist-500 ring-ink-500/30',
};

export function StatusPill({
  status,
  className = '',
}: {
  status: VehicleStatus | BookingStatus;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset whitespace-nowrap ${TONES[status]} ${className}`}
    >
      {t(`status.${status}`)}
    </span>
  );
}
