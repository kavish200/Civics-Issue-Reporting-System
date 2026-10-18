import { AxiosError } from 'axios';

/**
 * Maps axios error codes to user-friendly messages
 * Handles both network errors and API errors
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Network error or non-axios error
    if (!navigator.onLine) {
      return 'You are offline. Please check your internet connection.';
    }
    return error.message;
  }

  // Axios error handling
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const data = axiosError.response?.data as { message?: string };

    // Use API-provided message if available
    if (data?.message) {
      return data.message;
    }

    // Map HTTP status codes to friendly messages
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Session expired. Please sign in again.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 422:
        return 'Invalid data. Please check your input and try again.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Internal server error. Please try again later.';
      case 502:
        return 'Bad gateway. Please try again later.';
      case 503:
        return 'Service unavailable. Please try again later.';
      case 504:
        return 'Gateway timeout. Please try again later.';
      default:
        if (status !== undefined && status >= 400 && status < 500) {
          return 'Client error. Please check your request.';
        }
        if (status !== undefined && status >= 500 && status < 600) {
          return 'Server error. Please try again later.';
        }
        return 'An unexpected error occurred.';
    }
  }

  // Fallback for unknown error types
  return 'An unexpected error occurred.';
}

/**
 * Helper component to show error alerts
 * Can be used in try/catch blocks
 */
export async function showErrorAlert(error: unknown, title: string = 'Error'): Promise<void> {
  const message = getErrorMessage(error);
  Alert.alert(title, message, [{ text: 'OK', style: 'cancel' }]);
}

import { Alert } from 'react-native';