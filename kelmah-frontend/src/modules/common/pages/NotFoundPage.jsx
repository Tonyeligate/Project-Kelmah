import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

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
            <Typography variant="h2" component="p" color="primary" fontWeight="bold">
                404
            </Typography>
            <Typography variant="h5" component="p">
                Page not found
            </Typography>
            <Typography variant="body1" color="text.secondary" maxWidth={420}>
                The page you are looking for might have been moved or no longer exists. Try heading back
                to the homepage or explore available jobs instead.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" color="primary" onClick={() => navigate('/')}>
                    Go to Homepage
                </Button>
                <Button variant="outlined" color="primary" onClick={() => navigate('/jobs')}>
                    Browse Jobs
                </Button>
            </Box>
        </Box>
    );
};

export default NotFoundPage;
