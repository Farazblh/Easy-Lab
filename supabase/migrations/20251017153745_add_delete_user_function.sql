/*
  # Add function to delete users from auth.users

  1. New Functions
    - `delete_user` - Admin function to delete users from both profiles and auth.users
  
  2. Security
    - Function is SECURITY DEFINER to allow deletion from auth.users
    - Only callable by users with admin role
    - Prevents deletion of the main admin account
*/

-- Create function to delete user (both profile and auth user)
CREATE OR REPLACE FUNCTION delete_user(user_id_to_delete uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF get_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  -- Prevent deletion of main admin account
  IF user_id_to_delete = '3afb33a2-4a42-4679-ace8-fe82ac60630a' THEN
    RAISE EXCEPTION 'Cannot delete main admin account';
  END IF;

  -- Delete from profiles first (will cascade or trigger other deletions)
  DELETE FROM profiles WHERE id = user_id_to_delete;
  
  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = user_id_to_delete;
END;
$$;
