-- ============================================================
-- FIX CRITICO: Protezione IBAN - Mascheramento per utenti
-- ============================================================
-- Problema: Gli IBAN sono visibili in chiaro se un account viene compromesso
-- Soluzione: Creare una VIEW che maschera gli IBAN per utenti normali
--           Gli admin mantengono accesso completo alla tabella

-- 1. Creiamo una VIEW che maschera gli IBAN mostrando solo le ultime 4 cifre
CREATE OR REPLACE VIEW public.payout_requests_user_view AS
SELECT 
  id,
  wallet_id,
  amount_cents,
  status,
  requested_at,
  processed_at,
  admin_note,
  -- Maschera IBAN: mostra solo ultime 4 cifre (es: "IT**************1234")
  CASE 
    WHEN length(iban) > 4 THEN 
      substring(iban from 1 for 2) || repeat('*', length(iban) - 6) || substring(iban from length(iban) - 3)
    ELSE '****'
  END as iban_masked
FROM public.payout_requests;

-- 2. Abilitiamo RLS sulla VIEW
ALTER VIEW public.payout_requests_user_view SET (security_invoker = on);

-- 3. Policy per permettere agli utenti di vedere le loro richieste con IBAN mascherato
-- Nota: Le VIEW in Supabase usano le policy della tabella sottostante
-- quindi la policy user_owns_wallet continua a funzionare

-- 4. IMPORTANTE: Modifichiamo la policy SELECT esistente sulla tabella
--    per permettere solo agli admin di vedere gli IBAN completi
DROP POLICY IF EXISTS "Users can view only their wallet payout requests" ON public.payout_requests;

-- Ricreamo la policy solo per admin sulla tabella principale
CREATE POLICY "Only admins can view full payout requests with IBAN"
ON public.payout_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Creiamo una funzione RPC per permettere agli utenti di vedere le loro richieste mascherate
CREATE OR REPLACE FUNCTION public.get_my_payout_requests()
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
    id,
    wallet_id,
    amount_cents,
    status,
    requested_at,
    processed_at,
    admin_note,
    CASE 
      WHEN length(iban) > 4 THEN 
        substring(iban from 1 for 2) || repeat('*', length(iban) - 6) || substring(iban from length(iban) - 3)
      ELSE '****'
    END as iban_masked
  FROM public.payout_requests
  WHERE user_owns_wallet(wallet_id, auth.uid());
$$;

-- Note di sicurezza:
-- 1. Gli utenti NON possono più vedere gli IBAN completi dalla tabella
-- 2. Gli utenti devono usare get_my_payout_requests() per vedere le loro richieste (con IBAN mascherato)
-- 3. Solo gli admin vedono gli IBAN completi
-- 4. Se un account viene compromesso, l'attaccante vede solo "IT**************1234"