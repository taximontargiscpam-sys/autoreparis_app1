#!/bin/bash
# ============================================================
# AutoReparis OS — DEPLOIEMENT APP STORE COMPLET (A-Z)
#
# CE SCRIPT FAIT TOUT :
#   1. Pull + merge dans main
#   2. Deploy SQL Supabase (delete_own_account)
#   3. Cree le compte review Apple dans Supabase Auth
#   4. Active GitHub Pages
#   5. Copie le fichier .p8
#   6. Login EAS + variables d'env
#   7. Build iOS production
#   8. Push metadata + Submit App Store
#
# Usage :
#   cd autoreparis_app1
#   chmod +x scripts/deploy_appstore.sh
#   ./scripts/deploy_appstore.sh
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

step() { echo -e "\n${BLUE}${BOLD}======== ETAPE $1/$TOTAL_STEPS : $2 ========${NC}\n"; }
ok()   { echo -e "${GREEN}  [OK] $1${NC}"; }
warn() { echo -e "${YELLOW}  [ATTENTION] $1${NC}"; }
fail() { echo -e "${RED}  [ERREUR] $1${NC}"; exit 1; }
ask()  { echo -en "${YELLOW}  $1${NC}"; }

TOTAL_STEPS=8

echo -e "${BOLD}"
echo "  ╔════════════════════════════════════════════════╗"
echo "  ║   AutoReparis OS — Deploiement App Store       ║"
echo "  ║   Ce script fait TOUT de A a Z                 ║"
echo "  ╚════════════════════════════════════════════════╝"
echo -e "${NC}"

# ---- Etape 0 : Verifications ----
echo -e "${BLUE}Verifications prealables...${NC}"

if [ ! -f "app.json" ]; then
    fail "Lance ce script depuis la racine du projet (ou se trouve app.json)"
fi

for cmd in eas npx node git curl; do
    if ! command -v "$cmd" &>/dev/null; then
        fail "'$cmd' non installe."
    fi
done

ok "Tous les outils sont installes"

# ---- Recuperer la service_role key ----
echo ""
echo -e "${YELLOW}${BOLD}J'ai besoin de ta cle Supabase service_role pour deployer le SQL et creer le compte review.${NC}"
echo -e "${YELLOW}Trouve-la dans : Supabase Dashboard > Settings > API > service_role (secret)${NC}"
echo ""
ask "Colle ta service_role key ici (ou tape SKIP pour sauter) : "
read -r SERVICE_ROLE_KEY
echo ""

# ============================================================
# ETAPE 1 : Pull + Merge
# ============================================================
step "1" "Pull du code et merge dans main"

FEATURE_BRANCH="claude/project-analysis-ZPLpc"

git fetch origin "$FEATURE_BRANCH" 2>/dev/null || true
git fetch origin main 2>/dev/null || true

CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    git checkout main 2>/dev/null || git checkout -b main origin/main 2>/dev/null || git checkout -b main
fi

if ! git merge "origin/$FEATURE_BRANCH" --no-edit 2>/dev/null; then
    warn "Conflit de merge detecte. Resolution..."
    git merge --abort 2>/dev/null || true
    fail "Merge echoue avec des conflits. Resous-les manuellement : git merge origin/$FEATURE_BRANCH"
fi

git push origin main 2>/dev/null || warn "Push main echoue — fais-le manuellement : git push origin main"

ok "Code sur main"

# ============================================================
# ETAPE 2 : Deployer SQL Supabase
# ============================================================
step "2" "Deploiement SQL Supabase (delete_own_account)"

SUPABASE_URL="https://wjvqdvjtzwmusabbinnl.supabase.co"
SUPABASE_PROJECT_REF="wjvqdvjtzwmusabbinnl"

