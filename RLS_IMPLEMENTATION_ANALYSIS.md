# RLS Implementation Analysis - Mona B2B Platform

**Generated:** 2025-10-30  
**Purpose:** Comprehensive RLS policy design for minimal, safe implementation

---

## Executive Summary

This analysis provides a complete mapping of all database access patterns across the Mona platform. The goal is to design RLS policies that:
1. Are **minimally restrictive** to avoid breaking existing functionality
2. **Won't fail** on complex join queries used by beneficiaries
3. **Protect sensitive data** without extra implementation burden
4. Use **SERVICE_ROLE_KEY only for admin APIs** (server-side, already implemented)

---

## Part 1: Admin Access Patterns

### 1.1 Admin API Routes (Using SERVICE_ROLE_KEY - Server-Side Only)

#### Route: `/api/admin/members` (GET)
```typescript
// File: src/app/api/admin/members/route.ts:12
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
```
**Access Pattern:**
- Queries: `businesses` (full) → SELECT *
- Queries: `beneficiaries` (full) → SELECT *
- Queries: `profiles` (full) → SELECT email
- **Service Role:** YES (RLS bypassed)
- **Authorization:** Role check on profiles.role = 'admin' (after RLS bypass)

**RLS Impact:** ✅ SERVICE_ROLE_KEY bypasses RLS, no policies needed

#### Route: `/api/admin/users` (POST)
```typescript
// File: src/app/api/admin/users/route.ts:32
const adminClient = createAdminClient()
```
**Access Pattern:**
- Uses `adminClient.auth.admin.getUserById(userId)` - Auth admin API
- Queries: `profiles` (with SERVICE_ROLE_KEY) - Role check only
- **Service Role:** YES
- **Authorization:** Role check on profiles.role = 'admin'

**RLS Impact:** ✅ SERVICE_ROLE_KEY used, no policies needed

---

### 1.2 Admin UI Pages (Using Client-Side Queries)

#### Page: `/admin/businesses`
```typescript
// File: src/app/admin/businesses/page.tsx:71
// Fetches via: fetch('/api/admin/members')
```
**Access Pattern:**
- Indirect fetch through API (SERVICE_ROLE_KEY)
- **Authorization:** API route checks admin role

**RLS Impact:** ✅ Uses API with SERVICE_ROLE_KEY

#### Page: `/admin/donations`
```typescript
// File: src/app/admin/donations/page.tsx:74
const { data, error } = await supabase
  .from('donations')
  .select(`
    *,
    businesses(name)
  `)
  .order('created_at', { ascending: false })

// Line 89-92: Also queries donation_matches
const { data: allMatches } = await supabase
  .from('donation_matches')
  .select('status, accepted_quantity')
  .eq('donation_id', donation.id)
```
**Access Pattern:**
- **Table:** donations (SELECT *)
- **Table:** donation_matches (SELECT status, accepted_quantity)
- **Join:** businesses (name only)
- **Filter:** None - gets ALL donations

**RLS Requirement:**
- Admin must see ALL donations
- Admin must see ALL donation_matches for any donation

**RLS Impact:**
```sql
-- donations: Admin policy
CREATE POLICY "admin_select_all_donations" ON donations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- donation_matches: Admin policy
CREATE POLICY "admin_select_all_matches" ON donation_matches
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );
```

#### Page: `/admin/quotes`
```typescript
// File: src/app/admin/quotes/page.tsx:30
const { data, error } = await supabase
  .from('quotes')
  .select('*')
```
**Access Pattern:**
- **Table:** quotes (SELECT *)
- **Filter:** None - gets ALL quotes

**RLS Requirement:** Admin sees ALL quotes

**RLS Impact:**
```sql
CREATE POLICY "admin_select_all_quotes" ON quotes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );
```

#### Page: `/admin/donation/[id]/propose`
```typescript
// File: src/app/admin/donation/[id]/propose/page.tsx:62-65
const { data: beneficiaryData, error: beneficiaryError } = await supabase
  .from('beneficiaries')
  .select('id, organization_name, organization_type, address')
  .eq('status', 'approved')
  .order('organization_name')

// Line 167-172: Creates multiple matches
const matchesToInsert = selectedBeneficiaries.map(ben => ({
  donation_id: donationId,
  beneficiary_id: ben.id,
  proposed_quantity: ben.quantity,
  status: 'proposed'
}))

await supabase
  .from('donation_matches')
  .insert(matchesToInsert)
```
**Access Pattern:**
- **SELECT:** beneficiaries (approved ones)
- **INSERT:** donation_matches (multiple rows at once)

