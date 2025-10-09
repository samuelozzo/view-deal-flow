-- Add Stripe Connect account ID to profiles
ALTER TABLE public.profiles
ADD COLUMN stripe_connect_account_id TEXT,
ADD COLUMN stripe_connect_onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN stripe_connect_charges_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN stripe_connect_payouts_enabled BOOLEAN DEFAULT FALSE;