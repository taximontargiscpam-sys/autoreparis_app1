# SOP — Publication App Store iOS & Mise en Production
## Standard Operating Procedure — AutoReparis OS

> Version 1.0 — 23 février 2026
> Ce document est le guide définitif A-to-Z pour publier AutoReparis OS sur l'App Store iOS.
> Il est destiné à l'agent IA (Sonnet 4.6 via Antigravity) et au développeur humain.

---

## PARTIE 1 — Structure d'Équipe Agents Antigravity

Quand tu ouvres ce projet sur Antigravity, voici comment organiser les agents Claude :

### Agent 1 — Code Health Agent
**Rôle** : Gardien de la qualité du code. À appeler en premier avant toute autre action.

```
Prompt recommandé :
"Vérifie la santé du code AutoReparis OS :
1. Lance npx tsc --noEmit → doit retourner 0 erreurs
2. Lance npx jest → doit retourner 83/83 passed
3. Lance git status → doit retourner 'nothing to commit'
4. Rapporte tout écart par rapport à ces valeurs cibles."
```

**Quand l'utiliser** :
- En début de toute session
- Avant tout build EAS
- Après toute modification de code

---

### Agent 2 — Database Agent
**Rôle** : Gestion Supabase, SQL, migrations, RLS.

```
Prompt recommandé :
"Prépare la base de données Supabase pour la production :
1. Lis scripts/deploy_all_sql.sql pour comprendre ce qui doit être déployé
2. Vérifie si les tables existent déjà (fournis une requête de vérification)
3. Donne les instructions exactes pour exécuter le script dans Supabase SQL Editor"
```

**Accès requis** : `service_role` key Supabase (ne jamais commiter dans git)

**Script principal** : `scripts/deploy_all_sql.sql`

---

### Agent 3 — Xcode Build Agent
**Rôle** : Build, Archive et Upload via Xcode natif. Nécessite un Mac.

```
Prompt recommandé :
"Prépare le build iOS Xcode pour AutoReparis OS :
1. Lance expo prebuild pour générer le projet natif iOS
2. Guide le Signing & Capabilities dans Xcode (Team BV2C6322V3)
3. Explique comment faire Product → Archive puis Distribute App → Upload
4. Surveille les erreurs et propose des corrections si le build échoue"
```

**Accès requis** : Mac avec Xcode 16+, compte Apple Developer (Team ID: BV2C6322V3)

**Processus** :
```bash
npx expo prebuild --platform ios --clean
open ios/AutoReparisOs.xcworkspace
# Puis dans Xcode : Product → Archive → Distribute App → App Store Connect → Upload
```

---

### Agent 4 — QA & Screenshots Agent
**Rôle** : Tests et captures d'écran pour l'App Store.

```
Prompt recommandé :
"Prépare les screenshots App Store pour AutoReparis OS :
1. Indique comment lancer l'app sur simulateur iPhone 15 Pro Max (6.7")
2. Liste les 5-7 écrans les plus représentatifs à capturer
3. Donne les instructions de résolution et format requis par Apple"
```

**Outil** : Simulateur Xcode → iPhone 15 Pro Max → Résolution 1290×2796

---

## PARTIE 2 — Guide A-to-Z Publication App Store

### Vue d'ensemble du processus

```
PHASE 0 : Pré-requis (vérification unique)
    ↓
PHASE 1 : Infrastructure (GitHub Pages + Supabase + compte démo)
    ↓
PHASE 2 : Santé du code (TS + tests)
    ↓
PHASE 3 : Build iOS via Xcode (~15 min)
    ↓
PHASE 4 : App Store Connect (upload + screenshots + vérification)
    ↓
PHASE 5 : Screenshots (simulateur Xcode)
    ↓
PHASE 6 : Submit for Review → Attente Apple (1-3 jours)
    ↓
PHASE 7 : App live sur l'App Store 🎉
```

---

### PHASE 0 — Pré-requis (à cocher une fois)

**Matériel et comptes nécessaires :**