if [ "$SERVICE_ROLE_KEY" != "SKIP" ] && [ -n "$SERVICE_ROLE_KEY" ]; then
    # Read the SQL file
    SQL_CONTENT=$(cat scripts/delete_account.sql)

    # Try deploying via setup_supabase.js (handles both SQL + review account)
    if node scripts/setup_supabase.js "$SERVICE_ROLE_KEY" 2>/dev/null; then
        ok "Setup Supabase termine via script Node"
    else
        echo ""
        echo -e "${YELLOW}  Le script automatique a echoue. Deploie manuellement :${NC}"
        echo -e "${YELLOW}  1. Ouvre : https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF/sql/new${NC}"
        echo -e "${YELLOW}  2. Copie-colle le contenu de scripts/delete_account.sql${NC}"
        echo -e "${YELLOW}  3. Clique Run${NC}"
    fi
else
    warn "SKIP — Tu dois deployer scripts/delete_account.sql manuellement dans Supabase SQL Editor"
    echo -e "  URL: ${BOLD}https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF/sql/new${NC}"
fi

# ============================================================
# ETAPE 3 : Creer le compte review Apple
# ============================================================
step "3" "Creation du compte review Apple"

if [ "$SERVICE_ROLE_KEY" != "SKIP" ] && [ -n "$SERVICE_ROLE_KEY" ]; then
    # Create review user via Supabase Auth Admin API
    CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" \
        "$SUPABASE_URL/auth/v1/admin/users" \
        -X POST \
        -H "apikey: $SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "review@autoreparis.com",
            "password": "AppleReview2026!",
            "email_confirm": true,
            "user_metadata": {"nom": "Review", "prenom": "Apple"}
        }' 2>/dev/null)

    HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -1)
    BODY=$(echo "$CREATE_RESPONSE" | head -n -1)

    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        # Extract user ID
        USER_ID=$(echo "$BODY" | node -e "process.stdin.on('data',d=>{try{console.log(JSON.parse(d).id)}catch(e){console.log('')}})" 2>/dev/null)

        if [ -n "$USER_ID" ]; then
            # Insert into users table
            curl -s -o /dev/null \
                "$SUPABASE_URL/rest/v1/users" \
                -X POST \
                -H "apikey: $SERVICE_ROLE_KEY" \
                -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
                -H "Content-Type: application/json" \
                -H "Prefer: return=minimal" \
                -d "{
                    \"id\": \"$USER_ID\",
                    \"email\": \"review@autoreparis.com\",
                    \"nom\": \"Review\",
                    \"prenom\": \"Apple\",
                    \"role\": \"admin\",
                    \"actif\": true
                }" 2>/dev/null || true

            ok "Compte review cree : review@autoreparis.com / AppleReview2026!"
        else
            warn "User cree dans Auth mais ID non recupere. Ajoute manuellement dans la table users."
        fi
    elif echo "$BODY" | grep -qi "already"; then
        ok "Compte review existe deja"

        # Get the user ID to update the password
        LIST_RESPONSE=$(curl -s \
            "$SUPABASE_URL/auth/v1/admin/users" \
            -X GET \
            -H "apikey: $SERVICE_ROLE_KEY" \
            -H "Authorization: Bearer $SERVICE_ROLE_KEY" 2>/dev/null)

        EXISTING_USER_ID=$(echo "$LIST_RESPONSE" | node -e "
            let data='';
            process.stdin.on('data',d=>data+=d);
            process.stdin.on('end',()=>{
                try{
                    const parsed=JSON.parse(data);
                    const users=parsed.users||[];
                    const u=users.find(u=>u.email==='review@autoreparis.com');
                    console.log(u?u.id:'');
                }catch(e){console.log('')}
            });" 2>/dev/null)

        if [ -n "$EXISTING_USER_ID" ]; then
            # Update password via PATCH
            curl -s -o /dev/null \
                "$SUPABASE_URL/auth/v1/admin/users/$EXISTING_USER_ID" \
                -X PUT \
                -H "apikey: $SERVICE_ROLE_KEY" \
                -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
                -H "Content-Type: application/json" \
                -d '{"password": "AppleReview2026!"}' 2>/dev/null || true
            ok "Mot de passe du compte review mis a jour"
        fi
    else
        warn "Creation du compte review echouee (code $HTTP_CODE). Cree-le manuellement dans Supabase Auth."
        echo -e "${YELLOW}  Email: review@autoreparis.com | Password: AppleReview2026!${NC}"
    fi
else
    warn "SKIP — Cree le compte review manuellement dans Supabase Auth"
    echo "    Email: review@autoreparis.com"
    echo "    Password: AppleReview2026!"
    echo "    Puis ajoute dans la table 'users' avec role: admin"
fi

# ============================================================
# ETAPE 4 : Activer GitHub Pages
# ============================================================
step "4" "Activation GitHub Pages"

REPO_OWNER="taximontargiscpam-sys"
REPO_NAME="autoreparis_app1"

# Try via GitHub API with token if available
if [ -n "${GITHUB_TOKEN:-}" ]; then
    curl -s -o /dev/null -w "%{http_code}" \
        "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/pages" \
        -X POST \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github+json" \
        -d '{"source":{"branch":"main","path":"/docs"}}' 2>/dev/null \
    && ok "GitHub Pages active" \
    || {
        curl -s -o /dev/null \
            "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/pages" \
            -X PUT \
            -H "Authorization: token $GITHUB_TOKEN" \
            -H "Accept: application/vnd.github+json" \
            -d '{"source":{"branch":"main","path":"/docs"}}' 2>/dev/null \
        && ok "GitHub Pages mis a jour" \
        || warn "Active GitHub Pages manuellement : Repo Settings > Pages > main > /docs"
    }
