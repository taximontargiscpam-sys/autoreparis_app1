# PRD — AutoReparis OS
## Product Requirements Document v1.0

**Produit :** AutoReparis OS — Application de gestion complete pour garage automobile
**Entreprise :** Auto Reparis, 35 Rue du Bon Houdart, 93700 Drancy
**Plateforme :** iOS (prioritaire), Android, Web
**Stack :** React Native (Expo 54) / TypeScript / Supabase / NativeWind
**Bundle ID :** com.autoreparis.os
**Date :** Fevrier 2026

---

## 1. VISION & OBJECTIFS

### 1.1 Vision
Fournir au garage Auto Reparis un outil mobile tout-en-un permettant de gerer l'integralite de l'activite : interventions mecaniques, clients, stocks, equipe, leads web, et suivi client en temps reel.

### 1.2 Objectifs Business
| Objectif | KPI | Cible |
|----------|-----|-------|
| Digitaliser 100% des interventions | Interventions creees/mois | 100+ |
| Reduire les ruptures de stock | Alertes stock bas traitees | <5 ruptures/mois |
| Convertir les leads web | Taux de conversion leads | >30% |
| Offrir un suivi client public | Recherches publiques/mois | 50+ |
| Optimiser la rentabilite | Marge visible par intervention | 100% des interventions |

### 1.3 Utilisateurs Cibles
| Persona | Role | Utilisation |
|---------|------|-------------|
| Patron/Admin | `admin` | Vision globale, KPIs, gestion equipe, decisions |
| Receptionniste | `frontdesk` | Accueil clients, creation interventions, leads, facturation |
| Mecanicien | `mecanicien` | Voir ses interventions assignees, mise a jour statuts, scanner pieces |
| Lecture seule | `lecture` | Consultation tableau de bord |
| Client public | aucun | Suivi reparation par plaque d'immatriculation |

---

## 2. ARCHITECTURE FONCTIONNELLE

### 2.1 Modules Principaux

```
AutoReparis OS
|
|-- [PUBLIC] Page d'accueil garage
|   |-- Presentation services (mecanique, diagnostic, carrosserie)
|   |-- Suivi vehicule par plaque (recherche + tracking temps reel)
|   |-- Contact telephonique direct
|   |-- Liens legaux (confidentialite, CGU)
|
|-- [AUTH] Authentification
|   |-- Login email/password (Supabase Auth)
|   |-- Reset mot de passe par email
|   |-- Protection de routes (useProtectedRoute)
|   |-- Roles RBAC (admin, frontdesk, mecanicien, lecture)
|
|-- [DASHBOARD] Tableau de bord
|   |-- KPI temps reel (interventions actives, CA hebdo, leads, stock bas)
|   |-- Pull-to-refresh
|   |-- Actions rapides (nouvelle intervention, scanner)
|   |-- Acces performance
|
|-- [INTERVENTIONS] Gestion Atelier
|   |-- Liste interventions avec recherche et filtres
|   |-- Creation intervention complete (client + vehicule + details)
|   |-- Detail intervention (statut, mecanicien, lignes, photos)
|   |-- Cycle de vie : planifiee > en_cours > en_attente_pieces > terminee > facturee
|   |-- Ajout lignes (pieces, main d'oeuvre, autre) avec calcul marges
|   |-- Photos vehicule (camera + galerie, max 6)
|   |-- Swipe-to-delete
|
|-- [PLANNING] Planning Equipe
|   |-- Calendrier mensuel interactif
|   |-- Disponibilite equipe (present/repos/conge/arret)
|   |-- Affectation mecanicien aux interventions
|   |-- Vue rendez-vous du jour
|
|-- [CLIENTS] Gestion Clients
|   |-- Liste clients avec recherche
|   |-- Fiche client complete (nom, contact, adresse)
|   |-- Vehicules lies au client
|   |-- Creation/edition/suppression
|   |-- Historique interventions par client
|
|-- [STOCK] Gestion Stocks
|   |-- Inventaire produits par categorie
|   |-- Alertes stock bas (seuil configurable)
|   |-- Scanner code-barres (camera live)
|   |-- Ajout/modification produits
|   |-- Prix achat/vente, reference fournisseur
|   |-- Mouvements de stock traces
|
|-- [LEADS] Gestion Leads Web
|   |-- Feed temps reel (Supabase Realtime)
|   |-- Notifications push sur nouveau lead
|   |-- Statuts : nouveau > contacte > converti > perdu
|   |-- Appel direct depuis l'app
|   |-- Conversion lead en intervention
|   |-- Swipe actions (archiver/supprimer)
|
|-- [PERFORMANCE] Tableau Financier
|   |-- Graphique barres CA hebdomaire (7 jours)
|   |-- Panier moyen
|   |-- Nombre d'interventions terminees
|   |-- Detail transactions avec filtre par jour
|
|-- [PROFIL] Gestion Compte
|   |-- Changement mot de passe
|   |-- Gestion equipe (ajout/suppression membres)
|   |-- Documents legaux
|   |-- Suppression de compte
|   |-- Deconnexion
|
|-- [SCANNER] Scanner Code-Barres
|   |-- Camera live avec overlay
|   |-- Reconnaissance QR/EAN13/UPC-A/Code128
|   |-- Lookup produit automatique
|   |-- Incrementation stock rapide
|   |-- Creation produit depuis code scanne
```

