-- Add unique index on wallet_transactions to prevent duplicate payment_intent processing
-- Using a partial unique index on the metadata jsonb field
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_transactions_stripe_payment_intent 
ON public.wallet_transactions ((metadata->>'stripe_payment_intent'))
WHERE metadata->>'stripe_payment_intent' IS NOT NULL;

-- Ensure wallets table has a trigger to update updated_at
-- (This should already exist but adding for safety)
DROP TRIGGER IF EXISTS set_wallets_updated_at ON public.wallets;
CREATE TRIGGER set_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();