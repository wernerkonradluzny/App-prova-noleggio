import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { ar, enGB } from 'date-fns/locale';
import { formatQAR } from '../domain/pricing';
import type { CarModel, Vehicle } from '../domain/types';

/**
 * The handful of things that read differently in Arabic: model names, colours,
 * money and dates.
 */
export function useLocale() {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const dateLocale = isArabic ? ar : enGB;

  return {
    isArabic,
    language: isArabic ? ('ar' as const) : ('en' as const),
    modelName: (model: CarModel | undefined) => (!model ? '' : isArabic ? model.nameAr : model.nameEn),
    colour: (vehicle: Vehicle | undefined) => (!vehicle ? '' : isArabic ? vehicle.colourAr : vehicle.colourEn),
    money: (amount: number) => formatQAR(amount, isArabic ? 'ar' : 'en'),
    /** 14 Mar 2026 */
    day: (iso: string) => format(parseISO(iso), 'd MMM yyyy', { locale: dateLocale }),
    /** Sat 14 Mar */
    shortDay: (iso: string) => format(parseISO(iso), 'EEE d MMM', { locale: dateLocale }),
    /** Saturday, 14 March 2026 */
    longDay: (iso: string) => format(parseISO(iso), 'EEEE, d MMMM yyyy', { locale: dateLocale }),
    number: (value: number) => new Intl.NumberFormat(isArabic ? 'ar-QA-u-nu-latn' : 'en-QA').format(value),
  };
}
