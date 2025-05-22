import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import WorkerDashboard from '../components/dashboard/WorkerDashboard';
import HirerDashboard from '../components/dashboard/HirerDashboard';
import DashboardLayout from '../components/dashboard/DashboardLayout';

function Dashboard() {
    const { user } = useSelector(state => state.auth);
    const navigate = useNavigate();

    // Add debugging to check the user role
    useEffect(() => {
        console.log('Current user role:', user?.role);
        
        // If user is a hirer, redirect to hirer dashboard
        if (user?.role === 'hirer') {
            navigate('/hirer/dashboard');
            return;
        }
    }, [user, navigate]);

    return (
        <DashboardLayout>
            {user?.role === 'hirer' ? <HirerDashboard /> : <WorkerDashboard />}
        </DashboardLayout>
    );
}

export default Dashboard;