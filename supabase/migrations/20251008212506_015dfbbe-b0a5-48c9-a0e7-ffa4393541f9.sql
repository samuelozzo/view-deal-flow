-- Update the handle_new_user function to include Instagram credentials
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    account_type, 
    display_name,
    instagram_access_token,
    instagram_user_id
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'creator')::account_type,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'instagram_access_token',
    NEW.raw_user_meta_data->>'instagram_user_id'
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