# GUIDE COMPLET : De A a Z jusqu'a l'App Store

## Vue d'ensemble

Ce guide couvre TOUTES les etapes pour publier AutoReparis OS sur l'Apple App Store.

**Prerequis :**
- Un Mac avec Xcode installe (pour le simulateur/screenshots)
- Un compte Apple Developer Program ($99/an) — deja souscrit (Team ID: BV2C6322V3)
- Node.js 18+ et npm
- EAS CLI installe (`npm install -g eas-cli`)

---

## ETAPE 1 : Activer GitHub Pages (pages legales)

Les URLs de politique de confidentialite et CGU sont hebergees sur GitHub Pages.

1. Aller sur https://github.com/taximontargiscpam-sys/autoreparis_app1/settings/pages
2. **Source** : "Deploy from a branch"
3. **Branch** : `main`, dossier `/docs`
4. Cliquer "Save"
5. Attendre 2-3 minutes, puis verifier :
   - https://taximontargiscpam-sys.github.io/autoreparis_app1/politique-de-confidentialite.html
   - https://taximontargiscpam-sys.github.io/autoreparis_app1/conditions-utilisation.html

> **IMPORTANT** : Apple testera ces URLs pendant la review. Elles DOIVENT etre accessibles.

---

## ETAPE 2 : Securite — Rotation des cles Supabase

Les cles API Supabase ont ete exposees dans l'historique Git.

1. Aller sur https://supabase.com/dashboard → projet AutoReparis
2. Settings → API → **Regenerer** l'anon key et la service role key
3. Mettre a jour le fichier `.env` local avec les nouvelles cles :
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=nouvelle_cle_ici
   ```
4. **Ne PAS commit le `.env`** (deja dans `.gitignore`)

---

## ETAPE 3 : Creer un compte demo pour Apple Review

Apple a besoin de credentials pour tester l'app.

1. Dans Supabase Auth, creer un utilisateur :
   - Email : `review@autoreparis.com`
   - Password : `AppleReview2026!`
2. Remplir des donnees de demo (quelques clients, interventions, produits)
3. Garder ces credentials pour l'etape App Store Connect

---

## ETAPE 4 : Configurer EAS Credentials

### Option A : Via EAS (recommande)
```bash
eas credentials
# Selectionner iOS → Production
# EAS gerera automatiquement :
# - Distribution Certificate
# - Provisioning Profile
```

### Option B : Cle API App Store Connect (pour eas submit)
La cle .p8 est deja configuree dans `eas.json`. Verifier que le fichier existe :
```bash
ls /Users/mike/Downloads/AuthKey_C2G27ANQC7.p8
```

Si tu veux utiliser EAS sur un autre Mac, upload la cle :
```bash
eas secret:create --name ASC_API_KEY --type file --value /Users/mike/Downloads/AuthKey_C2G27ANQC7.p8
```
Puis dans `eas.json`, remplacer `ascApiKeyPath` par :
```json
"ascApiKeyPath": "ASC_API_KEY"
```

---

## ETAPE 5 : Executer le RLS Hardening

Dans le SQL Editor de Supabase, executer le fichier `scripts/harden_rls.sql` :
```sql
-- Ce script active FORCE ROW LEVEL SECURITY sur toutes les tables
-- et supprime les policies publiques dangereuses
```

---

## ETAPE 6 : Build iOS Production

```bash
# Se connecter a EAS
eas login

# Lancer le build production iOS
eas build --platform ios --profile production
```

Le build prend ~15-25 minutes sur les serveurs EAS.
- EAS genere automatiquement le certificate + provisioning profile
- Le buildNumber s'auto-incremente (configure dans eas.json)
- Le build utilise la config Release

**Verifier le build :**
```bash
eas build:list --platform ios --limit 1
```

---

## ETAPE 7 : Soumettre a l'App Store

```bash
eas submit --platform ios --latest
```

Cela upload le build vers App Store Connect via l'API key configuree.

---

## ETAPE 8 : Prendre les screenshots

Apple exige des screenshots pour :
- **iPhone 6.7"** (iPhone 15 Pro Max) — OBLIGATOIRE
- **iPhone 6.5"** (iPhone 11 Pro Max) — optionnel si 6.7" fourni
- **iPad Pro 12.9"** — OBLIGATOIRE car `supportsTablet: true`

### Ecrans a capturer (5-10 screenshots par device) :
1. **Tableau de bord** — KPI en temps reel
2. **Liste des interventions** — vue atelier
3. **Detail d'une intervention** — fiche complete
4. **Planning equipe** — calendrier
5. **Stock** — liste produits avec scanner
6. **Scanner code-barres** — camera active
7. **Fiche client** — detail + vehicules
8. **Ecran de connexion** — page login
9. **Demandes web** — leads
10. **Profil** — parametres

### Comment les prendre :
```bash
# Lancer sur simulateur iPhone 15 Pro Max (6.7")
npx expo start --ios

