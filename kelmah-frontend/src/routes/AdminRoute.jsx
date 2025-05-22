import AdminLogin from '../components/admin/AdminLogin';
import AdminDashboard from '../components/admin/AdminDashboard';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import JobManagement from '../components/admin/JobManagement';
import UserManagement from '../components/admin/UserManagement';
import SystemSettings from '../components/admin/SystemSettings';
import { SecurityScanner } from '../components/security/SecurityScanner';
import { ResourceMonitoring } from '../components/monitoring/ResourceMonitoring';
import { BackupManagement } from '../components/infrastructure/BackupManagement';
import AdminRegister from '../components/admin/AdminRegister';

const adminRoutes = [
    {
        path: "/admin/login",
        element: <AdminLogin />
    },
    {
        path: "/admin/dashboard",
        element: <ProtectedRoute isAdmin><AdminDashboard /></ProtectedRoute>
    },
    {
        path: "/admin/analytics",
        element: <ProtectedRoute isAdmin><AnalyticsDashboard /></ProtectedRoute>
    },
    {
        path: "/admin/jobs",
        element: <ProtectedRoute isAdmin><JobManagement /></ProtectedRoute>
    },
    {
        path: "/admin/users",
        element: <ProtectedRoute isAdmin><UserManagement /></ProtectedRoute>
    },
    {
        path: "/admin/settings",
        element: <ProtectedRoute isAdmin><SystemSettings /></ProtectedRoute>
    },
    {
        path: "/admin/security",
        element: <ProtectedRoute isAdmin><SecurityScanner /></ProtectedRoute>
    },
    {
        path: "/admin/monitoring",
        element: <ProtectedRoute isAdmin><ResourceMonitoring /></ProtectedRoute>
    },
    {
        path: "/admin/backups",
        element: <ProtectedRoute isAdmin><BackupManagement /></ProtectedRoute>
    },
    {
        path: "/admin/register",
        element: <AdminRegister />
    }
];

export default adminRoutes; 