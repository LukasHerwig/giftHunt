import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/components/auth/useAuth';
import { InviteLoading, InviteProblem, InvitePrompt, InviteShell } from './components';
import { useAcceptInvitation } from './hooks';

const AcceptInvitation = () => {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const flow = useAcceptInvitation(params.get('token'));

  return (
    <InviteShell signedIn={Boolean(user)}>
      {flow.phase === 'loading' && <InviteLoading />}
      {flow.phase === 'prompt' && flow.invitation && (
        <InvitePrompt invitation={flow.invitation} onSignIn={flow.goSignIn} onSignUp={flow.goSignUp} />
      )}
      {flow.phase === 'problem' && flow.problem && (
        <InviteProblem
          problem={flow.problem}
          email={user?.email}
          onHome={flow.goHome}
          onLeave={() => void flow.leave()}
          onRetry={flow.retry}
        />
      )}
    </InviteShell>
  );
};

export default AcceptInvitation;
