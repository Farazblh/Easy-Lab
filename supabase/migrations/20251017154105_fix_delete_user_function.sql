/*
  # Fix delete_user function to properly check admin role

  1. Changes
    - Update delete_user function to use auth.uid() directly instead of get_user_role()
    - This fixes the issue where SECURITY DEFINER context was preventing role check
*/

-- Create function to delete user (both profile and auth user)
CREATE OR REPLACE FUNCTION delete_user(user_id_to_delete uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  -- Get the role of the caller directly using auth.uid()
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  
  -- Check if caller is admin
  IF caller_role != 'admin' THEN
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
