import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Paper,
    IconButton,
    Tooltip,
    Popover,
    Typography,
    Slider,
    ColorPicker,
    Menu,
    MenuItem,
    Button
} from '@mui/material';
import {
    Create,
    Highlight,
    Comment,
    PanTool,
    Delete,
    Undo,
    Redo,
    Save
} from '@mui/icons-material';

const TOOLS = {
    SELECT: 'select',
    DRAW: 'draw',
    HIGHLIGHT: 'highlight',
    COMMENT: 'comment'
};

function AnnotationTools({ onAnnotationChange }) {
    const [activeTool, setActiveTool] = useState(TOOLS.SELECT);
    const [annotations, setAnnotations] = useState([]);
    const [currentAnnotation, setCurrentAnnotation] = useState(null);
    const [strokeColor, setStrokeColor] = useState('#FF0000');
    const [strokeWidth, setStrokeWidth] = useState(2);
    const canvasRef = useRef(null);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    useEffect(() => {
        initializeCanvas();
    }, []);

    const initializeCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
    };

    const startAnnotation = (e) => {
        const { offsetX, offsetY } = e.nativeEvent;
        
        const newAnnotation = {
            tool: activeTool,
            color: strokeColor,
            width: strokeWidth,
            points: [[offsetX, offsetY]],
            timestamp: new Date()
        };

        setCurrentAnnotation(newAnnotation);
    };

    const updateAnnotation = (e) => {
        if (!currentAnnotation) return;

        const { offsetX, offsetY } = e.nativeEvent;
        const updatedAnnotation = {
            ...currentAnnotation,
            points: [...currentAnnotation.points, [offsetX, offsetY]]
        };

        setCurrentAnnotation(updatedAnnotation);
        drawAnnotation(updatedAnnotation);
    };

    const finishAnnotation = () => {
        if (!currentAnnotation) return;

        const newAnnotations = [...annotations, currentAnnotation];
        setAnnotations(newAnnotations);
        addToHistory(newAnnotations);
        setCurrentAnnotation(null);
        onAnnotationChange?.(newAnnotations);
    };

    const drawAnnotation = (annotation) => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.strokeStyle = annotation.color;
        ctx.lineWidth = annotation.width;

        annotation.points.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point[0], point[1]);
            } else {
                ctx.lineTo(point[0], point[1]);
            }
        });

        ctx.stroke();
    };

    const addToHistory = (newAnnotations) => {
        const newHistory = [...history.slice(0, historyIndex + 1), newAnnotations];
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setAnnotations(history[historyIndex - 1]);
            redrawCanvas(history[historyIndex - 1]);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setAnnotations(history[historyIndex + 1]);
            redrawCanvas(history[historyIndex + 1]);
        }
    };

    const redrawCanvas = (annotationsToDraw) => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        annotationsToDraw.forEach(drawAnnotation);
    };

    return (
        <Box sx={{ position: 'relative' }}>
            <Paper sx={{ 
                position: 'absolute', 
                top: 10, 
                left: 10, 
                p: 1, 
                display: 'flex', 
                gap: 1 
            }}>
                <Tooltip title="Select">
                    <IconButton 
                        color={activeTool === TOOLS.SELECT ? 'primary' : 'default'}
                        onClick={() => setActiveTool(TOOLS.SELECT)}
                    >
                        <PanTool />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Draw">
                    <IconButton 
                        color={activeTool === TOOLS.DRAW ? 'primary' : 'default'}
                        onClick={() => setActiveTool(TOOLS.DRAW)}
                    >
                        <Create />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Highlight">
                    <IconButton 
                        color={activeTool === TOOLS.HIGHLIGHT ? 'primary' : 'default'}
                        onClick={() => setActiveTool(TOOLS.HIGHLIGHT)}
                    >
                        <Highlight />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Comment">
                    <IconButton 
                        color={activeTool === TOOLS.COMMENT ? 'primary' : 'default'}
                        onClick={() => setActiveTool(TOOLS.COMMENT)}
                    >
                        <Comment />
                    </IconButton>
                </Tooltip>
                <ColorPicker
                    value={strokeColor}
                    onChange={(color) => setStrokeColor(color)}
                />
                <Tooltip title="Stroke Width">
                    <Slider
                        value={strokeWidth}
                        onChange={(_, value) => setStrokeWidth(value)}
                        min={1}
                        max={10}
                        sx={{ width: 100 }}
                    />
                </Tooltip>
                <Tooltip title="Undo">
                    <IconButton 
                        onClick={undo}
                        disabled={historyIndex <= 0}
                    >
                        <Undo />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Redo">
                    <IconButton 
                        onClick={redo}
                        disabled={historyIndex >= history.length - 1}
                    >
                        <Redo />
                    </IconButton>
                </Tooltip>
            </Paper>

            <canvas
                ref={canvasRef}
                onMouseDown={startAnnotation}
                onMouseMove={updateAnnotation}
                onMouseUp={finishAnnotation}
                onMouseLeave={finishAnnotation}
                style={{ border: '1px solid #ccc' }}
            />
        </Box>
    );
}

// Sharing Analytics Component
function SharingAnalytics({ resourceId }) {
    const [analytics, setAnalytics] = useState(null);
    const [timeRange, setTimeRange] = useState('7d');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, [resourceId, timeRange]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/analytics/sharing/${resourceId}`, {
                params: { timeRange }
            });
            setAnalytics(response.data);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <CircularProgress />;

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Sharing Analytics</Typography>
            
            <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Views
                            </Typography>
                            <Typography variant="h4">
                                {analytics.totalViews}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Unique Viewers
                            </Typography>
                            <Typography variant="h4">
                                {analytics.uniqueViewers}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Active Shares
                            </Typography>
                            <Typography variant="h4">
                                {analytics.activeShares}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Average View Time
                            </Typography>
                            <Typography variant="h4">
                                {analytics.avgViewTime}m
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Add charts and detailed analytics */}
            </Grid>
        </Paper>
    );
}

export { AnnotationTools, SharingAnalytics }; 