# Faire les captures d'ecran avec Cmd+S dans le simulateur
# Les screenshots sont dans ~/Library/Developer/CoreSimulator/...

# Repeter sur simulateur iPad Pro 12.9"
```

---

## ETAPE 9 : Completer App Store Connect

Aller sur https://appstoreconnect.apple.com → Apps → AutoReparis OS (ASC App ID: 6757646990)

### Onglet "App Information"
- [x] Nom : AutoReparis OS (deja configure)
- [x] Categories : Business, Productivity (deja configure)
- [x] Privacy Policy URL : `https://taximontargiscpam-sys.github.io/autoreparis_app1/politique-de-confidentialite.html`

### Onglet "Pricing and Availability"
- Prix : Gratuit (Free)
- Disponibilite : France (minimum), ou Monde entier

### Onglet "App Privacy"
Remplir le questionnaire Apple sur la collecte de donnees :
- **Contact Info** : Nom, email, telephone → collecte pour fonctionnalite de l'app
- **Identifiers** : Device ID (pour notifications push)
- **Usage Data** : Non collecte
- **Diagnostics** : Non collecte
- **Tracking** : NON (pas de tracking publicitaire)

### Onglet "Prepare for Submission" (Version 1.0.0)
- **Screenshots** : Upload pour iPhone 6.7" + iPad Pro 12.9"
- **Description** : (deja dans store.config.json, copier-coller)
- **Keywords** : garage, reparation, mecanique, atelier, gestion, automobile, planning, stock, devis, voiture
- **Support URL** : `https://taximontargiscpam-sys.github.io/autoreparis_app1/`
- **Marketing URL** : (optionnel)
- **Build** : Selectionner le build uploade
- **App Review Information** :
  - Prenom : [ton prenom]
  - Nom : [ton nom]
  - Telephone : [ton telephone]
  - Email : amirpro@hotmail.fr
  - **Demo Account** :
    - Username : `review@autoreparis.com`
    - Password : `AppleReview2026!`
  - Notes for reviewers :
    ```
    AutoReparis OS est une application professionnelle de gestion d'atelier
    pour le garage Auto Reparis a Drancy (93, France).

    L'application est destinee aux employes du garage pour gerer les
    interventions, le stock, les clients et le planning.

    Compte demo fourni avec des donnees de test pre-remplies.
    ```

### Content Rights
- "Does your app contain, show, or access third-party content?" → No

### Age Rating
- Deja configure dans store.config.json → 4+ (aucun contenu sensible)

---

## ETAPE 10 : Soumettre pour Review

1. Dans App Store Connect, cliquer **"Submit for Review"**
2. Repondre aux questions :
   - Encryption : **Non** (ITSAppUsesNonExemptEncryption = false, deja configure)
   - Advertising Identifier (IDFA) : **Non** (pas de SDK pub)
   - Content Rights : **Non**
3. Confirmer la soumission

### Delais de review
- Premiere soumission : **24h a 7 jours** (en general 24-48h)
- Apple peut rejeter pour des raisons mineures — lire attentivement le feedback

---

## ETAPE 11 : Apres l'approbation

Une fois approuvee :
1. L'app sera automatiquement publiee sur l'App Store (ou en release manuelle selon tes parametres)
2. Verifier l'app sur l'App Store : chercher "AutoReparis OS"
3. Installer depuis l'App Store sur un vrai device pour validation finale

---

## Commandes rapides (resume)

```bash
# 1. Build
eas build --platform ios --profile production

# 2. Submit
eas submit --platform ios --latest

# 3. Verifier le status
eas build:list --platform ios --limit 5

# 4. Voir les logs d'un build
eas build:view [BUILD_ID]
```

---

## Checklist finale

- [ ] GitHub Pages actif (politique de confidentialite + CGU accessibles)
- [ ] Cles Supabase regenerees (securite)
- [ ] Compte demo cree pour Apple Review
- [ ] RLS hardening execute en production
- [ ] EAS credentials configures
- [ ] `eas build --platform ios --profile production` reussi
- [ ] `eas submit --platform ios --latest` reussi
- [ ] Screenshots uploades (iPhone 6.7" + iPad 12.9")
- [ ] App Store Connect rempli (description, mots-cles, prix, privacy)
- [ ] Demo credentials renseignes dans Review Information
- [ ] "Submit for Review" clique
- [ ] App approuvee et visible sur l'App Store
