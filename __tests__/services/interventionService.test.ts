import { interventionService } from '../../lib/services/interventionService';
import { createChainableMock } from '../helpers/mockSupabase';

const mockChain = createChainableMock();
jest.mock('../../lib/supabase', () => ({
  supabase: { from: jest.fn(() => mockChain) },
}));

import { supabase } from '../../lib/supabase';

describe('interventionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('fetches interventions with pagination', async () => {
      mockChain._setResolved({
        data: [{ id: '1', statut: 'en_cours' }],
        error: null,
        count: 1,
      });

      const result = await interventionService.list(0);

      expect(supabase.from).toHaveBeenCalledWith('interventions');
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('throws on error', async () => {
      mockChain._setResolved({ data: null, error: { message: 'DB error' }, count: 0 });

      await expect(interventionService.list(0)).rejects.toEqual({ message: 'DB error' });
    });

    it('uses correct pagination offsets for page 2', async () => {
      mockChain._setResolved({ data: [], error: null, count: 0 });

      await interventionService.list(2);

      expect(mockChain.range).toHaveBeenCalledWith(60, 89);
    });
  });

  describe('getById', () => {
    it('fetches a single intervention', async () => {
      mockChain._setResolved({ data: { id: 'abc', statut: 'planifiee' }, error: null });

      const result = await interventionService.getById('abc');

      expect(mockChain.eq).toHaveBeenCalledWith('id', 'abc');
      expect(result.id).toBe('abc');
    });
  });

  describe('updateStatus', () => {
    it('updates status', async () => {
      mockChain._setResolved({ error: null });

      await interventionService.updateStatus('abc', 'terminee');

      expect(mockChain.update).toHaveBeenCalledWith({ statut: 'terminee' });
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'abc');
    });

    it('throws on error', async () => {
      mockChain._setResolved({ error: { message: 'fail' } });

      await expect(interventionService.updateStatus('abc', 'terminee')).rejects.toEqual({ message: 'fail' });
    });
  });

  describe('delete', () => {
    it('deletes an intervention', async () => {
      mockChain._setResolved({ error: null });

      await interventionService.delete('abc');

      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'abc');
    });
  });

  describe('assignMechanic', () => {
    it('assigns mechanic and sets planifiee', async () => {
      mockChain._setResolved({ error: null });

      await interventionService.assignMechanic('int-1', 'meca-1');

      expect(mockChain.update).toHaveBeenCalledWith({
        mecanicien_id: 'meca-1',
        statut: 'planifiee',
      });
    });
  });

  describe('getDashboardStats', () => {
    it('returns aggregated stats', async () => {
      // All 4 parallel queries will resolve with the same chain
      mockChain._setResolved({ data: [{ total_vente: 100 }], error: null, count: 5 });

      const stats = await interventionService.getDashboardStats();

      expect(stats).toHaveProperty('interventionsCount');
      expect(stats).toHaveProperty('stockLowCount');
      expect(stats).toHaveProperty('leadsCount');
      expect(stats).toHaveProperty('revenue');
    });
  });
});
