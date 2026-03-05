#!/usr/bin/env python3
"""
Upload screenshots to App Store Connect via API.
Process:
1. Get version & localization
2. Create screenshotSet for iPhone 6.7"
3. Reserve each screenshot upload
4. Upload file data via the upload operations
5. Commit the upload
"""

import jwt
import time
import sys
import os
import hashlib
import json

# Use urllib instead of requests to avoid dependency issues
import urllib.request
import urllib.error

# ── Configuration ──
API_KEY_ID = "C2G27ANQC7"
ISSUER_ID = "20260351-be55-465f-af4d-11200a82d927"
KEY_FILE = "/Users/mike/clawd/projects/autoreparis_app1/AuthKey_C2G27ANQC7.p8"
APP_ID = "6757646990"
BASE_URL = "https://api.appstoreconnect.apple.com/v1"

SCREENSHOTS_DIR = os.path.dirname(os.path.abspath(__file__))
DISPLAY_TYPE = "APP_IPHONE_67"  # 6.7" iPhone (1290x2796)

# Screenshots in order
SCREENSHOTS = [
    "01_home.png",
    "02_login.png",
    "03_dashboard.png",
    "04_interventions.png",
    "05_clients.png",
]


def generate_jwt():
    with open(KEY_FILE, "r") as f:
        private_key = f.read()
    now = int(time.time())
    payload = {
        "iss": ISSUER_ID,
        "iat": now,
        "exp": now + 20 * 60,
        "aud": "appstoreconnect-v1",
    }
    headers_dict = {"alg": "ES256", "kid": API_KEY_ID, "typ": "JWT"}
    return jwt.encode(payload, private_key, algorithm="ES256", headers=headers_dict)


def api_request(token, method, path, data=None, content_type="application/json"):
    url = f"{BASE_URL}{path}" if path.startswith("/") else path
    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")

    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", content_type)

    try:
        resp = urllib.request.urlopen(req)
        response_body = resp.read().decode("utf-8")
        if response_body:
            return resp.status, json.loads(response_body)
        return resp.status, {}
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(error_body)
        except:
            return e.code, {"raw": error_body[:800]}


def upload_part(url, file_data, method="PUT", content_type="application/octet-stream", extra_headers=None):
    """Upload raw file data to a URL."""
    req = urllib.request.Request(url, data=file_data, method=method)
    req.add_header("Content-Type", content_type)
    if extra_headers:
        for k, v in extra_headers.items():
            req.add_header(k, v)
    try:
        resp = urllib.request.urlopen(req)
        return resp.status
    except urllib.error.HTTPError as e:
        print(f"    Upload error: {e.code} {e.read().decode()[:300]}")
        return e.code


def GET(token, path, params=None):
    if params:
        query = "&".join(f"{k}={urllib.parse.quote(str(v))}" for k, v in params.items())
        path = f"{path}?{query}"
    status, body = api_request(token, "GET", path)
    print(f"  GET {path.split('?')[0]} -> {status}")
    return status, body


def POST(token, path, data):
    status, body = api_request(token, "POST", path, data)
    print(f"  POST {path} -> {status}")
    if status >= 400:
        errors = body.get("errors", [])
        for e in errors[:3]:
            print(f"    Error: {e.get('detail', e.get('title', str(e)[:200]))}")
    return status, body


def PATCH(token, path, data):
    status, body = api_request(token, "PATCH", path, data)
    print(f"  PATCH {path} -> {status}")
    if status >= 400:
        errors = body.get("errors", [])
        for e in errors[:3]:
            print(f"    Error: {e.get('detail', e.get('title', str(e)[:200]))}")
    return status, body


def DELETE(token, path):
    status, body = api_request(token, "DELETE", path)
    print(f"  DELETE {path} -> {status}")
    return status, body


def section(title):
    print(f"\n{'='*60}\n{title}\n{'='*60}")


import urllib.parse

# ═══════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════

section("STEP 1: Generate JWT")
token = generate_jwt()
print(f"  Token: {token[:50]}...")

