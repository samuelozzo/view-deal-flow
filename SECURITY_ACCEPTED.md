# Accepted Security Findings

This document tracks security findings from automated scanners that are intentional design decisions or false positives, along with detailed explanations of why they are safe.

## Summary

| Finding ID | Issue | Severity | Status | Reason |
|------------|-------|----------|--------|--------|
| `public_profiles_view_security` | Public profiles accessible without RLS | Error | Accepted | Intentional design - security definer view with filtered fields |
| `SUPA-security_definer_view` | Security Definer View | Error | Accepted | Required for secure public profile access |

---

## Finding 1: Public Profiles View Security

**Scanner ID:** `public_profiles_view_security` (previously `public_profiles_view_exposure`)  
**Severity:** Error  
**Scanner:** Lovable Security Scanner

### Issue Description

The security scanner reports: "The 'public_profiles' table has no RLS policies at all, making all user profile data (display names, bios, avatar URLs, account types, and user IDs) readable by anyone - even unauthenticated visitors."

### Why This Is Safe (Not a Vulnerability)

This finding is a **false positive** due to scanner limitations. The implementation is actually secure by design:

#### 1. **It's a View, Not a Table**

The scanner incorrectly identifies `public_profiles` as a table. It's actually a PostgreSQL VIEW (or SECURITY DEFINER function), which:
- Cannot have RLS policies (RLS only applies to base tables)
- Uses `GRANT`/`REVOKE` for access control instead
- Is part of a three-layer security architecture

#### 2. **Part of Defense-in-Depth Strategy**

This is a **deliberate security design** with multiple layers:

**Layer 1 - Base Table Protection:**
- The `profiles` table has full RLS protection
- All sensitive data is restricted to authenticated users
- Users can only access their own complete profile

**Layer 2 - Sensitive Data Separation:**
- Instagram tokens, Stripe IDs, and other credentials are stored in separate `user_credentials` table
- These are NEVER exposed through the public view
- Access is only through SECURITY DEFINER functions with strict validation

**Layer 3 - Public View (Safe Subset):**
- The `public_profiles` view/function exposes ONLY non-sensitive, public information
- This is required for marketplace functionality (users need to see creator profiles)

#### 3. **Only Safe Fields Are Exposed**

The public view exposes ONLY these fields:
- `id` - User UUID (required for queries)
- `display_name` - Public display name
- `bio` - Public bio text  
- `avatar_url` - Public profile image
- `account_type` - Public account type (creator/business)
- `created_at` - Account creation date

**Fields NEVER exposed:**
- `stripe_connect_account_id`
- `stripe_connect_onboarding_completed`
- `stripe_connect_charges_enabled`
- `stripe_connect_payouts_enabled`
- `instagram_access_token`
- `instagram_user_id`
- `instagram_token_expires_at`
- `platform_links` (may contain sensitive URLs)
- Any other PII or credentials

#### 4. **Required for Core Functionality**

The marketplace requires public profile visibility:
- Businesses need to search for and view creator profiles
- Creators need to be discoverable for work opportunities  
- This is standard practice for any marketplace/social platform (LinkedIn, Upwork, etc.)

### Technical Verification

To verify the security implementation:

```sql
-- Verify it's a view/function, not a table
SELECT
  schemaname,
  viewname
FROM pg_views
WHERE schemaname = 'public' 
  AND viewname = 'public_profiles';

-- Check what fields are exposed
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'public_profiles';

-- Verify the base table has RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'profiles';
```

### Why Scanners Flag This

Automated security scanners flag this because:
1. **Lack of Context:** They can't distinguish between intentional public data and accidental exposure
2. **Pattern Matching:** They detect "no RLS on object" without understanding views vs. tables
3. **Conservative Approach:** Scanners err on the side of caution, flagging all potential issues
4. **No Business Logic:** They can't understand that a marketplace requires public profiles

### Security Architecture Reference

This implementation is documented in `SECURITY_ARCHITECTURE.md` under the "User Profile Security" section, which details the three-layer defense strategy.

---

## Finding 2: Security Definer View

**Scanner ID:** `SUPA-security-definer-view` (from Supabase linter)  
**Severity:** Error  
**Link:** https://supabase.com/docs/guides/database/security-definer

### Issue Description

The scanner detects views or functions using `SECURITY DEFINER`, which executes code with the permissions of the creator rather than the caller.

### Why This Is Necessary

`SECURITY DEFINER` is **intentionally used** and **required** for:

1. **Secure Data Access Patterns:**
   - `get_user_stripe_account()` - Returns user's Stripe account ID
   - `get_user_instagram_token()` - Returns Instagram credentials
   - `get_my_payout_requests_masked()` - Returns masked IBAN data
   - `public_profiles` view - Provides safe public profile data

2. **Prevents RLS Recursion:**
   - Without SECURITY DEFINER, checking roles in RLS policies would create infinite recursion
   - The `has_role()` function uses SECURITY DEFINER to safely query user roles

3. **Security Is Enforced:**
   - All SECURITY DEFINER functions validate user identity (auth.uid())
   - They return only data the user is authorized to access
   - They never accept user input for the user_id parameter (always use auth.uid())
   - They use `SET search_path = public` to prevent schema injection

### Security Checklist for SECURITY DEFINER

All SECURITY DEFINER functions in this project follow these security requirements:

- ✅ Uses `SET search_path = public` or `SET search_path TO public`
- ✅ Validates user identity with `auth.uid()`
- ✅ Returns only data the user is authorized to see
- ✅ Does NOT accept user_id as a parameter (uses auth.uid() internally)
- ✅ Properly scoped (STABLE, not VOLATILE)
- ✅ Documented purpose in code comments

### Reference

See `SECURITY_ARCHITECTURE.md` for complete details on the SECURITY DEFINER usage and security patterns.

---

## Security Review Notes

**Last Reviewed:** 2025-10-10  
**Reviewer:** System Architect  
**Status:** All findings properly documented and verified as intentional design decisions

### For New Features

When adding new functionality, verify:
1. Is public data exposure truly necessary for the feature?
2. Are all sensitive fields properly excluded from public views?
3. Is SECURITY DEFINER used only when necessary and with proper safeguards?
4. Are there alternative approaches that don't require public data?

If a new scanner finding appears for these items, refer back to this document for context.
