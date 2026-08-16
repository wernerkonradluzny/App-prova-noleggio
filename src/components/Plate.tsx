/**
 * A plate number, isolated from the text around it.
 *
 * Without this, Arabic runs the plate into any neighbouring digits - a plate of
 * 525 130 sitting beside "تويوتا فورتشنر 2025" reorders into one unreadable run.
 * <bdi> exists for exactly this.
 */
export function Plate({ value, className = '' }: { value: string | undefined; className?: string }) {
  if (!value) return null;
  return (
    <bdi dir="ltr" className={`tabular-nums ${className}`}>
      {value}
    </bdi>
  );
}
