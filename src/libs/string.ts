export function getInitials(fullname: string) {
  const words = fullname.trim().split(/\s+/);

  return words[0].slice(0, 2).toUpperCase();
}

export function ucwords(str: string): string {
  // Convert the string to lowercase to ensure consistent capitalization, then split it into an array of words
  return String(str)
    .toLowerCase()
    .split(' ')
    .map((word) => {
      // For each word, capitalize its first letter and concatenate it with the rest of the word
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' '); // Join the capitalized words back into a single string with spaces
}

/**
 * Menyensor nomor telepon dengan menyisakan 4 digit terakhir.
 * Contoh: 081234567890 -> ********7890
 *
 * @param phoneNumber Nomor telepon yang akan disensor
 * @returns Nomor telepon yang sudah disensor
 */
export const maskPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';

  const digits = phoneNumber.replace(/\D/g, ''); // hapus karakter non-digit
  const visibleCount = 4;

  if (digits.length <= visibleCount) return digits; // jika terlalu pendek, tampilkan apa adanya

  const masked =
    '*'.repeat(digits.length - visibleCount) + digits.slice(-visibleCount);
  return masked;
};