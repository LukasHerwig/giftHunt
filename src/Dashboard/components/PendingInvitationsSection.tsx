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
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-primary" />
        {t('dashboard.pendingInvitations')}
      </h2>
      <div className="grid gap-4">
        {invitations.map((invitation) => (
          <Card key={invitation.id} className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                {invitation.wishlists.title}
                <Badge
                  variant="outline"
                  className="text-primary border-primary">
                  {t('dashboard.adminInvitation')}
                </Badge>
              </CardTitle>
              {invitation.wishlists.description && (
                <CardDescription>
                  {invitation.wishlists.description}
                </CardDescription>
              )}
              <CardDescription className="text-sm">
                {t('dashboard.invitedBy')}:{' '}
                {invitation.wishlists.owner_profile?.email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => onAcceptInvitation(invitation.id)}
                className="w-full bg-primary hover:bg-primary/90">
                <Check className="w-4 h-4 mr-2" />
                {t('dashboard.acceptInvitation')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
