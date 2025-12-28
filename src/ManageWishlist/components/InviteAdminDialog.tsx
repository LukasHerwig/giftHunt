import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { UserPlus, Loader2, X, Check, Mail } from 'lucide-react';
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

interface FormContentProps {
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  inviting: boolean;
  inviteEmail: string;
  setInviteEmail: (email: string) => void;
  t: any;
}

const FormContent = ({
  onSubmit,
  onOpenChange,
  inviting,
  inviteEmail,
  setInviteEmail,
  t,
}: FormContentProps) => (
  <form onSubmit={onSubmit} className="flex flex-col h-full">
    {/* Header */}
    <div className="flex items-center justify-between px-4 h-16">
      <button
        type="button"
        onClick={() => onOpenChange(false)}
        className="w-10 h-10 flex items-center justify-center bg-ios-background/50 rounded-full text-foreground active:opacity-50 transition-opacity">
        <X className="w-5 h-5" />
      </button>
      <h2 className="text-[20px] font-bold text-foreground">
        {t('inviteDialog.title')}
      </h2>
      <button
        type="submit"
        disabled={inviting || !inviteEmail.trim()}
        className="w-10 h-10 flex items-center justify-center bg-ios-background/50 rounded-full text-ios-blue disabled:text-ios-gray active:opacity-50 transition-opacity">
        {inviting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Check className="w-5 h-5" />
        )}
      </button>
    </div>

    <div className="flex-1 overflow-y-auto px-4 pb-10 pt-2 space-y-8">
      {/* Icon Placeholder */}
      <div className="flex flex-col items-center">
        <div className="w-48 h-48 relative">
          <div className="absolute inset-0 bg-ios-blue/10 rounded-full blur-3xl" />
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative">
              <Mail className="w-24 h-24 text-ios-blue opacity-20 absolute -top-4 -left-4" />
              <Mail className="w-24 h-24 text-ios-blue opacity-40 absolute top-4 left-4" />
              <Mail className="w-32 h-32 text-ios-blue relative z-10" />
            </div>
          </div>
        </div>
        <p className="text-center text-[15px] text-ios-gray max-w-[260px] mt-4">
          {t('inviteDialog.description')}
        </p>
      </div>

      {/* Inputs */}
      <div className="space-y-6">
        <div className="bg-ios-background/50 rounded-[20px] px-5 py-4 border border-ios-separator/5">
          <input
            type="email"
            placeholder={t('inviteDialog.emailPlaceholder') || 'Email address'}
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="w-full bg-transparent text-[17px] outline-none placeholder-ios-gray text-foreground"
            disabled={inviting}
            required
          />
        </div>
      </div>
    </div>
  </form>
);

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

  const formProps = {
    onSubmit,
    onOpenChange,
    inviting,
    inviteEmail,
    setInviteEmail,
    t,
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[92vh] bg-ios-secondary border-none rounded-t-[20px]">
          <FormContent {...formProps} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="sm:max-w-[425px] p-0 overflow-hidden bg-ios-secondary border-none rounded-[24px] shadow-2xl">
        <FormContent {...formProps} />
      </DialogContent>
    </Dialog>
  );
};
