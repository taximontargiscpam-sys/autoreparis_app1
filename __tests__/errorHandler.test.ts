import { handleError, logErrorSilent, getRecentErrors } from '../lib/errorHandler';
import { Alert } from 'react-native';

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('errorHandler', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows alert with user message', () => {
    handleError(new Error('test'), 'Erreur de chargement');
    jest.advanceTimersByTime(200);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Erreur',
      expect.stringContaining('Erreur de chargement')
    );
  });

  it('shows alert with default message when no user message', () => {
    handleError(new Error('technical failure'));
    jest.advanceTimersByTime(200);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Erreur',
      'Une erreur est survenue. Veuillez réessayer.'
    );
  });
});

describe('logErrorSilent', () => {
  it('logs error to internal buffer', () => {
    const initialCount = getRecentErrors().length;
    logErrorSilent(new Error('silent error'), 'test-context');
    const errors = getRecentErrors();
    expect(errors.length).toBe(initialCount + 1);
    expect(errors[errors.length - 1].context).toBe('test-context');
  });
});

describe('getRecentErrors', () => {
  it('returns an array', () => {
    expect(Array.isArray(getRecentErrors())).toBe(true);
  });

  it('returns a copy (not the original)', () => {
    const a = getRecentErrors();
    const b = getRecentErrors();
    expect(a).not.toBe(b);
  });
});