section("STEP 2: Find App Store Version & Localization")
status, body = GET(token, f"/apps/{APP_ID}/appStoreVersions", {"filter[platform]": "IOS"})
if status != 200:
    print("FATAL: Cannot get versions")
    sys.exit(1)

version_id = None
version_state = None
for v in body.get("data", []):
    vs = v["attributes"].get("versionString", "?")
    st = v["attributes"].get("appStoreState", "?")
    print(f"  Version '{vs}' | State: {st}")
    version_id = v["id"]
    version_state = st
    break  # Take first

if not version_id:
    print("FATAL: No version found")
    sys.exit(1)

print(f"  --> Version ID: {version_id} | State: {version_state}")

# If WAITING_FOR_REVIEW, we need to pull it from review first
EDITABLE_STATES = {"PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED", "METADATA_REJECTED"}
if version_state not in EDITABLE_STATES:
    section("STEP 2b: Pull version from review to edit")
    # Try to delete the submission
    status, body = GET(token, f"/appStoreVersions/{version_id}/appStoreVersionSubmission")
    if status == 200 and body.get("data"):
        submission_id = body["data"]["id"]
        print(f"  Found submission: {submission_id}")
        status, _ = DELETE(token, f"/appStoreVersionSubmissions/{submission_id}")
        if status in (200, 204):
            print("  Submission removed - version is now editable!")
            version_state = "PREPARE_FOR_SUBMISSION"
        else:
            print("  WARNING: Could not remove submission. Will try anyway...")
    else:
        print("  No submission found or cannot access. Will try anyway...")

# Get localization
section("STEP 3: Get version localization")
status, body = GET(token, f"/appStoreVersions/{version_id}/appStoreVersionLocalizations")
localization_id = None
if status == 200:
    for loc in body.get("data", []):
        locale = loc["attributes"].get("locale", "")
        print(f"  Localization: {locale} -> {loc['id']}")
        if locale == "fr-FR":
            localization_id = loc["id"]

if not localization_id:
    print("FATAL: No fr-FR localization found")
    sys.exit(1)

# Check existing screenshot sets
section("STEP 4: Check/Create Screenshot Set")
status, body = GET(token, f"/appStoreVersionLocalizations/{localization_id}/appScreenshotSets")
screenshot_set_id = None
if status == 200:
    for ss in body.get("data", []):
        dt = ss["attributes"].get("screenshotDisplayType", "")
        print(f"  Screenshot set: {dt} -> {ss['id']}")
        if dt == DISPLAY_TYPE:
            screenshot_set_id = ss["id"]

if screenshot_set_id:
    print(f"  Found existing set for {DISPLAY_TYPE}: {screenshot_set_id}")
    # Delete existing screenshots in this set
    status, body = GET(token, f"/appScreenshotSets/{screenshot_set_id}/appScreenshots")
    if status == 200:
        existing = body.get("data", [])
        if existing:
            print(f"  Deleting {len(existing)} existing screenshots...")
            for sc in existing:
                DELETE(token, f"/appScreenshots/{sc['id']}")
else:
    print(f"  Creating screenshot set for {DISPLAY_TYPE}...")
    status, body = POST(token, "/appScreenshotSets", {
        "data": {
            "type": "appScreenshotSets",
            "attributes": {
                "screenshotDisplayType": DISPLAY_TYPE,
            },
            "relationships": {
                "appStoreVersionLocalization": {
                    "data": {
                        "type": "appStoreVersionLocalizations",
                        "id": localization_id,
                    }
                }
            }
        }
    })
    if status in (200, 201):
        screenshot_set_id = body["data"]["id"]
        print(f"  Created set: {screenshot_set_id}")
    else:
        print("FATAL: Could not create screenshot set")
        sys.exit(1)

