import { useMemo } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { ArrowUpRight, CarFront, CircleCheck, TriangleAlert, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Plate } from '../components/Plate';
import { StatusPill } from '../components/StatusPill';
import { derivedStatus, holdsVehicle, isVehicleFree } from '../domain/availability';
import type { Booking } from '../domain/types';
import { useRental } from '../state/RentalProvider';
import { useLocale } from '../state/useLocale';

export function Dashboard() {
  const { t } = useTranslation();
  const locale = useLocale();
  const { vehicles, bookings, today, modelOf, vehicleById, resetData } = useRental();

  const view = useMemo(() => {
    const statuses = vehicles.map((vehicle) => derivedStatus(vehicle, bookings, today));
    const onRent = statuses.filter((status) => status === 'rented').length;
    const inWorkshop = statuses.filter((status) => status === 'maintenance').length;
    const availableNow = statuses.filter((status) => status === 'available').length;

    const month = today.slice(0, 7);
    const bookedThisMonth = bookings
      .filter((booking) => booking.status !== 'cancelled' && booking.startDate.slice(0, 7) === month)
      .reduce((sum, booking) => sum + booking.quote.total, 0);

    const soon = format(addDays(parseISO(today), 7), 'yyyy-MM-dd');

    return {
      onRent,
      inWorkshop,
      availableNow,
      bookedThisMonth,
      utilisation: vehicles.length ? Math.round((onRent / vehicles.length) * 100) : 0,
      pickupsToday: bookings.filter((booking) => holdsVehicle(booking) && booking.startDate === today),
      returnsToday: bookings.filter((booking) => holdsVehicle(booking) && booking.endDate === today),
      overdue: bookings.filter((booking) => booking.status === 'active' && booking.endDate < today),
      comingUp: bookings
        .filter((booking) => booking.status === 'reserved' && booking.startDate > today && booking.startDate <= soon)
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
      // Cars nobody has claimed for the next few days: the ones actually costing money.
      idle: vehicles.filter((vehicle) =>
        isVehicleFree(vehicle, { start: today, end: format(addDays(parseISO(today), 4), 'yyyy-MM-dd') }, bookings),
      ),
    };
  }, [vehicles, bookings, today]);

  return (
    <>
      <PageHeader
        title={t('dashboard.title')}
        subtitle={locale.longDay(today)}
        actions={
          <button
            type="button"
            onClick={() => {
              if (window.confirm(t('common.resetWarning'))) void resetData();
            }}
            className="rounded-lg border border-ink-600 px-3 py-2 text-xs text-mist-500 transition hover:border-ink-500 hover:text-mist-300"
          >
            {t('common.resetData')}
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={<CarFront size={18} />}
          label={t('dashboard.onRent')}
          value={locale.number(view.onRent)}
          note={`${t('dashboard.utilisation')} ${view.utilisation}%`}
          tone="brass"
        />
        <Stat
          icon={<CircleCheck size={18} />}
          label={t('dashboard.availableNow')}
          value={locale.number(view.availableNow)}
          note={t('dashboard.ofFleet', { count: vehicles.length })}
          tone="emerald"
        />
        <Stat
          icon={<Wrench size={18} />}
          label={t('dashboard.inWorkshop')}
          value={locale.number(view.inWorkshop)}
          tone="rose"
        />
        <Stat
          icon={<ArrowUpRight size={18} />}
          label={t('dashboard.revenueThisMonth')}
          value={locale.money(view.bookedThisMonth)}
          tone="mist"
        />
      </div>

      {view.overdue.length > 0 && (
        <div className="mt-6 flex items-start gap-3 rounded-xl bg-rose-500/10 p-4 ring-1 ring-rose-400/25">
          <TriangleAlert size={18} className="mt-0.5 shrink-0 text-rose-300" />
          <div className="flex-1">
            <p className="text-sm font-medium text-rose-200">{t('dashboard.overdue')}</p>
            <ul className="mt-2 space-y-1">
              {view.overdue.map((booking) => (
                <li key={booking.id} className="text-sm text-rose-200/80">
                  {booking.renter.name} · <Plate value={vehicleById(booking.vehicleId)?.plateNumber} /> ·{' '}
                  {t('bookings.dueBack', { date: locale.day(booking.endDate) })}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <BookingList title={t('dashboard.pickupsToday')} empty={t('dashboard.noPickups')} bookings={view.pickupsToday} />
        <BookingList title={t('dashboard.returnsToday')} empty={t('dashboard.noReturns')} bookings={view.returnsToday} />
        <BookingList
          title={t('dashboard.comingUp')}
          empty={t('dashboard.noneComingUp')}
          bookings={view.comingUp}
          showDate
        />

        <section className="panel p-5">
          <h2 className="text-sm font-medium tracking-wide text-mist-200 uppercase">{t('dashboard.idleCars')}</h2>
          <p className="mt-0.5 mb-3 text-xs text-mist-500">{t('dashboard.idleHint')}</p>
          {view.idle.length === 0 ? (
            <p className="py-6 text-center text-sm text-mist-500">{t('dashboard.allBusy')}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {view.idle.map((vehicle) => (
                <Link
                  key={vehicle.id}
                  to={`/fleet/${vehicle.id}`}
                  className="flex items-baseline gap-2 rounded-lg bg-ink-700/50 px-2.5 py-1.5 text-xs text-mist-300 transition hover:bg-ink-700"
                >
                  <span className="text-mist-100">{locale.modelName(modelOf(vehicle))}</span>
                  <Plate value={vehicle.plateNumber} className="text-mist-500" />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

const TONES = {
  brass: 'text-brass-300 bg-brass-400/10',
  emerald: 'text-emerald-300 bg-emerald-500/10',
  rose: 'text-rose-300 bg-rose-500/10',
  mist: 'text-mist-300 bg-ink-700/50',
};

function Stat({
  icon,
  label,
  value,
  note,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note?: string;
  tone: keyof typeof TONES;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2.5">
        <span className={`flex size-8 items-center justify-center rounded-lg ${TONES[tone]}`}>{icon}</span>
        <span className="text-xs tracking-wide text-mist-400 uppercase">{label}</span>
      </div>
      {/* Figures stay in the sans face: the display serif renders 1 almost as an I. */}
      <p className="mt-3 text-3xl font-semibold text-mist-100 tabular-nums">{value}</p>
      {note && <p className="mt-1 text-xs text-mist-500">{note}</p>}
    </div>
  );
}

function BookingList({
  title,
  empty,
  bookings,
  showDate = false,
}: {
  title: string;
  empty: string;
  bookings: Booking[];
  showDate?: boolean;
}) {
  const locale = useLocale();
  const { vehicleById, modelOf } = useRental();

  return (
    <section className="panel p-5">
      <h2 className="mb-3 text-sm font-medium tracking-wide text-mist-200 uppercase">{title}</h2>
      {bookings.length === 0 ? (
        <p className="py-6 text-center text-sm text-mist-500">{empty}</p>
      ) : (
        <ul className="divide-y divide-ink-700/50">
          {bookings.map((booking) => {
            const vehicle = vehicleById(booking.vehicleId);
            return (
              <li key={booking.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-mist-200">{booking.renter.name}</p>
                  {/* Separate flex boxes: a name ending in a year and a plate would
                      otherwise run together into one number when read right to left. */}
                  <span className="flex items-baseline gap-2 text-xs text-mist-500">
                    <span className="truncate">{vehicle ? locale.modelName(modelOf(vehicle)) : ''}</span>
                    <Plate value={vehicle?.plateNumber} />
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {showDate && (
                    <span className="text-xs text-mist-400 tabular-nums">{locale.shortDay(booking.startDate)}</span>
                  )}
                  <StatusPill status={booking.status} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