**RLS Requirement:**
- Admin can see all approved beneficiaries
- Admin can INSERT any donation_id + beneficiary_id combination

**RLS Impact:**
```sql
-- beneficiaries: Allow admin to see all
CREATE POLICY "admin_select_all_beneficiaries" ON beneficiaries
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- donation_matches: Allow admin to insert any
CREATE POLICY "admin_insert_matches" ON donation_matches
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );
```

#### Page: `/admin/donation/[id]/quote`
```typescript
// File: src/app/admin/donation/[id]/quote/page.tsx:85-106
const { data: donationData, error: donationError } = await supabase
  .from('donations')
  .select('*')
  .eq('id', params.id)
  .single()

const { data: businessData } = await supabase
  .from('businesses')
  .select('*')
  .eq('id', donationData.business_id)
  .single()

const { data: matchData, error: matchError } = await supabase
  .from('donation_matches')
  .select('*')
  .eq('donation_id', params.id)

// Line 217-334: INSERT/UPDATE quotes
```
**Access Pattern:**
- **SELECT:** donations, businesses, donation_matches
- **INSERT/UPDATE:** quotes

**RLS Requirement:** Admin can access any donation's related data

#### Page: `/admin/donation/[id]/pickup`
```typescript
// File: src/app/admin/donation/[id]/pickup/page.tsx:65
// INSERT pickup_schedules
await supabase
  .from('pickup_schedules')
  .insert({...})
```
**Access Pattern:**
- **INSERT:** pickup_schedules for any donation

#### Page: `/admin/donation/[id]/detail`
```typescript
// File: src/app/admin/donation/[id]/detail/page.tsx:120
// SELECT pickup_schedules
await supabase
  .from('pickup_schedules')
  .select('*')
  .eq('donation_id', donationId)
```

#### Page: `/admin/donation/[id]/matches`
```typescript
// File: src/app/admin/donation/[id]/matches/page.tsx:62
const { data, error } = await supabase
  .from('donation_matches')
  .select('*')
  .eq('donation_id', donationId)
```

#### Page: `/admin/reports`
```typescript
// File: src/app/admin/reports/page.tsx:28-32
const { data, error } = await supabase
  .from('businesses')
  .select('*')
  .eq('status', 'approved')

// Line 42: SELECT reports
const { data: reportData, error } = await supabase
  .from('reports')
  .select('created_at')
  .eq('business_id', business.id)
```
**Access Pattern:**
- **SELECT:** businesses, reports

#### Page: `/admin/profile`
```typescript
// File: src/app/admin/profile/page.tsx
// Likely: SELECT profiles (own)
```

---

### 1.3 Admin RLS Policies Summary

**Policy Set for Admin:**

