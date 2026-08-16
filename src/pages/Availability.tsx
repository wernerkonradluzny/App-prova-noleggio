import { useMemo, useState } from 'react';
import { addDays, differenceInCalendarDays, format, isWeekend, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Plate } from '../components/Plate';
import { holdsVehicle } from '../domain/availability';
import type { Booking, Vehicle } from '../domain/types';
import { useRental } from '../state/RentalProvider';
import { useLocale } from '../state/useLocale';

const WINDOW_DAYS = 21;

export function Availability() {
  const { t } = useTranslation();
  const { models, vehicles, bookings, today } = useRental();
  const [offset, setOffset] = useState(0);
  const [hideQuiet, setHideQuiet] = useState(false);

  const windowStart = useMemo(() => addDays(parseISO(today), offset), [today, offset]);
  const days = useMemo(
    () => Array.from({ length: WINDOW_DAYS }, (_, index) => addDays(windowStart, index)),
    [windowStart],
  );
  const windowEndIso = format(addDays(windowStart, WINDOW_DAYS), 'yyyy-MM-dd');
  const windowStartIso = format(windowStart, 'yyyy-MM-dd');

  /** Cars in catalogue order, each with the bookings that touch this window. */
  const rows = useMemo(() => {
    const order = new Map(models.map((model, index) => [model.id, index]));
    return vehicles
      .slice()
      .sort(
        (a, b) =>
          (order.get(a.modelId) ?? 0) - (order.get(b.modelId) ?? 0) || a.plateNumber.localeCompare(b.plateNumber),
      )
      .map((vehicle) => ({
        vehicle,
        bars: bookings.filter(
          (booking) =>
            booking.vehicleId === vehicle.id &&
            holdsVehicle(booking) &&
            booking.startDate < windowEndIso &&
            booking.endDate > windowStartIso,
        ),
      }))
      .filter((row) => !hideQuiet || row.bars.length > 0 || row.vehicle.status === 'maintenance');
  }, [models, vehicles, bookings, windowStartIso, windowEndIso, hideQuiet]);

  const gridTemplate = `minmax(9rem, 9rem) repeat(${WINDOW_DAYS}, minmax(2.25rem, 1fr))`;

  return (
    <>
      <PageHeader
        title={t('timeline.title')}
        subtitle={t('timeline.subtitle')}
        actions={
          <>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-mist-400">
              <input
                type="checkbox"
                checked={hideQuiet}
                onChange={(event) => setHideQuiet(event.target.checked)}
                className="size-4 accent-[var(--color-brass-400)]"
              />
              {t('timeline.showOnlyBusy')}
            </label>
            <div className="flex items-center gap-1">
              <NavButton onClick={() => setOffset(offset - 7)} label={t('timeline.earlier')}>
                <ChevronLeft size={16} className="rtl:rotate-180" />
              </NavButton>
              <button
                type="button"
                onClick={() => setOffset(0)}
                className="rounded-lg border border-ink-600 px-3 py-2 text-sm text-mist-300 transition hover:border-brass-400/50"
              >
                {t('timeline.jumpToToday')}
              </button>
              <NavButton onClick={() => setOffset(offset + 7)} label={t('timeline.later')}>
                <ChevronRight size={16} className="rtl:rotate-180" />
              </NavButton>
            </div>
          </>
        }
      />

      <div className="panel overflow-x-auto">
        <div className="min-w-[64rem]">
          <div
            className="sticky top-0 z-10 grid border-b border-ink-700/60 bg-ink-850"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <div className="px-4 py-3 text-[11px] tracking-wider text-mist-500 uppercase">{t('fleet.plate')}</div>
            {days.map((day) => {
              const iso = format(day, 'yyyy-MM-dd');
              const isToday = iso === today;
              return (
                <div
                  key={iso}
                  className={`border-s border-ink-700/40 py-2 text-center ${
                    isToday ? 'bg-brass-400/10' : isWeekend(day) ? 'bg-ink-900/40' : ''
                  }`}
                >
                  <div className={`text-[10px] uppercase ${isToday ? 'text-brass-300' : 'text-mist-500'}`}>
                    {format(day, 'EEEEE')}
                  </div>
                  <div className={`text-xs tabular-nums ${isToday ? 'text-brass-200' : 'text-mist-300'}`}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>

          {rows.length === 0 ? (
            <p className="py-16 text-center text-sm text-mist-500">{t('timeline.nothingBooked')}</p>
          ) : (
            rows.map(({ vehicle, bars }) => (
              <TimelineRow
                key={vehicle.id}
                vehicle={vehicle}
                bars={bars}
                windowStart={windowStart}
                gridTemplate={gridTemplate}
                today={today}
                days={days}
              />
            ))
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-mist-500">
        <Legend className="bg-brass-400/70" label={t('status.rented')} />
        <Legend className="bg-sky-500/60" label={t('status.reserved')} />
        <Legend className="bg-rose-500/50" label={t('status.maintenance')} />
      </div>
    </>
  );
}

function TimelineRow({
  vehicle,
  bars,
  windowStart,
  gridTemplate,
  today,
  days,
}: {
  vehicle: Vehicle;
  bars: Booking[];
  windowStart: Date;
  gridTemplate: string;
  today: string;
  days: Date[];
}) {
  const locale = useLocale();
  const { modelOf } = useRental();
  const model = modelOf(vehicle);
  const inWorkshop = vehicle.status === 'maintenance';

  return (
    <div
      className="grid min-h-11 border-b border-ink-700/30 last:border-0"
      style={{ gridTemplateColumns: gridTemplate }}
    >
      {/* Every child is placed explicitly. Left to auto-placement, the bars would
          shove the labels and day cells into invented rows. */}
      <Link
        to={`/fleet/${vehicle.id}`}
        className="flex flex-col justify-center px-4 py-2 transition hover:bg-ink-700/40"
        style={{ gridRow: 1, gridColumn: 1 }}
      >
        <span className="truncate text-xs text-mist-300">{locale.modelName(model)}</span>
        <Plate value={vehicle.plateNumber} className="text-[11px] text-mist-500" />
      </Link>

      {days.map((day, index) => {
        const iso = format(day, 'yyyy-MM-dd');
        return (
          <div
            key={iso}
            className={`border-s border-ink-700/25 ${
              iso === today ? 'bg-brass-400/[0.07]' : isWeekend(day) ? 'bg-ink-900/30' : ''
            }`}
            style={{ gridRow: 1, gridColumn: index + 2 }}
          />
        );
      })}

      {inWorkshop && (
        <div
          className="z-10 my-1.5 flex items-center justify-center rounded-md bg-rose-500/25 px-2 text-[11px] text-rose-200 ring-1 ring-rose-400/25"
          style={{ gridRow: 1, gridColumn: `2 / ${days.length + 2}` }}
        >
          {vehicle.notes ?? ''}
        </div>
      )}

      {!inWorkshop &&
        bars.map((booking) => {
          const from = Math.max(0, differenceInCalendarDays(parseISO(booking.startDate), windowStart));
          const to = Math.min(days.length, differenceInCalendarDays(parseISO(booking.endDate), windowStart));
          if (to <= from) return null;

          return (
            <div
              key={booking.id}
              title={`${booking.reference} · ${booking.renter.name} · ${locale.day(booking.startDate)} → ${locale.day(booking.endDate)}`}
              className={`z-10 my-1.5 flex items-center overflow-hidden rounded-md px-2 text-[11px] whitespace-nowrap ${
                booking.status === 'active'
                  ? 'bg-brass-400/70 text-ink-950'
                  : 'bg-sky-500/60 text-ink-950 ring-1 ring-sky-300/30'
              }`}
              style={{ gridRow: 1, gridColumn: `${from + 2} / ${to + 2}` }}
            >
              <span className="truncate font-medium">{booking.renter.name}</span>
            </div>
          );
        })}
    </div>
  );
}

function NavButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="rounded-lg border border-ink-600 p-2 text-mist-300 transition hover:border-brass-400/50 hover:text-brass-300"
    >
      {children}
    </button>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`inline-block h-3 w-6 rounded ${className}`} />
      {label}
    </span>
  );
}
