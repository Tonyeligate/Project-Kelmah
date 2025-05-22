import React, { useEffect } from 'react';
import PerformanceService from '../../services/PerformanceService';

const withPerformanceTracking = (WrappedComponent, pageName) => {
    return function PerformanceTrackedComponent(props) {
        useEffect(() => {
            const startTime = performance.now();
            
            return () => {
                const endTime = performance.now();
                PerformanceService.trackPageLoad(pageName, endTime - startTime);
            };
        }, []);

        return <WrappedComponent {...props} />;
    };
};

export default withPerformanceTracking; 