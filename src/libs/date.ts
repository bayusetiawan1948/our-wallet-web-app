import { format, differenceInCalendarDays } from 'date-fns';
import { id } from 'date-fns/locale';

export const toIndonesianDate = (
  input: string | Date | number,
  formatString:
    | 'DD-MM-YYYY'
    | 'YYYY-MM-DD'
    | 'YYYY/MM/DD'
    | 'DD/MM/YYYY' = 'DD-MM-YYYY',
): string | null => {
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) return null;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  const map = {
    DD: day,
    MM: month,
    YYYY: String(year),
  };

  return formatString
    .replace('DD', map.DD)
    .replace('MM', map.MM)
    .replace('YYYY', map.YYYY);
};

export function formatRelativeDateTime(
  input: string | Date,
  formatDate: string = 'dd-MM-yyyy HH:mm',
): string {
  const date = new Date(input);

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date input');
  }

  const now = new Date();
  const diffDays = differenceInCalendarDays(date, now);

  let relativeLabel: string;

  if (diffDays === 0) {
    relativeLabel = 'hari ini';
  } else if (diffDays === 1) {
    relativeLabel = 'besok';
  } else if (diffDays === -1) {
    relativeLabel = 'kemarin';
  } else if (diffDays < 0) {
    relativeLabel = `${Math.abs(diffDays)} hari yang lalu`;
  } else {
    relativeLabel = `${diffDays} hari lagi`;
  }

  const formattedDate = format(date, formatDate, {
    locale: id,
  });

  return `${relativeLabel}, ${formattedDate}`;
}
/** Waktu lokal sekarang untuk value `<input type="datetime-local">` (yyyy-MM-ddTHH:mm). */
export function nowLocalDateTime(): string {
  return format(new Date(), "yyyy-MM-dd'T'HH:mm");
}

/** Format ISO datetime dari API ke tampilan lokal (dd-MM-yyyy HH:mm). */
export function formatDateTime(input: string): string {
  const date = new Date(input);
  return isNaN(date.getTime()) ? input : format(date, 'dd-MM-yyyy HH:mm');
}