- [ ] Mac avec macOS 14+ (Sonoma ou supérieur)
- [ ] Xcode 16+ installé (depuis le Mac App Store)
- [ ] Apple Developer account actif
  - Team ID : `BV2C6322V3`
  - Abonnement annuel à jour ($99/an)
  - Apple ID connecté dans Xcode → Settings → Accounts
- [ ] Accès au projet Supabase
  - Dashboard : https://supabase.com/dashboard/project/wjvqdvjtzwmusabbinnl
  - Récupérer la `service_role` key (Settings → API)
- [ ] Fichier `.env` configuré (copier `.env.example` et remplir les vraies clés)

**Vérification pré-requis :**
```bash
node --version          # Doit afficher v20+ ou v22+
xcode-select --version  # Doit fonctionner (affiche "xcode-select version X")
```

---

### PHASE 1 — Infrastructure (30 min)

#### Étape 1.1 — Activer GitHub Pages (2 min)

1. Aller sur https://github.com/taximontargiscpam-sys/autoreparis_app1
2. Settings → Pages (menu gauche)
3. Source : `Deploy from a branch`
4. Branch : `main` | Folder : `/docs`
5. Cliquer **Save**
6. Attendre 2-3 min, puis vérifier :
   - `https://taximontargiscpam-sys.github.io/autoreparis_app1/politique-de-confidentialite.html` → doit retourner 200 OK
   - `https://taximontargiscpam-sys.github.io/autoreparis_app1/conditions-utilisation.html` → doit retourner 200 OK

> **Pourquoi ?** Apple exige des URLs valides pour la politique de confidentialité et les CGU lors de la soumission.

---

#### Étape 1.2 — Déployer SQL Supabase (5 min)

1. Aller sur https://supabase.com/dashboard/project/wjvqdvjtzwmusabbinnl/sql/new
2. Cliquer **New query**
3. Copier-coller le contenu de `scripts/deploy_all_sql.sql`
4. Cliquer **Run** (ou Cmd+Enter)
5. Vérifier : `"Success. No rows returned"` en bas

Ce script déploie :
- Row Level Security sur les 12 tables
- FORCE ROW LEVEL SECURITY (bloque même service_role)
- RPC functions (dashboard, interventions, performance)
- Fonction `delete_own_account()` (requis Apple)

---

#### Étape 1.3 — Créer le compte démo Apple Review (3 min)

**Option A — Via Supabase Dashboard :**
1. Authentication → Users → **Add user**
2. Email : `review@autoreparis.com`
3. Password : `AppleReview2026!`
4. Cliquer **Create user**
5. Copier l'UUID du nouvel utilisateur
6. SQL Editor → Exécuter :
```sql
INSERT INTO team_members (user_id, role, actif, nom, prenom)
VALUES ('<UUID_ICI>', 'admin', true, 'Review', 'Apple');
```

**Option B — Via script :**
```bash
export SUPABASE_SERVICE_ROLE_KEY="<ta_service_role_key>"
node scripts/setup_supabase.js
```

**Seeder les données de test :**
```bash
export SUPABASE_SERVICE_ROLE_KEY="<ta_service_role_key>"
node scripts/seed.js
```

---

### PHASE 2 — Santé du Code (5 min)

```bash
# Dans le dossier du projet
npx tsc --noEmit
# → Doit afficher RIEN (0 erreurs)

npx jest
# → Doit afficher : Tests: 83 passed, 83 total

git status
# → Doit afficher : nothing to commit, working tree clean
```

Si des erreurs apparaissent : ne pas continuer, corriger d'abord.

---

### PHASE 3 — Build iOS via Xcode (15-20 min)

#### Étape 3.1 — Vérifier les dépendances
```bash
npm install
npx expo install --check
```

#### Étape 3.2 — Générer le projet natif iOS
```bash
npx expo prebuild --platform ios --clean
```
Cette commande génère le dossier `ios/` avec le projet Xcode natif.

> **Note** : Le dossier `ios/` n'est pas commité dans git (`.gitignore`). Il faut relancer
> cette commande à chaque fois depuis un working tree propre.

