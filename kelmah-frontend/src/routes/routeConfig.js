import { lazy } from 'react';

// Lazy load components
const Home = lazy(() => import('../pages/Home'));
const Login = lazy(() => import('../components/auth/Login'));
const Register = lazy(() => import('../components/auth/Register'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const PasswordReset = lazy(() => import('../pages/auth/PasswordReset'));
const VerifyEmail = lazy(() => import('../pages/auth/VerifyEmail'));
const OAuthCallback = lazy(() => import('../pages/auth/OAuthCallback'));
const AdminLogin = lazy(() => import('../pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const Jobs = lazy(() => import('../pages/jobs/Jobs'));
const Profile = lazy(() => import('../pages/profile/Profile'));

export const routes = [
    {
        path: '/',
        component: Home,
        exact: true,
        public: true
    },
    {
        path: '/login',
        component: Login,
        public: true
    },
    {
        path: '/register',
        component: Register,
        public: true
    },
    {
        path: '/forgot-password',
        component: ForgotPassword,
        public: true
    },
    {
        path: '/reset-password/:token',
        component: PasswordReset,
        public: true
    },
    {
        path: '/verify-email/:token',
        component: VerifyEmail,
        public: true
    },
    {
        path: '/oauth-callback',
        component: OAuthCallback,
        public: true
    },
    {
        path: '/admin/login',
        component: AdminLogin,
        public: true
    },
    {
        path: '/admin/dashboard',
        component: AdminDashboard,
        roles: ['admin']
    },
    {
        path: '/jobs/*',
        component: Jobs,
        roles: ['user', 'admin']
    },
    {
        path: '/profile',
        component: Profile,
        roles: ['user', 'admin']
    }
]; 