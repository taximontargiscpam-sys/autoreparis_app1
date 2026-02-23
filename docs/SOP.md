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

### Agent 3 — Build & Submit Agent
**Rôle** : EAS Build, Submit, Metadata. Nécessite un Mac.

```
Prompt recommandé :
"Prépare et lance le build iOS EAS pour AutoReparis OS :
1. Vérifie que eas.json est correctement configuré (Apple Team ID + ASC App ID)
2. Donne les commandes exactes dans l'ordre pour : login, credentials, build, submit
3. Surveille les erreurs et propose des corrections si le build échoue"
```

**Accès requis** : EXPO_TOKEN valide, compte Apple Developer, Mac avec Xcode

**Commandes** :
```bash
eas login
eas credentials --platform ios
eas build --platform ios --profile production
eas submit --platform ios --latest
eas metadata:push
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
PHASE 3 : Build iOS (EAS ~25 min)
    ↓
PHASE 4 : Submit + Metadata
    ↓
PHASE 5 : Screenshots (simulateur Xcode)
    ↓
PHASE 6 : App Store Connect (upload + vérification)
    ↓
PHASE 7 : Submit for Review → Attente Apple (1-3 jours)
    ↓
PHASE 8 : App live sur l'App Store 🎉
```

---

### PHASE 0 — Pré-requis (à cocher une fois)

**Matériel et comptes nécessaires :**

- [ ] Mac avec macOS 14+ (Sonoma ou supérieur)
- [ ] Xcode 16+ installé (depuis le Mac App Store)
- [ ] Apple Developer account actif
  - Team ID : `BV2C6322V3`
  - Abonnement annuel à jour ($99/an)
- [ ] Compte Expo.dev actif (`mk75`)
  - Regénérer EXPO_TOKEN sur https://expo.dev/settings/access-tokens
- [ ] Accès au projet Supabase
  - Dashboard : https://supabase.com/dashboard/project/wjvqdvjtzwmusabbinnl
  - Récupérer la `service_role` key (Settings → API)
- [ ] Fichier `.env` configuré (copier `.env.example` et remplir les vraies clés)

**Vérification pré-requis :**
```bash
node --version          # Doit afficher v20+ ou v22+
npx eas-cli --version   # Doit afficher v7+
xcode-select --version  # Doit fonctionner
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

### PHASE 3 — Build iOS (25-30 min)

#### Étape 3.1 — Vérifier les dépendances
```bash
npm install
npx expo install --check
```

#### Étape 3.2 — Se connecter à Expo
```bash
export EXPO_TOKEN="<ton_token_expo>"
npx eas-cli login
# → "Logged in as mk75"
```

#### Étape 3.3 — Configurer les certificats iOS (première fois)
```bash
npx eas-cli credentials --platform ios
```
Cette commande va :
1. Demander ton Apple ID + password + code 2FA
2. Créer/récupérer le Distribution Certificate
3. Créer/récupérer le Provisioning Profile
4. Les stocker sur les serveurs EAS

#### Étape 3.4 — Lancer le build
```bash
npx eas-cli build --platform ios --profile production
```

**Ce qui se passe :**
- Upload du code vers les serveurs EAS (~2 min)
- Build sur serveur Mac Apple Silicon (~15-20 min)
- Génération du `.ipa` signé
- URL de l'artifact fournie en fin de build

**En cas d'erreur :**
- `"Not logged in"` → Re-exécuter étape 3.2
- `"Missing credentials"` → Re-exécuter étape 3.3
- `"Bundle ID not found"` → Vérifier app.json `bundleIdentifier: "com.autoreparis.os"`
- Build fail TypeScript → Re-exécuter PHASE 2

---

### PHASE 4 — Submit + Metadata (10 min)

#### Étape 4.1 — Soumettre à App Store Connect
```bash
npx eas-cli submit --platform ios --latest
```
Cette commande va :
1. Récupérer le dernier build EAS
2. L'uploader vers App Store Connect
3. Afficher l'URL de suivi

#### Étape 4.2 — Pousser les métadonnées
```bash
npx eas-cli metadata:push
```
Cette commande lit `store.config.json` et remplit automatiquement :
- Description (FR + EN)
- Mots-clés
- Catégories (BUSINESS, PRODUCTIVITY)
- Notes de version
- URL politique de confidentialité

---

### PHASE 5 — Screenshots (15 min)

**Device requis** : iPhone 15 Pro Max (6.7") — Résolution 1290×2796 px

**Étape 5.1 — Ouvrir le simulateur**
1. Ouvrir Xcode → menu Window → **Devices and Simulators**
2. Ou via Terminal : `open -a Simulator`
3. Hardware → Device → iOS 18 → **iPhone 15 Pro Max**

**Étape 5.2 — Lancer l'app**
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

**Capturer :** Dans le Simulateur → menu File → **Take Screenshot** (ou Cmd+S)
Les screenshots sont sauvegardés sur le Bureau.

**Format requis Apple :**
- Format : PNG
- Résolution : 1290×2796 px (iPhone 6.7")
- Maximum 10 screenshots par device
- Pas de texte marketing externe aux captures

---

### PHASE 6 — App Store Connect (15 min)

1. Aller sur https://appstoreconnect.apple.com
2. My Apps → **AutoReparis OS** (ASC App ID: `6757646990`)
3. Si l'app n'apparaît pas encore : attendre 15 min après la soumission EAS

**Infos à vérifier (tout est déjà dans `store.config.json`) :**

| Champ | Valeur |
|-------|--------|
| Nom | AutoReparis OS |
| Sous-titre | Gestion de garage automobile |
| Catégorie primaire | Business |
| Catégorie secondaire | Productivity |
| Âge minimum | 4+ |
| Prix | Gratuit (app B2B, facturation externe) |

**Upload Screenshots :**
- iOS App → 6.7" Display → Glisser-déposer les 3-7 captures
- Pas besoin d'iPad (supportsTablet: false)

**Review Information :**
- First Name : Bilel | Last Name : Younes
- Phone : +33600000000
- Email : amirpro@hotmail.fr
- Demo Account : review@autoreparis.com / AppleReview2026!
- Notes : "B2B app for Auto Reparis garage in Drancy, France. Login required — use demo credentials above."

**Privacy Policy URL :**
`https://taximontargiscpam-sys.github.io/autoreparis_app1/politique-de-confidentialite.html`

---

### PHASE 7 — Submit for Review

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

### PHASE 8 — Post-Publication

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
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --latest
# Le buildNumber s'incrémente automatiquement (autoIncrement: true)
```

---

## PARTIE 3 — Résolution de Problèmes Fréquents

| Problème | Cause probable | Solution |
|----------|---------------|----------|
| `EXPO_TOKEN expired` | Token expiré | Regénérer sur expo.dev/settings/access-tokens |
| `Pages légales 403` | GitHub Pages inactif | Suivre Étape 1.1 |
| `Build failed - TypeScript` | Erreur TS | `npx tsc --noEmit`, corriger les erreurs |
| `Credentials not found` | Première fois | `eas credentials --platform ios` |
| `Apple review rejected - missing account deletion` | Fonctionnalité absente | Déjà implémentée dans `app/profile.tsx` |
| `Apple review rejected - privacy policy` | URL invalide | Vérifier que GitHub Pages est actif |
| `Tests failing` | Régression | Lire les erreurs jest, corriger |
| `.env missing` | Fichier non créé | Copier `.env.example`, remplir les clés |

---

*Fichiers associés : `docs/PRD.md` (vision produit), `docs/PRICING.md` (tarification), `docs/DEPLOYMENT_CHECKLIST.md` (checklist détaillée)*