#### Étape 3.3 — Ouvrir dans Xcode
```bash
open ios/AutoReparisOs.xcworkspace
```
⚠️ Toujours ouvrir `.xcworkspace` (pas `.xcodeproj`).

#### Étape 3.4 — Configurer le Signing (première fois ou si expiré)
1. Dans le panneau gauche : cliquer sur **AutoReparisOs** (icône bleue)
2. Sélectionner **Targets → AutoReparisOs**
3. Onglet **Signing & Capabilities**
4. Cocher **Automatically manage signing**
5. **Team** : sélectionner ton compte Apple (Team ID `BV2C6322V3`)
6. **Bundle Identifier** : vérifier `com.autoreparis.os`
7. Xcode télécharge automatiquement le Distribution Certificate et Provisioning Profile

#### Étape 3.5 — Archiver l'app
1. En haut à gauche : sélectionner le scheme **AutoReparisOs**
2. Sélectionner le device : **Any iOS Device (arm64)** ← important, pas un simulateur
3. Menu **Product → Archive**
4. Attendre ~5-10 min (barre de progression en bas)

#### Étape 3.6 — Uploader vers App Store Connect
1. L'**Organizer Xcode** s'ouvre automatiquement (ou Window → Organizer)
2. Sélectionner l'archive → cliquer **Distribute App**
3. Choisir **App Store Connect** → **Upload**
4. Suivre l'assistant (options par défaut OK)
5. Cliquer **Upload** → attendre ~5 min
6. Attendre l'email Apple : _"Your submission was received"_

**En cas d'erreur :**
- `"No signing certificate"` → Xcode → Settings → Accounts → ajouter ton Apple ID
- `"Provisioning profile not found"` → Signing & Capabilities → cliquer "Manage Certificates"
- `"Bundle ID mismatch"` → Vérifier `app.json` : `bundleIdentifier: "com.autoreparis.os"`
- `"prebuild failed"` → `npm install` puis réessayer
- `"Archive disabled"` (grisé) → Vérifier que device sélectionné est "Any iOS Device", pas simulateur
- Build fail TypeScript → Re-exécuter PHASE 2

---

### PHASE 4 — App Store Connect (15 min)

Après l'upload depuis Xcode, le build est en traitement chez Apple (~10-15 min).

#### Étape 4.1 — Accéder à ton app dans ASC
1. Aller sur https://appstoreconnect.apple.com
2. **My Apps** → **AutoReparis OS** (ASC App ID: `6757646990`)
3. Onglet **iOS App** → sélectionner le build uploadé (il apparaît après traitement)

#### Étape 4.2 — Remplir les métadonnées (copier depuis `store.config.json`)

| Champ ASC | Valeur (source : `store.config.json`) |
|-----------|--------------------------------------|
| Nom | AutoReparis OS |
| Sous-titre | Gestion de garage automobile |
| Description | Voir `localizations.fr-FR.description` |
| Mots-clés | Voir `localizations.fr-FR.keywords` |
| Catégorie primaire | Business |
| Catégorie secondaire | Productivity |
| Âge minimum | 4+ |
| Prix | Gratuit |
| URL Politique de confidentialité | `https://taximontargiscpam-sys.github.io/autoreparis_app1/politique-de-confidentialite.html` |

#### Étape 4.3 — Review Information
- First Name : Bilel | Last Name : Younes
- Phone : +33600000000
- Email : amirpro@hotmail.fr
- Demo Account : `review@autoreparis.com` / `AppleReview2026!`
- Notes : "B2B app for Auto Reparis garage in Drancy, France. Login required — use demo credentials above."

---

### PHASE 5 — Screenshots (15 min)

