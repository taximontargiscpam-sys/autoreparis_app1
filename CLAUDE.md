# CLAUDE.md — AutoReparis OS

## Project Overview

**AutoReparis OS** is a mobile garage management application for an auto repair shop (Auto Reparis) located in Drancy, France. It handles clients, vehicles, repair interventions, inventory/stock, team scheduling, website lead management, invoicing, and public vehicle tracking.

- **Framework**: React Native 0.81 via Expo 54 (SDK 54) with Expo Router 6
- **Language**: TypeScript (strict mode) — all UI text is in French
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Platforms**: iOS, Android, Web

## Quick Reference Commands

```bash
# Install dependencies (always use --legacy-peer-deps)
npm ci --legacy-peer-deps

# Development
npm start             # Start Expo dev server
npm run ios           # Run on iOS
npm run android       # Run on Android
npm run web           # Run on Web

# Testing
npm test              # Run Jest tests (with coverage)
npm run test:watch    # Watch mode

# Type checking
npx tsc --noEmit      # TypeScript check (no output)
```

## Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React Native 0.81 + React 19 |
| Routing | Expo Router 6 (file-based) |
| Styling | NativeWind 4 (Tailwind CSS 3 for RN) |
| Data Fetching | @tanstack/react-query 5 |
| Backend | Supabase (2 projects: app DB + website leads DB) |
| Auth | Supabase Auth with expo-secure-store |
| Validation | Zod 4 |
| Icons | lucide-react-native |
| Dates | date-fns (French locale) |
| Animations | react-native-reanimated 4 |
| Camera/Media | expo-camera, expo-image-picker |
| Notifications | expo-notifications |

### Directory Structure

```
├── app/                        # Expo Router screens (file-based routing)
│   ├── _layout.tsx             # Root: QueryClient + AuthProvider + Theme
│   ├── index.tsx               # Public landing page
│   ├── (auth)/login.tsx        # Email/password login
│   ├── (tabs)/                 # Authenticated tab navigation (6 tabs)
│   │   ├── _layout.tsx         # Tab bar config
│   │   ├── index.tsx           # Dashboard (KPIs)
│   │   ├── planning.tsx        # Team calendar & scheduling
│   │   ├── interventions.tsx   # Repair list (infinite scroll)
│   │   ├── stock.tsx           # Inventory by category
│   │   ├── clients/            # Client CRUD (stack)
│   │   └── leads/              # Website leads (stack, real-time)
│   ├── interventions/          # Intervention detail & create
│   ├── products/               # Product detail & create
│   ├── performance/            # Revenue analytics
│   ├── profile.tsx             # Team management & settings
│   ├── scan.tsx                # Barcode scanner
│   ├── tracking.tsx            # Public intervention tracking
│   └── public/search.tsx       # Public vehicle search
├── components/                 # Reusable UI components
│   ├── AuthContext.tsx          # Auth provider (session, role, isAdmin)
│   ├── useProtectedRoute.ts    # Route guard hook
│   ├── ErrorState.tsx           # Error fallback with retry
│   ├── StatusBadge.tsx          # Intervention status badges
│   ├── KPICard.tsx              # Animated dashboard metric card
│   └── intervention/           # Intervention sub-components
│       ├── InterventionSummary.tsx
│       ├── InterventionParts.tsx
│       └── InterventionPhotos.tsx
├── lib/                        # Business logic & data layer
│   ├── supabase.ts             # Main Supabase client (secure store)
│   ├── supabaseWebsite.ts      # Website leads Supabase client (anon)
│   ├── database.types.ts       # TypeScript types for all DB tables
│   ├── validations.ts          # Zod schemas for forms
│   ├── errorHandler.ts         # Error logging & alerts
│   ├── queryClient.ts          # React Query config (2min stale, 2 retries)
│   ├── notifications.ts        # Push notification registration
│   ├── services/               # Data access (Supabase queries)
│   │   ├── interventionService.ts
│   │   ├── clientService.ts
│   │   ├── productService.ts
│   │   ├── leadService.ts
│   │   └── teamService.ts
│   └── hooks/                  # React Query hooks (queries + mutations)
│       ├── useInterventions.ts
│       ├── useClients.ts
│       ├── useProducts.ts
│       ├── useLeads.ts
│       ├── useTeam.ts
│       └── useVehicleSearch.ts
├── constants/
│   ├── Colors.ts               # Light/dark theme colors
│   └── garage.ts               # Garage info (phone, address, URLs)
├── __tests__/                  # Jest test suite
│   ├── components/             # Component tests
│   ├── services/               # Service layer tests (all 5 services)
│   ├── helpers/mockSupabase.ts # Shared Supabase mock
│   ├── validations.test.ts
│   ├── errorHandler.test.ts
│   └── useVehicleSearch.test.ts
├── scripts/                    # Setup, seed, deploy, debug scripts
├── schema.sql                  # Full database schema (12 tables)
├── rls_policies.sql            # Row-Level Security policies
├── rpc_functions.sql           # Server-side business logic RPCs
└── rpc_secure_functions.sql    # Public (anonymous) RPC functions
```

