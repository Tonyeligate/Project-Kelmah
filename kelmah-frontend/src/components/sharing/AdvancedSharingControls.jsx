import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    IconButton,
    Button,
    Dialog,
    TextField,
    Select,
    MenuItem,
    Chip,
    Switch,
    FormControlLabel
} from '@mui/material';
import {
    PersonAdd,
    Link,
    Settings,
    Delete,
    Security,
    Schedule,
    ContentCopy
} from '@mui/icons-material';

const PERMISSION_LEVELS = {
    view: { label: 'View', color: 'info' },
    comment: { label: 'Comment', color: 'success' },
    edit: { label: 'Edit', color: 'warning' },
    manage: { label: 'Manage', color: 'error' }
};

function AdvancedSharingControls({ resourceId, resourceType }) {
    const [shares, setShares] = useState([]);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [settings, setSettings] = useState({
        allowPublic: false,
        requireAuth: true,
        expiryEnabled: false,
        expiryDate: null,
        allowDomains: []
    });

    useEffect(() => {
        loadShares();
        loadSettings();
    }, [resourceId]);

    const loadShares = async () => {
        const response = await api.get(`/api/share/${resourceType}/${resourceId}`);
        setShares(response.data.shares);
    };

    const loadSettings = async () => {
        const response = await api.get(`/api/share/${resourceType}/${resourceId}/settings`);
        setSettings(response.data);
    };

    const handleShare = async (shareData) => {
        await api.post(`/api/share/${resourceType}/${resourceId}`, shareData);
        await loadShares();
        setShareDialogOpen(false);
    };

    const handleUpdatePermission = async (shareId, permission) => {
        await api.patch(`/api/share/${shareId}`, { permission });
        await loadShares();
    };

    const handleRemoveShare = async (shareId) => {
        await api.delete(`/api/share/${shareId}`);
        await loadShares();
    };

    const generateShareLink = async () => {
        const response = await api.post(`/api/share/${resourceType}/${resourceId}/link`);
        navigator.clipboard.writeText(response.data.url);
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Sharing Settings</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        startIcon={<Link />}
                        onClick={generateShareLink}
                    >
                        Copy Link
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<PersonAdd />}
                        onClick={() => setShareDialogOpen(true)}
                    >
                        Share
                    </Button>
                </Box>
            </Box>

            <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" gutterBottom>Access Settings</Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.allowPublic}
                            onChange={(e) => setSettings(prev => ({
                                ...prev,
                                allowPublic: e.target.checked
                            }))}
                        />
                    }
                    label="Allow public access"
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.requireAuth}
                            onChange={(e) => setSettings(prev => ({
                                ...prev,
                                requireAuth: e.target.checked
                            }))}
                        />
                    }
                    label="Require authentication"
                />
            </Box>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>User/Group</TableCell>
                        <TableCell>Permission</TableCell>
                        <TableCell>Expires</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {shares.map(share => (
                        <TableRow key={share.id}>
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {share.type === 'user' ? (
                                        <Typography>{share.user.email}</Typography>
                                    ) : (
                                        <Chip label={share.group.name} variant="outlined" />
                                    )}
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Select
                                    size="small"
                                    value={share.permission}
                                    onChange={(e) => handleUpdatePermission(share.id, e.target.value)}
                                >
                                    {Object.entries(PERMISSION_LEVELS).map(([key, value]) => (
                                        <MenuItem key={key} value={key}>
                                            <Chip
                                                label={value.label}
                                                size="small"
                                                color={value.color}
                                            />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </TableCell>
                            <TableCell>
                                {share.expires ? new Date(share.expires).toLocaleDateString() : '-'}
                            </TableCell>
                            <TableCell>
                                <IconButton onClick={() => handleRemoveShare(share.id)}>
                                    <Delete />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <ShareDialog
                open={shareDialogOpen}
                onClose={() => setShareDialogOpen(false)}
                onShare={handleShare}
            />
        </Paper>
    );
}

// Add collaborative comments and annotations
function CollaborativeComments({ resourceId, resourceType }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [selectedAnnotation, setSelectedAnnotation] = useState(null);

    useEffect(() => {
        loadComments();
    }, [resourceId]);

    const loadComments = async () => {
        const response = await api.get(`/api/${resourceType}/${resourceId}/comments`);
        setComments(response.data);
    };

    const addComment = async () => {
        if (!newComment.trim()) return;

        await api.post(`/api/${resourceType}/${resourceId}/comments`, {
            content: newComment,
            annotation: selectedAnnotation
        });

        setNewComment('');
        setSelectedAnnotation(null);
        await loadComments();
    };

    const handleAnnotationSelect = (annotation) => {
        setSelectedAnnotation(annotation);
    };

    return (
        <Box>
            <Box sx={{ mb: 2 }}>
                <TextField
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                />
                <Button
                    sx={{ mt: 1 }}
                    variant="contained"
                    onClick={addComment}
                >
                    Add Comment
                </Button>
            </Box>

            <Box>
                {comments.map(comment => (
                    <Paper key={comment.id} sx={{ p: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2">
                                {comment.user.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {new Date(comment.timestamp).toLocaleString()}
                            </Typography>
                        </Box>
                        {comment.annotation && (
                            <Box sx={{ bgcolor: 'action.hover', p: 1, borderRadius: 1, mb: 1 }}>
                                <Typography variant="caption">
                                    Annotation: {comment.annotation.text}
                                </Typography>
                            </Box>
                        )}
                        <Typography>{comment.content}</Typography>
                    </Paper>
                ))}
            </Box>
        </Box>
    );
}

export { AdvancedSharingControls, CollaborativeComments }; 