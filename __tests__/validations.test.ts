import { clientSchema, vehicleSchema } from '../lib/validations';

describe('Validation Schemas', () => {
    describe('clientSchema', () => {
        it('validates a correct client', () => {
            const valid = { nom: 'Dupont', email: 'test@test.com', telephone: '0600000000' };
            const result = clientSchema.safeParse(valid);
            expect(result.success).toBe(true);
        });

        it('rejects missing name', () => {
            const invalid = { email: 'test@test.com' };
            const result = clientSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('validates invalid email', () => {
            const invalid = { nom: 'Dupont', email: 'not-an-email' };
            const result = clientSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });
    });

    describe('vehicleSchema', () => {
        it('validates a correct vehicle', () => {
            const valid = { marque: 'Peugeot', modele: '208', immatriculation: 'AA-123-BB' };
            const result = vehicleSchema.safeParse(valid);
            expect(result.success).toBe(true);
        });

        it('rejects missing immatriculation', () => {
            const invalid = { marque: 'Peugeot', modele: '208' };
            const result = vehicleSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });
    });
});
