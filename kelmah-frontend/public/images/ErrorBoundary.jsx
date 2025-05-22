import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Container
} from '@mui/material';
import { Error as ErrorIcon, Refresh } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // Log error to your error reporting service
        this.logErrorToService(error, errorInfo);
    }

    logErrorToService = (error, errorInfo) => {
        // Send error to backend
        fetch('http://localhost:3000/api/logs/error', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                error: error.toString(),
                componentStack: errorInfo.componentStack,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
            })
        }).catch(console.error);
    };

    handleRefresh = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <Container maxWidth="sm">
                    <Paper 
                        elevation={3} 
                        sx={{ 
                            p: 4, 
                            mt: 4, 
                            textAlign: 'center',
                            backgroundColor: '#fff5f5'
                        }}
                    >
                        <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
                        <Typography variant="h5" gutterBottom color="error">
                            Oops! Something went wrong
                        </Typography>
                        <Typography variant="body1" color="text.secondary" paragraph>
                            We're sorry for the inconvenience. Please try refreshing the page or contact support if the problem persists.
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<Refresh />}
                            onClick={this.handleRefresh}
                            sx={{ mt: 2 }}
                        >
                            Refresh Page
                        </Button>
                        {process.env.NODE_ENV === 'development' && (
                            <Box sx={{ mt: 4, textAlign: 'left' }}>
                                <Typography variant="subtitle2" color="error">
                                    Error Details:
                                </Typography>
                                <pre style={{ 
                                    overflow: 'auto', 
                                    padding: '1rem',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '4px'
                                }}>
                                    {this.state.error && this.state.error.toString()}
                                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                                </pre>
                            </Box>
                        )}
                    </Paper>
                </Container>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary; 