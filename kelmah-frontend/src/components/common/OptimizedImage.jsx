import React, { useState, useEffect } from 'react';
import { Skeleton } from '@mui/material';

const OptimizedImage = ({ 
    src, 
    alt, 
    width, 
    height, 
    lazy = true,
    quality = 'medium' 
}) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [imageSrc, setImageSrc] = useState('');

    useEffect(() => {
        const img = new Image();
        
        // Add quality parameter to URL
        const qualityMap = {
            low: '?q=60',
            medium: '?q=80',
            high: '?q=100'
        };
        
        img.src = `${src}${qualityMap[quality]}`;
        
        img.onload = () => {
            setImageSrc(img.src);
            setLoading(false);
        };
        
        img.onerror = () => {
            setError(true);
            setLoading(false);
        };
    }, [src, quality]);

    if (loading) {
        return <Skeleton variant="rectangular" width={width} height={height} />;
    }

    if (error) {
        return <div>Error loading image</div>;
    }

    return (
        <img
            src={imageSrc}
            alt={alt}
            width={width}
            height={height}
            loading={lazy ? "lazy" : "eager"}
            style={{ objectFit: 'cover' }}
        />
    );
};

export default OptimizedImage; 