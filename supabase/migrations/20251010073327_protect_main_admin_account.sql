/*
  # Protect Main Admin Account

  1. Changes
    - Add trigger to prevent Junaid Gabol's role from being changed
    - Add trigger to prevent Junaid Gabol's account from being deleted
    
  2. Security
    - Ensures primary admin account remains protected at database level
*/

-- Create function to protect main admin
CREATE OR REPLACE FUNCTION protect_main_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if trying to modify Junaid Gabol's account
  IF OLD.id = '3afb33a2-4a42-4679-ace8-fe82ac60630a' THEN
    -- Prevent role change
    IF TG_OP = 'UPDATE' AND NEW.role != 'admin' THEN
      RAISE EXCEPTION 'Cannot change the role of the main admin account';
    END IF;
    
    -- Prevent deletion
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Cannot delete the main admin account';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updates
DROP TRIGGER IF EXISTS protect_main_admin_update ON profiles;
CREATE TRIGGER protect_main_admin_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_main_admin();

-- Create trigger for deletes
DROP TRIGGER IF EXISTS protect_main_admin_delete ON profiles;
CREATE TRIGGER protect_main_admin_delete
  BEFORE DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_main_admin();