---

## 3. MODELE DE DONNEES

### 3.1 Schema Base de Donnees (Supabase PostgreSQL)

#### Tables Principales
| Table | Description | Champs cles |
|-------|-------------|-------------|
| `users` | Employes du garage | id (FK auth.users), role, nom, prenom, email, actif |
| `clients` | Clients du garage | id, nom, prenom, telephone, email, adresse, ville, code_postal |
| `vehicles` | Vehicules des clients | id, client_id (FK), marque, modele, immatriculation, kilometrage, annee, vin |
| `products` | Pieces et consommables | id, nom, categorie, code_barres, ref_fournisseur, prix_achat, prix_vente, stock_actuel, stock_min |
| `interventions` | Reparations/services | id, client_id, vehicle_id, mecanicien_id, statut, dates, total_achat/vente/marge |
| `intervention_lines` | Lignes de facturation | id, intervention_id, type_ligne, product_id, quantite, prix_achat/vente (totaux calcules) |
| `vehicle_photos` | Photos vehicules | id, intervention_id, url_image, type, commentaire |
| `team_availability` | Planning equipe | id, user_id, date, statut (present/repos/conge/arret) |
| `leads_site_web` | Leads depuis le site web | id, nom, telephone, email, message, statut, converted_ids |
| `stock_movements` | Historique mouvements stock | id, product_id, type, quantite, motif, stock_avant/apres |
| `invoices` | Factures | id, intervention_id, numero, total_ht/tva/ttc, pdf_url, statut |
| `activity_log` | Journal d'activite | id, user_id, type_evenement, details (jsonb) |

#### Base de donnees secondaire (Site Web)
| Table | Description |
|-------|-------------|
| `devis_auto` | Demandes de devis depuis le site web autoreparis.com |

### 3.2 Relations
```
clients 1--N vehicles
clients 1--N interventions
vehicles 1--N interventions
interventions 1--N intervention_lines
interventions 1--N vehicle_photos
products 1--N intervention_lines
products 1--N stock_movements
users 1--N interventions (mecanicien)
users 1--N team_availability
interventions 1--1 invoices
```

### 3.3 Fonctions RPC (Server-Side)
| Fonction | Description |
|----------|-------------|
| `create_full_intervention()` | Creation atomique client + vehicule + intervention |
| `recalculate_intervention_totals()` | Recalcul marges depuis les lignes |
| `get_dashboard_stats()` | Stats dashboard en une requete |
| `get_performance_stats(days)` | Stats performance sur N jours |
| `get_vehicle_status_public(plate)` | Recherche vehicule publique (anon) |
| `get_intervention_details_public(id)` | Detail intervention publique (anon) |

---

## 4. SECURITE & RBAC

### 4.1 Politique de Roles
| Action | admin | frontdesk | mecanicien | lecture |
|--------|:-----:|:---------:|:----------:|:-------:|
| Dashboard (lecture) | X | X | X | X |
| Creer intervention | X | X | X | |
| Modifier intervention | X | X | X | |
| Supprimer intervention | X | | | |
| Gerer clients | X | X | | |
| Supprimer clients | X | | | |
| Gerer stock | X | X | X | |
| Gerer equipe | X | | | |
| Voir leads | X | X | X | X |
| Modifier leads | X | X | | |
| Facturation | X | X | | |

