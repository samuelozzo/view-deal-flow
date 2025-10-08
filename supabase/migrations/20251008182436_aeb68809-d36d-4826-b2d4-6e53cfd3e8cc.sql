-- Create unique index on wallet_transactions for payment_intent_id idempotency
-- This ensures no duplicate transactions for the same Stripe payment intent

-- First, add payment_intent_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'wallet_transactions' 
    AND column_name = 'payment_intent_id'
  ) THEN
    ALTER TABLE public.wallet_transactions 
    ADD COLUMN payment_intent_id text;
  END IF;
END $$;

-- Create unique index on payment_intent_id (allows NULL values, but ensures uniqueness when not null)
CREATE UNIQUE INDEX IF NOT EXISTS uq_wallet_tx_pi 
ON public.wallet_transactions(payment_intent_id) 
WHERE payment_intent_id IS NOT NULL;