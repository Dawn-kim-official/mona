# RLS Implementation Quick Reference

## What This Document Is

This is a **quick lookup guide** for the complete analysis in `RLS_IMPLEMENTATION_ANALYSIS.md`.

---

## Key Findings Summary

### 1. Admin Access Pattern
```
Admin Pages (Client)  ← RLS applies
     ↓ (Admin role check)
Admin APIs (Server)   ← SERVICE_ROLE_KEY (RLS bypassed)
     ↓ (Direct DB access)
Database
```

**Result:** Admin pages query database with RLS; APIs use service role.

### 2. Business Access Pattern
```
Business Pages (Client) ← RLS applies
     ↓ (Filter: business_id = own_id)
Database
```

**Result:** Business can see only own donations + matches.

### 3. Beneficiary Access Pattern (CRITICAL)
```
Beneficiary Pages (Client) ← RLS applies
     ↓ (Filter: complex join)
donations → businesses   ← Complex RLS policy needed!
```

**Result:** Beneficiary can see business info ONLY through donation matches.

---

## The Critical Policy

**Problem:** Beneficiary views a proposal and needs business contact info.

**Query Chain:**
1. `donation_matches` (own proposal)
2. → `donations` (via donation_id)
3. → `businesses` (via business_id)

**RLS Policy:**
```sql
CREATE POLICY "beneficiary_select_matched_businesses" ON businesses
    FOR SELECT USING (
        id IN (
            SELECT d.business_id FROM donations d
            JOIN donation_matches dm ON d.id = dm.donation_id
            WHERE beneficiary_is_user_owned(dm.beneficiary_id)
            AND dm.status IN ('accepted', 'quote_sent', 'received')
        )
    );
```

**Will It Work?** YES - All columns are indexed, query is straightforward.

---

## Tables Requiring RLS Policies

### Tier 1: Critical for Security
- `businesses` - Contains company data
- `beneficiaries` - Contains organization data
- `donations` - Contains product inventory
- `donation_matches` - Core workflow data

### Tier 2: Important for Functionality
- `quotes` - Multi-party access
- `pickup_schedules` - Multi-party access
- `reports` - Business-specific data

### Tier 3: Data Isolation
- `profiles` - User authentication
- `notifications` - Personal notifications

### Tier 4: Skip (RLS Not Needed)
- `subscriber_donations` - Not used in code

---

## Implementation Checklist

### Before RLS
- [x] Understand all access patterns (THIS ANALYSIS)
- [x] Identify breaking changes (None expected)
- [x] Create RLS policies (In analysis)
- [x] Plan rollout strategy (4 phases)

### Phase 1: Safe (Hour 1)
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- 5 simple policies
```
**Risk:** Minimal  
**Test:** Login, notification fetch

### Phase 2: Medium (Hour 2)
```sql
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;
-- 8 policies + is_admin() function
```
**Risk:** Low-Medium  
**Test:** Admin sees all, business sees own

### Phase 3: Complex (Hour 3)
```sql
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_matches ENABLE ROW LEVEL SECURITY;
-- 10 policies + 2 helper functions
```
**Risk:** Medium  
**Test:** Full donation workflow

### Phase 4: Critical (Hour 4)
```sql
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
-- 15 policies
```
**Risk:** Medium-High (Complex joins)  
**Test:** Beneficiary proposal detail page (critical!)

---

## What Won't Break

✅ Admin operations (use SERVICE_ROLE_KEY)  
✅ Business donations CRUD  
✅ Beneficiary proposal workflow  
✅ Quote and pickup scheduling  
✅ All existing client-side queries  

---

## What Could Break (If Policies Wrong)

⚠️ Beneficiary → Business join (CRITICAL - requires specific policy)  
⚠️ Admin seeing unfiltered data (RLS needs admin_role check)  
⚠️ Cross-business visibility (Must filter business_id)  

---

## Code Files Involved

### No Code Changes Needed
- `src/lib/supabase.ts` - Uses anon key (RLS applies)
- `src/lib/supabase-admin.ts` - Uses service role (RLS bypassed)
- `src/app/api/admin/*` - Already uses service role correctly

### Verify Still Works
- `src/app/admin/**/*` - Client-side queries (RLS applies)
- `src/app/business/**/*` - Client-side queries (RLS applies)
- `src/app/beneficiary/**/*` - Client-side queries (RLS applies)

### Create
- `supabase/migrations/[timestamp]_enable_rls_phase1.sql` (profiles, notifications)
- `supabase/migrations/[timestamp]_enable_rls_phase2.sql` (businesses, beneficiaries)
- `supabase/migrations/[timestamp]_enable_rls_phase3.sql` (donations, matches)
- `supabase/migrations/[timestamp]_enable_rls_phase4.sql` (quotes, schedules, reports)

---

## Performance Considerations

### Indexed Columns (Good for RLS)
✅ businesses.user_id  
✅ beneficiaries.user_id  
✅ donations.business_id  
✅ donation_matches.donation_id  
✅ donation_matches.beneficiary_id  

### Compound Indexes (Help Complex Queries)
✅ (donation_id, beneficiary_id) on donation_matches  
✅ (business_id) on donations  

### No Index Needed
- Auth checks (cached by Supabase)
- Status checks (already indexed)

---

## Deployment Strategy

### Monday: Phase 1 (Low Risk)
```bash
psql -h your-db-host -U postgres -d postgres \
  -f supabase/migrations/phase1_rls.sql
