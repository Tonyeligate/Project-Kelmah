import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                textAlign: 'center',
                px: 2,
            }}
        >
            <Helmet><title>Page Not Found | Kelmah</title></Helmet>
            <Typography variant="h2" component="p" color="primary" fontWeight="bold">
                404
            </Typography>
            <Typography variant="h5" component="p">
                Page not found
            </Typography>
            <Typography variant="body1" color="text.secondary" maxWidth={420}>
                This page may have moved or no longer exists. Use the buttons below
                to return home or continue finding work.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" color="primary" onClick={() => navigate('/')} sx={{ minHeight: 44 }}>
                    Go Home
                </Button>
                <Button variant="outlined" color="primary" onClick={() => navigate('/jobs')} sx={{ minHeight: 44 }}>
                    Find Jobs
                </Button>
            </Box>
        </Box>
    );
};

export default NotFoundPage;
