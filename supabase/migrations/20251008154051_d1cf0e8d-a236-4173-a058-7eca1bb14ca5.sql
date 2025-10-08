-- ============================================================
-- FIX CRITICO: Protezione contro creazione manuale di wallet
-- ============================================================
-- Problema: Gli utenti potrebbero creare wallet non autorizzati
-- Soluzione: Bloccare tutti gli INSERT diretti, permettere solo 
--           creazione automatica tramite trigger di sistema

-- Aggiungiamo una policy che BLOCCA tutti gli INSERT diretti
-- Il trigger create_wallet_for_user continuerà a funzionare
-- perché usa SECURITY DEFINER che bypassa le policy RLS
CREATE POLICY "Block manual wallet creation"
ON public.wallets
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Note di sicurezza:
-- 1. Questa policy IMPEDISCE agli utenti di creare wallet manualmente
-- 2. I wallet possono essere creati SOLO dal trigger create_wallet_for_user
-- 3. Il trigger usa SECURITY DEFINER quindi bypassa questa policy
-- 4. Questo previene attacchi dove utenti creano wallet falsi