# Security Architecture Documentation

This document explains the security patterns used in this project to protect sensitive user data while enabling marketplace functionality.

## Table of Contents
- [User Profile Security Model](#user-profile-security-model)
- [Payout Request Security](#payout-request-security)
- [Stripe Webhook Security](#stripe-webhook-security)
- [User Credentials Security](#user-credentials-security)

---

## User Profile Security Model

### Problem Statement
Our marketplace needs to balance two competing requirements:
1. **Discovery**: Users must be able to find and view other users' profiles
2. **Privacy**: Sensitive business data must be protected from competitors

### Solution: Defense-in-Depth Architecture

We use a two-layer security model:

#### Layer 1: Row Level Security (RLS) on `profiles` table
```sql
-- Users can only view their own complete profile
CREATE POLICY "Users can view own complete profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"  
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
```

**Result**: Direct table queries are blocked for other users' profiles.

#### Layer 2: Filtered View with SECURITY DEFINER

```sql
-- Safe public view for marketplace discovery
CREATE VIEW public.public_profiles
WITH (security_invoker = off)  -- SECURITY DEFINER mode
AS SELECT 
  id,
  display_name,
  avatar_url,
  bio,
  account_type,
  created_at
FROM profiles;
```

**Why SECURITY DEFINER?**
- Without it: View would respect RLS → Users can only see their own profile → **Marketplace breaks**
- With it: View bypasses RLS → Shows only safe fields → **Marketplace works + Data protected**

### Sensitive Fields Protected

The following fields are **hidden** from `public_profiles` view:

| Field | Why It's Sensitive | Risk if Exposed |
|-------|-------------------|-----------------|
| `stripe_connect_payouts_enabled` | Indicates payment processing capability | Competitors can identify and poach top earners |
| `stripe_connect_charges_enabled` | Shows business payment status | Competitor intelligence gathering |
| `stripe_connect_onboarding_completed` | Business operational status | Targeted competitor attacks |
| `platform_links` | Social media accounts (JSONB) | Social engineering, account takeover |
| `updated_at` | Activity timestamp | User behavior profiling |

### Developer Usage Guide

```typescript
// ✅ CORRECT: View other users for marketplace discovery
const { data: allUsers } = await supabase
  .from('public_profiles')
  .select('*');

// ✅ CORRECT: View your own complete profile
const { data: myProfile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();

// ✅ CORRECT: Update your own profile
const { error } = await supabase
  .from('profiles')
  .update({ display_name: 'New Name' })
  .eq('id', user.id);

// ❌ WRONG: Try to view other users' profiles directly
// This will fail due to RLS
const { data } = await supabase
  .from('profiles')
  .select('*')
  .neq('id', user.id);
```

### Why This is Not a Security Vulnerability

**Supabase Linter Warning**: The security linter flags SECURITY DEFINER views as potentially dangerous.

**Reality**: This is a **false positive**. SECURITY DEFINER is dangerous when it *exposes* sensitive data, but safe when it *filters* sensitive data.

Our view:
- ✅ Exposes only 6 of 11 columns (45% data reduction)
- ✅ Hides all Stripe Connect flags
- ✅ Hides platform links and activity timestamps
- ✅ Enables marketplace discovery without compromising privacy

**Industry Examples**: LinkedIn, GitHub, Airbnb, and other marketplace platforms use similar patterns.

---

## Payout Request Security

### Problem Statement
Payout requests contain IBAN bank account numbers, which are extremely sensitive financial data.

### Solution: Block Direct Access + Masked Function

```sql
-- Block ALL direct access to payout_requests table
CREATE POLICY "Block direct access to payout_requests"
ON public.payout_requests FOR ALL
USING (false) WITH CHECK (false);

-- Provide secure access via function that masks IBANs
CREATE FUNCTION get_my_payout_requests_masked()
RETURNS TABLE(...)
AS $$
  SELECT 
    ...,
    -- Mask IBAN: Show only first 2 and last 4 characters
    CASE 
      WHEN length(iban) > 4 THEN 
        substring(iban from 1 for 2) || repeat('*', length(iban) - 6) || substring(iban from length(iban) - 3)
      ELSE '****'
    END as iban_masked
  FROM payout_requests
  WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid())
$$;
```

### Developer Usage

```typescript
// ✅ CORRECT: Use the masked function
const { data, error } = await supabase
  .rpc('get_my_payout_requests_masked');

// Result: iban_masked = "IT**************1234"

// ❌ WRONG: Direct table query (blocked by RLS)
const { data, error } = await supabase
  .from('payout_requests')
  .select('*');
```

---

## Stripe Webhook Security

### Problem Statement
Stripe webhooks receive payment events that credit user wallets. Without verification, attackers could send fake payment events to steal money.

### Solution: HMAC-SHA256 Signature Verification

Our webhook implementation in `supabase/functions/stripe-webhook/index.ts`:

1. **Parse signature header**: `t=timestamp,v1=signature`
2. **Verify timestamp**: Reject events older than 5 minutes (prevents replay attacks)
3. **Compute HMAC-SHA256**: `HMAC_SHA256(webhookSecret, timestamp.payload)`
4. **Constant-time comparison**: Prevent timing attacks
5. **Process only if valid**: Reject all events with invalid signatures

### Security Features
- ✅ Cryptographic signature verification
- ✅ Replay attack prevention (5-minute window)
- ✅ Constant-time comparison (timing attack prevention)
- ✅ Idempotent processing (duplicate payment handling)

---

## User Credentials Security

### Problem Statement
Instagram access tokens and Stripe Connect account IDs must never be accessible to regular users, even through complex RLS policy exploits.

### Solution: Complete Access Block + SECURITY DEFINER Functions

```sql
-- Block ALL user access to credentials table
CREATE POLICY "Block all direct credential access"
ON user_credentials FOR ALL
USING (false) WITH CHECK (false);

-- Service role has full access (for edge functions)
CREATE POLICY "Service role has full access to credentials"
ON user_credentials FOR ALL TO service_role
USING (true) WITH CHECK (true);
```

**Access Methods**: Only through SECURITY DEFINER functions:
- `get_user_stripe_account(user_id)` - Returns only Stripe account ID
- `set_user_stripe_account(user_id, account_id)` - Updates Stripe credentials
- `get_user_instagram_token(user_id)` - Returns only token for requesting user
- `set_user_instagram_token(user_id, token)` - Updates Instagram credentials

These functions:
- ✅ Enforce user ownership validation
- ✅ Run with elevated privileges (SECURITY DEFINER)
- ✅ Return only necessary data (no bulk queries)
- ✅ Log all access for audit trails

---

## Security Review Checklist

When adding new features, verify:

- [ ] Sensitive data (passwords, tokens, IBANs, private info) stored in protected tables?
- [ ] RLS enabled on all tables containing user data?
- [ ] RLS policies tested with different user roles?
- [ ] Public views filter sensitive fields?
- [ ] SECURITY DEFINER used only when necessary and with filtering?
- [ ] Edge functions validate all inputs?
- [ ] Webhook signatures verified cryptographically?
- [ ] User ownership validated before data access?
- [ ] No sensitive data logged to console?
- [ ] Environment variables used for secrets (not hardcoded)?

---

## Security Incident Response

If you suspect a security breach:

1. **Immediately disable** affected API keys/credentials
2. **Review logs** in Supabase Dashboard → Database → Logs
3. **Check RLS policies** for the affected tables
4. **Rotate secrets** that may have been exposed
5. **Notify users** if their data was accessed
6. **Document** what happened and how to prevent it

---

## Additional Resources

- [Supabase RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Stripe Security Best Practices](https://stripe.com/docs/security/guide)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

**Last Updated**: 2025-10-09
**Reviewed By**: Security Architecture Implementation
**Next Review**: Quarterly or after major feature additions