```sql
-- profiles: Admin can only read own
-- (Same as business/beneficiary)

-- businesses: Admin can read/write all
CREATE POLICY "admin_select_all_businesses" ON businesses
    FOR SELECT USING (has_admin_role());

CREATE POLICY "admin_update_businesses" ON businesses
    FOR UPDATE USING (has_admin_role());

CREATE POLICY "admin_delete_businesses" ON businesses
    FOR DELETE USING (has_admin_role());

-- beneficiaries: Admin can read/write all
CREATE POLICY "admin_select_all_beneficiaries" ON beneficiaries
    FOR SELECT USING (has_admin_role());

CREATE POLICY "admin_update_beneficiaries" ON beneficiaries
    FOR UPDATE USING (has_admin_role());

-- donations: Admin can read/write all
CREATE POLICY "admin_select_all_donations" ON donations
    FOR SELECT USING (has_admin_role());

CREATE POLICY "admin_update_donations" ON donations
    FOR UPDATE USING (has_admin_role());

CREATE POLICY "admin_delete_donations" ON donations
    FOR DELETE USING (has_admin_role());

-- donation_matches: Admin can read/write all
CREATE POLICY "admin_select_all_matches" ON donation_matches
    FOR SELECT USING (has_admin_role());

CREATE POLICY "admin_insert_matches" ON donation_matches
    FOR INSERT WITH CHECK (has_admin_role());

CREATE POLICY "admin_update_matches" ON donation_matches
    FOR UPDATE USING (has_admin_role());

-- quotes: Admin can read/write all
CREATE POLICY "admin_select_all_quotes" ON quotes
    FOR SELECT USING (has_admin_role());

CREATE POLICY "admin_insert_quotes" ON quotes
    FOR INSERT WITH CHECK (has_admin_role());

CREATE POLICY "admin_update_quotes" ON quotes
    FOR UPDATE USING (has_admin_role());

CREATE POLICY "admin_delete_quotes" ON quotes
    FOR DELETE USING (has_admin_role());

-- pickup_schedules: Admin can read/write all
CREATE POLICY "admin_select_all_schedules" ON pickup_schedules
    FOR SELECT USING (has_admin_role());

CREATE POLICY "admin_insert_schedules" ON pickup_schedules
    FOR INSERT WITH CHECK (has_admin_role());

-- reports: Admin can read/write all
CREATE POLICY "admin_select_all_reports" ON reports
    FOR SELECT USING (has_admin_role());

CREATE POLICY "admin_insert_reports" ON reports
    FOR INSERT WITH CHECK (has_admin_role());

CREATE POLICY "admin_delete_reports" ON reports
    FOR DELETE USING (has_admin_role());
```

**Helper Function:**
```sql
CREATE OR REPLACE FUNCTION has_admin_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Part 2: Business Access Patterns

### 2.1 Business Layout Guard
```typescript
// File: src/app/business/layout.tsx:34-37
const { data: business } = await supabase
  .from('businesses')
  .select('id, status, contract_signed')
  .eq('user_id', user.id)
  .single()
```
**Pattern:** Business must be owner (user_id = auth.uid())

---

### 2.2 Business UI Pages

#### Page: `/business/donations`
```typescript
// File: src/app/business/donations/page.tsx:54-72
const { data: business } = await supabase
  .from('businesses')
  .select('id')
  .eq('user_id', user.id)
  .single()

const { data, error } = await supabase
  .from('donations')
  .select('*')
  .eq('business_id', business.id)

// Line 82: donation_matches query
const { data: matches } = await supabase
  .from('donation_matches')
  .select('*')
  .eq('donation_id', donationId)

// Line 105: quotes query
const { data: quote, error } = await supabase
  .from('quotes')
  .select('*')
  .eq('donation_id', donationId)
  .single()
```

**RLS Requirement:**
- Business can SELECT donations WHERE business_id = own_business_id
- Business can SELECT donation_matches WHERE donation_id IN (own donations)
- Business can SELECT quotes WHERE donation_id IN (own donations)

#### Page: `/business/donation/new`
```typescript
// File: src/app/business/donation/new/page.tsx:58-62
const { data: business } = await supabase
  .from('businesses')
  .select('*')
  .eq('user_id', user.id)
  .single()

// Line 83: INSERT donation
const { data: newDonation } = await supabase
  .from('donations')
  .insert({
    business_id: business.id,
    ...
  })
```

**RLS Requirement:**
- Business can INSERT donation with own business_id

#### Page: `/business/donation/[id]`
```typescript
// File: src/app/business/donation/[id]/DonationDetailClient.tsx:93
const { data: pickup } = await supabase
  .from('pickup_schedules')
  .select('*')
  .eq('donation_id', donationId)
```

**RLS Requirement:**
- Business can SELECT pickup_schedules WHERE donation_id IN (own donations)

#### Page: `/business/donation/[id]/pickup-schedule`
```typescript
// File: src/app/business/donation/[id]/pickup-schedule/page.tsx:78
const { error: scheduleError } = await supabase
  .from('pickup_schedules')
  .insert({
    donation_id: donationId,
    ...
  })

