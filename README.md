# AutoReparis OS 🚗🔧

> **Guide de réinstallation rapide pour nouveau Mac / Environnement de dév.**

Ce projet est une application mobile (iOS/Android) de gestion de garage, construite avec **React Native (Expo)**, **NativeWind** et **Supabase**.

---

## 1. Pré-requis (Nouveau Mac)

Avant de commencer, assurez-vous d'avoir installé les outils de base :

1.  **Git** : `git --version` (sinon installez via Xcode command line tools).
2.  **Node.js** (LTS v20+) : [Télécharger ici](https://nodejs.org/).
3.  **Watchman** (recommandé pour Expo) :
    ```bash
    brew install watchman
    ```

---

## 2. Installation du Projet

Ouvrez votre terminal et lancez ces commandes une par une :

```bash
# 1. Cloner le dépôt (votre code source)
git clone https://github.com/taximontargiscpam-sys/autoreparis_app1.git

# 2. Entrer dans le dossier
cd autoreparis_app1

# 3. Installer les dépendances (ça peut prendre 1-2 minutes)
npm install
```

---

## 3. Configuration des Clés (Supabase) 🔑

C'est l'étape la plus importante. L'application ne fonctionnera pas sans les clés API.

1.  **Dupliquer le fichier d'exemple** :
    ```bash
    cp .env.example .env
    ```

2.  **Ouvrir le fichier `.env`** avec votre éditeur de texte préféré (VS Code, Nano...).

3.  **Remplir les valeurs** :
    Il faut aller sur [Supabase Dashboard](https://supabase.com/dashboard/projects) et récupérer les clés pour les deux projets.

    ### 📌 Projet Principal (App Mobile)
    *   **Nom dans Supabase** : *AutoReparis* (ou similaire)
    *   **ID du projet** : `wjvqdvjtzwmusabbinnl`
    *   **Où trouver les clés ?** : Settings (roue crantée) > API.
    *   Collez l'URL dans `EXPO_PUBLIC_SUPABASE_URL`
    *   Collez la clé `anon` (publique) dans `EXPO_PUBLIC_SUPABASE_ANON_KEY`

    ### 📌 Projet Site Web (Leads)
    *   **Nom dans Supabase** : *Leads / Site Web*
    *   **ID du projet** : `pncgdoqbbsgstcgydtro`
    *   **Où trouver les clés ?** : Settings > API.
    *   Collez l'URL dans `EXPO_PUBLIC_WEBSITE_SUPABASE_URL`
    *   Collez la clé `anon` (publique) dans `EXPO_PUBLIC_WEBSITE_SUPABASE_ANON_KEY`

---

## 4. Lancer l'Application 🚀

Une fois `.env` configuré :

```bash
# Lancer le serveur de développement
npx expo start
```

*   Appuyez sur `i` pour ouvrir dans le simulateur **iOS**.
*   Appuyez sur `a` pour ouvrir dans l'émulateur **Android**.
*   Ou scannez le **QR Code** avec l'app "Expo Go" sur votre iPhone/Android réel.

---

## 5. Dépannage & Base de Données 🛠️

Si vous avez des erreurs bizarres (tables manquantes, erreurs RLS...), c'est probablement que la base de données n'est pas à jour.

### Mettre à jour la Base de Données
1.  Allez sur l'interface **Supabase** (Projet `wjvqdvjtzwmusabbinnl`).
2.  Allez dans **SQL Editor**.
3.  Ouvrez une nouvelle requête (New Query).
4.  Copiez/Collez le contenu du fichier local `rls_policies.sql` et cliquez sur **Run**.
5.  Copiez/Collez le contenu du fichier local `rpc_functions.sql` et cliquez sur **Run**.

### Erreur "Permission Denied"
Si vous ne voyez pas vos données, vérifiez que vous êtes bien authentifié dans l'app et que votre utilisateur a un rôle valide (`admin`, `mecanicien`) dans la table `users`.

---

## 📱 Structure du Code

*   `app/` : Tous les écrans de l'application (basé sur Expo Router).
    *   `(tabs)/` : Les onglets du bas (Dashboard, Planning, Atelier...).
    *   `lib/hooks/` : Toute la logique de données (React Query).
*   `lib/validations.ts` : Règles de validation des formulaires.
*   `components/` : Boutons, cartes et éléments visuels réutilisables.
