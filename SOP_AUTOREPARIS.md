# SOP — AutoReparis OS
## Standard Operating Procedures v2.0 — Agents, Teams, Skills & Sub-Agents

**Produit :** AutoReparis OS
**Stack :** Expo 54 / React Native / TypeScript / Supabase / NativeWind / TanStack React Query
**Date :** Fevrier 2026

---

## 1. ARCHITECTURE DES AGENTS & TEAMS

### 1.1 Vue d'Ensemble de l'Orchestration

```
ORCHESTRATEUR PRINCIPAL (Lead Agent)
|
|-- TEAM ALPHA : Frontend & UX
|   |-- [Agent] Screen Builder
|   |-- [Agent] Component Crafter
|   |-- [Sub-Agent] Navigation Specialist
|   |-- [Sub-Agent] Theme & Style Enforcer
|
|-- TEAM BETA : Data & Backend
|   |-- [Agent] Supabase Architect
|   |-- [Agent] Hook Engineer
|   |-- [Sub-Agent] RLS Policy Guard
|   |-- [Sub-Agent] RPC Function Builder
|   |-- [Sub-Agent] Dual-DB Coordinator
|
|-- TEAM GAMMA : Features Metier
|   |-- [Agent] Intervention Pipeline Manager
|   |-- [Agent] Stock & Scanner Specialist
|   |-- [Agent] Client & Vehicle Manager
|   |-- [Sub-Agent] Lead Conversion Engine
|   |-- [Sub-Agent] Performance Analytics Builder
|
|-- TEAM DELTA : Infrastructure & Release
|   |-- [Agent] DevOps & Build Master
|   |-- [Agent] Security & Compliance Auditor
|   |-- [Sub-Agent] Notification Orchestrator
|   |-- [Sub-Agent] Test Runner
```

---

## 2. ORCHESTRATEUR PRINCIPAL (Lead Agent)

### 2.1 Identite
```
Nom       : Lead Agent AutoReparis
Role      : Chef d'orchestre, architecte technique, arbitre
Contexte  : Connait le PRD_AUTOREPARIS.md de A a Z
```

### 2.2 Skills
| # | Skill | Description | Fichiers de reference |
|---|-------|-------------|----------------------|
| S1 | **Architecture Expo Router** | Maitrise du file-based routing, layouts imbriques, groupes (auth)/(tabs), modals | `app/_layout.tsx`, `app/(tabs)/_layout.tsx` |
| S2 | **Arbitrage technique** | Choisir entre RPC vs query directe, Context vs Query, local state vs Supabase | PRD section 2, tous les hooks |
| S3 | **Revue de code** | Verifier les patterns (React Query hooks, Zod validation, NativeWind classes), la coherence des types | `lib/database.types.ts`, `lib/validations.ts` |
| S4 | **Planification sprint** | Decomposer les features du PRD en taches assignables aux teams | PRD sections 2, 6, 10 |
| S5 | **Gestion des dependances inter-teams** | Coordonner quand Team Beta doit livrer un hook avant que Team Alpha puisse construire un ecran | Tous les hooks dans `lib/hooks/` |

### 2.3 Responsabilites de decision
```
DECIDE :
- Architecture des nouveaux modules
- Choix de patterns (hook vs context vs state local)
- Priorisation des bugs vs features
- Go/No-Go pour chaque build production

DELEGUE :
- Implementation des ecrans → Team Alpha
- Schemas et hooks → Team Beta
- Features metier complexes → Team Gamma
- Build et deploy → Team Delta
```

---

## 3. TEAM ALPHA — Frontend & UX

### 3.1 Agent : Screen Builder

**Skills implementables :**