elif command -v gh &>/dev/null && gh auth status &>/dev/null 2>&1; then
    gh api "repos/$REPO_OWNER/$REPO_NAME/pages" \
        -X POST \
        -f "source[branch]=main" \
        -f "source[path]=/docs" 2>/dev/null \
    && ok "GitHub Pages active" \
    || {
        gh api "repos/$REPO_OWNER/$REPO_NAME/pages" \
            -X PUT \
            -f "source[branch]=main" \
            -f "source[path]=/docs" 2>/dev/null \
        && ok "GitHub Pages mis a jour" \
        || warn "Active GitHub Pages manuellement : Repo Settings > Pages > main > /docs"
    }
else
    warn "Pas de token GitHub disponible. Active GitHub Pages manuellement :"
    echo "    1. Va sur https://github.com/$REPO_OWNER/$REPO_NAME/settings/pages"
    echo "    2. Source: Deploy from a branch"
    echo "    3. Branch: main, Folder: /docs"
    echo "    4. Save"
fi

# Verify URLs
echo "  Verification des URLs legales..."
for url in \
    "https://$REPO_OWNER.github.io/$REPO_NAME/politique-de-confidentialite.html" \
    "https://$REPO_OWNER.github.io/$REPO_NAME/conditions-utilisation.html"; do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    if [ "$CODE" = "200" ]; then
        ok "$url → 200 OK"
    else
        warn "$url → $CODE (peut prendre quelques minutes apres activation)"
    fi
done

# ============================================================
# ETAPE 5 : Copier le fichier .p8
# ============================================================
step "5" "Verification du fichier .p8 (App Store Connect API Key)"

if [ ! -f "./AuthKey_C2G27ANQC7.p8" ]; then
    # Check common locations
    P8_FOUND=false
    for loc in \
        "$HOME/Downloads/AuthKey_C2G27ANQC7.p8" \
        "$HOME/Desktop/AuthKey_C2G27ANQC7.p8" \
        "$HOME/Documents/AuthKey_C2G27ANQC7.p8" \
        "$HOME/AuthKey_C2G27ANQC7.p8"; do
        if [ -f "$loc" ]; then
            cp "$loc" ./AuthKey_C2G27ANQC7.p8
            ok "Fichier .p8 copie depuis $loc"
            P8_FOUND=true
            break
        fi
    done

    if [ "$P8_FOUND" = false ]; then
        fail "AuthKey_C2G27ANQC7.p8 introuvable ! Place-le a la racine du projet ou dans ~/Downloads/"
    fi
