import type { CarModel } from '../domain/types';

/**
 * The car cutouts keep the navy they were photographed on, with their edges
 * faded, so they need to sit on that same navy to look seamless.
 */
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

  return (
    <div className={`relative overflow-hidden bg-ink-850 ${className}`}>
      <img
        src={model.image}
        alt={alt}
        loading="lazy"
        className="h-full w-full object-contain object-center"
      />
    </div>
  );
}
