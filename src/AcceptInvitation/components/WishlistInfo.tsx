import { InvitationData } from '../types';

interface WishlistInfoProps {
  invitationData: InvitationData;
}

export const WishlistInfo = ({ invitationData }: WishlistInfoProps) => {
  if (!invitationData.wishlistTitle) return null;

  return (
    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
      <h3 className="font-semibold text-green-800 mb-1">
        {invitationData.wishlistTitle}
      </h3>
      {invitationData.wishlistDescription && (
        <p className="text-sm text-green-700">
          {invitationData.wishlistDescription}
        </p>
      )}
    </div>
  );
};