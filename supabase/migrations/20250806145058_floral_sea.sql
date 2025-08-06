/*
  # Add Admin Features and User Management

  This migration adds admin functionality and user management features.

  ## New Features
  1. Add user blocking/restriction capabilities
  2. Add admin role management
  3. Add system settings
  4. Add audit logging
  5. Enhance RLS policies for admin access

  ## Changes
  1. Add is_blocked column to users table
  2. Add admin_role column to users table
  3. Create admin_settings table
  4. Create audit_logs table
  5. Update RLS policies for admin access
*/

-- Add admin columns to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_blocked'
  ) THEN
    ALTER TABLE users ADD COLUMN is_blocked boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'admin_role'
  ) THEN
    ALTER TABLE users ADD COLUMN admin_role text DEFAULT 'user' CHECK (admin_role IN ('user', 'admin', 'super_admin'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE users ADD COLUMN last_login timestamptz;
  END IF;
END $$;

-- Create admin_settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES users(id),
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_settings (only admins can access)
CREATE POLICY "Admins can read settings"
  ON admin_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.admin_role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update settings"
  ON admin_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.admin_role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for audit_logs (only admins can read)
CREATE POLICY "Admins can read audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.admin_role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update users RLS policies to allow admin access
CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid() 
      AND admin_user.admin_role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update all users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid() 
      AND admin_user.admin_role IN ('admin', 'super_admin')
    )
  );

-- Insert default admin settings
INSERT INTO admin_settings (key, value, description) VALUES
  ('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
  ('default_entry_fee', '100', 'Default game entry fee'),
  ('platform_commission', '0.13', 'Platform commission percentage'),
  ('max_players_per_game', '10', 'Maximum players per game'),
  ('auto_block_suspicious', 'true', 'Auto-block suspicious users'),
  ('email_notifications', 'true', 'Send admin email notifications')
ON CONFLICT (key) DO NOTHING;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  admin_id uuid,
  action text,
  target_type text,
  target_id uuid DEFAULT NULL,
  details jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
  VALUES (admin_id, action, target_type, target_id, details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to block/unblock user
CREATE OR REPLACE FUNCTION admin_block_user(
  admin_id uuid,
  target_user_id uuid,
  block_status boolean,
  reason text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  admin_role_check text;
BEGIN
  -- Check if admin has permission
  SELECT admin_role INTO admin_role_check
  FROM users
  WHERE id = admin_id;
  
  IF admin_role_check NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  
  -- Update user block status
  UPDATE users
  SET is_blocked = block_status
  WHERE id = target_user_id;
  
  -- Log the action
  PERFORM log_admin_action(
    admin_id,
    CASE WHEN block_status THEN 'block_user' ELSE 'unblock_user' END,
    'user',
    target_user_id,
    jsonb_build_object('reason', reason)
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_admin_role ON users(admin_role);
CREATE INDEX IF NOT EXISTS idx_users_is_blocked ON users(is_blocked);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(key);

-- Update the user creation trigger to set admin role for admin emails
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, wallet_balance, created_at, admin_role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email'), 
    1000, -- Default wallet balance for new users
    now(),
    CASE 
      WHEN COALESCE(NEW.email, NEW.raw_user_meta_data->>'email') LIKE '%admin%' THEN 'admin'
      ELSE 'user'
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, users.email),
    wallet_balance = CASE 
      WHEN users.wallet_balance = 0 THEN 1000 
      ELSE users.wallet_balance 
    END,
    admin_role = CASE 
      WHEN COALESCE(EXCLUDED.email, users.email) LIKE '%admin%' THEN 'admin'
      ELSE users.admin_role
    END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;