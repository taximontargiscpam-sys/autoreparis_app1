# AutoReparis OS

Platforme de gestion d'atelier automobile propriétaire (Web + Mobile), remplaçant Mekage.

## 🚀 Démarrage Rapide

### Pré-requis
- Node.js (v18+)
- Compte Supabase (pour la base de données)

### Installation
1.  **Installer les dépendances** :
    ```bash
    npm install
    ```

2.  **Configuration Supabase** :
    - Créez un nouveau projet Supabase.
    - Allez dans l'éditeur SQL de Supabase.
    - Copiez-collez le contenu du fichier `schema.sql` (situé à la racine du projet) et exécutez-le.
    - Récupérez votre `Project URL` et `anon public key` dans les paramètres API de Supabase.

3.  **Variables d'environnement** :
    - Créez un fichier `.env.local` à la racine (si nécessaire, ou exportez simplement les vars).
    - Pour Expo, le plus simple est de créer un fichier `.env` ou de les passer avant la commande :
    ```bash
    export EXPO_PUBLIC_SUPABASE_URL="votre_url_supabase"
    export EXPO_PUBLIC_SUPABASE_ANON_KEY="votre_cle_anon"
    ```

4.  **Lancer l'application** :
    - **Pour le développement** (lance Metro Bundler) :
        ```bash
        npm start
        ```
    - **Pour le Web** :
        ```bash
        npm run web
        ```
    - **Pour iOS/Android** :
        - Scannez le QR code avec Expo Go sur votre téléphone.
        - Ou lancez `npm run ios` / `npm run android` (nécessite simulateurs).

## 📱 Fonctionnalités

- **Dashboard** : Vue d'ensemble des KPI clés (CA, Interventions) et alertes stock.
- **Planning** : Agenda des rendez-vous atelier.
- **Leads** : Gestion temps-réel des demandes entrantes (Site Web / IA).
- **Atelier** : Suivi des interventions (Planifiées, En cours, Terminées).
- **Stocks** : Inventaire pièces et produits.

## 🛠 Tech Stack

- **Frontend** : React Native (Expo) avec Expo Router.
- **Styling** : NativeWind (TailwindCSS).
- **Backend** : Supabase (PostgreSQL, Auth, Realtime).
- **Icons** : Lucide React Native.

## 🔒 Authentification

L'application utilise Supabase Auth.
- Créez un premier utilisateur via le dashboard Supabase ou utilisez le bouton "(Dev) Créer un compte" sur l'écran de login (si activé).
- Les routes principales sont protégées et redirigent vers `/login` si non authentifié.

## 📂 Structure du Projet

- `app/` : Routes et pages (Expo Router).
    - `(auth)/` : Login.
    - `(tabs)/` : Application principale avec barre de navigation.
- `components/` : Composants réutilisables et Contextes (AuthContext).
- `schema.sql` : Structure de la base de données.
