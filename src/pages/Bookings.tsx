import { useMemo, useState } from 'react';
import { CircleAlert, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/PageHeader';
import { Plate } from '../components/Plate';
import { StatusPill } from '../components/StatusPill';
import { BookingConflictError } from '../data';
import { quoteForDates } from '../domain/pricing';
import type { Booking, BookingStatus } from '../domain/types';
import { useRental } from '../state/RentalProvider';
import { useLocale } from '../state/useLocale';

const FILTERS: Array<BookingStatus | 'all'> = ['all', 'reserved', 'active', 'returned', 'cancelled'];

export function Bookings() {
  const { t } = useTranslation();
  const locale = useLocale();
  const { bookings, vehicleById, modelOf, changeBooking, today } = useRental();
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [extending, setExtending] = useState<Booking | null>(null);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return bookings
      .filter((booking) => filter === 'all' || booking.status === filter)
      .filter((booking) => {
        if (!needle) return true;
        const plate = vehicleById(booking.vehicleId)?.plateNumber ?? '';
        return (
          booking.reference.toLowerCase().includes(needle) ||
          booking.renter.name.toLowerCase().includes(needle) ||
          booking.renter.phone.includes(needle) ||
          plate.toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [bookings, filter, search, vehicleById]);

  return (
    <>
      <PageHeader title={t('bookings.title')} subtitle={t('bookings.subtitle', { count: bookings.length })} />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search size={15} className="pointer-events-none absolute inset-y-0 start-3 my-auto text-mist-500" />
          <input
            className="field focus:field-focus ps-9"
            placeholder={t('bookings.searchPlaceholder')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-lg px-3 py-2 text-sm transition ${
                filter === option
                  ? 'bg-brass-400/15 text-brass-300 ring-1 ring-brass-400/30'
                  : 'text-mist-400 hover:bg-ink-800'
              }`}
            >
              {option === 'all' ? t('common.all') : t(`status.${option}`)}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="panel p-10 text-center text-sm text-mist-500">{t('bookings.empty')}</p>
      ) : (
        <div className="space-y-3">
          {visible.map((booking) => {
            const vehicle = vehicleById(booking.vehicleId);
            const model = vehicle ? modelOf(vehicle) : undefined;

            return (
              <article key={booking.id} className="panel flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-40 flex-1">
                  <Plate value={booking.reference} className="text-xs text-mist-500" />
                  <p className="text-sm font-medium text-mist-100">{booking.renter.name}</p>
                  <bdi dir="ltr" className="block text-xs text-mist-500">
                    {booking.renter.phone}
                  </bdi>
                </div>

                <div className="min-w-40 flex-1">
                  <p className="text-sm text-mist-200">{locale.modelName(model)}</p>
                  <p className="text-xs text-mist-500">
                    <Plate value={vehicle?.plateNumber} /> · {locale.colour(vehicle)}
                  </p>
                </div>

                <div className="min-w-44 flex-1">
                  <p className="text-sm text-mist-200 tabular-nums">
                    {locale.day(booking.startDate)} → {locale.day(booking.endDate)}
                  </p>
                  <p className="text-xs text-mist-500">
                    {t('booking.duration', { count: booking.quote.days })}
                  </p>
                </div>

                <div className="min-w-24 text-end">
                  <p className="text-lg font-semibold text-brass-300 tabular-nums">{locale.money(booking.quote.total)}</p>
                  {booking.deposit > 0 && (
                    <p className="text-[11px] text-mist-500">
                      {t('bookings.deposit')} {locale.money(booking.deposit)}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={booking.status} />
                  {booking.status === 'reserved' && (
                    <Action onClick={() => void changeBooking(booking.id, { status: 'active' })}>
                      {t('bookings.markCollected')}
                    </Action>
                  )}
                  {booking.status === 'active' && (
                    <Action onClick={() => void changeBooking(booking.id, { status: 'returned' })}>
                      {t('bookings.markReturned')}
                    </Action>
                  )}
                  {(booking.status === 'reserved' || booking.status === 'active') && (
                    <>
                      <Action onClick={() => setExtending(booking)}>{t('bookings.extend')}</Action>
                      <Action
                        tone="danger"
                        onClick={() => {
                          if (window.confirm(t('bookings.cancelConfirm'))) {
                            void changeBooking(booking.id, { status: 'cancelled' });
                          }
                        }}
                      >
                        {t('common.cancel')}
                      </Action>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {extending && <ExtendDialog booking={extending} onClose={() => setExtending(null)} today={today} />}
    </>
  );
}

function ExtendDialog({ booking, onClose, today }: { booking: Booking; onClose: () => void; today: string }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const { vehicleById, modelOf, changeBooking } = useRental();
  const [endDate, setEndDate] = useState(booking.endDate);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const vehicle = vehicleById(booking.vehicleId);
  const model = vehicle ? modelOf(vehicle) : undefined;
  // Extending re-prices the whole rental, so show the new figure before committing.
  const preview = model && endDate > booking.startDate ? quoteForDates(booking.startDate, endDate, model.rates) : undefined;

  async function confirm() {
    setSaving(true);
    setError(null);
    try {
      await changeBooking(booking.id, { endDate });
      onClose();
    } catch (caught) {
      setError(caught instanceof BookingConflictError ? t('bookings.extendConflict') : String(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4" onClick={onClose}>
      <div className="panel w-full max-w-md p-6" onClick={(event) => event.stopPropagation()}>
        <h2 className="font-display text-2xl text-mist-100">{t('bookings.extendTitle')}</h2>
        <p className="mt-1 text-sm text-mist-400">
          <Plate value={booking.reference} /> · {booking.renter.name} · <Plate value={vehicle?.plateNumber} />
        </p>

        <label className="mt-5 block">
          <span className="label-text">{t('bookings.extendTo')}</span>
          <input
            type="date"
            className="field focus:field-focus"
            min={booking.endDate > today ? booking.endDate : today}
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </label>
        <p className="mt-2 text-xs text-mist-500">{t('bookings.extendFrom', { date: locale.day(booking.endDate) })}</p>

        {preview && preview.total !== booking.quote.total && (
          <p className="mt-4 rounded-lg bg-ink-700/40 px-3 py-2.5 text-sm text-mist-300">
            {t('bookings.repriced', {
              old: locale.money(booking.quote.total),
              new: locale.money(preview.total),
            })}
          </p>
        )}

        {error && (
          <p className="mt-4 flex items-start gap-2 rounded-lg bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300 ring-1 ring-rose-400/25">
            <CircleAlert size={16} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-ink-600 px-4 py-2.5 text-sm text-mist-300"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            disabled={saving || endDate <= booking.startDate}
            onClick={() => void confirm()}
            className="rounded-xl bg-brass-400 px-5 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-brass-300 disabled:bg-ink-700 disabled:text-mist-500"
          >
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Action({
  onClick,
  children,
  tone = 'normal',
}: {
  onClick: () => void;
  children: React.ReactNode;
  tone?: 'normal' | 'danger';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs transition ${
        tone === 'danger'
          ? 'border-ink-600 text-mist-400 hover:border-rose-400/40 hover:text-rose-300'
          : 'border-ink-600 text-mist-300 hover:border-brass-400/50 hover:text-brass-300'
      }`}
    >
      {children}
    </button>
  );
}
