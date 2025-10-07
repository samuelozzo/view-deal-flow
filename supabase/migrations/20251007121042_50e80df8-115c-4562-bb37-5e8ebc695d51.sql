-- Phase 1: Fix Critical Financial Data Leak in escrow_transactions
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view transactions for their offers or applications" ON public.escrow_transactions;

-- Create separate policies for business users and creators
CREATE POLICY "Business users can view all transactions for their offers"
ON public.escrow_transactions
FOR SELECT
USING (
  auth.uid() IN (
    SELECT business_id 
    FROM public.offers 
    WHERE id = escrow_transactions.offer_id
  )
);

CREATE POLICY "Creators can view transactions for their accepted applications"
ON public.escrow_transactions
FOR SELECT
USING (
  auth.uid() IN (
    SELECT creator_id 
    FROM public.applications 
    WHERE offer_id = escrow_transactions.offer_id
      AND status = 'accepted'
      AND creator_id = auth.uid()
  )
);

-- Phase 2: Restrict Public Data Access
-- Update profiles to require authentication
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Update offers to require authentication
DROP POLICY IF EXISTS "Offers are viewable by everyone" ON public.offers;

CREATE POLICY "Offers are viewable by authenticated users"
ON public.offers
FOR SELECT
USING (auth.uid() IS NOT NULL);