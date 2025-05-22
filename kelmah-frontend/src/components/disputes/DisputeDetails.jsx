import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Divider,
    TextField,
    IconButton,
    Paper,
    Chip,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Send,
    AttachFile,
    Download
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../../api/axios';

function DisputeDetails({ open, onClose, disputeId }) {
    const [dispute, setDispute] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (open && disputeId) {
            fetchDisputeDetails();
        }
    }, [open, disputeId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchDisputeDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/disputes/${disputeId}`);
            setDispute(response.data.dispute);
            setMessages(response.data.messages);
        } catch (error) {
            setError(error.response?.data?.message || 'Error loading dispute details');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() && !attachment) return;

        try {
            setSending(true);
            const formData = new FormData();
            formData.append('message', newMessage);
            if (attachment) {
                formData.append('attachment', attachment);
            }

            await api.post(`/api/disputes/${disputeId}/messages`, formData);
            setNewMessage('');
            setAttachment(null);
            fetchDisputeDetails();
        } catch (error) {
            setError(error.response?.data?.message || 'Error sending message');
        } finally {
            setSending(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const getStatusChip = (status) => {
        const statusConfig = {
            pending: { color: 'warning', label: 'Pending' },
            investigating: { color: 'info', label: 'Investigating' },
            resolved: { color: 'success', label: 'Resolved' },
            closed: { color: 'default', label: 'Closed' }
        };

        const config = statusConfig[status] || { color: 'default', label: status };
        return <Chip label={config.label} color={config.color} size="small" />;
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Dispute Details
                {dispute && (
                    <Box component="span" sx={{ ml: 2 }}>
                        {getStatusChip(dispute.status)}
                    </Box>
                )}
            </DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : dispute && (
                    <>
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Dispute Information
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                <Typography variant="body2">
                                    Raised by: {dispute.raised_by_name}
                                </Typography>
                                <Typography variant="body2">
                                    Date: {format(new Date(dispute.created_at), 'PPp')}
                                </Typography>
                                <Typography variant="body2">
                                    Reason: {dispute.reason}
                                </Typography>
                                <Typography variant="body2">
                                    Transaction: {dispute.transaction_reference}
                                </Typography>
                            </Box>
                            {dispute.description && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    Description: {dispute.description}
                                </Typography>
                            )}
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ mb: 2, height: '300px', overflowY: 'auto' }}>
                            {messages.map((message, index) => (
                                <Paper
                                    key={message.id}
                                    sx={{
                                        p: 2,
                                        mb: 2,
                                        backgroundColor: message.user_id === dispute.raised_by_id
                                            ? 'primary.light'
                                            : 'grey.100'
                                    }}
                                >
                                    <Typography variant="subtitle2">
                                        {message.sender_name}
                                    </Typography>
                                    <Typography variant="body2">
                                        {message.message}
                                    </Typography>
                                    {message.attachment && (
                                        <Button
                                            size="small"
                                            startIcon={<Download />}
                                            href={`/uploads/${message.attachment}`}
                                            target="_blank"
                                            sx={{ mt: 1 }}
                                        >
                                            Download Attachment
                                        </Button>
                                    )}
                                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                        {format(new Date(message.created_at), 'PPp')}
                                    </Typography>
                                </Paper>
                            ))}
                            <div ref={messagesEndRef} />
                        </Box>

                        {dispute.status !== 'closed' && (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    placeholder="Type your message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    disabled={sending}
                                />
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <IconButton
                                        component="label"
                                        disabled={sending}
                                    >
                                        <AttachFile />
                                        <input
                                            type="file"
                                            hidden
                                            onChange={(e) => setAttachment(e.target.files[0])}
                                        />
                                    </IconButton>
                                    <IconButton
                                        color="primary"
                                        onClick={handleSendMessage}
                                        disabled={(!newMessage.trim() && !attachment) || sending}
                                    >
                                        <Send />
                                    </IconButton>
                                </Box>
                            </Box>
                        )}
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default DisputeDetails; 