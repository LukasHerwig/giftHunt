import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ProfileNotFoundState = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ios-background flex flex-col">
      <div className="p-4">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 flex items-center justify-center bg-ios-secondary rounded-full text-foreground active:scale-90 transition-all shadow-sm border border-ios-separator/10">
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-ios-red/10 rounded-full flex items-center justify-center mb-6">
          <UserX className="w-10 h-10 text-ios-red" />
        </div>
        <h1 className="text-[24px] font-bold text-foreground mb-2">
          {t('messages.profileNotFoundTitle') || 'Profile Not Found'}
        </h1>
        <p className="text-[17px] text-ios-gray mb-8 max-w-xs">
          {t('messages.profileNotFound')}
        </p>
        <Button
          onClick={() => navigate('/')}
          className="bg-ios-blue hover:bg-ios-blue/90 text-white rounded-full px-8 h-12 font-semibold text-[17px]">
          {t('common.backToDashboard') || 'Back to Dashboard'}
        </Button>
      </div>
    </div>
  );
};
