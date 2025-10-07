-- Create function to delete user account
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_uuid uuid;
BEGIN
  -- Get the current user's ID
  user_uuid := auth.uid();
  
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete from related tables (cascading should handle most of this, but being explicit)
  -- The foreign key constraints will handle cascading deletes for most tables
  
  -- Delete the user from auth.users (this will cascade to profiles and other tables)
  DELETE FROM auth.users WHERE id = user_uuid;
  
END;
$$;