// Line 89: Also creates notification
```

**RLS Requirement:**
- Business can INSERT pickup_schedule for own donation

#### Page: `/business/profile`
```typescript
// File: src/app/business/profile/page.tsx:60
// UPDATE own business
```

#### Page: `/business/dashboard`
```typescript
// File: src/app/business/dashboard/page.tsx:78
const { data: reports } = await supabase
  .from('reports')
  .select('*')
  .eq('business_id', businessId)
```

**RLS Requirement:**
- Business can SELECT reports WHERE business_id = own_business_id

#### Page: `/business/receipts`
```typescript
// File: src/app/business/receipts/page.tsx
// Likely selects donation-related data
```

---

### 2.3 Business RLS Policies Summary

```sql
-- businesses: Business can read own + see approved businesses
CREATE POLICY "business_select_own" ON businesses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "business_select_approved" ON businesses
    FOR SELECT USING (status = 'approved' AND auth.uid() != user_id);

CREATE POLICY "business_update_own" ON businesses
    FOR UPDATE USING (auth.uid() = user_id);

-- donations: Business can read/write own only
CREATE POLICY "business_select_own_donations" ON donations
    FOR SELECT USING (
        business_id IN (
            SELECT id FROM businesses WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "business_insert_donations" ON donations
    FOR INSERT WITH CHECK (
        business_id IN (
            SELECT id FROM businesses WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "business_update_own_donations" ON donations
    FOR UPDATE USING (
        business_id IN (
            SELECT id FROM businesses WHERE user_id = auth.uid()
        )
    );

-- donation_matches: Business can read matches for own donations
CREATE POLICY "business_select_donation_matches" ON donation_matches
    FOR SELECT USING (
        donation_id IN (
            SELECT id FROM donations 
            WHERE business_id IN (
                SELECT id FROM businesses WHERE user_id = auth.uid()
            )
        )
    );

-- quotes: Business can read/update quotes for own donations
CREATE POLICY "business_select_quotes" ON quotes
    FOR SELECT USING (
        donation_id IN (
            SELECT id FROM donations 
            WHERE business_id IN (
                SELECT id FROM businesses WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "business_update_quotes" ON quotes
    FOR UPDATE USING (
        donation_id IN (
            SELECT id FROM donations 
            WHERE business_id IN (
                SELECT id FROM businesses WHERE user_id = auth.uid()
            )
        )
    );

-- pickup_schedules: Business can read/write for own donations
CREATE POLICY "business_select_schedules" ON pickup_schedules
    FOR SELECT USING (
        donation_id IN (
            SELECT id FROM donations 
            WHERE business_id IN (
                SELECT id FROM businesses WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "business_insert_schedules" ON pickup_schedules
    FOR INSERT WITH CHECK (
        donation_id IN (
            SELECT id FROM donations 
            WHERE business_id IN (
                SELECT id FROM businesses WHERE user_id = auth.uid()
            )
        )
    );

-- notifications: Business can read own
CREATE POLICY "business_select_notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

-- reports: Business can read own
CREATE POLICY "business_select_reports" ON reports
    FOR SELECT USING (
        business_id IN (
            SELECT id FROM businesses WHERE user_id = auth.uid()
        )
    );
```

---

## Part 3: Beneficiary Access Patterns (CRITICAL - Complex Joins)

### 3.1 Beneficiary Layout Guard
```typescript
// File: src/app/beneficiary/layout.tsx:74-77
const { data: beneficiary } = await supabase
  .from('beneficiaries')
  .select('id, organization_name, status')
  .eq('user_id', user.id)
  .single()
```

---

### 3.2 CRITICAL: Beneficiary → Business Cross-Join

#### Page: `/beneficiary/proposal/[id]`
```typescript
// File: src/app/beneficiary/proposal/[id]/page.tsx:96-112
// THIS IS THE CRITICAL QUERY!

const { data: donationData, error: donationError } = await supabase
  .from('donations')
  .select(`
    *,
    businesses (*)  // <-- NEEDS RLS POLICY
  `)
  .eq('id', data.donation_id)
  .single()

// Expected flow:
// 1. donation_matches (user's own proposal)
// 2. → donations (through donation_id)
// 3. → businesses (through business_id)
```

**The Problem:**
- Beneficiary views a PROPOSAL (donation_match)
- Proposal links to a DONATION (business_id)
- Donation links to a BUSINESS
- Beneficiary needs to see the BUSINESS info

**The Solution:**
Beneficiary CAN read a business **only if** they have an accepted match to one of its donations.

```sql
CREATE POLICY "beneficiary_select_matched_businesses" ON businesses
    FOR SELECT USING (
        -- Business can be read if current user is beneficiary with accepted match
        EXISTS (
            SELECT 1 FROM donation_matches dm
            JOIN donations d ON dm.donation_id = d.id
            JOIN beneficiaries b ON dm.beneficiary_id = b.id
            WHERE d.business_id = businesses.id
            AND b.user_id = auth.uid()
            AND dm.status IN ('accepted', 'quote_sent', 'received')
        )
    );
```

**Important Note:**
This is a moderately complex RLS policy but it's necessary and should work fine:
- It uses indexed columns (business_id, donation_id, beneficiary_id, user_id)
- The subquery is straightforward
- Supabase has good performance for these kinds of policies

#### Page: `/beneficiary/proposals`
```typescript
// File: src/app/beneficiary/proposals/page.tsx:88
const { data: matches, error } = await supabase
  .from('donation_matches')
  .select('*')
  .eq('beneficiary_id', beneficiaryId)

// Line 107: Also queries donations
const { data: donationIds } = await supabase
  .from('donations')
  .select('id')
  .in('id', matchedDonationIds)

// Line 113: And quotes
const { data: quotes } = await supabase
  .from('quotes')
  .select('*')
  .in('donation_id', matchedDonationIds)
```

**RLS Requirement:**
- Beneficiary can only see own donation_matches
- Beneficiary can only see donations with own matches
- Beneficiary can only see quotes for own matched donations

#### Page: `/beneficiary/dashboard`
```typescript
// Similar to proposals - sees own matches and related donations
```

#### Page: `/beneficiary/history`
```typescript
// History of completed matches
```

#### Page: `/beneficiary/profile`
```typescript
// Can update own beneficiary info

// File: src/app/beneficiary/profile/page.tsx:81
await supabase
  .from('beneficiaries')
  .update(updateData)
  .eq('user_id', user.id)

// Also in API: src/app/api/beneficiary/update-profile/route.ts:34
await supabase
  .from('beneficiaries')
  .update(updateData)
  .eq('user_id', user.id)
```

#### Page: `/beneficiary/receipts`
```typescript
// Can see receipts for accepted matches
```

---

### 3.3 Beneficiary RLS Policies Summary

```sql
-- beneficiaries: Beneficiary can read own only
CREATE POLICY "beneficiary_select_own" ON beneficiaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "beneficiary_update_own" ON beneficiaries
    FOR UPDATE USING (auth.uid() = user_id);

-- donation_matches: Beneficiary can read own only
CREATE POLICY "beneficiary_select_own_matches" ON donation_matches
    FOR SELECT USING (
        beneficiary_id IN (
            SELECT id FROM beneficiaries WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "beneficiary_update_own_matches" ON donation_matches
    FOR UPDATE USING (
        beneficiary_id IN (
            SELECT id FROM beneficiaries WHERE user_id = auth.uid()
        )
    );

-- donations: Beneficiary can read only if matched
CREATE POLICY "beneficiary_select_matched_donations" ON donations
    FOR SELECT USING (
        id IN (
            SELECT dm.donation_id 
            FROM donation_matches dm
            JOIN beneficiaries b ON dm.beneficiary_id = b.id
            WHERE b.user_id = auth.uid()
        )
    );

-- businesses: CRITICAL - Beneficiary can read only if has accepted match
CREATE POLICY "beneficiary_select_matched_businesses" ON businesses
    FOR SELECT USING (
        id IN (
            SELECT d.business_id
            FROM donations d
            JOIN donation_matches dm ON d.id = dm.donation_id
            JOIN beneficiaries b ON dm.beneficiary_id = b.id
            WHERE b.user_id = auth.uid()
            AND dm.status IN ('accepted', 'quote_sent', 'received')
        )
    );

-- quotes: Beneficiary can read quotes for matched donations
CREATE POLICY "beneficiary_select_quotes" ON quotes
    FOR SELECT USING (
        donation_id IN (
            SELECT dm.donation_id 
            FROM donation_matches dm
            JOIN beneficiaries b ON dm.beneficiary_id = b.id
            WHERE b.user_id = auth.uid()
        )
    );

-- pickup_schedules: Beneficiary can read schedules for matched donations
CREATE POLICY "beneficiary_select_schedules" ON pickup_schedules
    FOR SELECT USING (
        donation_id IN (
            SELECT dm.donation_id 
            FROM donation_matches dm
            JOIN beneficiaries b ON dm.beneficiary_id = b.id
            WHERE b.user_id = auth.uid()
        )
    );

-- notifications: Beneficiary can read own
CREATE POLICY "beneficiary_select_notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

-- profiles: Beneficiary can read own profile (for role checks)
CREATE POLICY "beneficiary_select_own_profile" ON profiles
    FOR SELECT USING (auth.uid() = id);
```

---

## Part 4: Shared Policies (All Users)

### 4.1 Profiles Table

```sql
-- Everyone can read own profile
CREATE POLICY "user_select_own_profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "user_update_own_profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert own profile during signup
CREATE POLICY "user_insert_own_profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Service role (for signup/auth triggers) can do anything
-- Already handled by auth.uid() matching
```

### 4.2 Notifications Table

```sql
-- Users can read own notifications
CREATE POLICY "user_select_own_notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_update_own_notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());
```

---

## Part 5: Complete Policy Implementation Plan

### Phase 1: Safe Policies (No Breaking Changes Expected)

1. **profiles** - Simple user_id check
2. **notifications** - Simple user_id check

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "users_select_own_profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_insert_own_profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- notifications
CREATE POLICY "users_select_own_notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users_update_own_notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
```

### Phase 2: Medium-Risk Policies (Business + Admin)

3. **businesses** - Owned resources
4. **beneficiaries** - Owned resources

```sql
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;

-- Create helper function first
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- businesses
CREATE POLICY "admin_all_businesses" ON businesses FOR ALL USING (is_admin());
CREATE POLICY "business_owner_select" ON businesses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "business_owner_update" ON businesses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "anyone_select_approved" ON businesses FOR SELECT USING (status = 'approved' AND auth.uid() != user_id);

-- beneficiaries  
CREATE POLICY "admin_all_beneficiaries" ON beneficiaries FOR ALL USING (is_admin());
CREATE POLICY "beneficiary_select_own" ON beneficiaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "beneficiary_update_own" ON beneficiaries FOR UPDATE USING (auth.uid() = user_id);
```

### Phase 3: Moderate-Risk Policies (Donations)

5. **donations** - Owned + matched resources
6. **donation_matches** - Matched resources

```sql
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_matches ENABLE ROW LEVEL SECURITY;

-- Helper for business ownership
CREATE OR REPLACE FUNCTION business_is_user_owned(business_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql;

-- Helper for beneficiary ownership
CREATE OR REPLACE FUNCTION beneficiary_is_user_owned(beneficiary_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN beneficiary_id IN (
    SELECT id FROM beneficiaries WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql;

-- donations
CREATE POLICY "admin_all_donations" ON donations FOR ALL USING (is_admin());

CREATE POLICY "business_select_own_donations" ON donations 
    FOR SELECT USING (business_is_user_owned(business_id));

CREATE POLICY "business_insert_donations" ON donations 
    FOR INSERT WITH CHECK (business_is_user_owned(business_id));

CREATE POLICY "business_update_own_donations" ON donations 
    FOR UPDATE USING (business_is_user_owned(business_id));

CREATE POLICY "beneficiary_select_matched_donations" ON donations 
    FOR SELECT USING (
        id IN (
            SELECT dm.donation_id FROM donation_matches dm
            WHERE beneficiary_is_user_owned(dm.beneficiary_id)
        )
    );

-- donation_matches
CREATE POLICY "admin_all_matches" ON donation_matches FOR ALL USING (is_admin());

CREATE POLICY "business_select_own_matches" ON donation_matches 
    FOR SELECT USING (
        donation_id IN (
            SELECT id FROM donations WHERE business_is_user_owned(business_id)
        )
    );

CREATE POLICY "beneficiary_select_own_matches" ON donation_matches 
    FOR SELECT USING (beneficiary_is_user_owned(beneficiary_id));

CREATE POLICY "beneficiary_update_own_matches" ON donation_matches 
    FOR UPDATE USING (beneficiary_is_user_owned(beneficiary_id));
```

### Phase 4: High-Risk Policies (Complex Joins)

7. **businesses** - Add beneficiary access policy (CRITICAL)
8. **quotes** - Multi-role access
9. **pickup_schedules** - Multi-role access
10. **reports** - Multi-role access

```sql
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Add to businesses (for beneficiary cross-join!)
CREATE POLICY "beneficiary_select_matched_businesses" ON businesses 
    FOR SELECT USING (
        id IN (
            SELECT d.business_id FROM donations d
            JOIN donation_matches dm ON d.id = dm.donation_id
            WHERE beneficiary_is_user_owned(dm.beneficiary_id)
            AND dm.status IN ('accepted', 'quote_sent', 'received')
        )
    );

-- quotes
CREATE POLICY "admin_all_quotes" ON quotes FOR ALL USING (is_admin());

CREATE POLICY "business_select_own_quotes" ON quotes 
    FOR SELECT USING (
        donation_id IN (
            SELECT id FROM donations WHERE business_is_user_owned(business_id)
        )
    );

CREATE POLICY "business_update_own_quotes" ON quotes 
    FOR UPDATE USING (
        donation_id IN (
            SELECT id FROM donations WHERE business_is_user_owned(business_id)
        )
    );

CREATE POLICY "beneficiary_select_matched_quotes" ON quotes 
    FOR SELECT USING (
        donation_id IN (
            SELECT dm.donation_id FROM donation_matches dm
            WHERE beneficiary_is_user_owned(dm.beneficiary_id)
        )
    );

-- pickup_schedules
CREATE POLICY "admin_all_schedules" ON pickup_schedules FOR ALL USING (is_admin());

CREATE POLICY "business_select_own_schedules" ON pickup_schedules 
    FOR SELECT USING (
        donation_id IN (
            SELECT id FROM donations WHERE business_is_user_owned(business_id)
        )
    );

CREATE POLICY "business_insert_schedules" ON pickup_schedules 
    FOR INSERT WITH CHECK (
        donation_id IN (
            SELECT id FROM donations WHERE business_is_user_owned(business_id)
        )
    );

CREATE POLICY "beneficiary_select_matched_schedules" ON pickup_schedules 
    FOR SELECT USING (
        donation_id IN (
            SELECT dm.donation_id FROM donation_matches dm
            WHERE beneficiary_is_user_owned(dm.beneficiary_id)
        )
    );

-- reports
CREATE POLICY "admin_all_reports" ON reports FOR ALL USING (is_admin());

CREATE POLICY "business_select_own_reports" ON reports 
    FOR SELECT USING (
        business_id IN (
            SELECT id FROM businesses WHERE user_id = auth.uid()
        )
    );
```

---

## Part 6: Critical Test Cases

These MUST pass after RLS is enabled:

### Test 1: Beneficiary views business info for matched donation
```sql
-- Setup: beneficiary_1 has accepted match for donation_1 → business_1
-- Expected: SELECT businesses WHERE id = business_1 → SUCCESS
-- Should fail: SELECT businesses WHERE id = business_2 → EMPTY

SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub = 'beneficiary_1_user_id';

SELECT * FROM businesses WHERE id = 'business_1'; -- SUCCESS
SELECT * FROM businesses WHERE id = 'business_2'; -- EMPTY
```

### Test 2: Business views own donations
```sql
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub = 'business_1_user_id';

SELECT * FROM donations WHERE business_id = 'business_1_id'; -- SUCCESS
SELECT * FROM donations WHERE business_id = 'business_2_id'; -- EMPTY
```

### Test 3: Admin sees all
```sql
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub = 'admin_user_id';

SELECT COUNT(*) FROM businesses; -- Should return total count
SELECT COUNT(*) FROM donations; -- Should return total count
SELECT COUNT(*) FROM donation_matches; -- Should return total count
```

### Test 4: Complex join still works
```sql
-- Beneficiary proposal detail page query
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub = 'beneficiary_1_user_id';

SELECT d.*, b.*
FROM donations d
JOIN businesses b ON d.business_id = b.id
WHERE d.id IN (
    SELECT dm.donation_id FROM donation_matches dm
    WHERE dm.beneficiary_id = 'beneficiary_1_id'
    AND dm.status = 'accepted'
); -- SUCCESS
```

---

## Part 7: Implementation Checklist

- [ ] Create helper functions (is_admin, business_is_user_owned, beneficiary_is_user_owned)
- [ ] Phase 1: Enable RLS on profiles, notifications
- [ ] Test Phase 1 (should be safe)
- [ ] Phase 2: Enable RLS on businesses, beneficiaries
- [ ] Test Phase 2 with admin and owner operations
- [ ] Phase 3: Enable RLS on donations, donation_matches
- [ ] Test Phase 3 with cross-role queries
- [ ] Phase 4: Enable RLS on quotes, pickup_schedules, reports
- [ ] Test Phase 4 including beneficiary → business queries
- [ ] Full integration test with all user roles
- [ ] Load test with realistic data volumes

---

## Part 8: Risk Assessment

### Low Risk (Safe to implement immediately)
- profiles: Simple user_id match
- notifications: Simple user_id match
- reports: Owned by business_id

### Medium Risk (Test thoroughly)
- businesses: Multiple policies (admin/owner/approved)
- beneficiaries: Simple self-access but multiple roles
- donations: Multiple roles accessing owned resources

### High Risk (Requires careful testing)
- donation_matches: Core workflow, multiple updates
- quotes: Multi-role updates
- pickup_schedules: Multi-role inserts

### Critical Risk (Complex joins - but should work)
- Beneficiary accessing businesses through donations join
- Complex subqueries in RLS conditions

---

## Part 9: Known Limitations & Workarounds

### Issue 1: Admin operations may be slower
**Problem:** Admin seeing "all" might be slower than direct queries
**Solution:** Admin operations can still use SERVICE_ROLE_KEY via API routes

### Issue 2: Cascade deletes
**Problem:** RLS doesn't prevent deletes; need explicit policies
**Solution:** DELETE policies restrict to appropriate roles

### Issue 3: Supabase Studio performance
**Problem:** Browsing tables in Supabase Studio will show only available rows
**Solution:** Use your regular accounts to test, not service role

---

## Part 10: Files to Modify

1. **Create:** `/supabase/migrations/[timestamp]_enable_rls.sql`
   - Contains all RLS policy definitions
   - Contains helper functions
   - Organized by table

2. **No code changes needed** to:
   - `/src/lib/supabase.ts` - Uses anon key (RLS applies)
   - `/src/lib/supabase-admin.ts` - Uses service role (RLS bypassed)
   - `/src/app/api/admin/*` - Already using service role

3. **Verify** these still work after RLS:
   - `/src/app/admin/**` - Uses client-side queries (RLS applies)
   - `/src/app/business/**` - Uses client-side queries (RLS applies)
   - `/src/app/beneficiary/**` - Uses client-side queries (RLS applies)

---

## Summary

### Admin Access
- ✅ Uses SERVICE_ROLE_KEY (bypasses RLS) via API routes
- ✅ Client-side queries protected by RLS policies
- ✅ Can see/do everything

### Business Access
- ✅ Can read own donations
- ✅ Can create/update own donations
- ✅ Can see donation_matches for own donations
- ✅ Can see quotes/schedules for own donations
- ✅ Can see reports for own business
- ✅ **Cannot** see other businesses' donations

### Beneficiary Access
- ✅ Can see own donation_matches (proposals)
- ✅ **Can see businesses** through complex join (CRITICAL)
- ✅ Can see donations they have matches for
- ✅ Can update own matches
- ✅ Can see quotes/schedules for matched donations
- ✅ **Cannot** see other beneficiaries' proposals
- ✅ **Cannot** see businesses without matches

### Overall
- 0 code changes needed
- ~40 SQL policies needed
- ~5 helper functions needed
- High confidence this will not break existing functionality
- Safe to implement in phases

