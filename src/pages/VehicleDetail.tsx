import { useState } from 'react';
import { ArrowLeft, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { CarPhoto } from '../components/CarPhoto';
import { Plate } from '../components/Plate';
import { StatusPill } from '../components/StatusPill';
import { derivedStatus } from '../domain/availability';
import { useRental } from '../state/RentalProvider';
import { useLocale } from '../state/useLocale';

export function VehicleDetail() {
  const { vehicleId } = useParams();
  const { t } = useTranslation();
  const locale = useLocale();
  const { vehicleById, modelOf, bookings, today, setVehicleService } = useRental();
  const [reason, setReason] = useState('');
  const [asking, setAsking] = useState(false);

  const vehicle = vehicleId ? vehicleById(vehicleId) : undefined;
  if (!vehicle) {
    return (
      <p className="panel p-10 text-center text-sm text-mist-500">
        <Link to="/fleet" className="text-brass-300">
          {t('fleet.title')}
        </Link>
      </p>
    );
  }

  const model = modelOf(vehicle);
  const status = derivedStatus(vehicle, bookings, today);
  const history = bookings
    .filter((booking) => booking.vehicleId === vehicle.id)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <>
      <Link to="/fleet" className="mb-4 inline-flex items-center gap-2 text-sm text-mist-400 hover:text-mist-200">
        <ArrowLeft size={15} className="rtl:rotate-180" />
        {t('fleet.title')}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="panel overflow-hidden">
          <CarPhoto model={model} alt={locale.modelName(model)} className="h-48 w-full" />
          <div className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl leading-tight text-mist-100">{locale.modelName(model)}</h1>
                <p className="text-sm text-mist-400">{locale.colour(vehicle)}</p>
              </div>
              <StatusPill status={status} />
            </div>

            <dl className="space-y-2 border-t border-ink-700/60 pt-4 text-sm">
              <Detail label={t('fleet.plate')} value={<Plate value={vehicle.plateNumber} />} />
              <Detail
                label={t('fleet.mileage')}
                value={<bdi>{`${locale.number(vehicle.mileage)} ${t('fleet.km')}`}</bdi>}
              />
              {model && (
                <>
                  <Detail label={t('fleet.daily')} value={locale.money(model.rates.daily)} />
                  <Detail label={t('fleet.weekly')} value={locale.money(model.rates.weekly)} />
                  <Detail label={t('fleet.monthly')} value={locale.money(model.rates.monthly)} />
                </>
              )}
            </dl>

            <div className="border-t border-ink-700/60 pt-4">
              {vehicle.status === 'maintenance' ? (
                <>
                  {vehicle.notes && <p className="mb-3 text-sm text-rose-300/90">{vehicle.notes}</p>}
                  <button
                    type="button"
                    onClick={() => void setVehicleService(vehicle.id, 'available')}
                    className="w-full rounded-xl bg-emerald-500/15 px-4 py-2.5 text-sm text-emerald-300 ring-1 ring-emerald-400/25 transition hover:bg-emerald-500/25"
                  >
                    {t('fleet.backInService')}
                  </button>
                </>
              ) : asking ? (
                <div className="space-y-2">
                  <label className="label-text">{t('fleet.workshopReason')}</label>
                  <input
                    autoFocus
                    className="field focus:field-focus"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void setVehicleService(vehicle.id, 'maintenance', reason.trim() || undefined)}
                      className="flex-1 rounded-xl bg-rose-500/15 px-4 py-2.5 text-sm text-rose-300 ring-1 ring-rose-400/25 transition hover:bg-rose-500/25"
                    >
                      {t('common.confirm')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAsking(false)}
                      className="rounded-xl border border-ink-600 px-4 py-2.5 text-sm text-mist-400"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAsking(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink-600 px-4 py-2.5 text-sm text-mist-300 transition hover:border-rose-400/40 hover:text-rose-300"
                >
                  <Wrench size={15} />
                  {t('fleet.sendToWorkshop')}
                </button>
              )}
            </div>
          </div>
        </div>

        <section className="panel p-5">
          <h2 className="mb-4 text-sm font-medium tracking-wide text-mist-200 uppercase">{t('fleet.history')}</h2>
          {history.length === 0 ? (
            <p className="py-8 text-center text-sm text-mist-500">{t('fleet.noHistory')}</p>
          ) : (
            <ul className="divide-y divide-ink-700/50">
              {history.map((booking) => (
                <li key={booking.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm text-mist-200">{booking.renter.name}</p>
                    <p className="text-xs text-mist-500">
                      <bdi>
                        {locale.day(booking.startDate)} → {locale.day(booking.endDate)}
                      </bdi>{' '}
                      · <Plate value={booking.reference} />
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-mist-300 tabular-nums">{locale.money(booking.quote.total)}</span>
                    <StatusPill status={booking.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-mist-500">{label}</dt>
      <dd className="text-mist-200 tabular-nums">{value}</dd>
    </div>
  );
}
