# AutoReparis OS — Audit Complet & Roadmap de Finalisation

> Généré le 23 février 2026. Ce document contient TOUT ce qui a été fait et TOUT ce qui reste à faire pour publier l'app sur l'App Store iOS.

---

## ✅ Ce qui a été fait (Audit + Nettoyage)

### 1. Suppression du code mort
Les fichiers suivants ont été supprimés car jamais importés dans l'application :
- `components/ExternalLink.tsx`
- `components/StyledText.tsx`
- `components/Themed.tsx`
- `components/useClientOnlyValue.ts`
- `components/useClientOnlyValue.web.ts`
- `components/__tests__/StyledText-test.js`
- `components/__tests__/__snapshots__/StyledText-test.js.snap`
- `__tests__/components/StatusBadge.test.ts`

### 2. Fix du Memory Leak (lib/supabase.ts)
L'écouteur `AppState.addEventListener('change', ...)` n'était jamais nettoyé. Corrigé en capturant la souscription dans une variable et en exportant une fonction `cleanupSupabase()`.

### 3. Error Handling manquant (lib/services/interventionService.ts)
La fonction `getDashboardStats()` ne vérifiait pas les erreurs Supabase avant d'utiliser les données. Ajout de `if (xxx.error) throw xxx.error;` pour les 4 requêtes parallèles.

### 4. Query Invalidations manquantes (lib/hooks/)
- `useInterventions.ts` → `useAssignMechanic` n'invalidait pas `['dashboard-stats']`. Corrigé.
- `useProducts.ts` → `useCreateProduct` n'invalidait pas `['dashboard-stats']`. Corrigé.

### 5. TypeScript : remplacement de `any` par `unknown`
Dans les 5 fichiers utilisant `renderRightActions` pour le swipe-to-delete :
- `app/(tabs)/clients/index.tsx`
- `app/(tabs)/interventions.tsx`
- `app/(tabs)/leads/index.tsx`
- `app/(tabs)/stock.tsx`
- `app/profile.tsx`

### 6. Suppression de `getStatusStyle()` dans `components/StatusBadge.tsx`
Fonction exportée mais jamais utilisée nulle part.

### 7. Configuration EAS mise à jour (app.json)
- `owner` : changé de `"mimir"` vers `"mk75"`
- `projectId` : mis à jour vers `"f846f519-62ed-4987-b462-1649277411bc"` (projet EAS créé sous mk75)

### 8. Vérifications passées avec succès
- **TypeScript** : `npx tsc --noEmit` → **0 erreurs**
- **Tests** : `npm test` → **76 tests passés, 0 échec**
- **Push Git** : tout poussé sur `origin/main`

---

## ✅ Préparatifs terminés (23 février 2026)

### 9. Fix TypeScript `any` restant
- `app/profile.tsx` : `catch (e: any)` → `catch (e: unknown)` dans la suppression de compte.

### 10. Configuration `eas.json` submit
- `appleTeamId` : renseigné avec `BV2C6322V3`
- `ascAppId` : renseigné avec `6757646990`
- Suppression des placeholders inutiles

### 11. Correction screenshots iPad
- `supportsTablet: false` dans `app.json` → pas besoin de screenshots iPad.
- `DEPLOYMENT_CHECKLIST.md` corrigé en conséquence.

### 12. Métadonnées Store complètes
- `store.config.json` : description FR + EN, mots-clés, release notes, review details, advisory ratings — tout prêt.

### 13. Vérifications finales
- **TypeScript** : `npx tsc --noEmit` → **0 erreurs**
- **Tests** : `npx jest` → **83 tests passés, 0 échec**
- **Suppression de compte** : implémentée (`profile.tsx:282-311`, appelle `delete_own_account` RPC)
- **Pages légales** : `politique-de-confidentialite.html` + `conditions-utilisation.html` dans `docs/`
- **Privacy manifests iOS** : configurés dans `app.json` (UserDefaults, FileTimestamp, SystemBootTime, DiskSpace)

---

## ❌ Ce qui reste à faire (MANUEL — nécessite un Mac + identifiants Apple)

### Étape 1 : Pré-requis
- [ ] S'assurer que GitHub Pages est actif (Settings → Pages → Branch `main`, dossier `/docs`)
- [ ] Vérifier que les URLs légales fonctionnent :
  - https://taximontargiscpam-sys.github.io/autoreparis_app1/politique-de-confidentialite.html
  - https://taximontargiscpam-sys.github.io/autoreparis_app1/conditions-utilisation.html
- [ ] Créer le compte de démonstration dans Supabase Auth :
  - Email : `review@autoreparis.com` / Mot de passe : `AppleReview2026!`
  - Remplir quelques données de test (clients, interventions, produits)
- [ ] (Optionnel) Régénérer les clés Supabase si elles ont été exposées dans l'historique Git

