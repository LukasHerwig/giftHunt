import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';

export const AdminPrivileges = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <h4 className="text-[13px] font-normal text-ios-label-secondary uppercase tracking-wider ml-4">
        {t('acceptInvitation.asAdminYouCan')}
      </h4>
      <div className="bg-ios-secondary rounded-[12px] border border-ios-separator overflow-hidden">
        {[
          t('acceptInvitation.seeItemsTaken'),
          t('acceptInvitation.shareWishlistLink'),
          t('acceptInvitation.coordinateGifts'),
          t('acceptInvitation.helpManage'),
        ].map((privilege, index, array) => (
          <div key={index}>
            <div className="flex items-center gap-3 p-4">
              <ShieldCheck className="w-5 h-5 text-ios-blue flex-shrink-0" />
              <span className="text-[15px] text-ios-label-primary">
                {privilege}
              </span>
            </div>
            {index < array.length - 1 && (
              <div className="ml-12 border-b border-ios-separator" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
