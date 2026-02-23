# AutoReparis OS — Contexte Projet

> Ce fichier est destiné aux agents IA (Claude/Sonnet) qui ouvrent ce projet pour la premiere fois.
> Il contient tout le contexte accumule lors des sessions precedentes.

---

## 1. Presentation du projet

**AutoReparis OS** est une application mobile de gestion de garage automobile.

| Cle | Valeur |
|-----|--------|
| Stack | TypeScript, React Native 0.81.5, Expo SDK 54, NativeWind, Supabase, React Query, Zod |
| Bundle ID | `com.autoreparis.os` |
| Owner EAS | `mk75` |
| EAS Project ID | `f846f519-62ed-4987-b462-1649277411bc` |
| Apple Team ID | `BV2C6322V3` |
| ASC App ID | `6757646990` |
| Localisation | Francais uniquement (pas d'i18n) |
| 2 projets Supabase | 1 pour l'app principale, 1 pour les leads du site web |

### Architecture
- **Frontend** : Expo Router (file-based routing), NativeWind pour le style
- **Backend** : Supabase (Auth, Database PostgreSQL, Realtime, Storage)
- **State** : React Query pour le cache/fetching, Zod pour la validation
- **RBAC** : 4 roles (`admin`, `frontdesk`, `mecanicien`, `lecture`)
- **12 tables** : garages, team_members, clients, vehicles, interventions, products, intervention_products, planning_events, leads, invoices, notifications, app_config

---

## 2. Etat actuel du code (23 fevrier 2026)

| Metrique | Valeur |
|----------|--------|
| TypeScript | 0 erreurs (`npx tsc --noEmit`) |
| Tests | 83/83 passent (`npx jest`) |
| Branche de travail | `claude/app-store-publication-MqW9f` |
| Dernier commit | `dfb3f55` — "docs: add PRD, SOP, PRICING and update CLAUDE.md for Antigravity" |
| Working tree | Propre |

---

## 3. Ce qui a ete fait (sessions precedentes)

### Audit et corrections
- Audit complet du projet (code, securite, conformite Apple)
- Fix de **23 issues Apple** : privacy descriptions iOS (camera, photos, micro), protection des routes auth, pages legales, suppression debug/console.log, suppression donnees de test hardcodees
- Fix TypeScript : tous les `any` remplaces, `catch (e: unknown)` partout
- Fix de 4 bugs (silent failures, product creation, schema mismatches, scanner errors)

### Configuration App Store
- `eas.json` configure avec Apple Team ID + ASC App ID + autoIncrement
- `store.config.json` avec toutes les metadonnees App Store (description FR, mots-cles, categories, privacy, age rating)
- Pages legales HTML dans `/docs` (politique de confidentialite + conditions d'utilisation)
- Workflow GitHub Pages configure (`.github/workflows/pages.yml`)

### Scripts et securite
- `scripts/deploy_all_sql.sql` — script SQL combine tout-en-un pour setup production Supabase (RLS, RPC functions, delete_own_account)
- `scripts/deploy_appstore.sh` — script de deploiement corrige (branche a jour)
- Nettoyage des secrets exposes dans la documentation (EXPO_TOKEN retire d'AUDIT_REPORT.md)
- `scripts/harden_rls.sql` — durcissement RLS (FORCE ROW LEVEL SECURITY sur 12 tables)

### Fonction suppression de compte (requise par Apple)
- `scripts/delete_account.sql` contient la fonction `delete_own_account()`
- Implementee dans `app/profile.tsx` (bouton "Supprimer mon compte")

---

## 4. Ce qui RESTE a faire (etapes manuelles)

> **Aucune de ces etapes ne peut etre faite par un agent dans un environnement sandbox.**
> Elles necessitent un Mac, des identifiants Apple, et un acces Supabase.

### Etape 1 : GitHub Pages (2 min)
- Repo Settings → Pages → Branch `main`, dossier `/docs` → Save
- Verifier que ces URLs repondent en HTTP 200 :
  - `https://taximontargiscpam-sys.github.io/autoreparis_app1/politique-de-confidentialite.html`
  - `https://taximontargiscpam-sys.github.io/autoreparis_app1/conditions-utilisation.html`

### Etape 2 : SQL Supabase (5 min)
- Copier-coller `scripts/deploy_all_sql.sql` dans le SQL Editor Supabase et executer
- Cela deploie : RLS policies, RPC functions, fonction delete_own_account()

### Etape 3 : Compte demo Apple Review (2 min)
- Creer dans Supabase Auth : `review@autoreparis.com` / `AppleReview2026!`
- Role : `admin`, actif : `true`
- Seeder des donnees de test via `scripts/seed.js`

### Etape 4 : Build iOS (25 min)
```bash
eas login
eas build --platform ios --profile production
# Attendre ~20 min...
```

### Etape 5 : Submit (5 min)
```bash
eas submit --platform ios --latest
eas metadata:push  # pousse store.config.json
```

### Etape 6 : Screenshots (10 min)
- Simulateur iPhone 15 Pro Max (6.7") : 3-7 captures d'ecran
- Pas besoin de screenshots iPad (`supportsTablet: false`)

### Etape 7 : App Store Connect (5 min)
- Upload screenshots
- Verifier les infos (tout est dans `store.config.json`)
- Cliquer "Submit for Review"

---

## 5. Problemes connus

| Probleme | Severite | Detail |
|----------|----------|--------|
| `.env` manquant | Bloquant pour dev local | Utiliser `.env.example` comme template avec les vraies cles Supabase |
| EXPO_TOKEN expire | Bloquant pour EAS CLI | Regenerer sur expo.dev et configurer en variable d'environnement |
| Pages legales 403 | Bloquant pour Apple Review | GitHub Pages pas encore active (voir Etape 1) |
| Table `products` RLS | Securite | Trop permissive en dev — corrige par `harden_rls.sql` (a deployer, Etape 2) |

---

## 6. Fichiers cles

| Fichier | Description |
|---------|-------------|
| `app.json` | Configuration Expo (bundle ID, plugins, permissions iOS) |
| `eas.json` | Configuration EAS Build + Submit (Team ID, App ID, profiles) |
| `store.config.json` | Metadonnees App Store (description, mots-cles, categories) |
| `constants/garage.ts` | Configuration du garage (URLs legales, infos entreprise) |
| `docs/PRD.md` | **Product Requirements Document** — vision, personas, modules, criteres de succes |
| `docs/SOP.md` | **Standard Operating Procedure** — guide A-to-Z App Store + structure equipe agents |
| `docs/PRICING.md` | **Analyse tarifaire** — marche 2026, recommandations, ROI garage |
| `docs/DEPLOYMENT_CHECKLIST.md` | Guide etape par etape pour la publication |
| `docs/AUDIT_REPORT.md` | Rapport d'audit complet avec roadmap |
| `docs/PROD_READINESS_REPORT.md` | Rapport de production readiness (bugs, securite) |
| `scripts/deploy_all_sql.sql` | Script SQL tout-en-un pour setup production Supabase |
| `scripts/deploy_appstore.sh` | Script de deploiement App Store |
| `.env.example` | Template des variables d'environnement requises |

---

## 7. Commandes utiles

```bash
# Verifier le code
npx tsc --noEmit          # TypeScript : doit retourner 0 erreurs
npx jest                  # Tests : doit retourner 83/83

# Developement
npx expo start            # Lancer le serveur de dev

# Build & Submit (necessite eas login)
eas build --platform ios --profile production
eas submit --platform ios --latest
eas metadata:push
```

---

## 8. Historique des sessions

### Session 1 (19 janv 2026) — Corrections initiales
- Fix 8 issues : TypeScript errors, npm vulnerabilities, .env exposure, typos

### Session 2 (20 janv 2026) — Conformite Apple
- Fix 23 issues Apple : privacy descriptions, auth protection, legal pages, debug cleanup

### Session 3 (8 janv 2026) — Production readiness
- Audit de production : 4 bugs fixes, 1 issue securite ouverte (products RLS)

### Session 4 (23 fev 2026) — Publication App Store
- Audit final complet, configuration EAS, store.config.json, script SQL combine
- Nettoyage secrets, fix deploy script, verification complete (0 erreurs TS, 83 tests)
- Tout pousse sur `claude/app-store-publication-MqW9f`
- **Resultat** : code pret, il reste les 7 etapes manuelles ci-dessus

### Session 5 (23 fev 2026) — Documentation & Guide complet Antigravity
- Creation de `docs/PRD.md` (Product Requirements Document)
- Creation de `docs/SOP.md` (Standard Operating Procedure A-to-Z App Store + structure equipe agents)
- Creation de `docs/PRICING.md` (analyse tarifaire marche 2026, recommandations -35%)
- Mise a jour CLAUDE.md avec contexte complet sessions precedentes
- Contexte recupere de la session Antigravity precedente (Sonnet 4.6) :
  - Verification sante code : 0 TS errors, 83/83 tests passerent
  - Fix eas.json : placeholders remplaces par vraies valeurs (BV2C6322V3, 6757646990)
  - Fix profile.tsx : `catch (e: any)` -> `catch (e: unknown)` (dernier any restant)
  - Fix DEPLOYMENT_CHECKLIST.md : iPad screenshots non requis (supportsTablet: false)
  - Creation deploy_all_sql.sql : script SQL combine tout-en-un pour Supabase
  - Nettoyage EXPO_TOKEN dans AUDIT_REPORT.md (secret expose supprime)
  - Correction branche hardcodee dans deploy_appstore.sh
  - 3 commits pousses sur `claude/app-store-publication-MqW9f`
  - EAS login impossible (EXPO_TOKEN expire) -> build doit se faire en local sur Mac
  - Pages legales retournent 403 -> GitHub Pages pas encore active (voir Etape 1)
- **Resultat** : documentation complete, pret pour livraison finale

### Environnement verifie
- Node.js v22.22.0, npm 10.9.4
- EAS CLI v18.0.3 (via npx)
- Expo SDK 54.0.23, React Native 0.81.5, React 19.1.0
- Supabase JS 2.89.0, TypeScript 5.9.2
