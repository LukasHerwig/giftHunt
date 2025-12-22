import { useTranslation } from 'react-i18next';
import { getBaseUrl } from '@/lib/urlUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2, Copy, User, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { WishlistAdmin, WishlistInvitation } from '../types';

interface AdminStatusSectionProps {
  admins: WishlistAdmin[];
  invitations: WishlistInvitation[];
  hasActiveShareLink: boolean;
  onRemoveInvitation: (invitationId: string) => Promise<void>;
  onRemoveAdmin: (adminId: string) => Promise<void>;
}

export const AdminStatusSection = ({
  admins,
  invitations,
  hasActiveShareLink,
  onRemoveInvitation,
  onRemoveAdmin,
}: AdminStatusSectionProps) => {
  const { t } = useTranslation();

  const handleCopyInviteLink = async (token: string) => {
    try {
      const inviteLink = `${getBaseUrl()}/accept-invitation?token=${token}`;
      await navigator.clipboard.writeText(inviteLink);
      toast.success(t('messages.inviteLinkCopied'));
    } catch (error) {
      console.error('Failed to copy invitation link:', error);
      toast.error('Failed to copy link - please try again');
    }
  };

  if (admins.length === 0 && invitations.length === 0) {
    return null;
  }

  const pendingInvitations = invitations.filter((inv) => !inv.accepted);

  return (
    <div className="mb-8">
      <h2 className="text-[13px] font-normal text-ios-label-secondary uppercase tracking-wider mb-2 ml-4">
        {t('manageWishlist.adminStatus')}
      </h2>

      <div className="bg-ios-secondary rounded-[12px] border border-ios-separator overflow-hidden">
        {/* Show pending invitations */}
        {pendingInvitations.map((invitation, index) => (
          <div key={invitation.id}>
            <div className="flex items-center justify-between p-4 active:bg-ios-tertiary transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-ios-blue/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-ios-blue" />
                </div>
                <div className="min-w-0">
                  <p className="text-[17px] font-medium truncate">
                    {invitation.email}
                  </p>
                  <p className="text-[13px] text-ios-label-secondary">
                    {t('manageWishlist.pending')} •{' '}
                    {new Date(invitation.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleCopyInviteLink(invitation.invitation_token)
                  }
                  className="h-8 w-8 text-ios-blue hover:bg-transparent active:opacity-50">
                  <Copy className="w-4 h-4" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-ios-red hover:bg-transparent active:opacity-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-[20px] border-none bg-ios-secondary/95 backdrop-blur-xl max-w-[90%] sm:max-w-[400px]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-center text-[17px] font-semibold">
                        {t('removeInvitationDialog.title')}
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-center text-[13px] text-ios-label-secondary">
                        {t('removeInvitationDialog.description', {
                          email: invitation.email,
                        })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-col gap-0 border-t border-ios-separator mt-4">
                      <AlertDialogAction
                        onClick={() => onRemoveInvitation(invitation.id)}
                        className="bg-transparent text-ios-red hover:bg-transparent active:bg-ios-tertiary font-semibold py-3 h-auto rounded-none border-b border-ios-separator">
                        {t('removeInvitationDialog.remove')}
                      </AlertDialogAction>
                      <AlertDialogCancel className="bg-transparent text-ios-blue hover:bg-transparent active:bg-ios-tertiary py-3 h-auto rounded-none border-none">
                        {t('removeInvitationDialog.cancel')}
                      </AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            {(index < pendingInvitations.length - 1 || admins.length > 0) && (
              <div className="ml-16 border-b border-ios-separator" />
            )}
          </div>
        ))}

        {/* Show current admins */}
        {admins.map((admin, index) => (
          <div key={admin.id}>
            <div className="flex items-center justify-between p-4 active:bg-ios-tertiary transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-ios-green/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-ios-green" />
                </div>
                <div className="min-w-0">
                  <p className="text-[17px] font-medium truncate">
                    {admin.profiles?.email || t('manageWishlist.unknownUser')}
                  </p>
                  <p className="text-[13px] text-ios-label-secondary">
                    {t('manageWishlist.activeAdmin')} •{' '}
                    {new Date(admin.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-ios-red hover:bg-transparent active:opacity-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[20px] border-none bg-ios-secondary/95 backdrop-blur-xl max-w-[90%] sm:max-w-[400px]">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-center text-[17px] font-semibold">
                      {t('removeAdminDialog.title')}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center text-[13px] text-ios-label-secondary">
                      {t('removeAdminDialog.description', {
                        email:
                          admin.profiles?.email ||
                          t('manageWishlist.unknownUser'),
                      })}
                      {hasActiveShareLink && (
                        <>
                          <br />
                          <br />
                          <span className="text-ios-red font-semibold">
                            {t('removeAdminDialog.shareLinkWarning')}
                          </span>
                        </>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col sm:flex-col gap-0 border-t border-ios-separator mt-4">
                    <AlertDialogAction
                      onClick={() => onRemoveAdmin(admin.id)}
                      className="bg-transparent text-ios-red hover:bg-transparent active:bg-ios-tertiary font-semibold py-3 h-auto rounded-none border-b border-ios-separator">
                      {t('removeAdminDialog.remove')}
                    </AlertDialogAction>
                    <AlertDialogCancel className="bg-transparent text-ios-blue hover:bg-transparent active:bg-ios-tertiary py-3 h-auto rounded-none border-none">
                      {t('removeAdminDialog.cancel')}
                    </AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            {index < admins.length - 1 && (
              <div className="ml-16 border-b border-ios-separator" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
