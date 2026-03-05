#!/usr/bin/env python3
"""
App Store Connect API - Metadata Setup for AutoReparis OS
Generates JWT, checks build, finds version, rejects if needed, sets all metadata.
"""

import jwt
import time
import sys
import requests

# ── Configuration ──────────────────────────────────────────────────────
API_KEY_ID = "C2G27ANQC7"
ISSUER_ID = "20260351-be55-465f-af4d-11200a82d927"
KEY_FILE = "/Users/mike/clawd/projects/autoreparis_app1/AuthKey_C2G27ANQC7.p8"
APP_ID = "6757646990"
BASE_URL = "https://api.appstoreconnect.apple.com/v1"

# Metadata
LOCALE = "fr-FR"
KEYWORDS = "garage,automobile,réparation,gestion,facturation,stock,pièces,atelier,mécanique,intervention"
SUPPORT_URL = "https://mkdigitalparis.com/contact"
PRIVACY_POLICY_URL = "https://autoreparis-legal.vercel.app/politique-de-confidentialite.html"
MARKETING_URL = "https://mkdigitalparis.com/apps/autoreparis"
REVIEW_EMAIL = "demo@autoreparis.com"
REVIEW_PASSWORD = "Demo1234!"
REVIEW_NOTES = "Application B2B de gestion pour garages automobiles. Ce compte démo contient des données exemple."
WHATS_NEW = "Première version de l'application."
SUBTITLE = "Gérez votre garage auto"
COPYRIGHT = "© 2026 MKDigital"

DESCRIPTION = """AutoReparis OS — Le système d'exploitation de votre garage automobile.

Transformez la gestion de votre atelier avec AutoReparis OS, la solution tout-en-un conçue spécifiquement pour les professionnels de la réparation automobile. Fini les carnets papier, les tableurs complexes et les outils dispersés. Tout est centralisé dans une seule application puissante et intuitive.

GESTION DES INTERVENTIONS
Créez, suivez et clôturez vos ordres de réparation en quelques taps. Historique complet par véhicule, suivi en temps réel de l'avancement des travaux, et attribution des tâches à vos techniciens. Chaque intervention est documentée et traçable.

STOCK & PIÈCES DÉTACHÉES
Gérez votre inventaire de pièces détachées avec précision. Alertes de stock bas automatiques, suivi des commandes fournisseurs et valorisation du stock en temps réel. Ne manquez plus jamais une pièce critique.

FACTURATION PROFESSIONNELLE
Générez des devis et factures conformes en quelques secondes. Calcul automatique de la main-d'œuvre, intégration des pièces utilisées, et envoi direct au client par email ou SMS. Export comptable inclus.

PORTAIL CLIENT
Offrez à vos clients une expérience premium. Ils suivent l'avancement de leur véhicule en temps réel, consultent l'historique des interventions, et valident les devis directement depuis leur téléphone.

TABLEAU DE BORD & ANALYTICS
Visualisez la performance de votre garage en un coup d'œil. Chiffre d'affaires, nombre d'interventions, temps moyen de réparation, taux d'occupation… Des indicateurs clés pour piloter votre activité.

FONCTIONNALITÉS PRINCIPALES :
• Gestion complète des ordres de réparation
• Suivi du stock de pièces détachées en temps réel
• Devis et facturation conformes aux normes françaises
• Portail client avec suivi en direct
• Fiches véhicules avec historique complet
• Planning des techniciens et de l'atelier
• Notifications et rappels automatiques
• Tableau de bord avec KPI essentiels
• Export des données comptables
• Mode hors-ligne pour l'atelier

CONÇU PAR DES PROS, POUR DES PROS
Développé en collaboration avec des garagistes français, AutoReparis OS répond aux vrais besoins du terrain. Interface claire, workflows optimisés et zéro superflu.

Téléchargez AutoReparis OS et modernisez votre garage dès maintenant !"""


