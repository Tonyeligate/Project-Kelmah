import React from 'react';
import { useSelector } from 'react-redux';
import DashboardLayout from './layout/DashboardLayout';
import WorkerDashboard from './dashboard/WorkerDashboard';
import HirerDashboard from './dashboard/HirerDashboard';

function Dashboard() {
    const user = useSelector(state => state.auth.user);

    return (
        <DashboardLayout>
            {user?.role === 'hirer' ? <HirerDashboard /> : <WorkerDashboard />}
        </DashboardLayout>
    );
}

export default Dashboard;