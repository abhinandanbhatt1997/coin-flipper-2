/*
  # Add Google Authentication Support

  This migration adds support for Google OAuth authentication.

  ## Changes
  1. Update auth configuration to support Google provider
  2. Ensure user trigger works with OAuth signups
  3. Add default wallet balance for new OAuth users
*/

-- Update the user creation trigger to handle OAuth users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, wallet_balance, created_at)
  VALUES (
    NEW.id, 
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email'), 
    1000, -- Default wallet balance for new users
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, users.email),
    wallet_balance = CASE 
      WHEN users.wallet_balance = 0 THEN 1000 
      ELSE users.wallet_balance 
    END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();