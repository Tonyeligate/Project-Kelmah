import { Suspense, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Route } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import ProtectedRoute from '../modules/auth/components/common/ProtectedRoute';
import RouteSkeleton from './RouteSkeleton';
import { workerRoutesConfig } from './workerRoutesConfig';
import { hasRole as userHasRole } from '../utils/userUtils';

// Error fallback component for route-level errors
const RouteErrorFallback = ({ error, resetErrorBoundary }) => (
  <div
    style={{
      padding: 24,
      backgroundColor: '#000000',
      color: '#FFD700',
      minHeight: '50vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Inter", "Roboto", "Helvetica Neue", "Arial", sans-serif',
    }}
  >
    <h2>Something went wrong</h2>
    <p>{error.message}</p>
    <button
      onClick={resetErrorBoundary}
      style={{
        padding: '8px 16px',
        backgroundColor: '#FFD700',
        color: '#000000',
        border: 'none',
        borderRadius: 4,
        cursor: 'pointer',
        marginTop: 16,
      }}
    >
      Try Again
    </button>
  </div>
);

RouteErrorFallback.propTypes = {
  error: PropTypes.shape({
    message: PropTypes.string,
  }),
  resetErrorBoundary: PropTypes.func.isRequired,
};

RouteErrorFallback.defaultProps = {
  error: { message: 'Something went wrong' },
};
const WorkerRoutes = () => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  // Memoized role checking to prevent infinite re-renders
  const isWorkerAllowed = useMemo(() => {
    console.log('Worker route protection check:', {
      isAuthenticated,
      hasUser: !!user,
      userRole: user?.role,
      loading,
      userId: user?.id,
    });

    // If loading, allow access to prevent redirect loops
    if (loading) {
      console.log('Worker route: Allowing access due to loading state');
      return true;
    }
    // If authenticated and user exists, check role
    if (isAuthenticated && user) {
      const allowed = userHasRole(user, 'worker');
      console.log('Worker route: Role check result:', allowed);
      return allowed;
    }
    // If authenticated but no user (race condition), allow access temporarily
    if (isAuthenticated && !user) {
      console.log(
        'Worker route: Allowing access due to race condition (authenticated but no user)',
      );
      return true;
    }
    // Otherwise, not allowed
    console.log('Worker route: Access denied - not authenticated');
    return false;
  }, [isAuthenticated, user, loading]);

  const renderRouteElement = (Component, requiresAuth, withBoundary) => {
    const protectedContent = requiresAuth ? (
      <ProtectedRoute
        isAllowed={isWorkerAllowed}
        redirectPath="/login"
        loading={loading}
      >
        <Component />
      </ProtectedRoute>
    ) : (
      <Component />
    );

    const suspenseWrapped = (
      <Suspense fallback={<RouteSkeleton />}>{protectedContent}</Suspense>
    );

    if (withBoundary) {
      return (
        <ErrorBoundary FallbackComponent={RouteErrorFallback}>
          {suspenseWrapped}
        </ErrorBoundary>
      );
    }

    return suspenseWrapped;
  };

  return (
    <>
      {workerRoutesConfig.map(
        ({ path, component: Component, requiresAuth = true, withBoundary }) => (
          <Route
            key={path}
            path={path}
            element={renderRouteElement(Component, requiresAuth, withBoundary)}
          />
        ),
      )}
    </>
  );
};

export default WorkerRoutes;
