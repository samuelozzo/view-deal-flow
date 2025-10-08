-- SECURITY FIX: Replace view with SECURITY DEFINER function
-- Step 1: Drop the old function that depends on the view

DROP FUNCTION IF EXISTS public.get_my_payout_requests_from_view();

-- Step 2: Drop the view
DROP VIEW IF EXISTS public.payout_requests_user_view CASCADE;

-- Step 3: Create new SECURITY DEFINER function that returns masked payout requests
CREATE OR REPLACE FUNCTION public.get_my_payout_requests_masked()
RETURNS TABLE (
  id uuid,
  wallet_id uuid,
  amount_cents integer,
  status payout_status,
  requested_at timestamp with time zone,
  processed_at timestamp with time zone,
  admin_note text,
  iban_masked text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    pr.id,
    pr.wallet_id,
    pr.amount_cents,
    pr.status,
    pr.requested_at,
    pr.processed_at,
    pr.admin_note,
    CASE 
      WHEN length(pr.iban) > 4 THEN 
        substring(pr.iban from 1 for 2) || repeat('*', length(pr.iban) - 6) || substring(pr.iban from length(pr.iban) - 3)
      ELSE '****'
    END as iban_masked
  FROM public.payout_requests pr
  WHERE pr.wallet_id IN (
    SELECT w.id 
    FROM public.wallets w 
    WHERE w.user_id = auth.uid()
  )
  ORDER BY pr.requested_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_payout_requests_masked() TO authenticated;

-- Security model:
-- ❌ Users CANNOT query payout_requests table (no SELECT policy)
-- ✅ Users call get_my_payout_requests_masked() for their masked data
-- ✅ Function filters by wallet ownership (auth.uid())
-- ✅ Admins query payout_requests directly for full IBANs
-- ✅ Hackers with stolen wallet_id cannot bypass function filtering