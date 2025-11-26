import { useRoutes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from '../modules/layout/components/Layout';
import ProtectedRoute from '../modules/auth/components/common/ProtectedRoute';
import LoadingScreen from '../modules/common/components/loading/LoadingScreen';

const LandingPage = lazy(() => import('../modules/home/pages/HomePage'));
const LoginPage = lazy(() => import('../modules/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('../modules/auth/pages/RegisterPage'));
const DashboardPage = lazy(
  () => import('../modules/dashboard/pages/DashboardPage'),
);
const JobsPage = lazy(() => import('../modules/jobs/pages/JobsPage'));
const JobDetailsPage = lazy(
  () => import('../modules/jobs/pages/JobDetailsPage'),
);
const WorkerProfilePage = lazy(
  () => import('../modules/worker/pages/WorkerProfilePage'),
);
const MessagesPage = lazy(
  () => import('../modules/messaging/pages/MessagingPage'),
);
const NotFoundPage = lazy(() => import('../modules/common/pages/NotFoundPage'));

const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'jobs',
        children: [
          { index: true, element: <JobsPage /> },
          { path: ':id', element: <JobDetailsPage /> },
        ],
      },
      {
        path: 'workers/:id',
        element: <WorkerProfilePage />,
      },
      {
        path: 'messages',
        element: (
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export const AppRoutes = () => {
  const element = useRoutes(routes);
  return <Suspense fallback={<LoadingScreen />}>{element}</Suspense>;
};
