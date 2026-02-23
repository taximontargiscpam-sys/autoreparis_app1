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

## ❌ Ce qui reste à faire pour publier sur l'App Store

### Étape 1 : Générer les certificats iOS (MANUEL — nécessite 2FA Apple)
```bash
cd ~/autoreparis_app1/autoreparis_app1-2
export EXPO_TOKEN="jfA8Sr5S2671xCuv9gHrg2PJcd4dwPEdq8UAtEis"
eas credentials --platform ios
```
Répondre :
- Profile : **production**
- Distribution Certificate : **Generate new**
- Provisioning Profile : **Generate new**
- Fournir l'Apple ID, mot de passe, et code 2FA

### Étape 2 : Lancer le build iOS production
```bash
export EXPO_TOKEN="jfA8Sr5S2671xCuv9gHrg2PJcd4dwPEdq8UAtEis"
eas build --profile production --platform ios
```
Durée estimée : ~25 minutes sur les serveurs Expo.

### Étape 3 : Soumettre à App Store Connect
```bash
export EXPO_TOKEN="jfA8Sr5S2671xCuv9gHrg2PJcd4dwPEdq8UAtEis"
eas submit --platform ios
```
Il faudra fournir :
- L'**Apple ID** (email du compte développeur)
- Le **mot de passe spécifique à l'application** (générable sur https://appleid.apple.com/account/manage → Mots de passe d'app)
- Ou un **App Store Connect API Key** (méthode recommandée)

### Étape 4 : Compléter les métadonnées sur App Store Connect
Sur https://appstoreconnect.apple.com :
1. **Screenshots** : minimum 3 captures d'écran par taille d'appareil (iPhone 6.7", 6.1", iPad si applicable)
2. **Description** : description de l'application en français
3. **Catégorie** : Business / Productivity
4. **Privacy Policy URL** : lien vers `privacy-policy.html` hébergé
5. **Informations de contact** : nom, email, téléphone
6. **Version** : confirmer 1.0.0
7. **Compte de démonstration** : fournir un email/mot de passe de test pour les reviewers Apple

### Étape 5 : Soumettre pour review Apple
Sur App Store Connect → cliquer "Submit for Review". Délai estimé : 24-48h.

---

## ⚠️ Points d'attention pour la review Apple

| Guideline | Risque | Action |
|-----------|--------|--------|
| 3.2 (Business) | "App is for internal use only" | L'app possède déjà une page publique (suivi véhicule + recherche). S'assurer que la page d'accueil publique est bien visible au lancement. |
| 5.1.1(v) | Suppression de compte | Vérifier que la fonctionnalité de suppression de compte fonctionne dans `app/profile.tsx`. |
| 2.1 (Performance) | Localisation | Tout le texte est en français, s'assurer que les métadonnées App Store sont aussi en français. |
| 4.0 (Design) | Permissions | Les descriptions de permissions (caméra, photos, micro) sont en français dans `app.json` → OK. |

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