# Test: Login, read profiles
```

### Wednesday: Phase 2 (Test Admin)
```bash
psql -h your-db-host -U postgres -d postgres \
  -f supabase/migrations/phase2_rls.sql
# Test: Admin dashboard, business list
```

### Friday: Phase 3 (Test Workflows)
```bash
psql -h your-db-host -U postgres -d postgres \
  -f supabase/migrations/phase3_rls.sql
# Test: Create donation, see matches
```

### Next Monday: Phase 4 (Complex Queries)
```bash
psql -h your-db-host -U postgres -d postgres \
  -f supabase/migrations/phase4_rls.sql
# Test: Beneficiary views business info through match
```

---

## Rollback Strategy

### If Something Breaks (Phase X)
```sql
-- Disable all RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
-- ... (all tables)

-- Fix policies, then re-enable
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ... (recreate policies)
```

---

## Success Criteria

All of these must work after RLS:

1. **Admin can:**
   - See all businesses, donations, beneficiaries
   - Create/edit any donation match
   - Create/edit any quote
   - ✓ Uses service role, so RLS bypassed

2. **Business can:**
   - See own donations
   - See matches for own donations
   - Create quotes/schedules
   - ✓ Filtered by business_id = own_id

3. **Beneficiary can:**
   - See own proposals (donation_matches)
   - See donations they matched with
   - **See business contact info** (CRITICAL)
   - ✓ Complex join policy handles this

4. **Security:**
   - Business A cannot see Business B's donations
   - Beneficiary A cannot see Beneficiary B's proposals
   - ✓ Implicit in policies

---

## Common Issues & Solutions

### Issue: Admin can't see anything
**Cause:** Missing is_admin() function or wrong role check  
**Solution:** Create helper function, verify role in profiles

### Issue: Beneficiary can't see business info
**Cause:** Missing beneficiary_select_matched_businesses policy  
**Solution:** Check status filter (needs 'accepted', 'quote_sent', 'received')

### Issue: Complex join queries timeout
**Cause:** Missing indexes or inefficient subqueries  
**Solution:** Verify all indexed columns, check query plan

### Issue: Some pages work, others don't
**Cause:** Partial RLS enablement  
**Solution:** Complete all 4 phases before testing

---

## Testing Commands

### Test as Admin
```sql
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub = 'admin-user-id';
SELECT COUNT(*) FROM donations; -- Should work
```

### Test as Business
```sql
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub = 'business-user-id';
SELECT COUNT(*) FROM donations 
WHERE business_id IN (SELECT id FROM businesses WHERE user_id = 'business-user-id');
-- Should work
```

### Test as Beneficiary
```sql
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub = 'beneficiary-user-id';
SELECT * FROM businesses 
WHERE id IN (
    SELECT d.business_id FROM donations d
    JOIN donation_matches dm ON d.id = dm.donation_id
    WHERE dm.beneficiary_id IN (SELECT id FROM beneficiaries WHERE user_id = 'beneficiary-user-id')
    AND dm.status IN ('accepted', 'quote_sent', 'received')
); 
-- Should only show matched businesses
```

---

## Questions Answered

**Q: Do I need to change code?**  
A: No. Existing queries work with RLS applied via client.

**Q: Will admin pages break?**  
A: No. Admin RLS policies allow admin access; API route uses service role anyway.

**Q: Will beneficiary proposal detail break?**  
A: Only if you don't add the beneficiary_select_matched_businesses policy.

**Q: Can I partially enable RLS?**  
A: Yes! Use the 4 phases. Test each phase before proceeding.

**Q: What if I mess up?**  
A: Disable RLS (1 command), fix policies, re-enable.

**Q: How long to implement?**  
A: ~30 minutes per phase (SQL execution + testing).

---

## Files to Review

1. **Full Analysis:** `/Users/tagryu/PJT/mona/RLS_IMPLEMENTATION_ANALYSIS.md`
   - Complete access patterns
   - All policies listed
   - Critical test cases
   - Detailed explanations

2. **This Quick Reference:** `/Users/tagryu/PJT/mona/RLS_QUICK_REFERENCE.md`
   - Overview
   - Checklists
   - Common issues
   - Testing tips

3. **Existing Policy Draft:** `/Users/tagryu/PJT/mona/supabase_rls_policies.sql`
   - Some policies already written
   - Use as reference (may need updates)

---

## Next Steps

1. Read full analysis (RLS_IMPLEMENTATION_ANALYSIS.md)
2. Create migration SQL files (phase1-4)
3. Test Phase 1 in dev environment
4. Progressively deploy phases
5. Monitor for issues in each phase
6. Deploy to production

---

**Generated:** 2025-10-30  
**Status:** Ready for Implementation
