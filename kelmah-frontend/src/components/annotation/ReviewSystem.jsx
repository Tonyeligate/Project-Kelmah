import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Button,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Chip,
    Avatar,
    Badge,
    Rating,
    Select,
    MenuItem,
    Alert
} from '@mui/material';
import {
    Check,
    Close,
    Comment,
    Edit,
    Flag,
    History,
    ThumbUp,
    ThumbDown
} from '@mui/icons-material';

const REVIEW_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    NEEDS_REVISION: 'needs_revision'
};

function AnnotationReviewSystem({ documentId }) {
    const [annotations, setAnnotations] = useState([]);
    const [selectedAnnotation, setSelectedAnnotation] = useState(null);
    const [reviewDialog, setReviewDialog] = useState(false);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewStatus, setReviewStatus] = useState(REVIEW_STATUS.PENDING);
    const [filters, setFilters] = useState({
        status: 'all',
        reviewer: 'all'
    });

    useEffect(() => {
        loadAnnotations();
    }, [documentId, filters]);

    const loadAnnotations = async () => {
        try {
            const response = await api.get(`/api/documents/${documentId}/annotations`, {
                params: filters
            });
            setAnnotations(response.data);
        } catch (error) {
            console.error('Failed to load annotations:', error);
        }
    };

    const handleReview = async () => {
        try {
            await api.post(`/api/annotations/${selectedAnnotation.id}/review`, {
                status: reviewStatus,
                comment: reviewComment
            });
            setReviewDialog(false);
            setReviewComment('');
            setReviewStatus(REVIEW_STATUS.PENDING);
            await loadAnnotations();
        } catch (error) {
            console.error('Review submission failed:', error);
        }
    };

    const handleBulkAction = async (status) => {
        try {
            await api.post(`/api/documents/${documentId}/annotations/bulk-review`, {
                status,
                annotationIds: selectedAnnotations
            });
            await loadAnnotations();
        } catch (error) {
            console.error('Bulk action failed:', error);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Annotation Review</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Select
                        size="small"
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({
                            ...prev,
                            status: e.target.value
                        }))}
                    >
                        <MenuItem value="all">All Status</MenuItem>
                        {Object.values(REVIEW_STATUS).map(status => (
                            <MenuItem key={status} value={status}>
                                {status.replace('_', ' ').toUpperCase()}
                            </MenuItem>
                        ))}
                    </Select>
                    <Button
                        variant="contained"
                        onClick={() => handleBulkAction(REVIEW_STATUS.APPROVED)}
                        disabled={!selectedAnnotations.length}
                    >
                        Approve Selected
                    </Button>
                </Box>
            </Box>

            <List>
                {annotations.map(annotation => (
                    <ListItem
                        key={annotation.id}
                        button
                        onClick={() => {
                            setSelectedAnnotation(annotation);
                            setReviewDialog(true);
                        }}
                    >
                        <ListItemText
                            primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography>{annotation.content}</Typography>
                                    <Chip
                                        size="small"
                                        label={annotation.status}
                                        color={getStatusColor(annotation.status)}
                                    />
                                </Box>
                            }
                            secondary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar
                                        src={annotation.author.avatar}
                                        sx={{ width: 24, height: 24 }}
                                    />
                                    <Typography variant="body2">
                                        {annotation.author.name} • {new Date(annotation.timestamp).toLocaleString()}
                                    </Typography>
                                </Box>
                            }
                        />
                        <ListItemSecondaryAction>
                            <IconButton
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickApprove(annotation.id);
                                }}
                            >
                                <Check />
                            </IconButton>
                            <IconButton
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickReject(annotation.id);
                                }}
                            >
                                <Close />
                            </IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>

            <Dialog
                open={reviewDialog}
                onClose={() => setReviewDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Review Annotation</DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Annotation Content
                        </Typography>
                        <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                            {selectedAnnotation?.content}
                        </Paper>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Review Status
                        </Typography>
                        <Select
                            fullWidth
                            value={reviewStatus}
                            onChange={(e) => setReviewStatus(e.target.value)}
                        >
                            {Object.entries(REVIEW_STATUS).map(([key, value]) => (
                                <MenuItem key={key} value={value}>
                                    {value.replace('_', ' ').toUpperCase()}
                                </MenuItem>
                            ))}
                        </Select>
                    </Box>

                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Review Comment"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReviewDialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleReview}
                        disabled={!reviewStatus}
                    >
                        Submit Review
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

// Real-time Collaboration Features
function RealTimeCollaboration({ documentId }) {
    const [collaborators, setCollaborators] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [presence, setPresence] = useState({});
    const wsRef = useRef(null);
    const messageEndRef = useRef(null);

    useEffect(() => {
        connectWebSocket();
        return () => wsRef.current?.close();
    }, [documentId]);

    const connectWebSocket = () => {
        const ws = new WebSocket(`${process.env.REACT_APP_WS_URL}/collaborate/${documentId}`);
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };

        wsRef.current = ws;
    };

    const handleWebSocketMessage = (message) => {
        switch (message.type) {
            case 'presence_update':
                setPresence(message.presence);
                break;
            case 'chat_message':
                setMessages(prev => [...prev, message]);
                break;
            case 'collaborator_joined':
                setCollaborators(prev => [...prev, message.user]);
                break;
            case 'collaborator_left':
                setCollaborators(prev => 
                    prev.filter(c => c.id !== message.userId)
                );
                break;
        }
    };

    const sendMessage = () => {
        if (!newMessage.trim()) return;

        wsRef.current?.send(JSON.stringify({
            type: 'chat_message',
            content: newMessage
        }));

        setNewMessage('');
    };

    const updatePresence = (status) => {
        wsRef.current?.send(JSON.stringify({
            type: 'presence_update',
            status
        }));
    };

    return (
        <Box sx={{ display: 'flex', height: '100%' }}>
            <Box sx={{ width: 200, borderRight: 1, borderColor: 'divider', p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Collaborators
                </Typography>
                <List>
                    {collaborators.map(user => (
                        <ListItem key={user.id}>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Badge
                                            overlap="circular"
                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                            variant="dot"
                                            color={presence[user.id]?.online ? 'success' : 'error'}
                                        >
                                            <Avatar src={user.avatar} />
                                        </Badge>
                                        <Typography>{user.name}</Typography>
                                    </Box>
                                }
                                secondary={presence[user.id]?.status}
                            />
                        </ListItem>
                    ))}
                </List>
            </Box>

            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
                <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
                    {messages.map((message, index) => (
                        <Box key={index} sx={{ mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar
                                    src={message.user.avatar}
                                    sx={{ width: 24, height: 24 }}
                                />
                                <Typography variant="subtitle2">
                                    {message.user.name}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    {new Date(message.timestamp).toLocaleString()}
                                </Typography>
                            </Box>
                            <Typography sx={{ ml: 4 }}>
                                {message.content}
                            </Typography>
                        </Box>
                    ))}
                    <div ref={messageEndRef} />
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                sendMessage();
                            }
                        }}
                    />
                    <Button
                        variant="contained"
                        onClick={sendMessage}
                    >
                        Send
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}

export { AnnotationReviewSystem, RealTimeCollaboration }; 