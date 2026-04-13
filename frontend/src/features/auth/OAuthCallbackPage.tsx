import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { authService, usersService } from '@/services/auth.service';
import { PageLoader } from '@/components/ui/spinner';

const VALID_PROVIDERS = ['github', 'google', 'gitlab'];

export default function OAuthCallbackPage() {
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();

  useEffect(() => {
    // Validate the provider
    if (!provider || !VALID_PROVIDERS.includes(provider)) {
      navigate('/login', { replace: true });
      return;
    }

    const code = searchParams.get('code');

    if (code) {
      // Exchange one-time code for tokens (tokens never appear in URL)
      authService
        .exchangeCode(code)
        .then(({ accessToken, refreshToken }) => {
          setTokens(accessToken, refreshToken ?? '');
          return usersService.me();
        })
        .then((user) => {
          setUser(user);
          navigate('/', { replace: true });
        })
        .catch(() => {
          navigate('/login', { replace: true });
        });
    } else {
      // Backwards compatibility: support direct tokens from older flow
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
    }
  }, [provider, searchParams, navigate, setTokens, setUser]);

  return <PageLoader />;
}
