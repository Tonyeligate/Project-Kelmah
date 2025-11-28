import React from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Typography,
    Button,
    Paper,
    useTheme,
} from '@mui/material';
import {
    InboxOutlined,
    SearchOff,
    WorkOff,
    PersonOff,
    ErrorOutline,
} from '@mui/icons-material';

/**
 * Reusable EmptyState component for displaying when no data is available
 * Provides consistent UI across Hirer and Talent dashboards
 */
const EmptyState = ({
    type = 'default',
    title,
    description,
    actionText,
    actionIcon,
    onAction,
    secondaryActionText,
    onSecondaryAction,
    icon: CustomIcon,
    variant = 'default', // 'default' | 'card' | 'inline'
    size = 'medium', // 'small' | 'medium' | 'large'
}) => {
    const theme = useTheme();

    // Default configurations by type
    const typeConfigs = {
        default: {
            icon: InboxOutlined,
            defaultTitle: 'No Data Available',
            defaultDescription: 'There is nothing to display here yet.',
        },
        jobs: {
            icon: WorkOff,
            defaultTitle: 'No Jobs Found',
            defaultDescription: 'You haven\'t posted any jobs yet. Create your first job to get started.',
        },
        applications: {
            icon: SearchOff,
            defaultTitle: 'No Applications',
            defaultDescription: 'You don\'t have any applications yet. Start applying to jobs to see them here.',
        },
        workers: {
            icon: PersonOff,
            defaultTitle: 'No Workers Found',
            defaultDescription: 'No workers match your search criteria. Try adjusting your filters.',
        },
        search: {
            icon: SearchOff,
            defaultTitle: 'No Results',
            defaultDescription: 'No results found for your search. Try different keywords or filters.',
        },
        error: {
            icon: ErrorOutline,
            defaultTitle: 'Something Went Wrong',
            defaultDescription: 'An error occurred while loading data. Please try again.',
        },
        messages: {
            icon: InboxOutlined,
            defaultTitle: 'No Messages',
            defaultDescription: 'You don\'t have any messages yet. Start a conversation!',
        },
        notifications: {
            icon: InboxOutlined,
            defaultTitle: 'No Notifications',
            defaultDescription: 'You\'re all caught up! No new notifications.',
        },
    };

    const config = typeConfigs[type] || typeConfigs.default;
    const IconComponent = CustomIcon || config.icon;
    const displayTitle = title || config.defaultTitle;
    const displayDescription = description || config.defaultDescription;

    // Size configurations
    const sizeConfigs = {
        small: {
            iconSize: 48,
            titleVariant: 'h6',
            descVariant: 'body2',
            padding: 2,
            spacing: 1,
        },
        medium: {
            iconSize: 64,
            titleVariant: 'h5',
            descVariant: 'body1',
            padding: 4,
            spacing: 2,
        },
        large: {
            iconSize: 80,
            titleVariant: 'h4',
            descVariant: 'body1',
            padding: 6,
            spacing: 3,
        },
    };

    const sizeConfig = sizeConfigs[size];

    const content = (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                py: variant === 'inline' ? sizeConfig.padding / 2 : sizeConfig.padding,
                px: sizeConfig.padding,
            }}
        >
            <Box
                sx={{
                    width: sizeConfig.iconSize * 1.5,
                    height: sizeConfig.iconSize * 1.5,
                    borderRadius: '50%',
                    backgroundColor: type === 'error'
                        ? 'rgba(244, 67, 54, 0.1)'
                        : 'rgba(255, 215, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: sizeConfig.spacing,
                }}
            >
                <IconComponent
                    sx={{
                        fontSize: sizeConfig.iconSize,
                        color: type === 'error'
                            ? theme.palette.error.main
                            : theme.palette.text.secondary,
                        opacity: 0.7,
                    }}
                />
            </Box>

            <Typography
                variant={sizeConfig.titleVariant}
                sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    mb: 1,
                }}
            >
                {displayTitle}
            </Typography>

            <Typography
                variant={sizeConfig.descVariant}
                sx={{
                    color: 'text.secondary',
                    maxWidth: 400,
                    mb: (actionText || secondaryActionText) ? sizeConfig.spacing : 0,
                }}
            >
                {displayDescription}
            </Typography>

            {(actionText || secondaryActionText) && (
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        mt: 1,
                    }}
                >
                    {actionText && onAction && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={onAction}
                            startIcon={actionIcon}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                            }}
                        >
                            {actionText}
                        </Button>
                    )}
                    {secondaryActionText && onSecondaryAction && (
                        <Button
                            variant="outlined"
                            color="inherit"
                            onClick={onSecondaryAction}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                            }}
                        >
                            {secondaryActionText}
                        </Button>
                    )}
                </Box>
            )}
        </Box>
    );

    if (variant === 'card') {
        return (
            <Paper
                elevation={0}
                sx={{
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'background.paper',
                }}
            >
                {content}
            </Paper>
        );
    }

    return content;
};

EmptyState.propTypes = {
    type: PropTypes.oneOf([
        'default',
        'jobs',
        'applications',
        'workers',
        'search',
        'error',
        'messages',
        'notifications',
    ]),
    title: PropTypes.string,
    description: PropTypes.string,
    actionText: PropTypes.string,
    actionIcon: PropTypes.node,
    onAction: PropTypes.func,
    secondaryActionText: PropTypes.string,
    onSecondaryAction: PropTypes.func,
    icon: PropTypes.elementType,
    variant: PropTypes.oneOf(['default', 'card', 'inline']),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
};

export default EmptyState;