# Upload each screenshot
section("STEP 5: Upload Screenshots")
for i, filename in enumerate(SCREENSHOTS):
    filepath = os.path.join(SCREENSHOTS_DIR, filename)
    if not os.path.exists(filepath):
        print(f"  [{i+1}/{len(SCREENSHOTS)}] SKIP: {filename} not found")
        continue

    filesize = os.path.getsize(filepath)
    with open(filepath, "rb") as f:
        file_data = f.read()

    checksum = hashlib.md5(file_data).hexdigest()

    print(f"\n  [{i+1}/{len(SCREENSHOTS)}] {filename} ({filesize} bytes, md5: {checksum})")

    # Reserve the screenshot
    status, body = POST(token, "/appScreenshots", {
        "data": {
            "type": "appScreenshots",
            "attributes": {
                "fileName": filename,
                "fileSize": filesize,
            },
            "relationships": {
                "appScreenshotSet": {
                    "data": {
                        "type": "appScreenshotSets",
                        "id": screenshot_set_id,
                    }
                }
            }
        }
    })

    if status not in (200, 201):
        print(f"    FAILED to reserve upload for {filename}")
        continue

    screenshot_id = body["data"]["id"]
    upload_ops = body["data"]["attributes"].get("uploadOperations", [])
    print(f"    Reserved: {screenshot_id} | {len(upload_ops)} upload operation(s)")

    # Execute upload operations
    all_ok = True
    for op_idx, op in enumerate(upload_ops):
        op_url = op["url"]
        op_method = op.get("method", "PUT")
        op_offset = op.get("offset", 0)
        op_length = op.get("length", filesize)
        op_headers = {}
        for h in op.get("requestHeaders", []):
            op_headers[h["name"]] = h["value"]

        chunk = file_data[op_offset:op_offset + op_length]
        print(f"    Uploading part {op_idx+1}/{len(upload_ops)} ({len(chunk)} bytes)...")

        req = urllib.request.Request(op_url, data=chunk, method=op_method)
        for k, v in op_headers.items():
            req.add_header(k, v)

        try:
            resp = urllib.request.urlopen(req)
            print(f"    Part {op_idx+1}: {resp.status} OK")
        except urllib.error.HTTPError as e:
            print(f"    Part {op_idx+1}: FAILED ({e.code})")
            all_ok = False

    if not all_ok:
        print(f"    WARNING: Some parts failed for {filename}")
        continue

    # Commit the upload
    print(f"    Committing upload...")
    status, body = PATCH(token, f"/appScreenshots/{screenshot_id}", {
        "data": {
            "type": "appScreenshots",
            "id": screenshot_id,
            "attributes": {
                "uploaded": True,
                "sourceFileChecksum": checksum,
            }
        }
    })

    if status == 200:
        asset_state = body.get("data", {}).get("attributes", {}).get("assetDeliveryState", {})
        print(f"    Committed! State: {asset_state.get('state', 'unknown')}")
    else:
        print(f"    Commit failed!")

# Re-submit if we pulled from review
section("STEP 6: Re-submit for review")
if version_state == "PREPARE_FOR_SUBMISSION":
    # First update the review info with correct demo credentials
    status, body = GET(token, f"/appStoreVersions/{version_id}/appStoreReviewDetail")
    if status == 200 and body.get("data"):
        review_id = body["data"]["id"]
        PATCH(token, f"/appStoreReviewDetails/{review_id}", {
            "data": {
                "type": "appStoreReviewDetails",
                "id": review_id,
                "attributes": {
                    "demoAccountName": "admin@autoreparis.com",
                    "demoAccountPassword": "Garage2026!",
                    "demoAccountRequired": True,
                    "notes": "Application B2B de gestion pour garages automobiles. Utilisez le compte admin fourni pour accéder à toutes les fonctionnalités (dashboard, interventions, clients, stock, planning).",
                }
            }
        })

    print("  Submitting for review...")
    status, body = POST(token, "/appStoreVersionSubmissions", {
        "data": {
            "type": "appStoreVersionSubmissions",
            "relationships": {
                "appStoreVersion": {
                    "data": {
                        "type": "appStoreVersions",
                        "id": version_id,
                    }
                }
            }
        }
    })
    if status in (200, 201):
        print("  Submitted for review!")
    else:
        print("  Could not re-submit. Check manually.")
else:
    print("  Version was not pulled from review, no re-submission needed.")

section("DONE")
print("Screenshots uploaded successfully!")
