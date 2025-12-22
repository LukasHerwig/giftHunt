import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check } from 'lucide-react';
import { PendingInvitation } from '../types';

interface PendingInvitationsSectionProps {
  invitations: PendingInvitation[];
  onAcceptInvitation: (invitationId: string) => Promise<void>;
}

export const PendingInvitationsSection = ({
  invitations,
  onAcceptInvitation,
}: PendingInvitationsSectionProps) => {
  const { t } = useTranslation();

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 space-y-2">
      <h2 className="text-[13px] font-medium text-ios-gray uppercase tracking-wider flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        {t('dashboard.pendingInvitations')}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="bg-ios-secondary rounded-[20px] p-5 space-y-4 shadow-sm border border-ios-blue/20">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-[17px] font-semibold">
                  {invitation.wishlists.title}
                </h3>
                <span className="text-[12px] font-medium text-ios-blue bg-ios-blue/10 px-2 py-0.5 rounded-full">
                  {t('dashboard.adminInvitation')}
                </span>
              </div>
              {invitation.wishlists.description && (
                <p className="text-[15px] text-ios-gray line-clamp-2">
                  {invitation.wishlists.description}
                </p>
              )}
              <p className="text-[13px] text-ios-gray">
                {t('dashboard.invitedBy')}:{' '}
                {invitation.wishlists.owner_profile?.email}
              </p>
            </div>
            <button
              onClick={() => onAcceptInvitation(invitation.id)}
              className="w-full h-12 bg-ios-blue text-white rounded-[12px] text-[17px] font-semibold flex items-center justify-center gap-2 active:opacity-70 transition-all">
              <Check className="w-4 h-4" />
              {t('dashboard.acceptInvitation')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
