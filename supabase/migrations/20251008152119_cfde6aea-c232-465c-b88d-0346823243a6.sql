-- ============================================================
-- FIX CRITICO: Protezione IBAN in payout_requests
-- ============================================================

-- 1. Creiamo una security definer function per verificare 
--    che il wallet appartenga all'utente corrente
CREATE OR REPLACE FUNCTION public.user_owns_wallet(_wallet_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.wallets
    WHERE id = _wallet_id
      AND user_id = _user_id
  );
$$;

-- 2. Rimuoviamo la policy SELECT esistente che potrebbe essere vulnerabile
DROP POLICY IF EXISTS "Users can view their own payout requests" ON public.payout_requests;

-- 3. Creiamo una nuova policy SELECT più sicura usando la security definer function
CREATE POLICY "Users can view only their wallet payout requests"
ON public.payout_requests
FOR SELECT
TO authenticated
USING (public.user_owns_wallet(wallet_id, auth.uid()));

-- 4. Aggiorniamo anche la policy INSERT per consistenza
DROP POLICY IF EXISTS "Creators can create payout requests" ON public.payout_requests;

CREATE POLICY "Creators can create payout requests for their wallets"
ON public.payout_requests
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_owns_wallet(wallet_id, auth.uid()) 
  AND has_role(auth.uid(), 'creator'::app_role)
);