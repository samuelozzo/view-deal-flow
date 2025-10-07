-- =====================================================
-- VIEWDEAL DATABASE SCHEMA - FASE 2
-- =====================================================

-- 1. CREATE ENUMS
CREATE TYPE public.account_type AS ENUM ('creator', 'business');
CREATE TYPE public.app_role AS ENUM ('admin', 'creator', 'business');
CREATE TYPE public.offer_status AS ENUM ('draft', 'open', 'completed', 'cancelled');
CREATE TYPE public.application_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE public.submission_status AS ENUM ('pending_verification', 'verified', 'rejected');
CREATE TYPE public.escrow_status AS ENUM ('funded', 'released', 'refunded');
CREATE TYPE public.reward_type AS ENUM ('cash', 'product', 'discount');
CREATE TYPE public.platform_type AS ENUM ('TikTok', 'Instagram', 'YouTube');

-- =====================================================
-- 2. PROFILES TABLE
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type account_type NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  platform_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- 3. USER ROLES TABLE (SECURITY BEST PRACTICE)
-- =====================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security Definer Function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- 4. OFFERS TABLE
-- =====================================================
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  platform platform_type NOT NULL,
  reward_type reward_type NOT NULL,
  total_reward_cents INTEGER NOT NULL CHECK (total_reward_cents >= 0),
  claimed_reward_cents INTEGER NOT NULL DEFAULT 0 CHECK (claimed_reward_cents >= 0),
  required_views INTEGER NOT NULL CHECK (required_views > 0),
  views_per_product INTEGER,
  escrow_funded BOOLEAN NOT NULL DEFAULT false,
  status offer_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for offers
CREATE POLICY "Offers are viewable by everyone"
  ON public.offers FOR SELECT
  USING (true);

CREATE POLICY "Business users can create offers"
  ON public.offers FOR INSERT
  WITH CHECK (
    auth.uid() = business_id AND 
    public.has_role(auth.uid(), 'business')
  );

CREATE POLICY "Business users can update their own offers"
  ON public.offers FOR UPDATE
  USING (auth.uid() = business_id);

CREATE POLICY "Business users can delete their own offers"
  ON public.offers FOR DELETE
  USING (auth.uid() = business_id);

-- Indexes for performance
CREATE INDEX idx_offers_business_id ON public.offers(business_id);
CREATE INDEX idx_offers_status ON public.offers(status);
CREATE INDEX idx_offers_created_at ON public.offers(created_at DESC);

-- =====================================================
-- 5. APPLICATIONS TABLE
-- =====================================================
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status application_status NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(offer_id, creator_id)
);

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for applications
CREATE POLICY "Users can view applications for their offers or their own applications"
  ON public.applications FOR SELECT
  USING (
    auth.uid() = creator_id OR 
    auth.uid() IN (SELECT business_id FROM public.offers WHERE id = offer_id)
  );

CREATE POLICY "Creators can create applications"
  ON public.applications FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id AND 
    public.has_role(auth.uid(), 'creator')
  );

CREATE POLICY "Business users can update applications for their offers"
  ON public.applications FOR UPDATE
  USING (
    auth.uid() IN (SELECT business_id FROM public.offers WHERE id = offer_id)
  );

-- Indexes
CREATE INDEX idx_applications_offer_id ON public.applications(offer_id);
CREATE INDEX idx_applications_creator_id ON public.applications(creator_id);
CREATE INDEX idx_applications_status ON public.applications(status);

-- =====================================================
-- 6. SUBMISSIONS TABLE
-- =====================================================
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  content_url TEXT NOT NULL,
  screenshot_url TEXT,
  actual_views INTEGER NOT NULL CHECK (actual_views >= 0),
  calculated_earnings_cents INTEGER NOT NULL DEFAULT 0 CHECK (calculated_earnings_cents >= 0),
  status submission_status NOT NULL DEFAULT 'pending_verification',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(application_id)
);

-- Enable RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for submissions
CREATE POLICY "Users can view submissions for their applications"
  ON public.submissions FOR SELECT
  USING (
    auth.uid() IN (
      SELECT creator_id FROM public.applications WHERE id = application_id
    ) OR
    auth.uid() IN (
      SELECT business_id FROM public.offers 
      WHERE id IN (SELECT offer_id FROM public.applications WHERE id = application_id)
    )
  );

CREATE POLICY "Creators can create submissions for their applications"
  ON public.submissions FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT creator_id FROM public.applications WHERE id = application_id
    )
  );

CREATE POLICY "Business users can update submissions for their offers"
  ON public.submissions FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT business_id FROM public.offers 
      WHERE id IN (SELECT offer_id FROM public.applications WHERE id = application_id)
    )
  );

-- Indexes
CREATE INDEX idx_submissions_application_id ON public.submissions(application_id);
CREATE INDEX idx_submissions_status ON public.submissions(status);

-- =====================================================
-- 7. ESCROW TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE public.escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  status escrow_status NOT NULL DEFAULT 'funded',
  funded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  released_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for escrow_transactions
CREATE POLICY "Users can view transactions for their offers or applications"
  ON public.escrow_transactions FOR SELECT
  USING (
    auth.uid() IN (SELECT business_id FROM public.offers WHERE id = offer_id) OR
    auth.uid() IN (
      SELECT creator_id FROM public.applications WHERE offer_id = escrow_transactions.offer_id
    )
  );

CREATE POLICY "Business users can create transactions for their offers"
  ON public.escrow_transactions FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT business_id FROM public.offers WHERE id = offer_id)
  );

-- Indexes
CREATE INDEX idx_escrow_offer_id ON public.escrow_transactions(offer_id);
CREATE INDEX idx_escrow_status ON public.escrow_transactions(status);

-- =====================================================
-- 8. CHAT MESSAGES TABLE
-- =====================================================
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages for their applications"
  ON public.chat_messages FOR SELECT
  USING (
    auth.uid() IN (
      SELECT creator_id FROM public.applications WHERE id = application_id
    ) OR
    auth.uid() IN (
      SELECT business_id FROM public.offers 
      WHERE id IN (SELECT offer_id FROM public.applications WHERE id = application_id)
    )
  );

CREATE POLICY "Users can send messages for their applications"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND (
      auth.uid() IN (
        SELECT creator_id FROM public.applications WHERE id = application_id
      ) OR
      auth.uid() IN (
        SELECT business_id FROM public.offers 
        WHERE id IN (SELECT offer_id FROM public.applications WHERE id = application_id)
      )
    )
  );

-- Indexes
CREATE INDEX idx_chat_application_id ON public.chat_messages(application_id);
CREATE INDEX idx_chat_created_at ON public.chat_messages(created_at DESC);

-- =====================================================
-- 9. TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, account_type, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'creator')::account_type,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  
  -- Auto-assign role based on account type
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'creator')::app_role
  );
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();