-- Add Instagram credentials fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN instagram_access_token text,
ADD COLUMN instagram_user_id text;

COMMENT ON COLUMN public.profiles.instagram_access_token IS 'Instagram Graph API access token for the creator';
COMMENT ON COLUMN public.profiles.instagram_user_id IS 'Instagram Business Account ID for the creator';