import { teamService } from '../../lib/services/teamService';
import { createChainableMock } from '../helpers/mockSupabase';

const mockChain = createChainableMock();
jest.mock('../../lib/supabase', () => ({
  supabase: { from: jest.fn(() => mockChain) },
}));

import { supabase } from '../../lib/supabase';

describe('teamService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listMembers', () => {
    it('returns active team members', async () => {
      mockChain._setResolved({
        data: [{ id: 'u1', nom: 'Dupont', actif: true }],
        error: null,
      });

      const result = await teamService.listMembers();

      expect(result).toHaveLength(1);
      expect(mockChain.eq).toHaveBeenCalledWith('actif', true);
    });
  });

  describe('getAvailability', () => {
    it('returns availability for a date', async () => {
      mockChain._setResolved({
        data: [{ id: 'a1', user_id: 'u1', date: '2025-01-15', statut: 'present' }],
        error: null,
      });

      const result = await teamService.getAvailability('2025-01-15');

      expect(result).toHaveLength(1);
      expect(result[0].statut).toBe('present');
    });
  });

  describe('getMonthlyAvailability', () => {
    it('returns monthly availability', async () => {
      mockChain._setResolved({
        data: [{ date: '2025-01-01', statut: 'present' }],
        error: null,
      });

      const result = await teamService.getMonthlyAvailability('u1', '2025-01-01', '2025-01-31');

      expect(result).toHaveLength(1);
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'u1');
    });
  });

  describe('saveAvailability', () => {
    it('uses upsert for atomic save', async () => {
      mockChain._setResolved({ error: null });

      await teamService.saveAvailability([
        { user_id: 'u1', date: '2025-01-15', statut: 'repos' },
      ]);

      expect(mockChain.upsert).toHaveBeenCalledWith(
        [{ user_id: 'u1', date: '2025-01-15', statut: 'repos' }],
        { onConflict: 'user_id,date' },
      );
    });

    it('does nothing for empty records', async () => {
      mockChain.upsert.mockClear();
      await teamService.saveAvailability([]);
      expect(mockChain.upsert).not.toHaveBeenCalled();
    });
  });

  describe('createMember', () => {
    it('creates member with actif=true', async () => {
      mockChain._setResolved({
        data: { id: 'new-u', nom: 'Test', prenom: 'User', role: 'mecanicien', actif: true },
        error: null,
      });

      const result = await teamService.createMember({
        prenom: 'User',
        nom: 'Test',
        role: 'mecanicien',
      });

      expect(mockChain.insert).toHaveBeenCalledWith([
        { prenom: 'User', nom: 'Test', role: 'mecanicien', actif: true },
      ]);
      expect(result.id).toBe('new-u');
    });
  });

  describe('deleteMember', () => {
    it('soft-deletes by setting actif=false', async () => {
      mockChain._setResolved({ error: null });

      await teamService.deleteMember('u1');

      expect(mockChain.update).toHaveBeenCalledWith({ actif: false });
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'u1');
    });
  });
});
