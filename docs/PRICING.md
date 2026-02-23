# Analyse Tarifaire — AutoReparis OS (2026)

> Ce document est destiné au développeur/propriétaire du projet pour fixer les prix
> de commercialisation de l'application auprès des garages clients.

---

## 1. Contexte Marché SaaS Garage en France (2026)

### Concurrents directs et leurs prix

| Solution | Abonnement mensuel | Setup | Points faibles |
|----------|-------------------|-------|----------------|
| Wingarage | ~€150/mois | €1,500 | Web uniquement, UI dépassée |
| Mecaplan | ~€90-120/mois | €500-1,000 | Pas de mobile natif |
| AutoRepar Pro | ~€120/mois | €800 | Pas de portail client |
| Workshop Software (UK) | ~€140/mois | €1,000 | En anglais |
| Mitchell 1 Manager SE (US) | ~€180/mois | €2,000 | USA, complexe |
| Solutions Excel/papier | €0 | €0 | Zéro efficacité |

**Fourchette marché** : €80-200/mois + setup €500-2,000

### Ce qu'AutoReparis OS apporte en plus
- App mobile native iOS (les concurrents sont majoritairement web)
- Portail suivi client public (différenciateur unique)
- Scanner code-barres intégré (stock)
- Notifications push temps réel
- CRM leads depuis le site web
- Temps réel Supabase (statuts live)
- Sécurité enterprise (RLS PostgreSQL, RBAC 4 rôles)

**Valeur perçue équivalente marché** : €130-180/mois

---

## 2. Coût de Développement (Référence)

### Ce projet en heures réelles

| Phase | Heures estimées | Description |
|-------|----------------|-------------|
| Architecture & setup | 30h | Expo, Supabase, routing, auth |
| 9 modules fonctionnels | 180h | CRUD, RLS, React Query |
| RBAC & sécurité | 40h | RLS PostgreSQL, 4 rôles |
| Tests (83 tests) | 30h | Jest, mocking Supabase |
| Conformité Apple | 20h | Privacy, legal pages, manifest |
| Scripts SQL & déploiement | 20h | RLS, RPC functions, scripts |
| Configuration EAS & metadata | 10h | eas.json, store.config.json |
| **Total estimé** | **~330h** | |

### Tarif marché France 2026

| Profil | Tarif journalier | Tarif horaire |
|--------|-----------------|---------------|
| Développeur React Native junior | €300-400/j | €38-50/h |
| Développeur React Native senior | €500-700/j | €63-88/h |
| Freelance senior Paris | €600-800/j | €75-100/h |

### Coût si développé sans IA
- 330h × €70/h (tarif moyen) = **€23,100**
- 330h × €90/h (tarif senior) = **€29,700**

### Gain avec IA (Claude/Sonnet via Antigravity)
- Accélération estimée : 3-5x sur les tâches répétitives
- Équivalent humain : ~80-100h de travail senior effectif
- 100h × €85/h = **€8,500** (coût réel avec IA)
- **Économie : ~65-70% par rapport au développement 100% humain**

---

## 3. Recommandations Tarifaires (à -35% du marché)

### Option A — SaaS Mensuel (RECOMMANDÉ)

**Le modèle le plus adapté pour un logiciel B2B garage.**

| Poste | Prix recommandé | Prix marché référence |
|-------|----------------|----------------------|
| Setup & onboarding | **€490** | €1,500 |
| Abonnement mensuel | **€89/mois** | €140/mois |
| Abonnement annuel (prépayé) | **€890/an** | €1,400/an |
| Formation (1h visio) | **€90** | €150 |

**Pourquoi ce prix ?**
- €89/mois = -36% vs moyenne marché (€140)
- Setup €490 = positionnement accessible pour garage indépendant
- Annuel = 2 mois offerts → incite à l'engagement long terme

**Revenu récurrent attendu :**
- 1 garage : €89/mois = **€1,068/an**
- 5 garages : **€5,340/an**
- 10 garages : **€10,680/an**
- 20 garages : **€21,360/an** (rentabilité confortable)

---

### Option B — Licence Unique (pour garages réticents aux abos)

| Poste | Prix recommandé | Prix marché |
|-------|----------------|-------------|
| Licence à vie | **€2,900** | €4,500 |
| Maintenance annuelle (après an 1) | **€290/an** | €450/an |
| Hébergement Supabase (à charge client) | ~€25/mois | - |

**Avantages** : Vente one-shot, client autonome
**Inconvénients** : Pas de revenu récurrent, support plus complexe

---

### Option C — Package Clé en Main (tout inclus)

**Pour les garages qui veulent zéro gestion technique.**

