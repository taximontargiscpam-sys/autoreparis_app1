import { clientService } from '../../lib/services/clientService';
import { createChainableMock } from '../helpers/mockSupabase';

const mockChain = createChainableMock();
jest.mock('../../lib/supabase', () => ({
  supabase: { from: jest.fn(() => mockChain) },
}));

import { supabase } from '../../lib/supabase';

describe('clientService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('returns paginated clients', async () => {
      mockChain._setResolved({
        data: [{ id: '1', nom: 'Dupont' }, { id: '2', nom: 'Martin' }],
        error: null,
        count: 2,
      });

      const result = await clientService.list('', 0);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('applies search filter when provided', async () => {
      mockChain._setResolved({ data: [], error: null, count: 0 });

      await clientService.list('Dupont', 0);

      expect(mockChain.or).toHaveBeenCalledWith('nom.ilike.%Dupont%,prenom.ilike.%Dupont%');
    });

    it('throws on error', async () => {
      mockChain._setResolved({ data: null, error: { message: 'error' }, count: 0 });

      await expect(clientService.list('', 0)).rejects.toEqual({ message: 'error' });
    });
  });

  describe('getById', () => {
    it('fetches a single client', async () => {
      mockChain._setResolved({ data: { id: 'c1', nom: 'Dupont' }, error: null });

      const result = await clientService.getById('c1');

      expect(result.nom).toBe('Dupont');
    });
  });

  describe('create', () => {
    it('creates a new client', async () => {
      const client = { nom: 'Nouveau', prenom: 'Client', telephone: '06', email: null, adresse: null, ville: null, code_postal: null };
      mockChain._setResolved({ data: { id: 'new-id', ...client }, error: null });

      const result = await clientService.create(client);

      expect(result.id).toBe('new-id');
      expect(mockChain.insert).toHaveBeenCalledWith([client]);
    });
  });

  describe('delete', () => {
    it('deletes a client', async () => {
      mockChain._setResolved({ error: null });

      await clientService.delete('c1');

      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'c1');
    });

    it('throws on FK error', async () => {
      mockChain._setResolved({ error: { message: 'FK violation' } });

      await expect(clientService.delete('c1')).rejects.toEqual({ message: 'FK violation' });
    });
  });

  describe('getVehicles', () => {
    it('returns vehicles for a client', async () => {
      mockChain._setResolved({ data: [{ id: 'v1', marque: 'Renault' }], error: null });

      const result = await clientService.getVehicles('c1');

      expect(result).toHaveLength(1);
      expect(result[0].marque).toBe('Renault');
    });
  });

  describe('createVehicle', () => {
    it('creates a vehicle', async () => {
      const vehicle = { client_id: 'c1', marque: 'Peugeot', modele: '308', immatriculation: 'AB-123-CD', kilometrage: null, annee: null, vin: null };
      mockChain._setResolved({ data: { id: 'v-new', ...vehicle }, error: null });

      const result = await clientService.createVehicle(vehicle);

      expect(result.id).toBe('v-new');
    });
  });
});
