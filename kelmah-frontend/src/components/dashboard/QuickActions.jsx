import React from 'react';
import { 
    Grid, 
    Paper, 
    Typography, 
    Box,
    alpha,
    useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { 
    Work as WorkIcon,
    Search as SearchIcon,
    Description as DescriptionIcon,
    Event as EventIcon,
    Add as AddIcon,
    Message as MessageIcon,
    Payments as PaymentsIcon
} from '@mui/icons-material';

// Styled components for better reusability
const ActionCard = styled(Paper)(({ theme, color }) => ({
    padding: theme.spacing(3),
    borderRadius: 12,
    cursor: 'pointer',
    background: theme.palette.background.paper,
    border: `1px solid ${alpha(color, 0.1)}`,
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2.5),
    boxShadow: `0 4px 15px ${alpha(color, 0.1)}`,
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '5px',
        height: '100%',
        background: color,
    },
    '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: `0 10px 25px ${alpha(color, 0.15)}`,
        border: `1px solid ${alpha(color, 0.2)}`,
        '& .action-icon': {
            transform: 'scale(1.1)',
            background: alpha(color, 0.2),
        },
        '& .action-title': {
            color: color,
        }
    }
}));

const IconWrapper = styled(Box)(({ theme, color }) => ({
    width: 54,
    height: 54,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: alpha(color, 0.1),
    color: color,
    transition: 'all 0.3s ease',
}));

function QuickActions({ actions = [] }) {
    const theme = useTheme();

    // Map icon names to actual components
    const getIcon = (iconName) => {
        switch (iconName) {
            case 'work':
                return <WorkIcon fontSize="large" />;
            case 'search':
                return <SearchIcon fontSize="large" />;
            case 'description':
                return <DescriptionIcon fontSize="large" />;
            case 'event':
                return <EventIcon fontSize="large" />;
            case 'add':
                return <AddIcon fontSize="large" />;
            case 'message':
                return <MessageIcon fontSize="large" />;
            case 'payment':
                return <PaymentsIcon fontSize="large" />;
            default:
                return null;
        }
    };

    if (actions.length === 0) {
        return null;
    }

    return (
        <Box sx={{ mb: 4 }}>
            <Typography 
                variant="h6" 
                sx={{ 
                    mb: 2.5, 
                    fontWeight: 600,
                    pl: 1,
                    borderLeft: `4px solid ${theme.palette.primary.main}`,
                    paddingLeft: 2
                }}
            >
                Quick Actions
            </Typography>
            <Grid container spacing={3}>
                {actions.map((action, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ 
                                delay: 0.1 * index,
                                duration: 0.4
                            }}
                        >
                            <ActionCard 
                                onClick={action.onClick} 
                                color={action.color}
                                component={motion.div}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <IconWrapper 
                                    color={action.color}
                                    className="action-icon"
                                >
                                    {getIcon(action.icon)}
                                </IconWrapper>
                                <Typography 
                                    variant="subtitle1" 
                                    className="action-title"
                                    sx={{ 
                                        fontWeight: 600,
                                        color: theme.palette.text.primary,
                                        transition: 'color 0.3s ease'
                                    }}
                                >
                                    {action.title}
                                </Typography>
                            </ActionCard>
                        </motion.div>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}

QuickActions.propTypes = {
    actions: PropTypes.arrayOf(
        PropTypes.shape({
            title: PropTypes.string.isRequired,
            icon: PropTypes.string.isRequired,
            color: PropTypes.string.isRequired,
            onClick: PropTypes.func.isRequired
        })
    )
};

export default QuickActions; 