### 4.2 Row Level Security (RLS)
- Toutes les tables ont RLS active
- Fonctions helper : `get_user_role()`, `has_write_access()`, `is_admin()`
- Acces public via RPC SECURITY DEFINER (pas d'acces direct aux tables pour anon)

### 4.3 Authentification
- Supabase Auth (email/password)
- Token JWT auto-refresh (AppState listener)
- Session persistee via AsyncStorage
- Protection de routes cote client (useProtectedRoute)

---

## 5. NOTIFICATIONS

### 5.1 Push Notifications (Expo Notifications)
| Evenement | Destinataire | Message |
|-----------|-------------|---------|
| Nouveau lead site web | Tous employes connectes | "Nouvelle Demande: {projet}" |

### 5.2 Realtime (Supabase Channels)
| Canal | Table | Evenement |
|-------|-------|-----------|
| `global_leads_notifications` | `devis_auto` | INSERT |

---

## 6. ECRANS & NAVIGATION

### 6.1 Arbre de Navigation
```
/ (index) .............. Page publique accueil
/public/search ......... Recherche vehicule par plaque
/tracking?id= .......... Suivi reparation temps reel
/(auth)/login .......... Connexion employe
/(tabs)/ ............... Navigation principale (6 onglets)
  /index ............... Dashboard
  /planning ............ Planning equipe
  /interventions ....... Liste interventions
  /clients/ ............ Gestion clients
    /index ............. Liste
    /[id] .............. Detail client
    /new_client ........ Nouveau client
  /stock ............... Inventaire
  /leads/ .............. Leads web
    /index ............. Liste leads
    /[id] .............. Detail lead
/interventions/new ..... Nouvelle intervention (modal)
/interventions/[id] .... Detail intervention
/products/new .......... Nouveau produit
/products/[id] ......... Detail produit
/scan .................. Scanner code-barres
/performance ........... Tableau financier
/profile ............... Profil & equipe
/portal ................ Portail client (recherche alternative)
/modal ................. Modal generique
```

### 6.2 Tab Bar
| Onglet | Icone | Ecran |
|--------|-------|-------|
| Dashboard | LayoutDashboard | KPIs + actions rapides |
| Planning | Calendar | Calendrier equipe |
| Atelier | Wrench | Liste interventions |
| Clients | Users | Liste clients |
| Stocks | Package | Inventaire produits |
| Demandes | Inbox | Feed leads web |

---

## 7. INTEGRATIONS EXTERNES

| Service | Usage | Config |
|---------|-------|--------|
| Supabase (principal) | Auth, DB, Storage, Realtime | wjvqdvjtzwmusabbinnl |
| Supabase (site web) | Leads du site autoreparis.com | pncgdoqbbsgstcgydtro |
| Expo Notifications | Push notifications | Expo Push Service |
| Expo Camera | Scanner code-barres | Permission camera |
| Expo Image Picker | Photos vehicules | Permission galerie |
| Vercel | Pages legales hebergees | autoreparis-legal.vercel.app |

---

## 8. EXIGENCES NON-FONCTIONNELLES

### 8.1 Performance
| Metrique | Cible |
|----------|-------|
| Cold start | <3s |
| Navigation entre ecrans | <100ms |
| Requete API (CRUD simple) | <500ms |
| Chargement dashboard | <1s |
| Scan code-barres (detection) | <2s |

### 8.2 Compatibilite
- iOS 16.0+ (iPhone + iPad)
- Android 8.0+ (API 26)
- Web (via React Native Web/Metro)

### 8.3 Accessibilite
- Labels d'accessibilite sur tous les boutons interactifs
- Support VoiceOver/TalkBack
- Contraste texte respecte (theme dark/light)

### 8.4 Internationalisation
- Francais uniquement (v1)

---

## 9. CONTRAINTES APP STORE

### 9.1 Deja Traite
- [x] Privacy descriptions iOS (camera, photos, notifications)
- [x] Privacy Manifests (UserDefaults, FileTimestamp, BootTime, DiskSpace)
- [x] Suppression placeholder/debug content
- [x] Protection de routes activee
- [x] Liens confidentialite + CGU
- [x] .env dans .gitignore

### 9.2 Reste a Faire
- [ ] Regenerer cles API Supabase (exposees dans git history)
- [ ] Creer compte demo Apple Review
- [ ] Screenshots 3 tailles
- [ ] Tester sur device physique
- [ ] Build EAS production
- [ ] Nettoyer sous-dossier `autoreparis-os-main/` (doublon)

---

## 10. ROADMAP

### v1.0 — MVP (Actuel)
- [x] Dashboard avec KPIs
- [x] CRUD interventions complet
- [x] Gestion clients + vehicules
- [x] Gestion stock + scanner
- [x] Planning equipe
- [x] Leads web en temps reel
- [x] Suivi public par plaque
- [x] Performance financiere
- [x] Authentification RBAC
- [x] Notifications push

### v1.1 — Post-Launch
- [ ] Export PDF factures
- [ ] Sentry (error monitoring)
- [ ] Tests unitaires (couverture >60%)
- [ ] Historique complet par client
- [ ] Mode hors-ligne (cache local)

### v1.2 — Ameliorations
- [ ] SMS notifications clients
- [ ] Tableau de bord avance (graphiques mensuels)
- [ ] Multi-garage (franchise)
- [ ] API publique REST
- [ ] Gestion des fournisseurs

### v2.0 — Evolution
- [ ] Module comptabilite integre
- [ ] Gestion RDV en ligne (booking client)
- [ ] Integration SIV (carte grise)
- [ ] Version Android Play Store
- [ ] Version tablette optimisee

---

## 11. RISQUES & MITIGATIONS

| Risque | Impact | Probabilite | Mitigation |
|--------|--------|-------------|------------|
| Cles API exposees dans git history | Eleve | Confirme | Regenerer les cles Supabase avant production |
| RLS trop permissif (v1 basique) | Moyen | Moyen | RLS RBAC deja deploye via rls_policies.sql |
| Absence de tests | Moyen | Eleve | Plan de tests unitaires v1.1 |
| Single point of failure Supabase | Moyen | Faible | Backups automatiques Supabase, plan Pro |
| Rejet App Store | Eleve | Faible | Fixes Apple deja appliques, rapport complet |
| Sous-dossier doublon dans le projet | Faible | Confirme | Supprimer autoreparis-os-main/ |

---

*Document genere le 27 fevrier 2026 — AutoReparis OS v1.0*