### Étape 2 : Générer les certificats iOS (nécessite 2FA Apple)
```bash
eas credentials --platform ios
```
- Choisir : **production** → **Generate new** pour Distribution Certificate et Provisioning Profile
- Fournir l'Apple ID, mot de passe, et code 2FA

### Étape 3 : Lancer le build iOS production
```bash
eas build --platform ios --profile production
```

### Étape 4 : Soumettre le build à App Store Connect
```bash
eas submit --platform ios --latest
```
EAS demandera une des méthodes d'authentification :
- **App Store Connect API Key** (recommandé) — fichier `.p8`
- **Ou** Apple ID + mot de passe spécifique à l'application

### Étape 5 : Prendre les screenshots (iPhone 6.7" uniquement)
Sur simulateur iPhone 15 Pro Max, capturer au minimum 3 écrans parmi :
1. Tableau de bord (KPI)
2. Liste des interventions
3. Détail d'une intervention
4. Planning équipe
5. Stock / Scanner
6. Fiche client
7. Écran de connexion

### Étape 6 : Compléter App Store Connect
Sur https://appstoreconnect.apple.com → Apps → AutoReparis OS (ID: 6757646990) :

**Tout est pré-rempli dans `store.config.json` — copier-coller les valeurs :**
- Description (FR) → onglet "Prepare for Submission"
- Mots-clés : `garage, réparation, mécanique, atelier, gestion, automobile, planning, stock, devis, voiture, carrosserie`
- Catégories : Business + Productivity
- Privacy Policy URL : `https://taximontargiscpam-sys.github.io/autoreparis_app1/politique-de-confidentialite.html`
- Prix : Gratuit
- Disponibilité : France (minimum)
- Screenshots : uploader ceux de l'étape 5
- Build : sélectionner le build uploadé
- Demo Account : `review@autoreparis.com` / `AppleReview2026!`
- Notes for reviewers : voir `store.config.json` → `reviewDetails.notes`

**App Privacy** (questionnaire) :
- Contact Info (nom, email, téléphone) → Fonctionnalité de l'app
- Identifiers (Device ID) → Notifications push
- Usage Data / Diagnostics → Non collecté
- Tracking → NON

### Étape 7 : Soumettre pour review Apple
1. Dans App Store Connect → **"Submit for Review"**
2. Encryption : **Non** (déjà configuré `ITSAppUsesNonExemptEncryption: false`)
3. IDFA : **Non**
4. Content Rights : **Non**

---

## ⚠️ Points d'attention pour la review Apple

| Guideline | Risque | Statut |
|-----------|--------|--------|
| 3.2 (Business) | "App is for internal use only" | ✅ L'app a une page publique (suivi véhicule + recherche). |
| 5.1.1(v) | Suppression de compte | ✅ Implémenté dans `profile.tsx` (RPC `delete_own_account`). |
| 2.1 (Performance) | Localisation | ✅ Texte en français, métadonnées FR prêtes dans `store.config.json`. |
| 4.0 (Design) | Permissions | ✅ Descriptions caméra/photos/micro en français dans `app.json`. |
| 5.1.2 | Privacy manifests | ✅ Configurés dans `app.json` (4 API types déclarés). |
| 2.5.1 | API publique | ✅ Utilise uniquement les APIs Expo/React Native standards. |

---

## 📁 Structure du projet (référence rapide)

```
app/                     # Écrans (Expo Router)
├── (tabs)/              # 6 onglets principaux
├── (auth)/login.tsx     # Connexion
├── interventions/       # CRUD interventions
├── performance/         # Analytics
├── products/            # CRUD produits
├── profile.tsx          # Profil + équipe
├── scan.tsx             # Scanner code-barres
├── tracking.tsx         # Suivi public
└── public/search.tsx    # Recherche véhicule public

lib/
├── hooks/               # React Query hooks
├── services/            # Fonctions Supabase
├── supabase.ts          # Client principal
├── supabaseWebsite.ts   # Client leads site web
├── validations.ts       # Schémas Zod
└── database.types.ts    # Types TypeScript

components/
├── AuthContext.tsx       # Auth + rôles
├── useProtectedRoute.ts # Garde de route
├── KPICard.tsx          # Carte KPI dashboard
└── StatusBadge.tsx      # Badge statut intervention
```

---

## 🔑 Informations clés

| Clé | Valeur |
|-----|--------|
| Compte EAS | `mk75` |
| EXPO_TOKEN | `jfA8Sr5S2671xCuv9gHrg2PJcd4dwPEdq8UAtEis` |
| Project ID EAS | `f846f519-62ed-4987-b462-1649277411bc` |
| Bundle ID iOS | `com.autoreparis.os` |
| Apple Team ID | `BV2C6322V3` |
| Slug | `autoreparis-os` |
| Version | `1.0.0` |
