import type { CarModel } from '../domain/types';

/**
 * The car cutouts keep the navy they were photographed on, with their edges
 * faded, so they need to sit on that same navy to look seamless.
 */
const FRAME: Record<string, string> = {
  'exceed-lx-2025': 'object-[65%_center]',
  'chery-tiggo-7': 'object-[65%_center]',
  'mg-zs': 'object-[65%_center]',
};

export function CarPhoto({
  model,
  alt,
  className = '',
}: {
  model: CarModel | undefined;
  alt: string;
  className?: string;
}) {
  if (!model) {
    return <div className={`bg-ink-850 ${className}`} />;
  }

  const fit = FRAME[model.id] ?? 'object-center';

  return (
    <div className={`relative overflow-hidden bg-ink-850 ${className}`}>
      <img
        src={model.image}
        alt={alt}
        loading="lazy"
        className={`h-full w-full object-contain ${fit}`}
      />
    </div>
  );
}
