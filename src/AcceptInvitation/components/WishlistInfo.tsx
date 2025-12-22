import { InvitationData } from '../types';
import { Gift } from 'lucide-react';

interface WishlistInfoProps {
  invitationData: InvitationData;
}

export const WishlistInfo = ({ invitationData }: WishlistInfoProps) => {
  if (!invitationData.wishlistTitle) return null;

  return (
    <div className="flex items-center gap-3 p-4">
      <div className="w-10 h-10 rounded-full bg-ios-blue/10 flex items-center justify-center flex-shrink-0">
        <Gift className="w-5 h-5 text-ios-blue" />
      </div>
      <div className="min-w-0">
        <h3 className="text-[17px] font-semibold truncate">
          {invitationData.wishlistTitle}
        </h3>
        {invitationData.wishlistDescription && (
          <p className="text-[13px] text-ios-label-secondary line-clamp-1">
            {invitationData.wishlistDescription}
          </p>
        )}
      </div>
    </div>
  );
};
