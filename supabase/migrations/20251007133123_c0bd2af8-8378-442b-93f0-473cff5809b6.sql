-- Add admin role to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'admin';

-- Add admin_note column to submissions table
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS admin_note text,
ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Admin can create notifications for any user
CREATE POLICY "Admins can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admin can view all submissions
CREATE POLICY "Admins can view all submissions"
ON public.submissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admin can update all submissions (for approval/rejection)
CREATE POLICY "Admins can update all submissions"
ON public.submissions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admin can view all applications
CREATE POLICY "Admins can view all applications"
ON public.applications
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admin can view all offers
CREATE POLICY "Admins can view all offers"
ON public.offers
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admin can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admin can view all escrow transactions
CREATE POLICY "Admins can view all escrow transactions"
ON public.escrow_transactions
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admin can create escrow transactions
CREATE POLICY "Admins can create escrow transactions"
ON public.escrow_transactions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admin can update escrow transactions
CREATE POLICY "Admins can update escrow transactions"
ON public.escrow_transactions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Create index on notifications for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);