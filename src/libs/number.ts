/**
 * Mengubah angka menjadi string format Rupiah.
 * @param {number | string} amount - Nilai angka yang akan diformat.
 * @returns {string} - String Rupiah, contoh: "Rp 1.234.567".
 */
export function formatRupiah(amount: number | string): string {
  if (amount === null || amount === undefined || amount === '') {
    return 'Rp 0';
  }

  // Mengkonversi input menjadi number jika berupa string
  const numericAmount =
    typeof amount === 'string' ? parseFloat(amount) : amount;

  // Best Practice: Menggunakan Intl.NumberFormat untuk format mata uang.
  // Ini adalah API standar browser/Node.js yang menangani lokalitas secara tepat.
  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0, // Tidak menampilkan desimal
    maximumFractionDigits: 0,
  });

  return formatter.format(numericAmount);
}

export function normalizeDecimal(
  value: string | number,
  maxFractionDigits: number = 2,
): number {
  if (maxFractionDigits < 0) {
    throw new Error('maxFractionDigits must be >= 0');
  }

  const num =
    typeof value === 'string' ? Number(value.replace(',', '.').trim()) : value;

  if (!Number.isFinite(num)) {
    throw new Error('Invalid number input');
  }

  const factor = 10 ** maxFractionDigits;

  const rounded = Math.round((num + Number.EPSILON) * factor) / factor;

  // Convert ke string lalu kembali ke number untuk hilangkan trailing zero
  return Number(rounded.toString());
}

export interface FormatCompactOptions {
  /**
   * Menambahkan prefix 'Rp ' di depan hasil format.
   * @default false
   */
  withPrefix?: boolean;
  /**
   * Jumlah desimal maksimal di belakang koma.
   * @default 2
   */
  maxFractionDigits?: number;
  /**
   * Menambahkan spasi antara angka dan imbuhan (contoh: "1,5 Jt").
   * @default false
   */
  spaceSuffix?: boolean;
}

/**
 * Mengubah angka menjadi format ringkas Indonesia (Rb, Jt, M, T).
 * Contoh:
 * 1500000 -> "1,5Jt" (atau "Rp 1,5Jt" jika withPrefix: true)
 * 15000000 -> "15Jt"
 * 2500 -> "2,5Rb"
 * 1500000000 -> "1,5M"
 * 1000000000000 -> "1T"
 *
 * @param {number | string} amount - Nilai angka yang akan diformat.
 * @param {FormatCompactOptions} [options] - Opsi konfigurasi format.
 * @returns {string} - String format ringkas.
 */
export function formatCompactNumber(
  amount: number | string,
  options: FormatCompactOptions = {},
): string {
  const {
    withPrefix = false,
    maxFractionDigits = 2,
    spaceSuffix = false,
  } = options;

  if (amount === null || amount === undefined || amount === '') {
    return withPrefix ? 'Rp 0' : '0';
  }

  const numericAmount =
    typeof amount === 'string' ? parseFloat(amount.replace(',', '.')) : amount;

  if (!Number.isFinite(numericAmount)) {
    return withPrefix ? 'Rp 0' : '0';
  }

  const isNegative = numericAmount < 0;
  const absAmount = Math.abs(numericAmount);

  const units = [
    { value: 1e12, symbol: 'T' },
    { value: 1e9, symbol: 'M' },
    { value: 1e6, symbol: 'Jt' },
    { value: 1e3, symbol: 'Rb' },
  ];

  let selectedUnit = units.find((u) => absAmount >= u.value);

  let formattedValue: string;
  let symbol = '';

  if (selectedUnit) {
    let scaled = absAmount / selectedUnit.value;

    const factor = 10 ** maxFractionDigits;
    const roundedScaled = Math.round(scaled * factor) / factor;

    if (roundedScaled >= 1000) {
      const nextUnitIndex = units.indexOf(selectedUnit) - 1;
      if (nextUnitIndex >= 0) {
        selectedUnit = units[nextUnitIndex];
        scaled = absAmount / selectedUnit.value;
      }
    }

    symbol = selectedUnit.symbol;

    const formatter = new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxFractionDigits,
    });

    formattedValue = formatter.format(scaled);
  } else {
    const formatter = new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxFractionDigits,
    });
    formattedValue = formatter.format(absAmount);
  }

  const spacing = spaceSuffix && symbol ? ' ' : '';
  const sign = isNegative ? '-' : '';
  const prefixStr = withPrefix ? 'Rp ' : '';

  return `${prefixStr}${sign}${formattedValue}${spacing}${symbol}`;
}

export const formatShortRupiah = formatCompactNumber;