import { useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import { ArrowRight, Check, CircleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CarPhoto } from '../components/CarPhoto';
import { PageHeader } from '../components/PageHeader';
import { Plate } from '../components/Plate';
import { BookingConflictError } from '../data';
import { freeVehicles } from '../domain/availability';
import { quoteFor, rentalDays } from '../domain/pricing';
import type { Booking, CarModel, Quote, Vehicle } from '../domain/types';
import { useRental } from '../state/RentalProvider';
import { useLocale } from '../state/useLocale';

const today = () => format(new Date(), 'yyyy-MM-dd');

export function NewBooking() {
  const { t } = useTranslation();
  const locale = useLocale();
  const { models, vehicles, bookings, createBooking } = useRental();

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(() => format(addDays(new Date(), 3), 'yyyy-MM-dd'));
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [renter, setRenter] = useState({ name: '', phone: '', idNumber: '', licenceNumber: '', nationality: '' });
  const [deposit, setDeposit] = useState(0);
  const [depositTouched, setDepositTouched] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<Booking | null>(null);

  const datesValid = endDate >= startDate;
  const days = datesValid ? rentalDays(startDate, endDate) : 0;

  /** Only cars genuinely free for the whole span, grouped under their model. */
  const offers = useMemo(() => {
    if (!datesValid) return [];
    const free = freeVehicles(vehicles, { start: startDate, end: endDate }, bookings);
    const byModel = new Map<string, Vehicle[]>();
    for (const vehicle of free) {
      const list = byModel.get(vehicle.modelId) ?? [];
      list.push(vehicle);
      byModel.set(vehicle.modelId, list);
    }
    return models
      .filter((model) => byModel.has(model.id))
      .map((model) => ({
        model,
        units: byModel.get(model.id)!,
        quote: quoteFor(days, model.rates),
      }));
  }, [models, vehicles, bookings, startDate, endDate, datesValid, days]);

  const freeCount = offers.reduce((sum, offer) => sum + offer.units.length, 0);
  const chosen = vehicleId ? vehicles.find((vehicle) => vehicle.id === vehicleId) : undefined;
  const chosenOffer = chosen ? offers.find((offer) => offer.model.id === chosen.modelId) : undefined;
  const stillOffered = Boolean(chosen && chosenOffer?.units.some((unit) => unit.id === chosen.id));
  const quote = stillOffered ? chosenOffer?.quote : undefined;

  function selectVehicle(vehicle: Vehicle, model: CarModel) {
    setVehicleId(vehicle.id);
    setError(null);
    if (!depositTouched) setDeposit(model.rates.daily * 2);
  }

  async function submit() {
    if (!chosen || !quote) return setError(t('booking.selectCar'));
    if (!datesValid) return setError(t('booking.invalidDates'));
    if (!renter.name.trim() || !renter.phone.trim() || !renter.idNumber.trim()) {
      return setError(t('booking.required'));
    }

    setSaving(true);
    setError(null);
    try {
      const booking = await createBooking({
        vehicleId: chosen.id,
        renter: { ...renter, nationality: renter.nationality || undefined },
        startDate,
        endDate,
        deposit,
        notes: notes.trim() || undefined,
      });
      setCreated(booking);
    } catch (caught) {
      setError(caught instanceof BookingConflictError ? t('booking.conflict') : String(caught));
    } finally {
      setSaving(false);
    }
  }

  if (created) {
    return <Confirmation booking={created} onAnother={() => window.location.reload()} />;
  }

  return (
    <>
      <PageHeader title={t('booking.newTitle')} subtitle={t('booking.chooseDates')} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="panel p-5">
            <SectionTitle step={1} title={t('booking.stepDates')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label-text">{t('booking.pickup')}</span>
                <input
                  type="date"
                  className="field focus:field-focus"
                  value={startDate}
                  onChange={(event) => {
                    setStartDate(event.target.value);
                    if (event.target.value > endDate) setEndDate(event.target.value);
                  }}
                />
              </label>
              <label className="block">
                <span className="label-text">{t('booking.return')}</span>
                <input
                  type="date"
                  className="field focus:field-focus"
                  min={startDate}
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </label>
            </div>
            {datesValid ? (
              <p className="mt-3 text-sm text-mist-400">
                {t('booking.duration', { count: days })} · {locale.shortDay(startDate)} → {locale.shortDay(endDate)}
              </p>
            ) : (
              <Notice tone="error">{t('booking.invalidDates')}</Notice>
            )}
          </section>

          <section className="panel p-5">
            <SectionTitle
              step={2}
              title={t('booking.stepCar')}
              hint={datesValid ? t('booking.availableCars', { count: freeCount }) : undefined}
            />
            {!datesValid ? null : offers.length === 0 ? (
              <Notice tone="error">{t('booking.noneAvailable')}</Notice>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {offers.map(({ model, units, quote: modelQuote }) => (
                  <OfferCard
                    key={model.id}
                    model={model}
                    units={units}
                    quote={modelQuote}
                    selectedVehicleId={vehicleId}
                    onSelect={(vehicle) => selectVehicle(vehicle, model)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="panel p-5">
            <SectionTitle step={3} title={t('booking.stepRenter')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('booking.renterName')} value={renter.name} onChange={(v) => setRenter({ ...renter, name: v })} />
              <Field
                label={t('booking.renterPhone')}
                value={renter.phone}
                onChange={(v) => setRenter({ ...renter, phone: v })}
                dir="ltr"
              />
              <Field
                label={t('booking.renterId')}
                value={renter.idNumber}
                onChange={(v) => setRenter({ ...renter, idNumber: v })}
                dir="ltr"
              />
              <Field
                label={`${t('booking.renterLicence')} (${t('common.optional')})`}
                value={renter.licenceNumber}
                onChange={(v) => setRenter({ ...renter, licenceNumber: v })}
                dir="ltr"
              />
              <Field
                label={`${t('booking.renterNationality')} (${t('common.optional')})`}
                value={renter.nationality}
                onChange={(v) => setRenter({ ...renter, nationality: v })}
              />
              <label className="block">
                <span className="label-text">{t('booking.deposit')}</span>
                <input
                  type="number"
                  min={0}
                  step={50}
                  className="field focus:field-focus"
                  value={deposit}
                  onChange={(event) => {
                    setDepositTouched(true);
                    setDeposit(Number(event.target.value) || 0);
                  }}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="label-text">
                  {t('common.notes')} ({t('common.optional')})
                </span>
                <textarea
                  rows={2}
                  className="field focus:field-focus resize-none"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </label>
            </div>
          </section>
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <div className="panel overflow-hidden">
            {chosen && chosenOffer ? (
              <CarPhoto model={chosenOffer.model} alt={locale.modelName(chosenOffer.model)} className="h-36 w-full" />
            ) : (
              <div className="flex h-36 items-center justify-center bg-ink-850 px-6 text-center text-sm text-mist-500">
                {t('booking.selectCar')}
              </div>
            )}

            <div className="space-y-4 p-5">
              {chosen && chosenOffer && (
                <div>
                  <p className="font-display text-xl text-mist-100">{locale.modelName(chosenOffer.model)}</p>
                  <p className="text-sm text-mist-400">
                    <Plate value={chosen.plateNumber} /> · {locale.colour(chosen)}
                  </p>
                </div>
              )}

              <div className="space-y-1 text-sm">
                <Row label={t('common.from')} value={locale.day(startDate)} />
                <Row label={t('common.to')} value={locale.day(endDate)} />
                {datesValid && <Row label={t('common.days')} value={locale.number(days)} />}
              </div>

              {quote && <QuoteBreakdown quote={quote} />}

              {deposit > 0 && (
                <div className="border-t border-ink-700/60 pt-3 text-sm">
                  <Row label={t('bookings.deposit')} value={locale.money(deposit)} muted />
                </div>
              )}

              {error && <Notice tone="error">{error}</Notice>}

              <button
                type="button"
                disabled={!stillOffered || saving || !datesValid}
                onClick={() => void submit()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brass-400 px-4 py-3 text-sm font-semibold text-ink-950 transition hover:bg-brass-300 disabled:cursor-not-allowed disabled:bg-ink-700 disabled:text-mist-500"
              >
                {t('booking.confirm')}
                <ArrowRight size={16} className="rtl:rotate-180" />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function QuoteBreakdown({ quote }: { quote: Quote }) {
  const { t } = useTranslation();
  const locale = useLocale();

  return (
    <div className="space-y-2 border-t border-ink-700/60 pt-4">
      <p className="label-text">{t('booking.priceBreakdown')}</p>
      {quote.lines.map((line) => (
        <div key={line.tier} className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-mist-300">
            {locale.number(line.quantity)}{' '}
            {t(`common.${line.tier}${line.quantity === 1 ? '' : 's'}`)}
            <span className="text-mist-500"> × {locale.money(line.unitRate)}</span>
          </span>
          <span className="tabular-nums text-mist-200">{locale.money(line.amount)}</span>
        </div>
      ))}

      <div className="flex items-baseline justify-between gap-3 border-t border-ink-700/60 pt-2">
        <span className="text-sm font-medium text-mist-200">{t('common.total')}</span>
        <span className="text-2xl font-semibold text-brass-300 tabular-nums">{locale.money(quote.total)}</span>
      </div>

      {quote.chargedDays > quote.days && (
        <p className="text-xs leading-relaxed text-mist-500">
          {t('booking.chargedNote', { charged: quote.chargedDays, actual: quote.days })}
        </p>
      )}
      {quote.saving > 0 && (
        <p className="text-xs text-emerald-400/90">{t('booking.savingNote', { amount: locale.money(quote.saving) })}</p>
      )}
    </div>
  );
}

function OfferCard({
  model,
  units,
  quote,
  selectedVehicleId,
  onSelect,
}: {
  model: CarModel;
  units: Vehicle[];
  quote: Quote;
  selectedVehicleId: string | null;
  onSelect: (vehicle: Vehicle) => void;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const selectedHere = units.find((unit) => unit.id === selectedVehicleId);

  return (
    <div
      className={`overflow-hidden rounded-xl border transition ${
        selectedHere ? 'border-brass-400/70 bg-ink-800/60' : 'border-ink-600/50 bg-ink-850/50 hover:border-ink-500'
      }`}
    >
      <button type="button" onClick={() => onSelect(selectedHere ?? units[0])} className="block w-full text-start">
        <CarPhoto model={model} alt={locale.modelName(model)} className="h-28 w-full" />
        <div className="flex items-start justify-between gap-2 px-4 pt-3">
          <div>
            <p className="text-sm font-medium text-mist-100">{locale.modelName(model)}</p>
            <p className="text-xs text-mist-500">
              {t(`class.${model.carClass}`)} · {t('fleet.seats', { count: model.seats })}
            </p>
          </div>
          {selectedHere && (
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brass-400 text-ink-950">
              <Check size={13} strokeWidth={3} />
            </span>
          )}
        </div>
        <div className="flex items-baseline justify-between gap-2 px-4 pt-2">
          <span className="text-xs text-mist-500">{locale.money(model.rates.daily)} / {t('common.day')}</span>
          <span className="text-base font-semibold text-brass-300 tabular-nums">{locale.money(quote.total)}</span>
        </div>
      </button>

      <div className="flex flex-wrap gap-1.5 px-4 pt-3 pb-4">
        {units.map((unit) => (
          <button
            key={unit.id}
            type="button"
            onClick={() => onSelect(unit)}
            className={`rounded-md px-2 py-1 text-[11px] transition ${
              unit.id === selectedVehicleId
                ? 'bg-brass-400/20 text-brass-200 ring-1 ring-brass-400/40'
                : 'bg-ink-700/50 text-mist-400 hover:bg-ink-700'
            }`}
          >
            <Plate value={unit.plateNumber} />
          </button>
        ))}
      </div>
    </div>
  );
}

function Confirmation({ booking, onAnother }: { booking: Booking; onAnother: () => void }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const { vehicleById, modelById } = useRental();
  const vehicle = vehicleById(booking.vehicleId);
  const model = vehicle ? modelById(vehicle.modelId) : undefined;

  return (
    <div className="mx-auto max-w-lg">
      <div className="panel overflow-hidden text-center">
        <CarPhoto model={model} alt={locale.modelName(model)} className="h-40 w-full" />
        <div className="space-y-4 p-8">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
            <Check size={22} />
          </span>
          <h2 className="font-display text-2xl text-mist-100">
            {t('booking.created', { reference: booking.reference })}
          </h2>
          <p className="text-sm leading-relaxed text-mist-400">
            {t('booking.createdBody', {
              car: `${locale.modelName(model)} (${vehicle?.plateNumber})`,
              renter: booking.renter.name,
              from: locale.day(booking.startDate),
              to: locale.day(booking.endDate),
            })}
          </p>
          <p className="text-3xl font-semibold text-brass-300 tabular-nums">{locale.money(booking.quote.total)}</p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              to="/bookings"
              className="rounded-xl bg-brass-400 px-5 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-brass-300"
            >
              {t('booking.viewBooking')}
            </Link>
            <button
              type="button"
              onClick={onAnother}
              className="rounded-xl border border-ink-600 px-5 py-2.5 text-sm text-mist-300 transition hover:border-brass-400/50"
            >
              {t('booking.another')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ step, title, hint }: { step: number; title: string; hint?: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="flex size-6 items-center justify-center rounded-full bg-ink-700 text-xs font-medium text-mist-300">
        {step}
      </span>
      <h2 className="text-sm font-medium tracking-wide text-mist-200 uppercase">{title}</h2>
      {hint && <span className="text-xs text-mist-500">{hint}</span>}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  dir,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <label className="block">
      <span className="label-text">{label}</span>
      <input dir={dir} className="field focus:field-focus" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-mist-500">{label}</span>
      <span className={muted ? 'text-mist-400' : 'text-mist-200'}>{value}</span>
    </div>
  );
}

function Notice({ tone, children }: { tone: 'error'; children: React.ReactNode }) {
  return (
    <div
      className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${
        tone === 'error' ? 'bg-rose-500/10 text-rose-300 ring-1 ring-rose-400/25' : ''
      }`}
    >
      <CircleAlert size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