def generate_jwt():
    """Generate a JWT token for ASC API authentication."""
    with open(KEY_FILE, "r") as f:
        private_key = f.read()
    now = int(time.time())
    payload = {
        "iss": ISSUER_ID,
        "iat": now,
        "exp": now + 20 * 60,
        "aud": "appstoreconnect-v1",
    }
    headers = {"alg": "ES256", "kid": API_KEY_ID, "typ": "JWT"}
    return jwt.encode(payload, private_key, algorithm="ES256", headers=headers)


def hdrs(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def GET(token, path, params=None):
    url = f"{BASE_URL}{path}"
    r = requests.get(url, headers=hdrs(token), params=params)
    print(f"  GET {path} -> {r.status_code}")
    if r.status_code >= 400:
        print(f"    {r.text[:800]}")
    return r


def POST(token, path, data):
    url = f"{BASE_URL}{path}"
    r = requests.post(url, headers=hdrs(token), json=data)
    print(f"  POST {path} -> {r.status_code}")
    if r.status_code >= 400:
        print(f"    {r.text[:1200]}")
    return r


def PATCH(token, path, data):
    url = f"{BASE_URL}{path}"
    r = requests.patch(url, headers=hdrs(token), json=data)
    print(f"  PATCH {path} -> {r.status_code}")
    if r.status_code >= 400:
        print(f"    {r.text[:1200]}")
    return r


def DELETE(token, path):
    url = f"{BASE_URL}{path}"
    r = requests.delete(url, headers=hdrs(token))
    print(f"  DELETE {path} -> {r.status_code}")
    if r.status_code >= 400:
        print(f"    {r.text[:800]}")
    return r


def section(title):
    print(f"\n{'='*70}\n{title}\n{'='*70}")


# ══════════════════════════════════════════════════════════════════════
# STEP 1: Generate JWT
# ══════════════════════════════════════════════════════════════════════
section("STEP 1: Generate JWT token")
token = generate_jwt()
print(f"  Token: {token[:60]}...")

# ══════════════════════════════════════════════════════════════════════
# STEP 2: Verify API access
# ══════════════════════════════════════════════════════════════════════
section("STEP 2: Verify API access")
r = GET(token, f"/apps/{APP_ID}")
if r.status_code != 200:
    print("FATAL: Cannot access app.")
    sys.exit(1)
app_data = r.json()["data"]["attributes"]
print(f"  App: {app_data.get('name')} | Bundle: {app_data.get('bundleId')}")

# ══════════════════════════════════════════════════════════════════════
# STEP 3: Check build #38
# ══════════════════════════════════════════════════════════════════════
section("STEP 3: Check build #38")
r = GET(token, "/builds", params={
    "filter[app]": APP_ID,
    "filter[version]": "38",
    "sort": "-uploadedDate",
    "limit": 5,
})
build_id = None
if r.status_code == 200:
    builds = r.json().get("data", [])
    for b in builds:
        a = b["attributes"]
        print(f"  Build {a.get('version')} | State: {a.get('processingState')} | "
              f"Uploaded: {a.get('uploadedDate')}")
    if builds:
        build_id = builds[0]["id"]
        print(f"  --> Build ID: {build_id} (state: {builds[0]['attributes']['processingState']})")
    else:
        print("  Build #38 not found. Listing all recent builds...")
        r2 = GET(token, "/builds", params={
            "filter[app]": APP_ID, "sort": "-uploadedDate", "limit": 5
        })
        if r2.status_code == 200:
            for b in r2.json().get("data", []):
                a = b["attributes"]
                print(f"    Build {a.get('version')} | {a.get('processingState')} | {a.get('uploadedDate')}")
            all_b = r2.json().get("data", [])
            if all_b:
                build_id = all_b[0]["id"]

# ══════════════════════════════════════════════════════════════════════
# STEP 4: Find version (any version string, e.g. "1.0" or "1.0.0")
# ══════════════════════════════════════════════════════════════════════
section("STEP 4: Find App Store version")
r = GET(token, f"/apps/{APP_ID}/appStoreVersions", params={
    "filter[platform]": "IOS",
})
version_id = None
version_state = None
version_string = None
if r.status_code == 200:
    versions = r.json().get("data", [])
    for v in versions:
        vs = v["attributes"].get("versionString", "?")
        st = v["attributes"].get("appStoreState", "?")
        print(f"  Version '{vs}' | State: {st} | ID: {v['id']}")
    if versions:
        # Prefer editable version, otherwise take the first one
        for v in versions:
            st = v["attributes"].get("appStoreState", "")
            if st in ("PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED", "METADATA_REJECTED"):
                version_id = v["id"]
                version_state = st
                version_string = v["attributes"].get("versionString")
                break
        if not version_id:
            # Take the first version (likely WAITING_FOR_REVIEW or IN_REVIEW)
            version_id = versions[0]["id"]
            version_state = versions[0]["attributes"].get("appStoreState", "")
            version_string = versions[0]["attributes"].get("versionString", "?")
        print(f"  --> Using version '{version_string}' ({version_state}) -> {version_id}")

if not version_id:
    print("FATAL: No version found. Exiting.")
    sys.exit(1)

# ══════════════════════════════════════════════════════════════════════
# STEP 4b: If version is WAITING_FOR_REVIEW, reject it first
# ══════════════════════════════════════════════════════════════════════
EDITABLE_STATES = {"PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED", "METADATA_REJECTED"}

if version_state and version_state not in EDITABLE_STATES:
    section(f"STEP 4b: Version is '{version_state}' - attempting developer reject")
    print("  Need to pull the version from review to edit metadata.")

    # Try using the appStoreVersionSubmissions endpoint to delete the submission
    # First check if there's a submission
    r = GET(token, f"/appStoreVersions/{version_id}/appStoreVersionSubmission")
    if r.status_code == 200:
        submission_data = r.json().get("data")
        if submission_data:
            submission_id = submission_data["id"]
            print(f"  Found submission: {submission_id}")
            # Delete the submission (this removes from review)
            r = DELETE(token, f"/appStoreVersionSubmissions/{submission_id}")
            if r.status_code in (200, 204):
                print("  Submission deleted - version pulled from review!")
                version_state = "PREPARE_FOR_SUBMISSION"
            else:
                print("  Could not delete submission. Will try to update metadata anyway.")
        else:
            print("  No submission found. Will try to update metadata directly.")
    elif r.status_code == 404:
        print("  No submission resource found. Will try to update metadata directly.")
    else:
        print("  Could not check submission. Will try to update metadata directly.")

    # Re-check state after potential rejection
    if version_state not in EDITABLE_STATES:
        r = GET(token, f"/appStoreVersions/{version_id}")
        if r.status_code == 200:
            version_state = r.json()["data"]["attributes"].get("appStoreState", "")
            print(f"  Current version state: {version_state}")

# ══════════════════════════════════════════════════════════════════════
# STEP 5: Update version attributes
# ══════════════════════════════════════════════════════════════════════
section("STEP 5: Update version attributes (copyright)")
r = PATCH(token, f"/appStoreVersions/{version_id}", {
    "data": {
        "type": "appStoreVersions",
        "id": version_id,
        "attributes": {
            "copyright": COPYRIGHT,
            "releaseType": "MANUAL",
        }
    }
})
if r.status_code == 200:
    print("  Updated copyright and releaseType.")
else:
    print("  Note: Could not update version attributes (may not be editable).")

# ══════════════════════════════════════════════════════════════════════
# STEP 6: Set version localization (description, keywords, URLs)
# ══════════════════════════════════════════════════════════════════════
section("STEP 6: Set version localization (fr-FR)")
r = GET(token, f"/appStoreVersions/{version_id}/appStoreVersionLocalizations")
localization_id = None
if r.status_code == 200:
    for loc in r.json().get("data", []):
        locale = loc["attributes"].get("locale", "")
        print(f"  Localization: {locale} -> {loc['id']}")
        if locale == LOCALE:
            localization_id = loc["id"]

loc_attrs = {
    "description": DESCRIPTION,
    "keywords": KEYWORDS,
    "supportUrl": SUPPORT_URL,
    "marketingUrl": MARKETING_URL,
    "whatsNew": WHATS_NEW,
}

if localization_id:
    print(f"  Updating existing localization {localization_id}...")
    r = PATCH(token, f"/appStoreVersionLocalizations/{localization_id}", {
        "data": {
            "type": "appStoreVersionLocalizations",
            "id": localization_id,
            "attributes": loc_attrs,
        }
    })
    if r.status_code == 200:
        print("  Localization UPDATED: description, keywords, supportUrl, marketingUrl, whatsNew.")
    else:
        print("  Warning: Localization update failed.")
        # Try individual fields
        for field, value in loc_attrs.items():
            print(f"  Trying {field} individually...")
            r2 = PATCH(token, f"/appStoreVersionLocalizations/{localization_id}", {
                "data": {
                    "type": "appStoreVersionLocalizations",
                    "id": localization_id,
                    "attributes": {field: value},
                }
            })
            if r2.status_code == 200:
                print(f"    {field}: OK")
            else:
                print(f"    {field}: FAILED")
else:
    print(f"  Creating new {LOCALE} localization...")
    r = POST(token, "/appStoreVersionLocalizations", {
        "data": {
            "type": "appStoreVersionLocalizations",
            "attributes": {**loc_attrs, "locale": LOCALE},
            "relationships": {
                "appStoreVersion": {
                    "data": {"type": "appStoreVersions", "id": version_id}
                }
            }
        }
    })
    if r.status_code in (200, 201):
        localization_id = r.json()["data"]["id"]
        print(f"  Created localization: {localization_id}")
    else:
        print("  Failed to create localization.")

# ══════════════════════════════════════════════════════════════════════
# STEP 7: Set app-level info (subtitle, privacy policy URL)
# ══════════════════════════════════════════════════════════════════════
section("STEP 7: App-level info (subtitle, privacy policy)")
r = GET(token, f"/apps/{APP_ID}/appInfos")
app_info_id = None
if r.status_code == 200:
    infos = r.json().get("data", [])
    for ai in infos:
        st = ai["attributes"].get("appStoreState", "")
        print(f"  AppInfo {ai['id']} | State: {st}")
        # Prefer editable info
        if st in EDITABLE_STATES or st == "":
            app_info_id = ai["id"]
    if not app_info_id and infos:
        app_info_id = infos[0]["id"]
    print(f"  Using: {app_info_id}")

if app_info_id:
    r = GET(token, f"/appInfos/{app_info_id}/appInfoLocalizations")
    app_info_loc_id = None
    if r.status_code == 200:
        for ail in r.json().get("data", []):
            locale = ail["attributes"].get("locale", "")
            print(f"  AppInfoLocalization: {locale} -> {ail['id']}")
            if locale == LOCALE:
                app_info_loc_id = ail["id"]

    ail_attrs = {
        "subtitle": SUBTITLE,
        "privacyPolicyUrl": PRIVACY_POLICY_URL,
    }

    if app_info_loc_id:
        print(f"  Updating {app_info_loc_id}...")
        r = PATCH(token, f"/appInfoLocalizations/{app_info_loc_id}", {
            "data": {
                "type": "appInfoLocalizations",
                "id": app_info_loc_id,
                "attributes": ail_attrs,
            }
        })
        if r.status_code == 200:
            print("  Updated subtitle + privacy policy URL.")
        else:
            print("  Warning: Failed to update app info localization.")
            # Try fields individually
            for field, value in ail_attrs.items():
                print(f"  Trying {field} individually...")
                r2 = PATCH(token, f"/appInfoLocalizations/{app_info_loc_id}", {
                    "data": {
                        "type": "appInfoLocalizations",
                        "id": app_info_loc_id,
                        "attributes": {field: value},
                    }
                })
                if r2.status_code == 200:
                    print(f"    {field}: OK")
                else:
                    print(f"    {field}: FAILED ({r2.text[:300]})")
    else:
        print(f"  Creating {LOCALE} appInfoLocalization...")
        r = POST(token, "/appInfoLocalizations", {
            "data": {
                "type": "appInfoLocalizations",
                "attributes": {**ail_attrs, "locale": LOCALE},
                "relationships": {
                    "appInfo": {
                        "data": {"type": "appInfos", "id": app_info_id}
                    }
                }
            }
        })
        if r.status_code in (200, 201):
            print("  Created app info localization.")
        else:
            print("  Failed to create app info localization.")

# ══════════════════════════════════════════════════════════════════════
# STEP 8: App Review information (demo account + notes)
# ══════════════════════════════════════════════════════════════════════
section("STEP 8: App Review information")
r = GET(token, f"/appStoreVersions/{version_id}/appStoreReviewDetail")
review_id = None
if r.status_code == 200:
    rd = r.json().get("data")
    if rd:
        review_id = rd["id"]
        print(f"  Existing review detail: {review_id}")

review_attrs = {
    "contactFirstName": "Mike",
    "contactLastName": "MKDigital",
    "contactEmail": "contact@mkdigitalparis.com",
    "contactPhone": "+33600000000",
    "demoAccountName": REVIEW_EMAIL,
    "demoAccountPassword": REVIEW_PASSWORD,
    "demoAccountRequired": True,
    "notes": REVIEW_NOTES,
}

if review_id:
    r = PATCH(token, f"/appStoreReviewDetails/{review_id}", {
        "data": {
            "type": "appStoreReviewDetails",
            "id": review_id,
            "attributes": review_attrs,
        }
    })
    if r.status_code == 200:
        print("  Review detail UPDATED (demo account, review notes).")
    else:
        print("  Warning: Could not update review detail.")
else:
    print("  Creating review detail...")
    r = POST(token, "/appStoreReviewDetails", {
        "data": {
            "type": "appStoreReviewDetails",
            "attributes": review_attrs,
            "relationships": {
                "appStoreVersion": {
                    "data": {"type": "appStoreVersions", "id": version_id}
                }
            }
        }
    })
    if r.status_code in (200, 201):
        review_id = r.json()["data"]["id"]
        print(f"  Created review detail: {review_id}")
    else:
        print("  Failed to create review detail.")

# ══════════════════════════════════════════════════════════════════════
# STEP 9: Link build to version
# ══════════════════════════════════════════════════════════════════════
section("STEP 9: Link build to version")
if build_id:
    r = PATCH(token, f"/appStoreVersions/{version_id}/relationships/build", {
        "data": {"type": "builds", "id": build_id}
    })
    if r.status_code in (200, 204):
        print(f"  Build {build_id} linked to version.")
    elif r.status_code == 409:
        print("  Build already linked (409 conflict - this is OK).")
    else:
        print(f"  Warning: Could not link build.")
else:
    print("  No build ID available. Skipping.")

# ══════════════════════════════════════════════════════════════════════
# STEP 10: Final verification - read back localization
# ══════════════════════════════════════════════════════════════════════
section("STEP 10: Verify - read back version localization")
if localization_id:
    r = GET(token, f"/appStoreVersionLocalizations/{localization_id}")
    if r.status_code == 200:
        attrs = r.json()["data"]["attributes"]
        print(f"  Description length: {len(attrs.get('description', ''))}")
        print(f"  Keywords: {attrs.get('keywords', 'N/A')}")
        print(f"  Support URL: {attrs.get('supportUrl', 'N/A')}")
        print(f"  Marketing URL: {attrs.get('marketingUrl', 'N/A')}")
        print(f"  What's New: {attrs.get('whatsNew', 'N/A')}")

# ══════════════════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════════════════
section("SUMMARY")
print(f"  App ID:          {APP_ID}")
print(f"  Version:         {version_string} (ID: {version_id})")
print(f"  Version State:   {version_state}")
print(f"  Build ID:        {build_id}")
print(f"  Locale:          {LOCALE}")
print(f"  Localization ID: {localization_id}")
print(f"  Review Detail:   {review_id}")
print(f"  Description:     {len(DESCRIPTION)} chars")
print(f"  Keywords:        {len(KEYWORDS)} chars / 100")
print("=" * 70)
print("DONE!")
