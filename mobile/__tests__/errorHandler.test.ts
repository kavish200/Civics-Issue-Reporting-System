import { getErrorMessage } from '../src/utils/errorHandler';

describe('Error Handler', () => {
  describe('getErrorMessage', () => {
    it('should return offline message when no network', () => {
      const error = new Error('Network error');
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });
      expect(getErrorMessage(error)).toBe('You are offline. Please check your internet connection.');
    });

    it('should handle 401 unauthorized', () => {
      const error = {
        response: { status: 401, data: {} },
      };
      expect(getErrorMessage(error)).toBe('Session expired. Please sign in again.');
    });

    it('should handle 403 forbidden', () => {
      const error = {
        response: { status: 403, data: {} },
      };
      expect(getErrorMessage(error)).toBe('You don\'t have permission to perform this action.');
    });

    it('should handle 404 not found', () => {
      const error = {
        response: { status: 404, data: {} },
      };
      expect(getErrorMessage(error)).toBe('Resource not found.');
    });

    it('should handle 422 unprocessable entity', () => {
      const error = {
        response: { status: 422, data: {} },
      };
      expect(getErrorMessage(error)).toBe('Invalid data. Please check your input and try again.');
    });

    it('should handle 500 server error', () => {
      const error = {
        response: { status: 500, data: {} },
      };
      expect(getErrorMessage(error)).toBe('Internal server error. Please try again later.');
    });

    it('should use API-provided message when available', () => {
      const error = {
        response: { status: 400, data: { message: 'Custom error message' } },
      };
      expect(getErrorMessage(error)).toBe('Custom error message');
    });

    it('should handle unknown errors gracefully', () => {
      expect(getErrorMessage(null)).toBe('An unexpected error occurred.');
      expect(getErrorMessage(undefined)).toBe('An unexpected error occurred.');
      expect(getErrorMessage({})).toBe('An unexpected error occurred.');
    });
  });
});
