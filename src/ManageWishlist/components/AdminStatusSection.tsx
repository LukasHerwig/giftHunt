import { useTranslation } from 'react-i18next';
import { getBaseUrl } from '@/lib/urlUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Trash2, Copy } from 'lucide-react';
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

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg">
          {t('manageWishlist.adminStatus')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-2">
            {t('manageWishlist.adminAccess')}
          </h4>
          <div className="space-y-2">
            {/* Show pending invitations */}
            {invitations
              .filter((inv) => !inv.accepted)
              .map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 bg-primary/5 dark:bg-primary/10 rounded-lg">
                  <div>
                    <p className="font-medium">{invitation.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('inviteDialog.invited')}{' '}
                      {new Date(invitation.created_at).toLocaleDateString()} •{' '}
                      {t('inviteDialog.expires')}{' '}
                      {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-primary font-medium">
                      {t('manageWishlist.pending')}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleCopyInviteLink(invitation.invitation_token)
                      }
                      className="text-primary hover:text-primary/80">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t('removeInvitationDialog.title')}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('removeInvitationDialog.description', {
                              email: invitation.email,
                            })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            {t('removeInvitationDialog.cancel')}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onRemoveInvitation(invitation.id)}
                            className="bg-destructive hover:bg-destructive/90">
                            {t('removeInvitationDialog.remove')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}

            {/* Show current admins */}
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center justify-between p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
                <div>
                  <p className="font-medium">
                    {admin.profiles?.email || t('manageWishlist.unknownUser')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('manageWishlist.adminSince')}{' '}
                    {new Date(admin.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-primary font-medium">
                    {t('manageWishlist.activeAdmin')}
                  </span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t('removeAdminDialog.title')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('removeAdminDialog.description', {
                            email:
                              admin.profiles?.email ||
                              t('manageWishlist.unknownUser'),
                          })}
                          {hasActiveShareLink && (
                            <>
                              <br />
                              <br />
                              <strong className="text-destructive">
                                {t('removeAdminDialog.shareLinkWarning')}
                              </strong>
                            </>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {t('removeAdminDialog.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onRemoveAdmin(admin.id)}
                          className="bg-destructive hover:bg-destructive/90">
                          {t('removeAdminDialog.remove')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
