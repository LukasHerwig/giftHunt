import { useSearchParams } from 'react-router-dom';
import { useAcceptInvitation } from './hooks';
import { LoadingState, ErrorState, SuccessState } from './components';

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const {
    loading,
    error,
    invitationValid,
    invitationData,
    handleSignIn,
    handleGoHome,
  } = useAcceptInvitation(token);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onGoHome={handleGoHome} />;
  }

  if (invitationValid && invitationData) {
    return <SuccessState invitationData={invitationData} onSignIn={handleSignIn} />;
  }

  // Fallback to error state
  return <ErrorState error="Unable to process invitation" onGoHome={handleGoHome} />;
};

export default AcceptInvitation;