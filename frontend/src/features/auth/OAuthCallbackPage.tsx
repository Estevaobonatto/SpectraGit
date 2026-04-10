import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { usersService } from '@/services/auth.service';
import { PageLoader } from '@/components/ui/spinner';

export default function OAuthCallbackPage() {
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken);
      usersService
        .me()
        .then((user) => {
          setUser(user);
          navigate('/', { replace: true });
        })
        .catch(() => {
          navigate('/login', { replace: true });
        });
    } else {
      navigate('/login', { replace: true });
    }
  }, [provider, searchParams, navigate, setTokens, setUser]);

  return <PageLoader />;
}
