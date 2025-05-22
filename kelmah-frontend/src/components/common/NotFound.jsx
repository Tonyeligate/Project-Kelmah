import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Home as HomeIcon } from '@mui/icons-material';

function NotFound() {
    const navigate = useNavigate();

    return (
        <Container maxWidth="md">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '80vh',
                    textAlign: 'center'
                }}
            >
                <Typography
                    variant="h1"
                    color="secondary"
                    sx={{
                        fontSize: { xs: '6rem', sm: '8rem' },
                        fontWeight: 'bold',
                        mb: 2
                    }}
                >
                    404
                </Typography>
                
                <Typography
                    variant="h4"
                    color="text.primary"
                    gutterBottom
                    sx={{ mb: 3 }}
                >
                    Page Not Found
                </Typography>
                
                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 4, maxWidth: '600px' }}
                >
                    The page you're looking for doesn't exist or has been moved.
                    Please check the URL or return to the homepage.
                </Typography>
                
                <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<HomeIcon />}
                    onClick={() => navigate('/')}
                    size="large"
                >
                    Back to Home
                </Button>
            </Box>
        </Container>
    );
}

export default NotFound; 