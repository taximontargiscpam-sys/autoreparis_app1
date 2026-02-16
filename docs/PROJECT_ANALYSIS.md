# Analyse complète du projet AutoReparis OS

## Contexte

**AutoReparis OS** est une application mobile professionnelle de gestion de garage automobile pour "Auto Reparis", un garage situé à Drancy, France. L'application cible iOS, Android et Web. L'ensemble de l'interface est en français.

---

## 1. Stack technologique

| Couche | Technologie |
|---|---|
| Langage | TypeScript (strict mode) |
| Framework mobile | React Native 0.81.5 + React 19.1.0 |
| Plateforme | Expo SDK 54 (managed workflow, new architecture) |
| Navigation | Expo Router v6 (file-based routing) |
| Styling | NativeWind v4 (Tailwind CSS pour React Native) |
| Backend / BDD | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| State management | TanStack React Query v5 (serveur) + React Context (auth) |
| Validation | Zod v4 |
| Animations | react-native-reanimated v4 |
| Icônes | lucide-react-native |
| Notifications | expo-notifications + Supabase Realtime |
| CI/CD | GitHub Actions (tests + typecheck) / EAS Build (déploiement) |

---

## 2. Architecture globale

```
/autoreparis_app1/
├── app/                    # Écrans (Expo Router file-based)
│   ├── _layout.tsx         # Layout racine (providers, auth, notifications)
│   ├── index.tsx           # Page d'accueil publique
│   ├── (auth)/login.tsx    # Connexion
│   ├── (tabs)/             # Navigation par onglets (6 tabs)
│   │   ├── index.tsx       # Dashboard KPI
│   │   ├── planning.tsx    # Planning équipe
│   │   ├── interventions.tsx # Liste atelier
│   │   ├── clients/        # Gestion clients (liste, détail, création)
│   │   ├── stock.tsx       # Gestion stock
│   │   └── leads/          # Leads site web (CRM)
│   ├── interventions/      # Détail/création interventions (modal)
│   ├── performance/        # Analytics CA
│   ├── products/           # Détail/création produits
│   ├── profile.tsx         # Profil, équipe, mot de passe
│   ├── scan.tsx            # Scanner code-barres
│   ├── tracking.tsx        # Suivi réparation (public)
│   └── public/search.tsx   # Recherche véhicule (public)
├── components/             # Composants réutilisables
│   ├── AuthContext.tsx      # Contexte auth + rôles
│   ├── useProtectedRoute.ts # Garde de route
│   └── intervention/       # Sous-composants intervention
├── lib/                    # Logique métier
│   ├── supabase.ts         # Client Supabase principal
│   ├── supabaseWebsite.ts  # Client Supabase site web (leads)
│   ├── database.types.ts   # Types TypeScript des tables
│   ├── validations.ts      # Schémas Zod
│   ├── queryClient.ts      # Config React Query
│   ├── errorHandler.ts     # Gestion centralisée des erreurs
│   ├── notifications.ts    # Push notifications
│   └── hooks/              # React Query hooks (CRUD par domaine)
├── __tests__/              # Tests unitaires
├── scripts/                # Scripts utilitaires (seed, debug)
├── schema.sql              # Schéma PostgreSQL complet
├── rls_policies.sql        # Politiques Row Level Security
└── rpc_functions.sql       # Fonctions RPC PostgreSQL
```

**Pas de serveur backend traditionnel** — tout passe par Supabase (PostgREST + Auth + Realtime + Storage). Deux projets Supabase sont utilisés :
- **Principal** : gestion du garage (clients, véhicules, interventions, stock, etc.)
- **Site web** : capture des leads (`devis_auto`)

---

## 3. Base de données (12 tables)

