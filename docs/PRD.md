# PRD — AutoReparis OS
## Product Requirements Document

> Version 1.0 — 23 février 2026
> Statut : Production Ready (en attente de publication App Store)

---

## 1. Vision Produit

**AutoReparis OS** remplace les outils papier, WhatsApp et Excel d'un garage automobile indépendant par une application mobile iOS centralisée qui digitalise les opérations, améliore l'expérience client et automatise les tâches répétitives.

### Problème résolu

Les garages indépendants gèrent encore manuellement :

| Processus actuel | Problème | Solution AutoReparis OS |
|------------------|----------|------------------------|
| Fiches intervention (papier) | Perte, illisible, non partageable | Module Interventions numérique |
| Rendez-vous (cahier/WhatsApp) | Conflits, oublis, no-shows | Planning avec notifications push |
| Stock pièces (Excel ou tête) | Ruptures, commandes d'urgence | Stock avec scanner code-barres |
| Factures (Word/manuscrit) | Erreurs, impayés, pas de suivi | Module Facturation intégré |
| Communication client (SMS manuel) | Chronophage, oubli | Notifications automatiques + portail suivi |
| Leads site web (email perdu) | Conversion faible | CRM Leads intégré |

---

## 2. Périmètre et Contraintes

| Contrainte | Valeur |
|------------|--------|
| Plateforme | iOS uniquement (App Store) |
| Localisation | Français uniquement |
| Utilisateurs cibles | 2-15 personnes par garage |
| Connectivité | Requiert internet (Supabase cloud) |
| Tablet | Non supporté (`supportsTablet: false`) |
| RGPD | Politique de confidentialité publiée |

---

## 3. Personas

### Admin (Patron de garage)
- **Besoins** : Vue globale du CA, performance équipe, facturation, configuration
- **Accès** : Toutes les fonctionnalités
- **Fréquence** : Quotidien, surtout matin pour le dashboard

### Front Desk (Accueil / Secrétaire)
- **Besoins** : Enregistrer clients, créer interventions, gérer planning, envoyer devis
- **Accès** : Clients, véhicules, interventions, planning (lecture/écriture)
- **Fréquence** : Usage intensif toute la journée

### Mécanicien
- **Besoins** : Voir ses interventions assignées, mettre à jour les statuts, ajouter pièces utilisées
- **Accès** : Ses propres interventions (lecture/écriture limitée)
- **Fréquence** : 3-5 mises à jour par jour

### Lecture (Comptable / Partenaire)
- **Besoins** : Consulter les données sans modification
- **Accès** : Vue lecture seule sur tout
- **Fréquence** : Hebdomadaire ou mensuel

---

## 4. Modules Fonctionnels (9)

### Module 1 — Dashboard
- KPIs temps réel : CA du jour/mois, interventions en cours, leads entrants
- Graphiques de performance
- Alertes (interventions en retard, stock bas)
- Technologie : React Query + Supabase RPC `get_dashboard_stats()`

### Module 2 — Interventions
- CRUD complet (créer, lire, modifier, supprimer)
- Statuts : `en_attente`, `en_cours`, `terminee`, `facturee`
- Ajout de pièces et produits à chaque intervention
- Photos (caméra ou galerie)
- Assignation mécanicien
- Technologie : Supabase `interventions` + `intervention_products`

### Module 3 — Clients & Véhicules
- Fiche client complète (coordonnées, historique)
- Fiche véhicule (marque, modèle, immat, VIN, historique interventions)
- Scan QR code / code-barres pour identification rapide
- Technologie : Supabase `clients` + `vehicles`, expo-camera

### Module 4 — Stock
- Inventaire produits avec prix d'achat et vente
- Scanner code-barres (ajout rapide)
- Alertes stock bas
- Technologie : Supabase `products`, expo-camera barcode

### Module 5 — Planning
- Calendrier d'équipe (vue jour/semaine)
- Création et modification de rendez-vous
- Disponibilités mécaniciens
- Technologie : Supabase `planning_events`, Realtime pour synchro live