| Poste | Prix |
|-------|------|
| Setup complet (config Supabase + formation 2h) | **€790** |
| Abonnement tout inclus (app + hébergement + support) | **€99/mois** |

**Inclus dans l'abonnement :**
- App iOS mise à jour
- Hébergement Supabase Pro (~€25/mois)
- Support par email (48h)
- 1 mise à jour majeure/an

**Marge réelle :**
- Coût infra : ~€50/mois (Supabase + EAS + Apple Dev)
- Marge nette : €49/garage/mois → ~€588/garage/an

---

## 4. ROI pour le Garage Client

### Gains de temps estimés

| Tâche | Temps actuel (papier) | Temps avec AutoReparis OS | Gain |
|-------|----------------------|--------------------------|------|
| Créer fiche intervention | 10 min | 2 min | 8 min |
| Mettre à jour statut | 5 min (WhatsApp client) | 30 sec | 4,5 min |
| Trouver historique client | 5-15 min | 10 sec | ~10 min |
| Gestion stock | 30 min/sem | 5 min/sem | 25 min/sem |
| Répondre "ma voiture est prête ?" | 2 min/appel × 5/jour | 0 (portail auto) | 10 min/jour |

**Gain total estimé : 2-3h/jour pour le garage**

### Valeur financière du gain

| Hypothèse | Calcul | Résultat |
|-----------|--------|---------|
| 2h/jour × 22 jours × €15/h (coût du temps) | 2 × 22 × 15 | **€660/mois** |
| 3h/jour × 22 jours × €15/h | 3 × 22 × 15 | **€990/mois** |

**Retour sur investissement : < 1 semaine** pour le garage.

### Argument de vente

> "Pour €89/mois — soit moins de €3/jour — vous récupérez 2-3 heures par jour sur l'administration.
> En termes de rentabilité, c'est payé en moins d'une semaine.
> Et vos clients adorent le portail de suivi : moins d'appels, plus de satisfaction."

---

## 5. Coûts Infrastructure (à Déduire de la Marge)

| Service | Coût mensuel | Coût annuel |
|---------|-------------|-------------|
| Supabase Pro (1 projet) | $25 (~€23) | $300 (~€276) |
| EAS Build (builds mensuels) | $0-20 | $0-240 |
| Apple Developer Program | $8/mois | $99/an (~€92) |
| **Total infra (1 garage)** | **~€50/mois** | **~€600/an** |

**Marge nette par garage (Option A €89/mois) :**
- Revenu : €89/mois
- Coût infra : €50/mois (partagé si plusieurs garages sur même Supabase = moins cher)
- **Marge : €39/mois/garage minimum, davantage avec plusieurs garages**

> **Note** : Si 5 garages partagent le même projet Supabase Pro, le coût infra ne change pas — la marge augmente à ~€80/mois/garage.

---

## 6. Stratégie de Lancement

### Phase 1 — Lancement (mois 1-3)
- Prix de lancement : **€59/mois** (promotion -34% sur le prix normal)
- Objectif : 3-5 premiers clients garages (bouche à oreille, réseau local)
- Retour d'expérience → itérations

### Phase 2 — Croissance (mois 4-12)
- Prix normal : **€89/mois**
- Objectif : 10-15 garages
- Ajout fonctionnalités V2 selon feedbacks

### Phase 3 — Scale (an 2)
- Tarification multi-garage
- Partenariats distributeurs (syndicats de garagistes, groupements)
- Possible augmentation tarifaire : **€99-119/mois**

---

## 7. Résumé — Grille Tarifaire à Communiquer au Client

```
╔══════════════════════════════════════════════════════════════╗
║           AutoReparis OS — Tarifs 2026                       ║
╠══════════════════════════════════════════════════════════════╣
║  Setup & Configuration     │  490 € (paiement unique)       ║
╠══════════════════════════════════════════════════════════════╣
║  Abonnement Mensuel        │  89 €/mois                      ║
║  Abonnement Annuel         │  890 €/an (2 mois offerts)      ║
╠══════════════════════════════════════════════════════════════╣
║  Formation (1h visio)      │  90 €                           ║
╠══════════════════════════════════════════════════════════════╣
║  Licence à Vie             │  2 900 € (maintenance 290€/an)  ║
╚══════════════════════════════════════════════════════════════╝

Inclus dans l'abonnement :
✓ Application iOS mise à jour automatiquement
✓ Hébergement cloud sécurisé (Supabase)
✓ Support email 48h
✓ Sauvegardes automatiques quotidiennes
✓ Mises à jour de sécurité
```

---

*Fichiers associés : `docs/PRD.md` (fonctionnalités), `docs/SOP.md` (guide publication)*
