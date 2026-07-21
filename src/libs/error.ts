import axios, { type AxiosError } from "axios";

export type ErrorResponse = {
  message?: string;
  [key: string]: unknown;
};

export function getErrorMessage(error: unknown): string {
  // Handle axios error
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponse>;

    // Ambil pesan dari response.data.message jika tersedia
    const message = axiosError.response?.data?.message;

    if (typeof message === 'string') return message;

    // Fallback ke error.message
    return axiosError.message || 'Terjadi kesalahan pada permintaan';
  }

  // Handle Error biasa
  if (error instanceof Error) {
    return error.message || 'Terjadi kesalahan';
  }

  // Fallback terakhir untuk unknown
  return 'Terjadi kesalahan tak dikenal';
}