import { leadService } from '../../lib/services/leadService';
import { createChainableMock } from '../helpers/mockSupabase';

const mockChain = createChainableMock();
jest.mock('../../lib/supabaseWebsite', () => ({
  supabaseWebsite: { from: jest.fn(() => mockChain) },
}));

import { supabaseWebsite } from '../../lib/supabaseWebsite';

describe('leadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('returns leads', async () => {
      mockChain._setResolved({
        data: [{ id: '1', nom: 'Lead 1' }, { id: '2', nom: 'Lead 2' }],
        error: null,
      });

      const result = await leadService.list('');

      expect(result).toHaveLength(2);
      expect(supabaseWebsite.from).toHaveBeenCalledWith('devis_auto');
    });

    it('applies search filter', async () => {
      mockChain._setResolved({ data: [], error: null });

      await leadService.list('test@email.com');

      expect(mockChain.or).toHaveBeenCalledWith('nom.ilike.%test@email.com%,email.ilike.%test@email.com%');
    });

    it('throws on error', async () => {
      mockChain._setResolved({ data: null, error: { message: 'fail' } });

      await expect(leadService.list('')).rejects.toEqual({ message: 'fail' });
    });
  });

  describe('getById', () => {
    it('returns a single lead', async () => {
      mockChain._setResolved({ data: { id: 'l1', nom: 'Test Lead' }, error: null });

      const result = await leadService.getById('l1');

      expect(result.nom).toBe('Test Lead');
    });
  });

  describe('updateStatus', () => {
    it('updates lead status', async () => {
      mockChain._setResolved({ error: null });

      await leadService.updateStatus('l1', 'en_traitement');

      expect(mockChain.update).toHaveBeenCalledWith({ statut: 'en_traitement' });
    });
  });

  describe('archive', () => {
    it('sets status to perdu', async () => {
      mockChain._setResolved({ error: null });

      await leadService.archive('l1');

      expect(mockChain.update).toHaveBeenCalledWith({ statut: 'perdu' });
    });
  });
});
