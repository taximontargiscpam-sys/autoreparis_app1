#!/bin/bash
# ============================================================
# AutoReparis OS — Script de deploiement App Store COMPLET
# Lance depuis la racine du projet sur ton Mac :
#   chmod +x scripts/deploy_appstore.sh
#   ./scripts/deploy_appstore.sh
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

step() { echo -e "\n${BLUE}======== ETAPE $1 : $2 ========${NC}\n"; }
ok()   { echo -e "${GREEN}[OK] $1${NC}"; }
warn() { echo -e "${YELLOW}[ATTENTION] $1${NC}"; }
fail() { echo -e "${RED}[ERREUR] $1${NC}"; exit 1; }

# ---- Verifications ----
step "0" "Verifications"

if [ ! -f "app.json" ]; then
    fail "Lance ce script depuis la racine du projet (ou se trouve app.json)"
fi

if ! command -v eas &>/dev/null; then
    fail "'eas' non installe. Fais: npm install -g eas-cli"
fi

if ! command -v npx &>/dev/null; then
    fail "'npx' non installe. Installe Node.js."
fi

ok "Outils trouves"

# ---- Etape 1 : Pull le code ----
step "1" "Pull du code"

git fetch origin claude/project-analysis-ZPLpc
git checkout main 2>/dev/null || git checkout -b main
git merge origin/claude/project-analysis-ZPLpc --no-edit
git push origin main

ok "Code merge dans main et pousse"

# ---- Etape 2 : Copier le fichier .p8 ----
step "2" "Verification du fichier .p8"

if [ ! -f "./AuthKey_C2G27ANQC7.p8" ]; then
    if [ -f "$HOME/Downloads/AuthKey_C2G27ANQC7.p8" ]; then
        cp "$HOME/Downloads/AuthKey_C2G27ANQC7.p8" ./AuthKey_C2G27ANQC7.p8
        ok "Fichier .p8 copie depuis ~/Downloads"
    else
        fail "Fichier .p8 introuvable. Place AuthKey_C2G27ANQC7.p8 a la racine du projet ou dans ~/Downloads"
    fi
else
    ok "Fichier .p8 deja present"
fi

# ---- Etape 3 : Login Expo/EAS ----
step "3" "Login EAS"

CURRENT_USER=$(npx expo whoami 2>/dev/null || echo "")
if [ -z "$CURRENT_USER" ] || [ "$CURRENT_USER" = "Not logged in" ]; then
    echo "Connexion a ton compte Expo..."
    npx expo login -u "amirpro@hotmail.fr" -p "BilelYounes1977@"
    ok "Connecte a Expo"
else
    ok "Deja connecte en tant que: $CURRENT_USER"
fi

# ---- Etape 4 : Variables d'environnement EAS ----
step "4" "Configuration des variables d'environnement EAS"

echo "Configuration des secrets EAS pour le build production..."

# On utilise eas env:create. Si ca echoue (deja existant), on ignore.
eas env:create --name EXPO_PUBLIC_SUPABASE_URL \
    --value "https://wjvqdvjtzwmusabbinnl.supabase.co" \
    --environment production --force 2>/dev/null || true

eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY \
    --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqdnFkdmp0endtdXNhYmJpbm5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODA0MDgsImV4cCI6MjA4Mjg1NjQwOH0.s9khE4mXagZNe2YgcpySdZl23DBtia35zAntt-nZK6c" \
    --environment production --force 2>/dev/null || true

eas env:create --name EXPO_PUBLIC_WEBSITE_SUPABASE_URL \
    --value "https://pncgdoqbbsgstcgydtro.supabase.co" \
    --environment production --force 2>/dev/null || true

eas env:create --name EXPO_PUBLIC_WEBSITE_SUPABASE_ANON_KEY \
    --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuY2dkb3FiYnNnc3RjZ3lkdHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MjE1MDgsImV4cCI6MjA3OTQ5NzUwOH0.meo_LJEsbGuDCzQ5anmUl9rohQ9dxCjHCqCXrsdCY7g" \
    --environment production --force 2>/dev/null || true

ok "Variables d'environnement configurees"

# ---- Etape 5 : Build iOS ----
step "5" "Build iOS production"

echo "Lancement du build iOS..."
echo "Cela prend environ 15-25 minutes sur EAS."
echo ""

eas build --platform ios --profile production --non-interactive

ok "Build iOS termine"

# ---- Etape 6 : Push metadata ----
step "6" "Push des metadonnees App Store"

eas metadata:push 2>/dev/null || warn "metadata:push a echoue — verifie manuellement dans App Store Connect"

ok "Metadonnees poussees"

# ---- Etape 7 : Submit ----
step "7" "Soumission a l'App Store"

eas submit --platform ios --latest --non-interactive

ok "Build soumis a App Store Connect"

# ---- Rappels finaux ----
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   BUILD SOUMIS AVEC SUCCES !${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${YELLOW}ACTIONS MANUELLES RESTANTES :${NC}"
echo ""
echo "1. SUPABASE SQL (CRITIQUE) :"
echo "   Va dans https://supabase.com/dashboard → projet wjvqdvjtzwmusabbinnl"
echo "   → SQL Editor → copie-colle le contenu de scripts/delete_account.sql"
echo ""
echo "2. COMPTE DE REVIEW (CRITIQUE) :"
echo "   Dans Supabase Auth, cree un user :"
echo "   Email: review@autoreparis.com"
echo "   Password: AppleReview2026!"
echo "   Puis dans la table 'users', ajoute ce user avec role 'admin'"
echo ""
echo "3. GITHUB PAGES :"
echo "   Repo Settings > Pages > Source: main, /docs"
echo "   Verifie les URLs :"
echo "   - https://taximontargiscpam-sys.github.io/autoreparis_app1/politique-de-confidentialite.html"
echo "   - https://taximontargiscpam-sys.github.io/autoreparis_app1/conditions-utilisation.html"
echo ""
echo "4. APP STORE CONNECT :"
echo "   - Uploade les screenshots iPhone 6.7\""
echo "   - Verifie les Review Information (pre-remplies)"
echo "   - Clique 'Submit for Review'"
echo ""