| # | Skill | Detail technique | Exemple concret |
|---|-------|-----------------|-----------------|
| A1 | **Creer un ecran CRUD complet** | SafeAreaView + ScrollView + RefreshControl + NativeWind + useCallback + navigation | Pattern exact dans `app/(tabs)/index.tsx` |
| A2 | **Gerer les etats d'ecran** | Loading skeleton, empty state, error state, data state | `isLoading ? <ActivityIndicator> : data.length === 0 ? <Empty> : <List>` |
| A3 | **Implementer la recherche filtree** | TextInput + debounce + filtrage local + useQuery avec search param | `app/(tabs)/interventions.tsx` : searchQuery + filteredInterventions |
| A4 | **Implementer le pull-to-refresh** | useState(refreshing) + useCallback(onRefresh) + RefreshControl | Pattern dans chaque ecran de liste |
| A5 | **Implementer le swipe-to-delete** | Swipeable de react-native-gesture-handler + Alert.confirm + mutation delete | `app/(tabs)/leads/index.tsx` |
| A6 | **Creer un formulaire complexe** | useState par champ + validation Zod + handleSave + Alert feedback | `app/interventions/new.tsx`, `app/(tabs)/clients/new_client.tsx` |
| A7 | **Gerer les photos camera/galerie** | expo-image-picker + Supabase Storage upload + affichage grille | `components/intervention/InterventionPhotos.tsx` |

**Fichiers sous responsabilite :**
```
app/(tabs)/index.tsx ............... Dashboard
app/(tabs)/interventions.tsx ....... Liste interventions
app/(tabs)/planning.tsx ............ Calendrier equipe
app/(tabs)/stock.tsx ............... Inventaire produits
app/(tabs)/clients/index.tsx ....... Liste clients
app/(tabs)/clients/[id].tsx ........ Detail client
app/(tabs)/clients/new_client.tsx .. Nouveau client
app/(tabs)/leads/index.tsx ......... Liste leads
app/(tabs)/leads/[id].tsx .......... Detail lead
app/interventions/new.tsx .......... Nouvelle intervention
app/interventions/[id].tsx ......... Detail intervention
app/products/new.tsx ............... Nouveau produit
app/products/[id].tsx .............. Detail produit
app/performance/index.tsx .......... Dashboard financier
app/profile.tsx .................... Profil utilisateur
```

**Pattern de code obligatoire pour chaque ecran :**
```typescript
// PATTERN ECRAN AUTOREPARIS — A respecter systematiquement
import { View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MonEcran() {
  const { data, isLoading, refetch } = useMonHook();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) return <ActivityIndicator className="flex-1 bg-slate-50" />;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1 px-4"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Contenu */}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
```

---

### 3.2 Agent : Component Crafter

**Skills implementables :**

| # | Skill | Detail technique |
|---|-------|-----------------|
| A8 | **Creer un composant intervention** | Composant encapsule avec props typees, gestion d'etats internes | `InterventionSummary.tsx`, `InterventionParts.tsx`, `InterventionPhotos.tsx` |
| A9 | **Construire un modal CRUD** | Modal + TextInput + Picker + boutons Annuler/Valider + mutation | Pattern dans `InterventionParts.tsx` (modal ajout ligne) |
| A10 | **Construire une carte KPI** | TouchableOpacity + icone Lucide + valeur numerique + label + couleur | Dashboard KPI cards |

**Fichiers sous responsabilite :**
```
components/intervention/InterventionSummary.tsx
components/intervention/InterventionParts.tsx
components/intervention/InterventionPhotos.tsx
components/AuthContext.tsx (lecture seule — pas de modification sans Team Beta)
components/Themed.tsx
components/ExternalLink.tsx
components/StyledText.tsx
```

---

### 3.3 Sub-Agent : Navigation Specialist

**Skills implementables :**

| # | Skill | Detail technique |
|---|-------|-----------------|
| A11 | **Configurer le file-based routing** | Groupes de routes `(auth)`, `(tabs)`, layouts `_layout.tsx`, routes dynamiques `[id].tsx` |
| A12 | **Configurer les tabs** | Tab icons (Lucide), 6 onglets, badges dynamiques, couleurs theme | `app/(tabs)/_layout.tsx` |
| A13 | **Implementer la protection de routes** | `useProtectedRoute()` : verifier session + role avant affichage | `components/useProtectedRoute.ts` |
| A14 | **Gerer les redirections par role** | `router.replace` selon le role RBAC (admin → dashboard, mecanicien → interventions) |

**Configuration exacte des tabs :**
```typescript
// 6 onglets — configuration dans app/(tabs)/_layout.tsx
Tab "Dashboard"     → icone: LayoutDashboard → ecran: (tabs)/index
Tab "Planning"      → icone: Calendar        → ecran: (tabs)/planning
Tab "Atelier"       → icone: Wrench          → ecran: (tabs)/interventions
Tab "Clients"       → icone: Users           → ecran: (tabs)/clients/
Tab "Stocks"        → icone: Package         → ecran: (tabs)/stock
Tab "Demandes"      → icone: Inbox           → ecran: (tabs)/leads/
```

