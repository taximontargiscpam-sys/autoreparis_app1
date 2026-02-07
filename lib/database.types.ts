// Auto-generated types matching schema.sql
// Replace with `supabase gen types typescript` when CLI is configured

export type UserRole = 'admin' | 'frontdesk' | 'mecanicien' | 'lecture';

export type InterventionStatus =
  | 'planifiee'
  | 'en_cours'
  | 'en_attente_pieces'
  | 'terminee'
  | 'facturee'
  | 'annulee'
  | 'no_show';

export type ProductCategory =
  | 'mecanique'
  | 'carrosserie'
  | 'entretien'
  | 'pneus'
  | 'batterie'
  | 'autre';

export type LeadStatus = 'nouveau' | 'en_traitement' | 'transformé_en_client' | 'perdu';

export type AvailabilityStatus = 'present' | 'repos' | 'conge' | 'arret' | 'autre';

export type InvoiceStatus = 'brouillon' | 'emise' | 'payee' | 'annulee';

export type StockMovementType = 'entree' | 'sortie' | 'correction';

export type LineType = 'piece' | 'main_oeuvre' | 'autre';

// --- Row types ---

export interface User {
  id: string;
  role: UserRole;
  nom: string | null;
  prenom: string | null;
  email: string | null;
  actif: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  nom: string;
  prenom: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  ville: string | null;
  code_postal: string | null;
  created_at: string;
}

export interface Vehicle {
  id: string;
  client_id: string;
  marque: string;
  modele: string;
  immatriculation: string;
  kilometrage: number | null;
  annee: number | null;
  vin: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  nom: string;
  categorie: ProductCategory | null;
  code_barres: string | null;
  reference_fournisseur: string | null;
  prix_achat_unitaire: number | null;
  prix_vente_unitaire: number | null;
  stock_actuel: number;
  stock_min: number;
  localisation: string | null;
  created_at: string;
}

export interface Intervention {
  id: string;
  client_id: string;
  vehicle_id: string;
  mecanicien_id: string | null;
  date_heure_debut_prevue: string | null;
  date_heure_fin_prevue: string | null;
  date_heure_debut_reelle: string | null;
  date_heure_fin_reelle: string | null;
  statut: InterventionStatus;
  type_intervention: string | null;
  commentaire: string | null;
  total_achat: number;
  total_vente: number;
  marge_totale: number;
  total_ttc: number | null; // Added field
  created_at: string;
}

export interface InterventionWithRelations extends Intervention {
  clients: Pick<Client, 'nom' | 'prenom' | 'telephone' | 'email'> | null;
  vehicles: Pick<Vehicle, 'marque' | 'modele' | 'immatriculation'> | null;
  mecanicien: Pick<User, 'id' | 'nom' | 'prenom'> | null; // Added id
}

export interface InterventionLine {
  id: string;
  intervention_id: string;
  type_ligne: LineType | null;
  product_id: string | null;
  description: string | null;
  quantite: number;
  prix_achat_unitaire: number;
  prix_vente_unitaire: number;
  total_achat_ligne: number;
  total_vente_ligne: number;
}

export interface LeadSiteWeb {
  id: string;
  source: string | null;
  nom: string | null;
  prenom: string | null;
  telephone: string | null;
  email: string | null;
  message: string | null;
  type_demande: string | null;
  statut: LeadStatus;
  converted_client_id: string | null;
  converted_intervention_id: string | null;
  created_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  type: StockMovementType | null;
  quantite: number;
  motif: string | null;
  intervention_id: string | null;
  user_id: string | null;
  stock_avant: number | null;
  stock_apres: number | null;
  created_at: string;
}

export interface VehiclePhoto {
  id: string;
  intervention_id: string;
  url_image: string;
  type: string | null;
  commentaire: string | null;
  created_at: string;
}

export interface TeamAvailability {
  id: string;
  user_id: string;
  date: string;
  statut: AvailabilityStatus | null;
  commentaire: string | null;
}

export interface Invoice {
  id: string;
  intervention_id: string;
  numero_facture: string | null;
  date_facture: string | null;
  total_ht: number | null;
  total_tva: number | null;
  total_ttc: number | null;
  pdf_url: string | null;
  statut: InvoiceStatus;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  type_evenement: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

// --- Insert types (omit generated fields) ---

export type ClientInsert = Omit<Client, 'id' | 'created_at'>;
export type VehicleInsert = Omit<Vehicle, 'id' | 'created_at'>;
export type ProductInsert = Omit<Product, 'id' | 'created_at'>;
export type InterventionInsert = Omit<Intervention, 'id' | 'created_at' | 'total_achat' | 'total_vente' | 'marge_totale'>;
export type InterventionLineInsert = Omit<InterventionLine, 'id' | 'total_achat_ligne' | 'total_vente_ligne'>;

// --- Website leads (separate DB) ---

export interface DevisAuto {
  id: string;
  nom: string | null;
  prenom: string | null;
  telephone: string | null;
  email: string | null;
  message: string | null;
  vehicle_model: string | null;
  projet: string | null;
  statut: string | null;
  created_at: string;
}
