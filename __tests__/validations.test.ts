import {
  clientSchema,
  vehicleSchema,
  interventionSchema,
  productSchema,
  interventionLineSchema,
  plateSchema,
  teamMemberSchema,
  passwordSchema,
  getValidationError,
} from '../lib/validations';

describe('clientSchema', () => {
  it('accepts valid client data', () => {
    const result = clientSchema.safeParse({
      nom: 'Dupont',
      prenom: 'Jean',
      telephone: '0612345678',
      email: 'jean@test.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty nom', () => {
    const result = clientSchema.safeParse({ nom: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = clientSchema.safeParse({ nom: 'Test', email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('allows empty email', () => {
    const result = clientSchema.safeParse({ nom: 'Test', email: '' });
    expect(result.success).toBe(true);
  });

  it('applies defaults for optional fields', () => {
    const result = clientSchema.safeParse({ nom: 'Test' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.prenom).toBe('');
      expect(result.data.telephone).toBe('');
    }
  });
});

describe('vehicleSchema', () => {
  it('accepts valid vehicle data', () => {
    const result = vehicleSchema.safeParse({
      marque: 'Renault',
      modele: 'Clio',
      immatriculation: 'AB-123-CD',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing marque', () => {
    const result = vehicleSchema.safeParse({
      modele: 'Clio',
      immatriculation: 'AB-123-CD',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing immatriculation', () => {
    const result = vehicleSchema.safeParse({
      marque: 'Renault',
      modele: 'Clio',
    });
    expect(result.success).toBe(false);
  });

  it('validates year range', () => {
    const result = vehicleSchema.safeParse({
      marque: 'Renault',
      modele: 'Clio',
      immatriculation: 'AB-123-CD',
      annee: 1800,
    });
    expect(result.success).toBe(false);
  });
});

describe('interventionSchema', () => {
  it('accepts valid intervention', () => {
    const result = interventionSchema.safeParse({
      type_intervention: 'Vidange',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty type_intervention', () => {
    const result = interventionSchema.safeParse({
      type_intervention: '',
    });
    expect(result.success).toBe(false);
  });

  it('applies default values', () => {
    const result = interventionSchema.safeParse({
      type_intervention: 'Freins',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.total_vente).toBe(0);
      expect(result.data.commentaire).toBe('');
    }
  });
});

describe('productSchema', () => {
  it('accepts valid product', () => {
    const result = productSchema.safeParse({
      nom: 'Filtre à huile',
      categorie: 'entretien',
      prix_vente_unitaire: 15.99,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty nom', () => {
    const result = productSchema.safeParse({ nom: '' });
    expect(result.success).toBe(false);
  });

  it('rejects negative price', () => {
    const result = productSchema.safeParse({
      nom: 'Test',
      prix_vente_unitaire: -5,
    });
    expect(result.success).toBe(false);
  });

  it('validates categorie enum', () => {
    const result = productSchema.safeParse({
      nom: 'Test',
      categorie: 'invalid_category',
    });
    expect(result.success).toBe(false);
  });
});

describe('interventionLineSchema', () => {
  it('accepts valid line', () => {
    const result = interventionLineSchema.safeParse({
      type_ligne: 'piece',
      description: 'Plaquettes de frein',
      quantite: 2,
      prix_vente_unitaire: 45,
    });
    expect(result.success).toBe(true);
  });

  it('rejects zero quantity', () => {
    const result = interventionLineSchema.safeParse({
      type_ligne: 'piece',
      description: 'Test',
      quantite: 0,
      prix_vente_unitaire: 10,
    });
    expect(result.success).toBe(false);
  });
});

describe('plateSchema', () => {
  it('normalizes plate format', () => {
    const result = plateSchema.safeParse('ab-123-cd');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('AB123CD');
    }
  });

  it('rejects empty plate', () => {
    const result = plateSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});

describe('teamMemberSchema', () => {
  it('accepts valid team member', () => {
    const result = teamMemberSchema.safeParse({
      prenom: 'Amir',
      nom: 'Test',
      role: 'admin',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid role', () => {
    const result = teamMemberSchema.safeParse({
      prenom: 'Test',
      nom: 'Test',
      role: 'superadmin',
    });
    expect(result.success).toBe(false);
  });
});

describe('passwordSchema', () => {
  it('accepts matching passwords', () => {
    const result = passwordSchema.safeParse({
      password: 'secure123',
      confirmPassword: 'secure123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-matching passwords', () => {
    const result = passwordSchema.safeParse({
      password: 'secure123',
      confirmPassword: 'different',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = passwordSchema.safeParse({
      password: '12345',
      confirmPassword: '12345',
    });
    expect(result.success).toBe(false);
  });
});

describe('getValidationError', () => {
  it('returns null for success', () => {
    const result = clientSchema.safeParse({ nom: 'Test' });
    expect(getValidationError(result)).toBeNull();
  });

  it('returns first error message on failure', () => {
    const result = clientSchema.safeParse({ nom: '' });
    const error = getValidationError(result);
    expect(error).toBeTruthy();
    expect(typeof error).toBe('string');
  });
});