### Data Flow

```
Screen → React Query Hook → Service → Supabase Client → PostgreSQL (RLS enforced)
                ↕                          ↕
        Cache + Mutations          Realtime Subscriptions
```

1. **Screens** call **hooks** (e.g., `useInterventions()`)
2. **Hooks** use React Query wrapping **services** (e.g., `interventionService.list()`)
3. **Services** call **Supabase** client with typed queries
4. **RLS policies** enforce authorization at the database level
5. **Mutations** invalidate relevant query keys for automatic cache refresh
6. **Real-time subscriptions** trigger refetch on external changes

## Database

### Tables (12)

| Table | Purpose |
|-------|---------|
| `users` | Team members (extends auth.users) — roles: admin, frontdesk, mecanicien, lecture |
| `clients` | Customers |
| `vehicles` | Client vehicles (FK → clients) |
| `products` | Inventory items with stock tracking |
| `interventions` | Repair jobs (FK → clients, vehicles, users) |
| `intervention_lines` | Parts & labor line items (FK → interventions, products) |
| `leads_site_web` | Website quote requests with conversion tracking |
| `stock_movements` | Inventory audit trail |
| `vehicle_photos` | Before/after repair photos (Supabase Storage) |
| `team_availability` | Daily team presence/absence calendar |
| `invoices` | Billing records |
| `activity_log` | Audit trail (jsonb details) |

### Key Enums (all text-based)

- **UserRole**: `admin`, `frontdesk`, `mecanicien`, `lecture`
- **InterventionStatus**: `planifiee`, `en_cours`, `en_attente_pieces`, `terminee`, `facturee`, `annulee`, `no_show`
- **ProductCategory**: `mecanique`, `carrosserie`, `entretien`, `pneus`, `batterie`, `autre`
- **LeadStatus**: `nouveau`, `en_traitement`, `transformé_en_client`, `perdu`

### RLS Authorization Model

- `get_user_role()` / `has_write_access()` / `is_admin()` — helper functions
- **SELECT**: All authenticated users can read all tables
- **INSERT/UPDATE**: Requires `has_write_access()` (admin, frontdesk, or mecanicien)
- **DELETE**: Most tables require `is_admin()` only
- **Public RPCs**: `get_vehicle_status_public()` and `get_intervention_details_public()` use `SECURITY DEFINER` for anonymous access

### RPC Functions