| Table | Rôle |
|---|---|
| `users` | Personnel du garage (rôles: admin/frontdesk/mecanicien/lecture) |
| `clients` | Clients du garage |
| `vehicles` | Véhicules liés aux clients |
| `products` | Pièces détachées et stock |
| `interventions` | Ordres de réparation (entité centrale) |
| `intervention_lines` | Lignes de facturation (pièces + main d'œuvre) |
| `leads_site_web` | Leads provenant du site web |
| `stock_movements` | Journal des mouvements de stock |
| `vehicle_photos` | Photos des véhicules/interventions |
| `team_availability` | Planning de disponibilité de l'équipe |
| `invoices` | Factures liées aux interventions |
| `activity_log` | Journal d'audit |

### Relations clés
- `clients` → `vehicles` (1:N)
- `clients` → `interventions` (1:N)
- `vehicles` → `interventions` (1:N)
- `users` → `interventions` via `mecanicien_id` (1:N)
- `interventions` → `intervention_lines` (1:N)
- `interventions` → `vehicle_photos` (1:N)
- `interventions` → `invoices` (1:1)
- `products` → `intervention_lines` (1:N)
- `products` → `stock_movements` (1:N)

### Fonctions RPC serveur
- `create_full_intervention()` — création atomique (client + véhicule + intervention) en une transaction
- `recalculate_intervention_totals()` — recalcul des totaux depuis les lignes
- `get_dashboard_stats()` — KPIs agrégés côté serveur
- `get_performance_stats()` — analytics CA sur N jours
- `get_vehicle_status_public()` / `get_intervention_details_public()` — accès public sécurisé

---

## 4. Authentification et autorisations (RBAC)

**4 rôles** : `admin`, `frontdesk`, `mecanicien`, `lecture`

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| users | tous auth | admin | admin ou soi-même | admin |
| clients | tous auth | write_access | write_access | admin |
| vehicles | tous auth | write_access | write_access | admin |
| products | tous auth | write_access | write_access | admin |
| interventions | tous auth | write_access | write_access | admin |
| intervention_lines | tous auth | write_access | write_access | write_access |
| invoices | tous auth | admin/frontdesk | admin/frontdesk | — |
| stock_movements | tous auth | write_access | — | — |
| vehicle_photos | tous auth | write_access | — | write_access |
| team_availability | tous auth | write_access | write_access | — |

- Auth JWT via Supabase Auth, session persistée dans AsyncStorage
- RLS enforced au niveau PostgreSQL
- `write_access` = admin OU frontdesk OU mecanicien (utilisateur actif)
- Routes publiques : `/`, `/login`, `/portal`, `/tracking`, `/public/search`

---

## 5. Fonctionnalités métier

### Cycle de vie d'une intervention
```
planifiee → en_cours → en_attente_pieces → terminee → facturee
         ↘ annulee / no_show
```

### Modules fonctionnels

1. **Dashboard** — 4 KPIs (interventions actives, stock bas, leads, CA hebdo) + liste interventions récentes
2. **Interventions** — CRUD complet, formulaire multi-étapes, affectation mécanicien, lignes de facturation (pièces + main d'œuvre), upload photos
3. **Clients** — CRUD + gestion véhicules associés, recherche par nom/prénom
4. **Stock** — CRUD produits, scanner code-barres (expo-camera), mouvements audités, alerte stock bas (seuil configurable)
5. **Planning** — calendrier 60 jours scrollable, grille disponibilité équipe (présent/repos/congé), affectation interventions par mécanicien
6. **Leads CRM** — réception en temps réel depuis le site web, conversion en intervention, notifications push
7. **Suivi public** — recherche par plaque d'immatriculation, timeline temps réel des réparations (sans données financières)
8. **Performance** — graphiques CA 30 jours, ventilation hebdomadaire, panier moyen
9. **Profil** — gestion équipe (création/désactivation), changement mot de passe, suppression compte

---

## 6. Temps réel et notifications

- **Supabase Realtime** (postgres_changes) sur : `leads_site_web`, `interventions`, `intervention_lines`, `products`, `stock_movements`
- **Push notifications** via `expo-notifications` quand un nouveau lead arrive (statut = 'nouveau')
- **Tracking public** : mise à jour instantanée de la timeline client via abonnement Realtime

---

## 7. Validation des données

Schémas Zod définis dans `lib/validations.ts` :
- `clientSchema` — nom (2-100 chars), téléphone (format FR), email optionnel, adresse
- `vehicleSchema` — immatriculation (format AA-123-AA), marque, modèle, année, VIN optionnel
- `productSchema` — nom, catégorie (enum), prix achat/vente, stock, seuil min
- `interventionSchema` — type, dates, montants, statut (enum)

---

## 8. Tests et CI/CD

### Tests existants (couverture limitée)
- `sanity.test.tsx` — test de base (smoke test)
- `validations.test.ts` — schémas Zod
- `errorHandler.test.ts` — gestion erreurs
- `useVehicleSearch.test.ts` — hook de recherche véhicule
- `StyledText-test.js` — snapshot composant

### CI (GitHub Actions)
2 jobs parallèles sur push/PR vers `main` :
1. `npm test` (Jest + coverage)
2. `npx tsc --noEmit` (typecheck)

### Build/Deploy
EAS Build avec 3 profils : development, preview, production — déclenchement manuel

---

## 9. Points d'attention identifiés

| # | Catégorie | Sévérité | Description |
|---|---|---|---|
| SEC-001 | Sécurité | Moyenne | Table `products` signalée avec RLS public en dev — à durcir en production |
| SEC-002 | Sécurité | Info | Clés Supabase `anon` dans le bundle (normal, mais RLS doit être solide) |
| TEST-001 | Tests | Haute | Couverture très faible (5 fichiers) — pas de tests d'intégration ni E2E |
| ARCH-001 | Architecture | Moyenne | Couplage fort hooks/Supabase — pas de couche service abstraite |
| ARCH-002 | Architecture | Basse | Composants inline dans les écrans (KPICard, TabButton) non extraits |
| PERF-001 | Performance | Basse | Pas de pagination infinie — chargement par pages de 30 avec boutons |
| DX-001 | Dev Experience | Basse | `lib/store.ts` vestige minimal (simple variable globale) |
| I18N-001 | i18n | Info | Tout est en dur en français — pas de système d'internationalisation |

---

## 10. Résumé

**AutoReparis OS** est une application métier complète et bien structurée pour la gestion d'un garage automobile. Elle utilise une stack moderne (Expo 54 + React Native + Supabase + NativeWind) avec une architecture serverless.

**Forces :**
- Couverture fonctionnelle très complète (9 modules)
- Utilisation du temps réel (Supabase Realtime)
- RBAC solide avec RLS PostgreSQL
- Validation robuste (Zod)
- Architecture de navigation claire (file-based routing)

**Axes d'amélioration :**
- Renforcement significatif des tests
- Durcissement de la sécurité RLS sur certaines tables
- Extraction de composants réutilisables
- Ajout d'une couche service pour découpler la logique de Supabase
