import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface InviteAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canInviteAdmin: boolean;
  inviteEmail: string;
  setInviteEmail: (email: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  inviting: boolean;
}

export const InviteAdminDialog = ({
  open,
  onOpenChange,
  canInviteAdmin,
  inviteEmail,
  setInviteEmail,
  onSubmit,
  inviting,
}: InviteAdminDialogProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  if (!canInviteAdmin) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size={isMobile ? 'default' : 'lg'}>
          <UserPlus className="w-5 h-5" />
          <span className="ml-2">{t('manageWishlist.inviteAdmin')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('inviteDialog.title')}</DialogTitle>
          <DialogDescription>{t('inviteDialog.description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email address"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="text-base"
            disabled={inviting}
          />
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
            disabled={inviting}>
            {inviting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Invitation'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