| Function | Auth | Purpose |
|----------|------|---------|
| `create_full_intervention()` | Auth'd | Atomic creation of client + vehicle + intervention |
| `recalculate_intervention_totals()` | Auth'd | Recalculate totals from line items |
| `get_dashboard_stats()` | Auth'd | KPI aggregation (counts, revenue) |
| `get_performance_stats(days)` | Auth'd | Revenue analytics |
| `get_vehicle_status_public(plate)` | Public | Find intervention by license plate |
| `get_intervention_details_public(id)` | Public | Limited intervention details for customers |

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
EXPO_PUBLIC_SUPABASE_URL=            # Main app Supabase URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=       # Main app anon key
EXPO_PUBLIC_WEBSITE_SUPABASE_URL=    # Website leads Supabase URL
EXPO_PUBLIC_WEBSITE_SUPABASE_ANON_KEY= # Website leads anon key
```

Both use anon (public) keys — security is enforced via RLS at the database level.

## Conventions & Patterns

### File Naming

- **Screens**: Default exports, file name = route path (Expo Router)
- **Components**: PascalCase (`KPICard.tsx`, `StatusBadge.tsx`)
- **Hooks**: camelCase with `use` prefix (`useInterventions.ts`)
- **Services**: camelCase with `Service` suffix (`interventionService.ts`)
- **Types**: PascalCase interfaces in `lib/database.types.ts`

### Import Aliases

Use `@/` path alias (maps to project root):
```typescript
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthContext';
```

### Component Pattern

```typescript
export default function ScreenName() {
  const { data, isLoading, error } = useCustomHook();

  if (isLoading) return <ActivityIndicator />;
  if (error) return <ErrorState message="..." onRetry={refetch} />;

  return <View className="flex-1 bg-slate-950">...</View>;
}
```

### Service Pattern

```typescript
export const exampleService = {
  async list(search = '', page = 0) {
    const PAGE_SIZE = 30;
    let query = supabase.from('table').select('*', { count: 'exact' });
    if (search) query = query.ilike('name', `%${search}%`);
    const { data, error, count } = await query
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { data: data ?? [], total: count ?? 0 };
  },
};
```

### Hook Pattern

```typescript
export function useItems(search: string) {
  return useQuery({
    queryKey: ['items', search],
    queryFn: () => itemService.list(search),
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => itemService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}
```

### Styling

- Use **NativeWind** className strings (Tailwind syntax) — no StyleSheet objects
- Theme colors: primary `#0090E7` (blue), secondary `#FC6A03` (orange)
- Dark backgrounds: `bg-slate-950` (`#0f172a`), `bg-slate-900`
- Text: `text-white`, `text-gray-400` for secondary

### Validation

All forms use **Zod** schemas from `lib/validations.ts`:
```typescript
import { clientSchema } from '@/lib/validations';
const result = clientSchema.safeParse(formData);
if (!result.success) { /* show error */ }
```

### Error Handling

```typescript
import { handleError, logErrorSilent } from '@/lib/errorHandler';
// User-facing: shows Alert dialog
handleError(error, 'Custom message');
// Silent: logs to in-memory buffer (max 50)
logErrorSilent(error, 'context');
```

### Authentication

- `useAuth()` hook provides: `session`, `user`, `isAuthenticated`, `isAdmin`, `userRole`
- `useProtectedRoute()` redirects unauthenticated users from protected screens
- Public routes: `/`, `/(auth)/*`, `/portal`, `/tracking`, `/public/*`
- Tokens stored in expo-secure-store (iOS Keychain / Android Keystore)

### Accessibility

All interactive elements include:
- `accessibilityLabel` — descriptive text
- `accessibilityRole` — button, tab, link, etc.
- `accessibilityState` — selected, disabled
- `accessibilityHint` — action description

### Pagination

Standard page size is **30 items**. Screens use either:
- `useInfinite*()` hooks for infinite scroll (FlatList `onEndReached`)
- `use*()` with page parameter for manual pagination

### Real-Time

Supabase Realtime channels are used for:
- New leads (`devis_auto` table on website DB)
- Intervention changes
- Product/stock updates
- Intervention photos and lines

## Testing

### Framework

- **Jest** with **jest-expo** preset
- **@testing-library/react-native** for component tests
- Mocks configured in `jest.setup.js` (Reanimated, AsyncStorage, expo modules, Supabase)

### Coverage Thresholds

```
lib/services/: 75% statements, 50% branches, 100% functions, 100% lines
```

### Test Organization

```
__tests__/
├── helpers/mockSupabase.ts      # Shared chainable Supabase query mock
├── services/*.test.ts           # All 5 service modules tested
├── components/*.test.tsx        # ErrorState, StatusBadge
├── validations.test.ts          # Zod schema tests
├── errorHandler.test.ts         # Error utility tests
├── useVehicleSearch.test.ts     # Hook test
└── sanity.test.tsx              # Basic sanity check
```

### Running Tests

```bash
npm test                    # Full suite with coverage
npm run test:watch          # Watch mode for development
npx jest __tests__/services # Run specific directory
npx jest --testPathPattern=validations  # Run by pattern
```

## CI/CD

### GitHub Actions (`.github/workflows/ci.yml`)

Runs on push to `main` and PRs targeting `main`:

1. **test** job: `npm ci --legacy-peer-deps` → `npm test`
2. **typecheck** job: `npm ci --legacy-peer-deps` → `npx tsc --noEmit`

Both jobs run on `ubuntu-latest` with Node.js 20.

### EAS Build (`eas.json`)

- **development**: Dev client, internal distribution
- **preview**: Internal distribution for testing
- **production**: Auto-increment build number, iOS medium resource class

### GitHub Pages (`.github/workflows/pages.yml`)

Deploys `/docs` directory (privacy policy, terms) to GitHub Pages on changes.

## Key Files Reference

| File | Purpose |
|------|---------|
| `lib/database.types.ts` | All TypeScript interfaces and enums for the DB |
| `lib/validations.ts` | Zod schemas for all forms (client, vehicle, product, etc.) |
| `lib/supabase.ts` | Main Supabase client with secure token storage |
| `lib/supabaseWebsite.ts` | Read-only client for website leads DB |
| `lib/queryClient.ts` | React Query defaults (2min stale, 2 retries, no window refocus) |
| `constants/garage.ts` | Centralized garage info (phone, address, legal URLs) |
| `components/AuthContext.tsx` | Auth provider with role-based access |
| `schema.sql` | Complete database DDL |
| `rls_policies.sql` | All RLS policies and helper functions |
| `rpc_functions.sql` | Business logic RPCs (create intervention, dashboard stats) |
| `rpc_secure_functions.sql` | Public RPCs for anonymous vehicle tracking |

## Important Notes

- **Language**: All UI strings, error messages, and database content are in **French**. Maintain French for all user-facing text.
- **Two Supabase projects**: The app DB (`supabase.ts`) and the website leads DB (`supabaseWebsite.ts`) are separate. Leads come from an external website form.
- **No i18n library**: French strings are hardcoded throughout. There is no translation system.
- **`--legacy-peer-deps`**: Always use this flag with `npm install` / `npm ci` due to peer dependency conflicts.
- **Typed routes**: Expo Router typed routes are enabled (`experiments.typedRoutes` in `app.json`). Use `href` types from expo-router.
- **Reanimated plugin**: The Reanimated Babel plugin is commented out in `babel.config.js`. If adding new Reanimated worklet features, it may need to be re-enabled.
- **Page size**: All paginated services use 30 items per page.
- **Soft deletes**: Team members use soft delete (`actif: false`). Most other entities are hard-deleted.
- **Generated columns**: `intervention_lines` has computed `total_achat_ligne` and `total_vente_ligne` columns — don't set these directly.
