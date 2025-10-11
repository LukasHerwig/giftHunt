-- Create a database function to automatically create admin record when invitation is accepted
-- This ensures data consistency between admin_invitations and wishlist_admins tables

-- Create a function that creates admin record when invitation is accepted
CREATE OR REPLACE FUNCTION create_admin_on_invitation_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the invitation was just accepted (changed from false to true)
  IF OLD.accepted = false AND NEW.accepted = true THEN
    -- Get the user ID for the accepted invitation email
    DECLARE
      invitee_user_id UUID;
    BEGIN
      SELECT id INTO invitee_user_id 
      FROM public.profiles 
      WHERE email = NEW.email 
      LIMIT 1;
      
      -- If we found the user, create the admin record
      IF invitee_user_id IS NOT NULL THEN
        INSERT INTO public.wishlist_admins (
          wishlist_id,
          admin_id,
          invited_by
        ) VALUES (
          NEW.wishlist_id,
          invitee_user_id,
          NEW.invited_by
        )
        -- Use ON CONFLICT to prevent duplicate records
        ON CONFLICT (wishlist_id) DO NOTHING;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create admin record when invitation is accepted
DROP TRIGGER IF EXISTS auto_create_admin_on_accept ON public.admin_invitations;

CREATE TRIGGER auto_create_admin_on_accept
  AFTER UPDATE ON public.admin_invitations
  FOR EACH ROW
  EXECUTE FUNCTION create_admin_on_invitation_acceptance();

-- Add comment to document the trigger
COMMENT ON FUNCTION create_admin_on_invitation_acceptance() 
IS 'Automatically creates wishlist_admins record when admin_invitations.accepted changes from false to true';

COMMENT ON TRIGGER auto_create_admin_on_accept ON public.admin_invitations 
IS 'Ensures admin record is created when invitation is accepted - maintains data consistency';