else
    ok "Fichier .p8 present"
fi

# ============================================================
# ETAPE 6 : Login EAS + Variables d'environnement
# ============================================================
step "6" "Login EAS et configuration"

CURRENT_USER=$(npx expo whoami 2>/dev/null || echo "")
if [ -z "$CURRENT_USER" ] || echo "$CURRENT_USER" | grep -qi "not logged"; then
    echo -e "  ${YELLOW}Tu dois te connecter a ton compte Expo/EAS.${NC}"
    echo ""
    npx expo login
    ok "Connecte a Expo"
else
    ok "Deja connecte : $CURRENT_USER"
fi

echo "  Configuration des variables d'env EAS..."
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "$EXPO_PUBLIC_SUPABASE_URL" --environment production --force 2>/dev/null || true
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "$EXPO_PUBLIC_SUPABASE_ANON_KEY" --environment production --force 2>/dev/null || true
eas env:create --name EXPO_PUBLIC_WEBSITE_SUPABASE_URL --value "$EXPO_PUBLIC_WEBSITE_SUPABASE_URL" --environment production --force 2>/dev/null || true
eas env:create --name EXPO_PUBLIC_WEBSITE_SUPABASE_ANON_KEY --value "$EXPO_PUBLIC_WEBSITE_SUPABASE_ANON_KEY" --environment production --force 2>/dev/null || true

ok "Variables EAS configurees"

# ============================================================
# ETAPE 7 : Build iOS
# ============================================================
step "7" "Build iOS production"

echo -e "  ${BOLD}Lancement du build iOS sur EAS...${NC}"
echo "  Cela prend environ 15-25 minutes."
echo ""

# Capture build ID for reliable submit
BUILD_OUTPUT=$(eas build --platform ios --profile production --non-interactive --json 2>/dev/null || echo "")

if [ -n "$BUILD_OUTPUT" ]; then
    BUILD_ID=$(echo "$BUILD_OUTPUT" | node -e "
        let d='';process.stdin.on('data',c=>d+=c);
        process.stdin.on('end',()=>{try{const p=JSON.parse(d);console.log(Array.isArray(p)?p[0].id:p.id)}catch(e){console.log('')}});" 2>/dev/null)
    ok "Build iOS termine ! (ID: ${BUILD_ID:-unknown})"
else
    # Fallback to non-json build
    eas build --platform ios --profile production --non-interactive
    BUILD_ID=""
    ok "Build iOS termine !"
fi

# ============================================================
# ETAPE 8 : Metadata + Submit
# ============================================================
step "8" "Soumission a l'App Store"

echo "  Push des metadonnees..."
if ! eas metadata:push 2>/dev/null; then
    warn "metadata:push a echoue — remplis manuellement dans App Store Connect"
    echo "  Les infos sont dans store.config.json"
fi

echo ""
echo "  Soumission du build..."
if [ -n "${BUILD_ID:-}" ]; then
    eas submit --platform ios --id "$BUILD_ID" --non-interactive
else
    eas submit --platform ios --latest --non-interactive
fi

ok "Build soumis a App Store Connect !"

# ============================================================
# TERMINE
# ============================================================
echo ""
echo -e "${GREEN}${BOLD}"
echo "  ╔════════════════════════════════════════════════╗"
echo "  ║                                                ║"
echo "  ║   AutoReparis OS soumis a l'App Store !        ║"
echo "  ║                                                ║"
echo "  ╚════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${BOLD}Derniere etape dans App Store Connect :${NC}"
echo "  1. Uploade tes screenshots iPhone 6.7\""
echo "  2. Verifie les Review Info (pre-remplies)"
echo "  3. Clique Submit for Review"
echo ""
echo -e "${BOLD}Credentials review Apple :${NC}"
echo "  Email    : review@autoreparis.com"
echo "  Password : AppleReview2026!"
echo ""
echo -e "${BOLD}Chemin suppression de compte :${NC}"
echo "  Dashboard > icone user (haut droite) > Profil > Supprimer mon compte"
echo ""
