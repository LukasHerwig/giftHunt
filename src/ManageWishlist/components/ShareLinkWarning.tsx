import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ShareLinkWarningProps {
  hasActiveShareLink: boolean;
}

export const ShareLinkWarning = ({
  hasActiveShareLink,
}: ShareLinkWarningProps) => {
  const { t } = useTranslation();

  if (!hasActiveShareLink) return null;

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50/80 dark:border-amber-800/50 dark:bg-amber-950/30">
      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="text-amber-700 dark:text-amber-300">
        {t('messages.shareLinkActive') + ' '}
        {t('messages.editingRestricted')}
        <br />
        <br />
        {t('messages.editingAskAdmin')}
      </AlertDescription>
    </Alert>
  );
};
