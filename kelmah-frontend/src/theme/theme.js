import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
    palette: {
        primary: {
            light: '#FFE89E',
            main: '#FFD700', // Gold
            dark: '#E6C200',
            contrastText: '#1A1A1A',
        },
        secondary: {
            light: '#7FC8FF',
            main: '#2196F3', // Blue
            dark: '#0B79D0',
            contrastText: '#FFFFFF',
        },
        success: {
            main: '#4CAF50',
            dark: '#3B8C3E',
            light: '#A5D6A7',
        },
        warning: {
            main: '#FF9800',
            dark: '#C77700',
            light: '#FFE082',
        },
        error: {
            main: '#F44336',
            dark: '#C62828',
            light: '#FFCDD2',
        },
        info: {
            main: '#03A9F4',
            dark: '#0288D1',
            light: '#B3E5FC',
        },
        background: {
            default: '#F9FAFB',
            paper: '#FFFFFF',
            card: '#FFFFFF',
            dark: '#1A1A1A',
        },
        text: {
            primary: '#1A1A1A',
            secondary: '#5F6368',
            disabled: '#9E9E9E',
        },
        divider: 'rgba(0, 0, 0, 0.08)',
    },
    shape: {
        borderRadius: 12
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 700,
            fontSize: '2.5rem',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
        },
        h2: {
            fontWeight: 700,
            fontSize: '2rem',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
        },
        h3: {
            fontWeight: 600,
            fontSize: '1.75rem',
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
        },
        h4: {
            fontWeight: 600,
            fontSize: '1.5rem',
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
        },
        h5: {
            fontWeight: 600,
            fontSize: '1.25rem',
            lineHeight: 1.4,
            letterSpacing: '-0.01em',
        },
        h6: {
            fontWeight: 600,
            fontSize: '1.1rem',
            lineHeight: 1.4,
            letterSpacing: '-0.01em',
        },
        subtitle1: {
            fontWeight: 500,
            fontSize: '1rem',
        },
        subtitle2: {
            fontWeight: 500,
            fontSize: '0.875rem',
        },
        body1: {
            fontSize: '1rem',
            lineHeight: 1.5,
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
        },
        button: {
            fontWeight: 600,
            textTransform: 'none',
        },
    },
    shadows: [
        'none',
        '0px 2px 4px rgba(0, 0, 0, 0.04)',
        '0px 4px 8px rgba(0, 0, 0, 0.04)',
        '0px 6px 12px rgba(0, 0, 0, 0.04)',
        '0px 8px 16px rgba(0, 0, 0, 0.04)',
        '0px 10px 20px rgba(0, 0, 0, 0.04)',
        '0px 12px 24px rgba(0, 0, 0, 0.04)',
        '0px 14px 28px rgba(0, 0, 0, 0.04)',
        '0px 16px 32px rgba(0, 0, 0, 0.04)',
        '0px 18px 36px rgba(0, 0, 0, 0.04)',
        '0px 20px 40px rgba(0, 0, 0, 0.04)',
        '0px 22px 44px rgba(0, 0, 0, 0.04)',
        '0px 24px 48px rgba(0, 0, 0, 0.04)',
        '0px 26px 52px rgba(0, 0, 0, 0.04)',
        '0px 28px 56px rgba(0, 0, 0, 0.04)',
        '0px 30px 60px rgba(0, 0, 0, 0.04)',
        '0px 32px 64px rgba(0, 0, 0, 0.04)',
        '0px 34px 68px rgba(0, 0, 0, 0.04)',
        '0px 36px 72px rgba(0, 0, 0, 0.04)',
        '0px 38px 76px rgba(0, 0, 0, 0.04)',
        '0px 40px 80px rgba(0, 0, 0, 0.04)',
        '0px 42px 84px rgba(0, 0, 0, 0.04)',
        '0px 44px 88px rgba(0, 0, 0, 0.04)',
        '0px 46px 92px rgba(0, 0, 0, 0.04)',
        '0px 48px 96px rgba(0, 0, 0, 0.04)',
    ],
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.04)',
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0px 12px 24px rgba(0, 0, 0, 0.08)',
                    },
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    fontWeight: 600,
                    boxShadow: 'none',
                    padding: '10px 20px',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.08)',
                    },
                },
                contained: {
                    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.04)',
                },
                containedPrimary: {
                    '&:hover': {
                        backgroundColor: '#E6C200',
                    },
                },
                outlined: {
                    borderWidth: '1.5px',
                    '&:hover': {
                        borderWidth: '1.5px',
                    },
                },
                text: {
                    '&:hover': {
                        backgroundColor: 'rgba(255, 215, 0, 0.08)',
                    },
                },
            }
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    minWidth: 100,
                    padding: '12px 16px',
                },
            }
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    fontWeight: 500,
                },
            }
        },
        MuiAvatar: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                },
            }
        },
        MuiListItem: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    transition: 'background-color 0.2s ease-in-out',
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.03)',
                    },
                },
            }
        },
        MuiLinearProgress: {
            styleOverrides: {
                root: {
                    borderRadius: 4,
                    height: 8,
                    backgroundColor: 'rgba(255, 215, 0, 0.2)',
                },
                bar: {
                    borderRadius: 4,
                },
            }
        },
        MuiCircularProgress: {
            styleOverrides: {
                root: {
                    strokeLinecap: 'round',
                },
            }
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: '#1A1A1A',
                    color: '#FFFFFF',
                    fontSize: '0.75rem',
                    borderRadius: 6,
                    padding: '8px 12px',
                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.12)',
                },
            }
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    padding: '16px 24px',
                },
                head: {
                    fontWeight: 600,
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                }
            }
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 12,
                },
            }
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.08)',
                },
            }
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    borderRadius: 0,
                },
            }
        }
    },
}); 