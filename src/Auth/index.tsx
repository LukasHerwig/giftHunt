import { useAuth } from './hooks/useAuth';
import { AuthLoadingState } from './components/AuthLoadingState';
import { AuthFormWrapper } from './components/AuthFormWrapper';

const Auth = () => {
  const { checking } = useAuth();

  if (checking) {
    return <AuthLoadingState />;
  }

  return <AuthFormWrapper />;
};

export default Auth;
