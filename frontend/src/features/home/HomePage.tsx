import { useAuthStore } from '@/stores/auth.store';
import { lazy, Suspense } from 'react';
import { PageLoader } from '@/components/ui/spinner';

const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const ExplorePage = lazy(() => import('@/features/explore/ExplorePage'));

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Suspense fallback={<PageLoader />}>
      {isAuthenticated ? <DashboardPage /> : <ExplorePage />}
    </Suspense>
  );
}
