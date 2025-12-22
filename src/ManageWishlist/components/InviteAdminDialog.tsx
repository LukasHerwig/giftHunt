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
      <DialogContent className="sm:max-w-[425px] rounded-[20px] bg-ios-secondary/95 backdrop-blur-xl border-ios-separator p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-center text-[17px] font-semibold">
            {t('inviteDialog.title')}
          </DialogTitle>
          <DialogDescription className="text-center text-[13px] text-ios-gray">
            {t('inviteDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="p-6 pt-2 space-y-6">
          <div className="bg-ios-background rounded-[12px] border border-ios-separator overflow-hidden">
            <div className="px-4 py-3">
              <Input
                type="email"
                placeholder={
                  t('inviteDialog.emailPlaceholder') || 'Email address'
                }
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="border-none bg-transparent p-0 h-auto text-[17px] focus-visible:ring-0 placeholder:text-ios-gray/50"
                disabled={inviting}
                required
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-ios-blue hover:bg-ios-blue/90 text-white rounded-[12px] py-6 font-semibold text-[17px] shadow-lg active:opacity-70 transition-all"
            disabled={inviting}>
            {inviting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {t('inviteDialog.sending') || 'Sending...'}
              </>
            ) : (
              t('inviteDialog.sendButton') || 'Send Invitation'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
