import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import {
    Box,
    Paper,
    Typography,
    Divider,
    useTheme
} from '@mui/material';

function ApiDocs() {
    const theme = useTheme();

    const customCss = `
        .swagger-ui .topbar {
            display: none;
        }
        .swagger-ui .info {
            margin: 20px 0;
        }
        .swagger-ui .scheme-container {
            background: ${theme.palette.background.paper};
            box-shadow: none;
            padding: 20px 0;
        }
        .swagger-ui .opblock-tag {
            border-bottom: 1px solid ${theme.palette.divider};
            color: ${theme.palette.text.primary};
        }
        .swagger-ui .opblock {
            border-radius: ${theme.shape.borderRadius}px;
            box-shadow: ${theme.shadows[1]};
            margin: 0 0 15px;
        }
        .swagger-ui .opblock .opblock-summary {
            padding: 15px;
        }
        .swagger-ui .opblock .opblock-summary-method {
            border-radius: 4px;
            min-width: 80px;
        }
        .swagger-ui .btn {
            border-radius: 4px;
        }
    `;

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    API Documentation
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Explore and test the Kelmah API endpoints using the interactive documentation below.
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                <style>{customCss}</style>
                <SwaggerUI
                    url="http://localhost:3000/api-docs/swagger.json"
                    docExpansion="list"
                    defaultModelsExpandDepth={-1}
                    filter={true}
                    tryItOutEnabled={true}
                />
            </Paper>
        </Box>
    );
}

export default ApiDocs; 