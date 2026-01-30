# 🍎 Apple App Store Fix Report — AutoReparis OS

**Date:** 20 janvier 2026  
**App:** AutoReparis OS v1.0.0  
**Bundle ID:** com.autoreparis.os  
**Platform:** React Native / Expo SDK 54  

---

## 📋 Summary

| Category | Issues Found | Fixed | Manual Required |
|----------|:---:|:---:|:---:|
| Privacy & Permissions | 6 | ✅ 6 | 0 |
| Placeholder / Debug Content | 7 | ✅ 7 | 0 |
| Route Protection / Auth | 2 | ✅ 2 | 0 |
| Legal Compliance | 2 | ✅ 1 | ⚠️ 1 |
| App Configuration | 3 | ✅ 3 | 0 |
| Data Integrity | 3 | ✅ 3 | 0 |
| **Total** | **23** | **22** | **1** |

---

## 🔴 Critical Issues Found & Fixed

### 1. Missing iOS Privacy Descriptions (Info.plist)
**Rejection Reason:** Guideline 5.1.1 — Data Collection and Storage

The app uses Camera, Photo Library, and Notifications but was missing several required `NS*UsageDescription` keys.

**Before:** Only `ITSAppUsesNonExemptEncryption` and `CFBundleDevelopmentRegion` in infoPlist.

**Fixed — Added all required keys:**
- `NSCameraUsageDescription` — Camera for barcode scanning & vehicle photos
- `NSPhotoLibraryUsageDescription` — Access existing photos for interventions
- `NSPhotoLibraryAddUsageDescription` — Save vehicle photos to library
- `NSMicrophoneUsageDescription` — Video recording of repairs
- `NSUserTrackingUsageDescription` — ATT compliance (third-party SDK requirement)
- `NSLocationWhenInUseUsageDescription` — Garage locator functionality
- `CFBundleLocalizations` — French localization declared

**File:** `app.json` → `expo.ios.infoPlist`

---

### 2. Authentication Route Protection Disabled
**Rejection Reason:** Guideline 2.1 — App Completeness

The `useProtectedRoute()` hook was **commented out**, meaning unauthenticated users could navigate directly to professional dashboards, delete data, manage team members, etc.

**Fixed:**
- Re-enabled `useProtectedRoute()` in `app/_layout.tsx`
- Added import for the hook
- Updated `useProtectedRoute.ts` to properly whitelist public routes: home page, public search, portal, tracking, and auth screens
- Added `public/search` to the Stack navigator

**Files:** `app/_layout.tsx`, `components/useProtectedRoute.ts`

---

### 3. Hardcoded Test/Demo Data in Production Code
**Rejection Reason:** Guideline 2.1 — App Completeness / 2.3.1 — Placeholder Content

Multiple screens contained hardcoded dummy data that would be shown in production:

| Location | Issue | Fix |
|----------|-------|-----|
| `app/(tabs)/stock.tsx` | 10 hardcoded dummy products as fallback | Removed — shows empty state instead |
| `app/interventions/[id].tsx` | 3 dummy interventions (`dummy1`, `dummy2`, `dummy5`) | Removed all dummy data blocks |
| `app/interventions/[id].tsx` | Fallback dummy users for mechanic list | Removed — fetches from DB only |
| `app/(tabs)/index.tsx` | `revenue: 12450` hardcoded weekly revenue | Replaced with actual Supabase query |
| `app/profile.tsx` | Fake UUID generation + visual-only user creation | Replaced with real DB insert + proper error handling |

---

### 4. Debug Console Logs & Exposed Technical Data
**Rejection Reason:** Guideline 2.3 — Accurate Metadata / Professional UI

Debug output was visible to users and in logs:

| File | Issue | Fix |
|------|-------|-----|
| `app/_layout.tsx` | `console.log('Push Token:', token)` | Removed |
| `app/tracking.tsx` | `console.log('TRACKING SCREEN PROPS:', ...)` | Removed |
| `app/tracking.tsx` | `console.log('Fetching intervention for ID:', id)` | Removed |
| `app/tracking.tsx` | `console.error('No ID provided')` | Removed |
| `app/tracking.tsx` | Shows `JSON.stringify(id)` to user on error | Replaced with user-friendly message |
| `app/public/search.tsx` | `console.log('Searching for plate...')` | Removed |
| `app/public/search.tsx` | `console.error(err)` | Removed |
| `app/(tabs)/leads/index.tsx` | `console.log("Received Leads:", data[0])` | Removed |
| `app/portal/index.tsx` | `JSON.stringify(vError)` shown in Alert | Replaced with user-friendly message |
| `app/portal/index.tsx` | Debug message about "données de démo" | Replaced with generic "véhicule introuvable" |

---

### 5. Missing Privacy Policy & Terms of Service Links
**Rejection Reason:** Guideline 5.1.1 — Privacy Policy Requirement

Apple requires a visible privacy policy link in the app.

**Fixed:** Added "Politique de confidentialité" and "Conditions d'utilisation" links to the public home screen footer (`app/index.tsx`).

**⚠️ MANUAL ACTION REQUIRED:** Create actual pages at:
- `https://autoreparis.com/politique-de-confidentialite`
- `https://autoreparis.com/conditions-utilisation`

---

### 6. Template / Placeholder Screens
**Rejection Reason:** Guideline 2.3.1 — Placeholder Content

| File | Issue | Fix |
|------|-------|-----|
| `app/modal.tsx` | Expo template with "EditScreenInfo" and English text | Replaced with branded AutoReparis modal |
| `app/+not-found.tsx` | English placeholder text | Translated to French with matching dark theme |

