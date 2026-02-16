import { getStatusStyle } from '../../components/StatusBadge';

describe('getStatusStyle', () => {
  it('returns correct style for planifiee', () => {
    const style = getStatusStyle('planifiee');
    expect(style.label).toBe('Planifiee');
    expect(style.bg).toContain('blue');
  });

  it('returns correct style for en_cours', () => {
    const style = getStatusStyle('en_cours');
    expect(style.label).toBe('En cours');
    expect(style.bg).toContain('orange');
  });

  it('returns correct style for terminee', () => {
    const style = getStatusStyle('terminee');
    expect(style.label).toBe('Terminee');
    expect(style.bg).toContain('green');
  });

  it('returns correct style for facturee', () => {
    const style = getStatusStyle('facturee');
    expect(style.label).toBe('Facturee');
    expect(style.bg).toContain('purple');
  });

  it('returns correct style for annulee', () => {
    const style = getStatusStyle('annulee');
    expect(style.label).toBe('Annulee');
    expect(style.bg).toContain('red');
  });

  it('returns correct style for no_show', () => {
    const style = getStatusStyle('no_show');
    expect(style.label).toBe('No-show');
    expect(style.bg).toContain('slate');
  });

  it('returns correct style for en_attente_pieces', () => {
    const style = getStatusStyle('en_attente_pieces');
    expect(style.label).toBe('Attente pieces');
    expect(style.bg).toContain('amber');
  });

  it('returns fallback for unknown status', () => {
    const style = getStatusStyle('unknown_status');
    expect(style.label).toBe('unknown_status');
    expect(style.bg).toContain('slate');
  });
});
