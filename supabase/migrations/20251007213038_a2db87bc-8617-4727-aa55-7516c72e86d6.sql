-- Create enum types for wallet system
CREATE TYPE public.wallet_transaction_type AS ENUM ('escrow_reserve', 'escrow_release', 'payout', 'topup', 'refund');
CREATE TYPE public.wallet_transaction_direction AS ENUM ('in', 'out');
CREATE TYPE public.wallet_transaction_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE public.payout_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE public.topup_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
CREATE TYPE public.topup_method AS ENUM ('card', 'bank_transfer');

-- Create wallets table
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  available_cents INTEGER NOT NULL DEFAULT 0 CHECK (available_cents >= 0),
  reserved_cents INTEGER NOT NULL DEFAULT 0 CHECK (reserved_cents >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create wallet_transactions table
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  type wallet_transaction_type NOT NULL,
  direction wallet_transaction_direction NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  status wallet_transaction_status NOT NULL DEFAULT 'completed',
  reference_type TEXT,
  reference_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payout_requests table
CREATE TABLE public.payout_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  iban TEXT NOT NULL,
  status payout_status NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  admin_note TEXT
);

-- Create topup_intents table
CREATE TABLE public.topup_intents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  method topup_method NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  status topup_status NOT NULL DEFAULT 'pending',
  reference TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add columns to escrow_transactions
ALTER TABLE public.escrow_transactions 
  ADD COLUMN creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE,
  ADD COLUMN duration_days INTEGER NOT NULL DEFAULT 14,
  ADD COLUMN scheduled_release_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topup_intents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wallets
CREATE POLICY "Users can view their own wallet"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
  ON public.wallets FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for wallet_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.wallet_transactions FOR SELECT
  USING (wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all transactions"
  ON public.wallet_transactions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for payout_requests
CREATE POLICY "Creators can create payout requests"
  ON public.payout_requests FOR INSERT
  WITH CHECK (
    wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'creator'::app_role)
  );

CREATE POLICY "Users can view their own payout requests"
  ON public.payout_requests FOR SELECT
  USING (wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view and update all payout requests"
  ON public.payout_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for topup_intents
CREATE POLICY "Business users can create topup intents"
  ON public.topup_intents FOR INSERT
  WITH CHECK (
    wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'business'::app_role)
  );

CREATE POLICY "Users can view their own topup intents"
  ON public.topup_intents FOR SELECT
  USING (wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view and update all topup intents"
  ON public.topup_intents FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes
CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);
CREATE INDEX idx_payout_requests_status ON public.payout_requests(status);
CREATE INDEX idx_topup_intents_status ON public.topup_intents(status);
CREATE INDEX idx_escrow_scheduled_release ON public.escrow_transactions(scheduled_release_at) WHERE status = 'funded';

-- Trigger for updated_at on wallets
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create wallet for new users
CREATE OR REPLACE FUNCTION public.create_wallet_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Trigger to create wallet when profile is created
CREATE TRIGGER on_profile_created_create_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_wallet_for_user();