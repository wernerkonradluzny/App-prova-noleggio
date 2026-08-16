import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CarPhoto } from '../components/CarPhoto';
import { PageHeader } from '../components/PageHeader';
import { Plate } from '../components/Plate';
import { StatusPill } from '../components/StatusPill';
import { derivedStatus } from '../domain/availability';
import type { CarClass, CarModel, Vehicle } from '../domain/types';
import { useRental } from '../state/RentalProvider';
import { useLocale } from '../state/useLocale';

const CLASSES: CarClass[] = ['luxury', 'suv', 'crossover', 'sedan', 'hatchback'];

export function Fleet() {
  const { t } = useTranslation();
  const { models, vehicles, bookings, today } = useRental();
  const [carClass, setCarClass] = useState<CarClass | 'all'>('all');
  const [search, setSearch] = useState('');

  const groups = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return models
      .filter((model) => carClass === 'all' || model.carClass === carClass)
      .map((model) => ({
        model,
        units: vehicles
          .filter((vehicle) => vehicle.modelId === model.id)
          .map((vehicle) => ({ vehicle, status: derivedStatus(vehicle, bookings, today) })),
      }))
      .filter(({ model, units }) => {
        if (units.length === 0) return false;
        if (!needle) return true;
        return (
          model.nameEn.toLowerCase().includes(needle) ||
          model.nameAr.includes(needle) ||
          units.some(
            ({ vehicle }) =>
              vehicle.plateNumber.toLowerCase().includes(needle) ||
              vehicle.colourEn.toLowerCase().includes(needle) ||
              vehicle.colourAr.includes(needle),
          )
        );
      });
  }, [models, vehicles, bookings, today, carClass, search]);

  return (
    <>
      <PageHeader
        title={t('fleet.title')}
        subtitle={t('fleet.subtitle', { cars: vehicles.length, models: models.length })}
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search size={15} className="pointer-events-none absolute inset-y-0 start-3 my-auto text-mist-500" />
          <input
            className="field focus:field-focus ps-9"
            placeholder={t('fleet.searchPlaceholder')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={carClass === 'all'} onClick={() => setCarClass('all')}>
            {t('fleet.allClasses')}
          </FilterChip>
          {CLASSES.map((option) => (
            <FilterChip key={option} active={carClass === option} onClick={() => setCarClass(option)}>
              {t(`class.${option}`)}
            </FilterChip>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="panel p-10 text-center text-sm text-mist-500">{t('fleet.nothingFound')}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map(({ model, units }) => (
            <ModelCard key={model.id} model={model} units={units} />
          ))}
        </div>
      )}
    </>
  );
}

function ModelCard({
  model,
  units,
}: {
  model: CarModel;
  units: Array<{ vehicle: Vehicle; status: ReturnType<typeof derivedStatus> }>;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const free = units.filter((unit) => unit.status === 'available').length;

  return (
    <article className="panel flex flex-col overflow-hidden">
      <CarPhoto model={model} alt={locale.modelName(model)} className="h-40 w-full" />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl leading-tight text-mist-100">{locale.modelName(model)}</h2>
            <p className="mt-0.5 text-xs text-mist-500">
              {t(`class.${model.carClass}`)} · {t('fleet.seats', { count: model.seats })}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs whitespace-nowrap ring-1 ring-inset ${
              free > 0
                ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/25'
                : 'bg-ink-600/40 text-mist-400 ring-ink-500/40'
            }`}
          >
            {free > 0 ? t('fleet.unitsFree', { free, total: units.length }) : t('fleet.noneFree')}
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-ink-600/40 text-center">
          <Rate label={t('fleet.daily')} value={locale.money(model.rates.daily)} />
          <Rate label={t('fleet.weekly')} value={locale.money(model.rates.weekly)} />
          <Rate label={t('fleet.monthly')} value={locale.money(model.rates.monthly)} />
        </dl>

        <ul className="mt-4 space-y-1.5">
          {units.map(({ vehicle, status }) => (
            <li key={vehicle.id}>
              <Link
                to={`/fleet/${vehicle.id}`}
                className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition hover:bg-ink-700/50"
              >
                <span className="flex items-baseline gap-2">
                  <Plate value={vehicle.plateNumber} className="text-mist-200" />
                  <span className="text-xs text-mist-500">{locale.colour(vehicle)}</span>
                </span>
                <StatusPill status={status} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function Rate({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink-850 px-2 py-2.5">
      <dt className="text-[10px] tracking-wider text-mist-500 uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm text-mist-200 tabular-nums">{value}</dd>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm transition ${
        active ? 'bg-brass-400/15 text-brass-300 ring-1 ring-brass-400/30' : 'text-mist-400 hover:bg-ink-800'
      }`}
    >
      {children}
    </button>
  );
}