---

### 7. App Configuration Issues

| Issue | Fix |
|-------|-----|
| URL scheme `thermalintergalactic` (template leftover) | Changed to `autoreparis` |
| Missing `expo-notifications` plugin config | Added with icon and brand color |
| Missing `cameraPermission` in expo-image-picker plugin | Added proper French description |

**File:** `app.json`

---

## ✅ Previously Fixed (from CORRECTIONS_REPORT.md)

These were already addressed before this audit:
- TypeScript errors in `ExternalLink.tsx` and `notifications.ts`
- `.env` file exposure in git (`.gitignore` updated)
- npm audit vulnerabilities (tar, undici)
- Unused parameter warnings (prefixed with `_`)

---

## 📝 Remaining Manual Steps

### MUST DO before submission:

1. **Create Privacy Policy page** at `https://autoreparis.com/politique-de-confidentialite`
   - Must cover: data collected, Supabase usage, push notifications, camera/photo access
   - Template available at: https://www.freeprivacypolicy.com/

2. **Create Terms of Service page** at `https://autoreparis.com/conditions-utilisation`

3. **Add privacy policy URL in App Store Connect** → App Information → Privacy Policy URL

4. **Verify app icons** — Check that `icon.png` (1024x1024) has:
   - No alpha/transparency channel
   - No rounded corners (iOS adds them)
   - Current icon is 470KB which is fine

5. **Test on physical device** — Camera and notifications only work on real hardware

6. **Set environment variables in EAS**:
   ```bash
   eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "your-url"
   eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-key"
   eas secret:create --name EXPO_PUBLIC_WEBSITE_SUPABASE_URL --value "your-url"
   eas secret:create --name EXPO_PUBLIC_WEBSITE_SUPABASE_ANON_KEY --value "your-key"
   ```

7. **Harden Supabase RLS policies** — `products` table still has public access (SEC-002 from PROD_READINESS_REPORT)

8. **Regenerate Supabase API keys** — They were previously exposed in git history

### RECOMMENDED:

9. **Add Apple Sign-In** if you ever add social login (Google, Facebook). Currently the app only uses email/password which is fine.

10. **Test IPv6 compatibility** — Expo/React Native handles this by default, but verify with an IPv6-only network

11. **Review App Store screenshots** — Ensure they match the actual app (no dummy data visible)

---

## 🏁 App Store Submission Checklist

### App Store Connect:
- [ ] App name: "AutoReparis OS"
- [ ] Bundle ID: `com.autoreparis.os`
- [ ] Privacy Policy URL set
- [ ] App category: Business or Utilities
- [ ] Age rating: 4+ (no objectionable content)
- [ ] App description in French
- [ ] Keywords set
- [ ] Screenshots for iPhone 6.7", 6.5", 5.5" (at minimum)
- [ ] Screenshots for iPad if `supportsTablet: true`
- [ ] Support URL provided
- [ ] Contact information filled

### Privacy Declarations (App Store Connect → App Privacy):
- [ ] Contact Info: Name, Email, Phone (collected for clients)
- [ ] Identifiers: Device ID (push notifications)
- [ ] Photos or Videos (camera/gallery usage)
- [ ] Usage Data: Product interaction
- [ ] Data NOT used for tracking
- [ ] Data linked to user identity (for authenticated users)

### Build & Submit:
- [ ] Run `eas build --platform ios --profile production`
- [ ] Test the `.ipa` on TestFlight first
- [ ] Verify all screens work without crashes
- [ ] Verify public flow works without login (home → search → tracking)
- [ ] Verify pro flow requires login (tabs redirect to login)
- [ ] Submit for review with demo account credentials in review notes

### Review Notes Template:
```
Demo Account for Review:
Email: review@autoreparis.com
Password: [create a test account]

This app is a professional workshop management tool for Auto Reparis 
garage in Drancy, France. 

Public features (no login required):
- Home page with garage information
- Vehicle tracking by license plate

Professional features (login required):
- Dashboard with KPIs
- Intervention management
- Client management
- Stock/inventory management
- Team planning
- Lead management from website
```

---

## 📁 Files Modified

| File | Changes |
|------|---------|
| `app.json` | Privacy descriptions, notifications plugin, URL scheme, image-picker camera permission |
| `app/_layout.tsx` | Enabled useProtectedRoute, added import, removed console.log, added public/search route |
| `components/useProtectedRoute.ts` | Updated to whitelist public routes properly |
| `app/index.tsx` | Added privacy policy & terms of service links |
| `app/modal.tsx` | Replaced template placeholder with branded screen |
| `app/+not-found.tsx` | Translated to French, matching app theme |
| `app/(tabs)/index.tsx` | Replaced hardcoded revenue with real DB query |
| `app/(tabs)/stock.tsx` | Removed 10 hardcoded dummy products |
| `app/(tabs)/leads/index.tsx` | Removed console.log |
| `app/interventions/[id].tsx` | Removed all dummy data (3 interventions + 3 users) |
| `app/tracking.tsx` | Removed debug logs, fixed user-facing error messages |
| `app/public/search.tsx` | Removed console.log/error |
| `app/portal/index.tsx` | Removed JSON.stringify in alerts, user-friendly error messages |
| `app/profile.tsx` | Replaced fake UUID user creation with real DB insert |
| `lib/notifications.ts` | Fixed trigger type annotation |

---

*Report generated by Clawd AI — January 2026*