### Module 6 — Leads CRM
- Formulaires entrants depuis le site web du garage
- Conversion lead → client → intervention
- Suivi statuts (nouveau, contacté, converti, perdu)
- Technologie : 2ème projet Supabase dédié aux leads

### Module 7 — Suivi Client (Portail Public)
- URL unique par véhicule/intervention
- Client peut voir l'avancement de sa réparation sans compte
- Partage par SMS/WhatsApp
- Technologie : Route publique Expo Router, Supabase RPC sécurisé

### Module 8 — Performance & Analytics
- Rapport mensuel par mécanicien
- CA par type d'intervention
- Taux de conversion leads
- Export PDF
- Technologie : Supabase RPC `get_performance_stats()`

### Module 9 — Profil & Configuration
- Gestion du compte utilisateur
- Changement mot de passe
- Suppression de compte (requis Apple)
- Préférences notifications
- Technologie : Supabase Auth, `delete_own_account()` RPC

---

## 5. Architecture Technique

```
┌─────────────────────────────────────────────┐
│              React Native App               │
│  Expo SDK 54 | Expo Router | NativeWind     │
├─────────────────────────────────────────────┤
│              State Management               │
│  React Query (server state) | Zod (valid.)  │
├─────────────────────────────────────────────┤
│                  Supabase                   │
│  Auth | PostgreSQL | Realtime | Storage     │
│  12 tables | RLS | 4 rôles RBAC            │
├──────────────────┬──────────────────────────┤
│   Build          │   Distribution           │
│   EAS Build      │   Apple App Store        │
│   iOS only       │   iOS only               │
└──────────────────┴──────────────────────────┘
```

### Base de données (12 tables)

| Table | Description |
|-------|-------------|
| `garages` | Configuration du garage (nom, adresse, tel) |
| `team_members` | Utilisateurs avec rôle (admin/frontdesk/mecanicien/lecture) |
| `clients` | Fiches clients |
| `vehicles` | Véhicules associés aux clients |
| `interventions` | Fiches intervention (statut, assignation, prix) |
| `products` | Catalogue produits / pièces |
| `intervention_products` | Produits utilisés par intervention |
| `planning_events` | Rendez-vous et événements |
| `leads` | Demandes entrantes du site web |
| `invoices` | Factures générées |
| `notifications` | Historique des notifications push |
| `app_config` | Configuration globale de l'app |

### Sécurité
- Row Level Security (RLS) activé sur les 12 tables
- FORCE ROW LEVEL SECURITY (bloque même le service_role)
- RBAC via helper functions PostgreSQL (`get_user_role()`, `has_write_access()`, `is_admin()`)
- Secrets gérés via `.env` (non commité) + Expo SecureStore côté client

---

## 6. Critères de Succès

| Critère | Cible | Mesure |
|---------|-------|--------|
| Publication App Store | App approuvée par Apple | Statut ASC = "Ready for Sale" |
| Onboarding | < 30 min pour un nouveau garage | Test utilisateur |
| Stabilité | 0 crash critique | Crash Organizer ASC |
| Disponibilité | > 99.9% | Supabase Dashboard |
| Performance | < 2s temps de chargement | Profiling React Native |
| Sécurité | 0 fuite de données | Audit RLS + logs Supabase |

---

## 7. Ce qui est hors périmètre (v1.0)

- ❌ Support Android (décision business)
- ❌ Support iPad
- ❌ Multi-garage (une instance = un garage)
- ❌ Application web (mobile uniquement)
- ❌ Intégration comptabilité (Sage, etc.)
- ❌ Paiement en ligne
- ❌ Multi-langues (français uniquement)

---

## 8. Roadmap V2 (post-publication)

1. **Multi-garage** : Un compte admin peut gérer plusieurs garages
2. **Facturation avancée** : Génération PDF + envoi email
3. **Android** : Si la demande client le justifie
4. **Intégration SMS** : Notifications automatiques via Twilio/Brevo
5. **Tableau de bord web** : Version browser pour l'admin

---

*Fichiers associés : `docs/SOP.md` (guide publication), `docs/AUDIT_REPORT.md` (état du code)*