**Device requis** : iPhone 15 Pro Max (6.7") — Résolution 1290×2796 px

**Étape 5.1 — Ouvrir le simulateur**
1. Dans Xcode : menu **Window → Devices and Simulators**
2. Ou via Terminal : `open -a Simulator`
3. Dans le Simulateur : **File → Open Simulator → iOS 18 → iPhone 15 Pro Max**

**Étape 5.2 — Lancer l'app sur le simulateur**
```bash
npx expo start --ios
```

**Étape 5.3 — Capturer les écrans (minimum 3, idéal 7)**

Écrans recommandés dans l'ordre :
1. **Dashboard** — Vue KPIs avec données seeder (CA, interventions)
2. **Liste interventions** — Quelques interventions avec statuts colorés
3. **Fiche intervention** — Détail d'une intervention avec produits
4. **Calendrier / Planning** — Vue semaine avec RDV
5. **Fiche client + véhicule** — Historique
6. **Stock** — Liste produits avec quantités
7. **Portail suivi client** — Vue publique de suivi

**Capturer :** Dans le Simulateur → menu **File → Take Screenshot** (ou `Cmd+S`)
Les screenshots sont sauvegardés sur le Bureau.

**Format requis Apple :**
- Format : PNG
- Résolution : 1290×2796 px (iPhone 6.7")
- Maximum 10 screenshots par device
- Pas besoin de screenshots iPad (`supportsTablet: false`)

**Upload dans ASC :**
- iOS App → 6.7" Display → Glisser-déposer les 3-7 captures

---

### PHASE 6 — Submit for Review

1. App Store Connect → AutoReparis OS → **Submit for Review**
2. Répondre aux questions Apple (chiffrement : Non, publicités : Non)
3. Confirmer → **Submit**

**Délais attendus :**
- Délai moyen Apple : 24-48h (weekdays)
- Week-end : 2-3 jours
- En cas de rejet : email avec motif → corriger → resoumettre

**Suivi :**
- Email de confirmation immédiat
- Statuts : In Review → Ready for Sale (si approuvé) ou Rejected (si rejeté)

---

### PHASE 7 — Post-Publication

**Vérification immédiate (J+0) :**
- [ ] App visible sur App Store FR (chercher "AutoReparis OS")
- [ ] Login avec review@autoreparis.com fonctionne
- [ ] Navigation principale OK
- [ ] Pas de crash au démarrage

**Monitoring continu :**
```
Supabase Dashboard → Logs → API errors
App Store Connect → Analytics → Téléchargements, sessions
App Store Connect → Crashes → Crash Organizer
```

**Mises à jour futures :**
```bash
# Après correction de bugs ou nouvelles fonctionnalités :
npx expo prebuild --platform ios --clean
# Puis dans Xcode : incrémenter le Build Number → Product → Archive → Distribute → Upload
# Aller sur App Store Connect → sélectionner nouveau build → Submit for Review
```

---

## PARTIE 3 — Résolution de Problèmes Fréquents

| Problème | Cause probable | Solution |
|----------|---------------|----------|
| `Pages légales 403` | GitHub Pages inactif | Suivre Étape 1.1 |
| `Build failed - TypeScript` | Erreur TS | `npx tsc --noEmit`, corriger les erreurs |
| `No signing certificate` | Apple ID non connecté | Xcode → Settings → Accounts → ajouter Apple ID |
| `Provisioning profile not found` | Profil expiré | Xcode → Signing → "Manage Certificates" |
| `Archive grisé (disabled)` | Mauvais device sélectionné | Sélectionner "Any iOS Device (arm64)", pas un simulateur |
| `Bundle ID mismatch` | ID différent dans Xcode | Vérifier `app.json` : `bundleIdentifier: "com.autoreparis.os"` |
| `prebuild failed` | Dépendances manquantes | `npm install` puis `npx expo prebuild --platform ios --clean` |
| `Apple review rejected - missing account deletion` | Fonctionnalité absente | Déjà implémentée dans `app/profile.tsx` |
| `Apple review rejected - privacy policy` | URL invalide | Vérifier que GitHub Pages est actif |
| `Tests failing` | Régression | Lire les erreurs jest, corriger |
| `.env missing` | Fichier non créé | Copier `.env.example`, remplir les clés |

---

*Fichiers associés : `docs/PRD.md` (vision produit), `docs/DEPLOYMENT_CHECKLIST.md` (checklist détaillée)*
