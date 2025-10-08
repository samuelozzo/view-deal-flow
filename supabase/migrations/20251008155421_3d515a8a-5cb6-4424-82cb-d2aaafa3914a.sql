-- Views inherit RLS from their underlying tables, so we can't enable RLS directly on the view
-- Instead, we need to ensure the view definition itself filters data appropriately
-- OR create a security definer function that creators can call

-- Create a security definer function that allows users to query the masked view
-- This bypasses the base table RLS while still ensuring security through wallet ownership

CREATE OR REPLACE FUNCTION public.get_my_payout_requests_from_view()
RETURNS SETOF payout_requests_user_view
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.payout_requests_user_view v
  WHERE EXISTS (
    SELECT 1
    FROM public.wallets w
    WHERE w.id = v.wallet_id
      AND w.user_id = auth.uid()
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_payout_requests_from_view() TO authenticated;