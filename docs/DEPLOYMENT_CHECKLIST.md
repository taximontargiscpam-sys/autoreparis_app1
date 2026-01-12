# DEPLOYMENT CHECKLIST

## Environment Variables
- [ ] `EXPO_PUBLIC_SUPABASE_URL`
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (Only for backend/scripts, NOT in client app)

## Database
- [ ] Run `schema.sql` (Base structure)
- [ ] Run `seed_team.sql` (Initial data)
- [ ] **Critical**: Review RLS Policies (Ensure `fix_availability_rls_v2.sql` is replaced by secure policies if possible, or accepted as risk)

## CI/CD
- [ ] GitHub Actions Workflow present (`.github/workflows/ci.yml`)
- [ ] Lint pass
- [ ] TypeScript Check pass
- [ ] Tests pass

## Monitoring
- [ ] Sentry (or equivalent) configured (Optional)
- [ ] Supabase Logs accessible

## Rollback Plan
1.  Code: Revert to previous Git tag.
2.  Database: Have `down` migrations or backups ready in Supabase.
