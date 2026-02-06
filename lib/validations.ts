import { z } from 'zod';

// --- Client ---
export const clientSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(100),
  prenom: z.string().max(100).optional().default(''),
  telephone: z.string().max(20).optional().default(''),
  email: z.string().email('Email invalide').or(z.literal('')).optional().default(''),
  adresse: z.string().max(255).optional().default(''),
  ville: z.string().max(100).optional().default(''),
  code_postal: z.string().max(10).optional().default(''),
});

export type ClientFormData = z.infer<typeof clientSchema>;

// --- Vehicle ---
export const vehicleSchema = z.object({
  marque: z.string().min(1, 'La marque est requise').max(50),
  modele: z.string().min(1, 'Le modèle est requis').max(50),
  immatriculation: z.string().min(1, "L'immatriculation est requise").max(20),
  kilometrage: z.number().int().nonnegative().optional(),
  annee: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  vin: z.string().max(17).optional(),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;

// --- Intervention ---
export const interventionSchema = z.object({
  type_intervention: z.string().min(1, "Le type d'intervention est requis"),
  date_heure_debut_prevue: z.string().optional(),
  commentaire: z.string().max(2000).optional().default(''),
  total_vente: z.number().nonnegative().optional().default(0),
});

export type InterventionFormData = z.infer<typeof interventionSchema>;

// --- Product ---
export const productSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(200),
  categorie: z.enum(['mecanique', 'carrosserie', 'entretien', 'pneus', 'batterie', 'autre']).optional(),
  code_barres: z.string().max(50).optional(),
  reference_fournisseur: z.string().max(100).optional(),
  prix_achat_unitaire: z.number().nonnegative().optional().default(0),
  prix_vente_unitaire: z.number().nonnegative().optional().default(0),
  stock_actuel: z.number().int().nonnegative().optional().default(0),
  stock_min: z.number().int().nonnegative().optional().default(5),
  localisation: z.string().max(100).optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

// --- Intervention Line ---
export const interventionLineSchema = z.object({
  type_ligne: z.enum(['piece', 'main_oeuvre', 'autre']),
  description: z.string().min(1, 'La description est requise').max(500),
  quantite: z.number().positive('La quantité doit être > 0'),
  prix_vente_unitaire: z.number().nonnegative('Le prix doit être >= 0'),
  prix_achat_unitaire: z.number().nonnegative().optional().default(0),
});

export type InterventionLineFormData = z.infer<typeof interventionLineSchema>;

// --- Search plate (public) ---
export const plateSchema = z
  .string()
  .min(1, "Veuillez entrer une plaque d'immatriculation")
  .max(20)
  .transform(val => val.replace(/[\s-]/g, '').toUpperCase());

// --- Team member ---
export const teamMemberSchema = z.object({
  prenom: z.string().min(1, 'Le prénom est requis').max(50),
  nom: z.string().min(1, 'Le nom est requis').max(50),
  role: z.enum(['admin', 'frontdesk', 'mecanicien', 'lecture']),
});

export type TeamMemberFormData = z.infer<typeof teamMemberSchema>;

// --- Password change ---
export const passwordSchema = z.object({
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

// --- Helper to extract first error message ---
export function getValidationError(result: z.SafeParseReturnType<unknown, unknown>): string | null {
  if (result.success) return null;
  return result.error.issues[0]?.message ?? 'Validation échouée';
}
