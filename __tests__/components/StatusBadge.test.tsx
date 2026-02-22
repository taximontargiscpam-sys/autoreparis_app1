import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StatusBadge } from '../../components/StatusBadge';

describe('StatusBadge', () => {
  it('renders known status with correct French label', () => {
    render(<StatusBadge status="planifiee" />);
    expect(screen.getByText('Planifiée')).toBeTruthy();
  });

  it('renders all known statuses with proper labels', () => {
    const cases: [string, string][] = [
      ['planifiee', 'Planifiée'],
      ['en_cours', 'En cours'],
      ['en_attente_pieces', 'Attente pièces'],
      ['terminee', 'Terminée'],
      ['facturee', 'Facturée'],
      ['annulee', 'Annulée'],
      ['no_show', 'No-show'],
    ];

    for (const [status, label] of cases) {
      const { unmount } = render(<StatusBadge status={status} />);
      expect(screen.getByText(label)).toBeTruthy();
      unmount();
    }
  });

  it('falls back to raw status string for unknown status', () => {
    render(<StatusBadge status="custom_status" />);
    expect(screen.getByText('custom_status')).toBeTruthy();
  });
});
