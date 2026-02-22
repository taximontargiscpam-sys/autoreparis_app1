import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import ErrorState from '../../components/ErrorState';

jest.mock('lucide-react-native', () => ({
  AlertTriangle: 'AlertTriangle',
}));

describe('ErrorState', () => {
  it('renders default error message', () => {
    render(<ErrorState />);
    expect(screen.getByText('Une erreur est survenue. Vérifiez votre connexion.')).toBeTruthy();
  });

  it('renders custom error message', () => {
    render(<ErrorState message="Erreur personnalisée" />);
    expect(screen.getByText('Erreur personnalisée')).toBeTruthy();
  });

  it('renders retry button when onRetry is provided', () => {
    const onRetry = jest.fn();
    render(<ErrorState onRetry={onRetry} />);

    const retryButton = screen.getByText('Réessayer');
    expect(retryButton).toBeTruthy();

    fireEvent.press(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorState />);
    expect(screen.queryByText('Réessayer')).toBeNull();
  });
});