---

### 3.4 Sub-Agent : Theme & Style Enforcer

**Skills implementables :**

| # | Skill | Detail technique |
|---|-------|-----------------|
| A15 | **Appliquer le design system** | Couleurs primary (#0090E7), secondary (#FC6A03), backgrounds slate-50/slate-950 |
| A16 | **Verifier la coherence NativeWind** | className Tailwind sur tous les composants, jamais de StyleSheet inline |
| A17 | **Assurer le responsive** | Tester iPhone SE, iPhone 15 Pro Max, iPad, Web |

**Palette exacte a respecter :**
```
Primary (bleu):    #0090E7 → boutons principaux, liens, icones actives
Secondary (orange): #FC6A03 → badges urgents, stock bas, alertes
Background light:  bg-slate-50
Background dark:   bg-slate-950
Text light:        text-slate-900
Text dark:         text-white
Cards:             bg-white dark:bg-slate-900
Borders:           border-slate-200 dark:border-slate-800
```

---

## 4. TEAM BETA — Data & Backend

### 4.1 Agent : Supabase Architect

**Skills implementables :**

| # | Skill | Detail technique | Fichiers |
|---|-------|-----------------|----------|
| B1 | **Modifier le schema SQL** | ALTER TABLE, CREATE TABLE, contraintes FK, indexes | `schema.sql` |
| B2 | **Gerer les 2 instances Supabase** | Instance principale (wjvqdvjtzwmusabbinnl) + Instance site web (pncgdoqbbsgstcgydtro) | `lib/supabase.ts`, `lib/supabaseWebsite.ts` |
| B3 | **Configurer le Realtime** | Publications, channels, subscription dans `_layout.tsx` pour les leads | `app/_layout.tsx` lignes Realtime |
| B4 | **Gerer le Storage** | Buckets pour photos vehicules, upload via Supabase Storage API | `InterventionPhotos.tsx` |
| B5 | **Mettre a jour les types TypeScript** | Synchroniser `database.types.ts` avec le schema reel | `lib/database.types.ts` |

**Tables gerees (12) :**
```
users                 → employes (FK auth.users, role RBAC)
clients               → clients du garage
vehicles              → vehicules (FK clients)
products              → pieces et consommables
interventions         → reparations (FK clients, vehicles, users)
intervention_lines    → lignes de facturation (FK interventions, products)
vehicle_photos        → photos (FK interventions)
team_availability     → planning (FK users)
leads_site_web        → leads du site web
stock_movements       → historique stock (FK products)
invoices              → factures (FK interventions)
activity_log          → journal (FK users)
```

---

### 4.2 Agent : Hook Engineer

**Skills implementables :**

| # | Skill | Detail technique |
|---|-------|-----------------|
| B6 | **Creer un hook useQuery** | queryKey unique, queryFn avec gestion erreur, staleTime adapte | Pattern dans chaque hook |
| B7 | **Creer un hook useMutation** | mutationFn + onSuccess (invalidateQueries) + onError | Pattern dans useCreateClient, useDeleteProduct, etc. |
| B8 | **Implementer la pagination** | PAGE_SIZE = 30, parametre `page`, range() Supabase | `useClients(search, page)`, `useProducts(category, page)` |
| B9 | **Implementer la recherche** | Parametre search, filtre ilike Supabase, staleTime court | `useClients(search)`, `useLeads(search)` |
| B10 | **Gerer le cache React Query** | queryClient config (staleTime: 2min, retry: 2), invalidation strategique | `lib/queryClient.ts` |

**Hooks existants et leurs fonctions exportees :**
```
lib/hooks/useClients.ts
  → useClients(search, page)
  → useClient(id)
  → useClientVehicles(clientId)
  → useCreateClient()
  → useDeleteClient()
  → useCreateVehicle()

lib/hooks/useProducts.ts
  → useProducts(category, page)
  → useProduct(id)
  → useProductByBarcode(code)
  → useUpdateStock()
  → useDeleteProduct()
  → useCreateProduct()

lib/hooks/useInterventions.ts
  → useInterventions(page)
  → useIntervention(id)
  → useUpdateInterventionStatus()
  → useDeleteIntervention()
  → useAssignMechanic()
  → useDashboardStats()

lib/hooks/useLeads.ts
  → useLeads(search)             [staleTime: 15s]
  → useLead(id)
  → useUpdateLeadStatus()
  → useDeleteLead()              [marque comme "perdu"]

lib/hooks/useTeam.ts
  → useTeamMembers()
  → useTeamAvailability(date)
  → useUserMonthlyAvailability(userId, startDate, endDate)
  → useSaveAvailability()
  → useCreateTeamMember()
  → useDeleteTeamMember()        [desactive, ne supprime pas]

lib/hooks/useVehicleSearch.ts
  → useVehicleSearch()           [recherche publique via RPC, rate limit 2s]
```

**Pattern de code obligatoire pour un nouveau hook :**
```typescript
// lib/hooks/useNouvelleEntite.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';

const PAGE_SIZE = 30;

export function useNouvelleEntite(page = 0) {
  return useQuery({
    queryKey: ['nouvelle_entite', page],
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from('nouvelle_entite')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateNouvelleEntite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: InsertType) => {
      const { data, error } = await supabase
        .from('nouvelle_entite')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nouvelle_entite'] });
    },
  });
}
```

---

### 4.3 Sub-Agent : RLS Policy Guard

**Skills implementables :**

| # | Skill | Detail technique |
|---|-------|-----------------|
| B11 | **Ecrire une politique RLS** | CREATE POLICY avec USING et WITH CHECK, 4 operations (SELECT/INSERT/UPDATE/DELETE) |
| B12 | **Utiliser les helper functions** | `get_user_role()`, `has_write_access()`, `is_admin()` — ne jamais dupliquer la logique |
| B13 | **Tester chaque role** | Verifier avec 4 tokens differents (admin, frontdesk, mecanicien, lecture) |

**Matrice RBAC exacte a respecter :**
```
Table              | SELECT         | INSERT        | UPDATE        | DELETE
-------------------|----------------|---------------|---------------|--------
users              | authenticated  | admin         | admin OR self | admin
clients            | authenticated  | has_write     | has_write     | admin
vehicles           | authenticated  | has_write     | has_write     | admin
products           | authenticated  | has_write     | has_write     | admin
interventions      | authenticated  | has_write     | has_write     | admin
intervention_lines | authenticated  | has_write     | has_write     | has_write
leads_site_web     | authenticated  | has_write     | has_write     | admin
stock_movements    | authenticated  | has_write     | —             | —
vehicle_photos     | authenticated  | has_write     | —             | has_write
team_availability  | authenticated  | has_write     | has_write     | —
invoices           | authenticated  | admin/front   | admin/front   | —
activity_log       | authenticated  | authenticated | —             | —
```

---

### 4.4 Sub-Agent : RPC Function Builder

**Skills implementables :**

| # | Skill | Detail technique |
|---|-------|-----------------|
| B14 | **Creer une RPC SECURITY DEFINER** | Fonction qui bypasse RLS pour operations atomiques ou publiques |
| B15 | **Creer une RPC transactionnelle** | BEGIN/COMMIT/ROLLBACK pour operations multi-tables |
| B16 | **Creer une RPC publique** | Fonctions accessibles par `anon` pour le tracking vehicule |

**RPC existantes :**
```
rpc_functions.sql :
  create_full_intervention(p_client_nom, p_client_prenom, ...) → uuid
    → Creation atomique : client + vehicule + intervention

  recalculate_intervention_totals(p_intervention_id) → void
    → Recalcul : total_achat, total_vente, marge_totale depuis intervention_lines

  get_dashboard_stats() → json
    → Retourne : interventions_count, stock_low_count, leads_count, weekly_revenue

  get_performance_stats(p_days integer DEFAULT 30) → json
    → Retourne : revenue, count, average_basket

rpc_secure_functions.sql :
  normalize_plate(plate TEXT) → TEXT
    → Helper : UPPER + supprime espaces/tirets

  get_vehicle_status_public(plate_text TEXT) → UUID
    → PUBLIQUE (anon) : recherche vehicule par plaque, retourne intervention_id

  get_intervention_details_public(intervention_id UUID) → JSON
    → PUBLIQUE (anon) : detail intervention avec vehicule + lignes + photos
```

---

### 4.5 Sub-Agent : Dual-DB Coordinator

**Skills implementables :**

| # | Skill | Detail technique |
|---|-------|-----------------|
| B17 | **Lire les leads depuis la DB site web** | `supabaseWebsite.from('devis_auto').select(*)` — LECTURE SEULE |
| B18 | **Configurer le Realtime cross-DB** | Channel `global_leads_notifications` sur la DB site web pour INSERT sur `devis_auto` |
| B19 | **Ne jamais ecrire dans la DB site web** | Regle absolue — les leads sont en lecture seule dans l'app |

**Regle critique :**
```
DB Principale (lib/supabase.ts)    → LECTURE + ECRITURE (toutes les tables operationnelles)
DB Site Web (lib/supabaseWebsite.ts) → LECTURE SEULE + REALTIME (table devis_auto uniquement)
```

---

## 5. TEAM GAMMA — Features Metier

### 5.1 Agent : Intervention Pipeline Manager

**Skills implementables :**

| # | Skill | Detail technique |
|---|-------|-----------------|
| G1 | **Gerer le cycle de vie** | planifiee → en_cours → en_attente_pieces → terminee → facturee |
| G2 | **Creer une intervention complete** | Via RPC `create_full_intervention()` : client + vehicule + intervention atomique |
| G3 | **Gerer les lignes d'intervention** | CRUD intervention_lines : type (piece/main_oeuvre/autre), prix achat/vente, quantite |
| G4 | **Calculer les marges** | Via RPC `recalculate_intervention_totals()` apres chaque ajout/modif de ligne |
| G5 | **Affecter un mecanicien** | Mutation `useAssignMechanic()` → update interventions.mecanicien_id |
| G6 | **Gerer les photos vehicule** | Camera + galerie (max 6), upload Storage, affichage grille avec suppression |

**Cycle de vie intervention :**
```
[planifiee] → clic "Demarrer" → [en_cours]
[en_cours]  → clic "En attente" → [en_attente_pieces]
[en_attente_pieces] → clic "Reprendre" → [en_cours]
[en_cours]  → clic "Terminer" → [terminee]
[terminee]  → clic "Facturer" → [facturee]
```

---

### 5.2 Agent : Stock & Scanner Specialist

**Skills implementables :**

| # | Skill | Detail technique |
|---|-------|-----------------|
| G7 | **Implementer le scanner code-barres** | expo-camera + handleBarCodeScanned + overlay target area | `app/scan.tsx` |
| G8 | **Lookup produit par code** | `useProductByBarcode(code)` → recherche dans la table products |
| G9 | **Incrementer stock rapide** | `useUpdateStock()` → update stock_actuel + insert stock_movements |
| G10 | **Creer produit depuis scan** | Si code inconnu → navigation vers `products/new` avec code pre-rempli |
| G11 | **Gerer les alertes stock bas** | Filtre produits ou stock_actuel < stock_min → badge dashboard |

**Formats de code-barres supportes :** `qr, ean13, upc_a, code128`

**Flux scanner :**
```
1. Camera ouverte avec overlay cible
2. Detection code-barre automatique
3. Lookup dans products.code_barres
4. SI TROUVE :
   → Affiche fiche produit dans modal bas
   → Bouton [+1] pour incrementer stock
   → Bouton [Voir Fiche] pour navigation detail
5. SI INCONNU :
   → Affiche code scanne
   → Bouton [Creer Produit] → navigation products/new?barcode=XXX
```

---

### 5.3 Agent : Client & Vehicle Manager

**Skills implementables :**

| # | Skill | Detail technique |
|---|-------|-----------------|
| G12 | **CRUD client complet** | Creer, lire, modifier, supprimer (admin only) avec validation Zod |
| G13 | **Lier vehicules a client** | vehicles.client_id FK, liste vehicules dans fiche client |
| G14 | **Historique interventions par client** | Filtre interventions par client_id, affichage chronologique |
| G15 | **Recherche client intelligente** | ilike sur nom, prenom, telephone, email |

**Schemas Zod a utiliser :**
```typescript
clientSchema   → nom (requis), prenom, telephone, email, adresse, ville, code_postal
vehicleSchema  → immatriculation (requis), marque, modele, kilometrage, annee, vin
```

---

### 5.4 Sub-Agent : Lead Conversion Engine

**Skills implementables :**

| # | Skill | Detail technique |
|---|-------|-----------------|
| G16 | **Afficher les leads temps reel** | Subscription Realtime sur devis_auto (DB site web) |
| G17 | **Gerer le pipeline leads** | nouveau → contacte → converti → perdu |
| G18 | **Convertir lead en intervention** | Creer intervention depuis les donnees du lead (nom, vehicule, message) |
| G19 | **Appel direct depuis l'app** | `Linking.openURL('tel:${telephone}')` |

---

### 5.5 Sub-Agent : Performance Analytics Builder

**Skills implementables :**

| # | Skill | Detail technique |
|---|-------|-----------------|
| G20 | **Construire le graphique CA hebdo** | Barres 7 jours via `get_performance_stats(7)` | `app/performance/index.tsx` |
| G21 | **Calculer le panier moyen** | revenue / count depuis les stats |
| G22 | **Filtrer les transactions par jour** | Clic sur barre → filtre par date exacte |

---

## 6. TEAM DELTA — Infrastructure & Release

### 6.1 Agent : DevOps & Build Master

**Skills implementables :**

| # | Skill | Detail technique |
|---|-------|-----------------|
| D1 | **Lancer un build EAS** | `eas build --platform ios --profile production` |
| D2 | **Configurer les secrets EAS** | `eas secret:create --name VAR --value "val"` pour les 4 env vars |
| D3 | **Soumettre a l'App Store** | `eas submit --platform ios --profile production` |
| D4 | **Executer un rollback** | `eas build:list` → `eas submit --id <ancien-build>` |
| D5 | **Bumper la version** | Modifier `version` et `buildNumber` dans `app.json` |
| D6 | **Gerer les seeds de test** | `node scripts/seed.js`, `node scripts/seed_team.js` |
| D7 | **Creer le compte admin** | `node scripts/create_admin_user.js` (admin@autoreparis.com / Garage2026!) |

**Variables d'environnement (4) :**
```
EXPO_PUBLIC_SUPABASE_URL           → URL instance principale
EXPO_PUBLIC_SUPABASE_ANON_KEY      → Cle anon instance principale
EXPO_PUBLIC_WEBSITE_SUPABASE_URL   → URL instance site web (leads)
EXPO_PUBLIC_WEBSITE_SUPABASE_ANON_KEY → Cle anon instance site web
```

**Scripts disponibles :**
```
scripts/create_admin_user.js .... Cree admin@autoreparis.com
scripts/seed.js ................. Donnees de test (clients, vehicules, interventions, leads, produits)
scripts/seed_team.js ............ 3 mecaniciens de test
scripts/check_users.js .......... Verifie les utilisateurs actifs
scripts/test_login.js ........... Teste le login admin
scripts/debug_db.js ............. Debug vehicules et interventions
scripts/test_access.js .......... Teste l'acces public
scripts/debug_website_db.js ..... Debug base site web
scripts/debug_website_rls.js .... Debug RLS base site web
scripts/inspect_website_schema.js Inspecte le schema site web
scripts/test_availability_write.js Teste l'ecriture planning
```

---

### 6.2 Agent : Security & Compliance Auditor

**Skills implementables :**

| # | Skill | Detail technique |
|---|-------|-----------------|
| D8 | **Auditer les politiques RLS** | Verifier chaque table : 4 operations x 4 roles |
| D9 | **Verifier les Privacy Manifests** | `app.json > ios > privacyManifests` : NSPrivacyAccessedAPITypes + reasons |
| D10 | **Verifier les permissions iOS** | Camera (NSCameraUsageDescription), Photos (NSPhotoLibraryUsageDescription), Notifications |
| D11 | **Auditer les dependances** | `npm audit` + verifier aucune CVE critique |
| D12 | **Verifier l'absence de secrets** | Aucune cle API en dur, .env dans .gitignore, pas de console.log en prod |
| D13 | **Valider conformite Apple** | Verifier les 23 criteres du `APPLE_FIX_REPORT.md` |

**Privacy Manifests declares dans app.json :**
```
NSPrivacyAccessedAPITypes :
  - UserDefaults      (reason: CA92.1)
  - FileTimestamp      (reason: C617.1)
  - SystemBootTime     (reason: 35F9.1)
  - DiskSpace          (reason: E174.1)
```

---

### 6.3 Sub-Agent : Notification Orchestrator

**Skills implementables :**

| # | Skill | Detail technique |
|---|-------|-----------------|
| D14 | **Enregistrer le push token** | `registerForPushNotificationsAsync()` → expo push token |
| D15 | **Envoyer une notification locale** | `sendLocalNotification(title, body, data)` |
| D16 | **Ecouter les leads en temps reel** | Channel Supabase Realtime sur `devis_auto` (DB site web) → notification push |
| D17 | **Configurer le canal Android** | MAX importance, vibration pattern [0,250,250,250] |

**Flux notification leads :**
```
1. Nouveau lead insere dans devis_auto (DB site web)
2. Channel Realtime 'global_leads_notifications' declenche
3. Callback dans app/_layout.tsx recoit l'INSERT
4. sendLocalNotification("Nouvelle Demande", projet) pour tous les employes
```

---

### 6.4 Sub-Agent : Test Runner

**Skills implementables :**

| # | Skill | Detail technique |
|---|-------|-----------------|
| D18 | **Executer les tests unitaires** | `npm test` — Jest + jest-expo |
| D19 | **Ecrire un test de hook** | Mock supabase + renderHook + act + waitFor |
| D20 | **Ecrire un test de validation** | Zod schemas : test les cas valides et invalides |
| D21 | **Verifier TypeScript** | `npx tsc --noEmit` — zero erreurs |

**Tests existants :**
```
__tests__/sanity.test.tsx ........... Smoke test (import React, render)
__tests__/errorHandler.test.ts ...... handleError(), logErrorSilent(), getRecentErrors()
__tests__/validations.test.ts ....... Tous les schemas Zod (client, vehicle, product, plate, etc.)
__tests__/useVehicleSearch.test.ts .. Hook recherche vehicule (mock supabase)
```

---

## 7. MATRICE RACI COMPLETE

| Tache | Lead | Screen Builder | Component Crafter | Supabase Arch. | Hook Eng. | RLS Guard | Intervention Mgr | Stock Spec. | DevOps | Security |
|-------|:----:|:--------------:|:-----------------:|:--------------:|:---------:|:---------:|:-----------------:|:-----------:|:------:|:--------:|
| Nouvel ecran liste | A | **R** | C | | C | | | | | |
| Nouvel ecran detail | A | **R** | C | | C | | | | | |
| Nouveau composant UI | A | C | **R** | | | | | | | |
| Nouveau hook data | A | | | C | **R** | | | | | |
| Modification schema | A | | | **R** | C | C | | | | |
| Nouvelle politique RLS | A | | | C | | **R** | | | | C |
| Nouvelle RPC | A | | | **R** | C | | | | | |
| Feature intervention | A | C | | | C | | **R** | | | |
| Feature scanner | A | C | | | C | | | **R** | | |
| Feature leads | A | C | | | C | | | | | |
| Build production | A | | | | | | | | **R** | C |
| Audit securite | I | | | C | | C | | | | **R** |
| Tests unitaires | A | | | | C | | | | **R** | |
| Fix bug UI | I | **R** | C | | | | | | | |
| Fix bug data | I | | | C | **R** | | | | | |

---

## 8. WORKFLOW D'ORCHESTRATION

### 8.1 Ajout d'une Nouvelle Feature

```
ETAPE 1 — LEAD AGENT analyse le PRD
  → Identifie les tables impactees
  → Identifie les hooks necessaires
  → Identifie les ecrans a creer/modifier
  → Assigne aux teams

ETAPE 2 — TEAM BETA execute en premier
  → Sub-Agent RPC : cree la fonction RPC si besoin
  → Agent Supabase : modifie le schema si besoin
  → Sub-Agent RLS : cree les politiques
  → Agent Hook : cree le hook React Query

ETAPE 3 — TEAM ALPHA execute ensuite
  → Agent Screen Builder : cree l'ecran avec le hook
  → Agent Component Crafter : cree les composants necessaires
  → Sub-Agent Navigation : ajoute la route et le lien dans les tabs/menus
  → Sub-Agent Theme : verifie la coherence visuelle

ETAPE 4 — TEAM GAMMA si feature metier
  → L'agent specialise implemente la logique metier

ETAPE 5 — TEAM DELTA valide
  → Sub-Agent Test : ecrit et execute les tests
  → Agent Security : audit securite rapide
  → Agent DevOps : build preview pour validation

ETAPE 6 — LEAD AGENT valide et merge
```

### 8.2 Correction d'un Bug

```
ETAPE 1 — LEAD AGENT identifie le type de bug
  Bug UI     → Team Alpha (Screen Builder ou Component Crafter)
  Bug data   → Team Beta (Hook Engineer ou Supabase Architect)
  Bug metier → Team Gamma (agent concerne)
  Bug build  → Team Delta (DevOps)

ETAPE 2 — L'agent assigne corrige
  → Cree branche fix/XXX
  → Corrige le code
  → Ajoute un test si pertinent

ETAPE 3 — LEAD AGENT review et merge
```

---

## 9. CONVENTIONS DE CODE

### 9.1 Validations Zod (lib/validations.ts)

```
Schemas existants :
  clientSchema        → nom (min 1), prenom, telephone, email, adresse, ville, code_postal
  vehicleSchema       → immatriculation (min 1), marque, modele, kilometrage, annee, vin
  interventionSchema  → type_intervention (min 1), date_heure_debut_prevue, commentaire, total_vente
  productSchema       → nom (min 1), categorie (enum), code_barres, ref_fournisseur, prix_*, stock_*
  interventionLineSchema → type_ligne (piece|main_oeuvre|autre), description (min 1), quantite (>0), prix_*
  plateSchema         → min 1, max 20, normalise (uppercase, supprime espaces/tirets)
  teamMemberSchema    → nom (min 1), prenom, role (admin|frontdesk|mecanicien|lecture)
  passwordSchema      → min 6, confirmPassword must match

Helper : getValidationError(result) → retourne le premier message d'erreur
```

### 9.2 Gestion d'Erreurs (lib/errorHandler.ts)

```
handleError(error, userMessage?)     → Alert.alert avec message user-friendly
logErrorSilent(error, context?)      → Log en memoire (max 50 entrees)
getRecentErrors()                    → Retourne le journal d'erreurs
```

### 9.3 Nommage

```
Ecrans :              kebab-case ou [id].tsx (Expo Router impose)
Composants :          PascalCase.tsx
Hooks :               useCamelCase.ts
Libs :                camelCase.ts
Types/Interfaces :    PascalCase
Variables :           camelCase
Constants env :       UPPER_SNAKE_CASE
Tables SQL :          snake_case (pluriel)
Colonnes SQL :        snake_case
Fonctions RPC :       snake_case
QueryKeys :           ['snake_case', ...params]
```

---

## 10. CHECKLIST DE LANCEMENT PRODUCTION

```
CODE :
[ ] npx tsc --noEmit → 0 erreurs
[ ] npm test → tous les tests passent
[ ] Aucun console.log (sauf __DEV__)
[ ] Aucune cle API en dur dans le code

DONNEES :
[ ] Schema SQL applique en production
[ ] Politiques RLS deployees et testees (4 roles)
[ ] Fonctions RPC deployees et testees
[ ] Compte admin cree (admin@autoreparis.com)
[ ] Donnees demo pour Apple Review

APP STORE :
[ ] Version + buildNumber bumpes dans app.json
[ ] Privacy Manifests a jour
[ ] Permissions iOS justifiees
[ ] Screenshots 3 tailles
[ ] Description en francais
[ ] Liens confidentialite + CGU fonctionnels (autoreparis-legal.vercel.app)
[ ] Compte demo dans les notes Apple Review

BUILD :
[ ] Secrets EAS configures (4 variables)
[ ] eas build --platform ios --profile production → succes
[ ] Test sur TestFlight → fonctionnel
[ ] eas submit → soumission effectuee
```

---

## 11. CONTACTS & COMPTES

| Service | Identifiant | Usage |
|---------|-------------|-------|
| Apple Developer | owner: mimir | App Store iOS |
| Expo (EAS) | owner: mimir | Builds & submissions |
| Supabase Principal | wjvqdvjtzwmusabbinnl | Donnees operationnelles |
| Supabase Site Web | pncgdoqbbsgstcgydtro | Leads site web (lecture seule) |
| Vercel | autoreparis-legal | Pages legales |
| Admin App | admin@autoreparis.com / Garage2026! | Compte admin principal |
| Team Test | thomas/sarah/marc.garage.test@gmail.com / Garage2024! | Comptes mecaniciens test |

---

*Document genere le 27 fevrier 2026 — AutoReparis OS v2.0*
