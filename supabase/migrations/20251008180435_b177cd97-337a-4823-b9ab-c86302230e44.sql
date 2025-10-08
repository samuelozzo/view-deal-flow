-- Create unique index on wallet_transactions to prevent duplicate processing
-- Using metadata->>'stripe_payment_intent' as the unique constraint for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS uq_wallet_transactions_stripe_pi 
ON public.wallet_transactions ((metadata->>'stripe_payment_intent'))
WHERE metadata->>'stripe_payment_intent' IS NOT NULL;