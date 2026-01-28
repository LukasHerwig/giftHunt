import { useTranslation } from 'react-i18next';
import {
  SheetDialog,
  SheetDialogContent,
  SheetDialogHeader,
  SheetDialogBody,
} from '@/components/ui/sheet-dialog';
import { Loader2, X, Check, Mail } from 'lucide-react';

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
  t: ReturnType<typeof useTranslation>['t'];
}

const FormContent = ({
  onSubmit,
  onOpenChange,
  inviting,
  inviteEmail,
  setInviteEmail,
  t,
}: FormContentProps) => (
  <form onSubmit={onSubmit}>
    <SheetDialogHeader
      title={t('inviteDialog.title')}
      onClose={() => onOpenChange(false)}
      submitDisabled={inviting || !inviteEmail.trim()}
      loading={inviting}
      closeIcon={<X className="w-5 h-5" />}
      submitIcon={
        inviting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Check className="w-5 h-5" />
        )
      }
    />

    <SheetDialogBody>
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

      {/* Email Input */}
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
    </SheetDialogBody>
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

  if (!canInviteAdmin) return null;

  return (
    <SheetDialog open={open} onOpenChange={onOpenChange}>
      <SheetDialogContent>
        <FormContent
          onSubmit={onSubmit}
          onOpenChange={onOpenChange}
          inviting={inviting}
          inviteEmail={inviteEmail}
          setInviteEmail={setInviteEmail}
          t={t}
        />
      </SheetDialogContent>
    </SheetDialog>
  );
};
