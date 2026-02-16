import { productService } from '../../lib/services/productService';
import { createChainableMock } from '../helpers/mockSupabase';

const mockChain = createChainableMock();
jest.mock('../../lib/supabase', () => ({
  supabase: { from: jest.fn(() => mockChain) },
}));

import { supabase } from '../../lib/supabase';

describe('productService', () => {
  describe('list', () => {
    it('returns paginated products', async () => {
      mockChain._setResolved({ data: [{ id: '1', nom: 'Filtre huile' }], error: null, count: 1 });

      const result = await productService.list('all', 0);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('filters by category when not "all"', async () => {
      mockChain._setResolved({ data: [], error: null, count: 0 });

      await productService.list('entretien', 0);

      expect(mockChain.eq).toHaveBeenCalledWith('categorie', 'entretien');
    });
  });

  describe('getById', () => {
    it('returns a product', async () => {
      mockChain._setResolved({ data: { id: 'p1', nom: 'Filtre' }, error: null });

      const result = await productService.getById('p1');

      expect(result.nom).toBe('Filtre');
    });
  });

  describe('getByBarcode', () => {
    it('returns a product by barcode', async () => {
      mockChain._setResolved({ data: { id: '1', nom: 'Filtre', code_barres: '123' }, error: null });

      const result = await productService.getByBarcode('123');

      expect(mockChain.eq).toHaveBeenCalledWith('code_barres', '123');
      expect(result?.nom).toBe('Filtre');
    });

    it('returns null when not found', async () => {
      mockChain._setResolved({ data: null, error: null });

      const result = await productService.getByBarcode('000');

      expect(result).toBeNull();
    });
  });

  describe('updateStock', () => {
    it('updates stock and creates movement (entree)', async () => {
      mockChain._setResolved({ error: null });

      await productService.updateStock({
        productId: 'p1',
        newStock: 15,
        previousStock: 10,
        motif: 'Livraison',
        userId: 'u1',
      });

      expect(mockChain.update).toHaveBeenCalledWith({ stock_actuel: 15 });
      expect(mockChain.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          product_id: 'p1',
          type: 'entree',
          quantite: 5,
          motif: 'Livraison',
          stock_avant: 10,
          stock_apres: 15,
          user_id: 'u1',
        }),
      ]);
    });

    it('records sortie for stock decrease', async () => {
      mockChain._setResolved({ error: null });

      await productService.updateStock({
        productId: 'p1',
        newStock: 3,
        previousStock: 10,
      });

      expect(mockChain.insert).toHaveBeenCalledWith([
        expect.objectContaining({ type: 'sortie', quantite: 7 }),
      ]);
    });

    it('uses default motif', async () => {
      mockChain._setResolved({ error: null });

      await productService.updateStock({
        productId: 'p1',
        newStock: 5,
        previousStock: 3,
      });

      expect(mockChain.insert).toHaveBeenCalledWith([
        expect.objectContaining({ motif: 'Ajustement manuel' }),
      ]);
    });
  });

  describe('create', () => {
    it('creates a product', async () => {
      mockChain._setResolved({ data: { id: 'new-p', nom: 'Nouveau' }, error: null });

      const result = await productService.create({ nom: 'Nouveau' } as any);

      expect(result.id).toBe('new-p');
    });
  });

  describe('delete', () => {
    it('deletes a product', async () => {
      mockChain._setResolved({ error: null });

      await productService.delete('p1');

      expect(mockChain.delete).toHaveBeenCalled();
    });
  });
});
