import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Grid,
    Typography,
    Avatar,
    AvatarGroup,
    Button,
    IconButton,
    Tooltip,
    Badge,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Divider,
    TextField,
    Menu,
    MenuItem,
    Dialog,
    Chip
} from '@mui/material';
import {
    VideoCall,
    Chat,
    Share,
    Lock,
    Edit,
    History,
    Notifications,
    PanTool,
    Comment,
    Save
} from '@mui/icons-material';

function AdvancedCollaboration({ documentId }) {
    const [activeUsers, setActiveUsers] = useState([]);
    const [activities, setActivities] = useState([]);
    const [videoCall, setVideoCall] = useState(null);
    const [permissions, setPermissions] = useState({});
    const wsRef = useRef(null);
    const peerConnection = useRef(null);

    useEffect(() => {
        initializeCollaboration();
        return () => {
            wsRef.current?.close();
            peerConnection.current?.close();
        };
    }, [documentId]);

    const initializeCollaboration = async () => {
        // Initialize WebSocket connection
        const ws = new WebSocket(`${process.env.REACT_APP_WS_URL}/collaborate/${documentId}`);
        
        ws.onmessage = handleWebSocketMessage;
        wsRef.current = ws;

        // Initialize WebRTC for video calls
        peerConnection.current = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        // Load initial data
        await Promise.all([
            loadActiveUsers(),
            loadActivities(),
            loadPermissions()
        ]);
    };

    const handleWebSocketMessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
            case 'user_joined':
                setActiveUsers(prev => [...prev, data.user]);
                break;
            case 'user_left':
                setActiveUsers(prev => prev.filter(u => u.id !== data.userId));
                break;
            case 'activity':
                setActivities(prev => [data.activity, ...prev]);
                break;
            case 'permission_changed':
                setPermissions(prev => ({ ...prev, [data.userId]: data.permissions }));
                break;
            case 'video_call_request':
                handleVideoCallRequest(data);
                break;
        }
    };

    const startVideoCall = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            
            stream.getTracks().forEach(track => {
                peerConnection.current.addTrack(track, stream);
            });

            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);

            wsRef.current.send(JSON.stringify({
                type: 'video_call_offer',
                offer
            }));

            setVideoCall({ active: true, stream });
        } catch (error) {
            console.error('Failed to start video call:', error);
        }
    };

    const handleVideoCallRequest = async (data) => {
        try {
            await peerConnection.current.setRemoteDescription(
                new RTCSessionDescription(data.offer)
            );

            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);

            wsRef.current.send(JSON.stringify({
                type: 'video_call_answer',
                answer
            }));
        } catch (error) {
            console.error('Failed to handle video call request:', error);
        }
    };

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">Collaboration Space</Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                startIcon={<VideoCall />}
                                onClick={startVideoCall}
                                disabled={videoCall?.active}
                            >
                                Video Call
                            </Button>
                            <Button startIcon={<Share />}>
                                Share
                            </Button>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <AvatarGroup max={5}>
                            {activeUsers.map(user => (
                                <Tooltip key={user.id} title={user.name}>
                                    <Badge
                                        overlap="circular"
                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                        variant="dot"
                                        color="success"
                                    >
                                        <Avatar src={user.avatar} alt={user.name} />
                                    </Badge>
                                </Tooltip>
                            ))}
                        </AvatarGroup>
                        <Typography variant="body2" sx={{ ml: 2 }}>
                            {activeUsers.length} active collaborators
                        </Typography>
                    </Box>

                    {videoCall?.active && (
                        <Box sx={{ mb: 2 }}>
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                style={{ width: '100%', borderRadius: 8 }}
                            />
                        </Box>
                    )}
                </Paper>

                {/* Collaboration content area */}
            </Grid>

            <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Activity Feed
                    </Typography>
                    <List>
                        {activities.map((activity, index) => (
                            <React.Fragment key={activity.id}>
                                <ListItem>
                                    <ListItemAvatar>
                                        <Avatar src={activity.user.avatar} />
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={activity.description}
                                        secondary={new Date(activity.timestamp).toLocaleString()}
                                    />
                                </ListItem>
                                {index < activities.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            </Grid>
        </Grid>
    );
}

// Review Workflow Automation
function ReviewWorkflowAutomation({ templateId }) {
    const [workflow, setWorkflow] = useState({
        steps: [],
        currentStep: null,
        autoAssign: true,
        notifications: true,
        deadlines: {}
    });

    const [reviewers, setReviewers] = useState([]);
    const [automationRules, setAutomationRules] = useState([]);

    useEffect(() => {
        loadWorkflowConfig();
        loadReviewers();
        loadAutomationRules();
    }, [templateId]);

    const loadWorkflowConfig = async () => {
        try {
            const response = await api.get(`/api/templates/${templateId}/workflow`);
            setWorkflow(response.data);
        } catch (error) {
            console.error('Failed to load workflow config:', error);
        }
    };

    const updateWorkflowStep = async (stepId, updates) => {
        try {
            await api.patch(`/api/workflow-steps/${stepId}`, updates);
            await loadWorkflowConfig();
        } catch (error) {
            console.error('Failed to update workflow step:', error);
        }
    };

    const addAutomationRule = async (rule) => {
        try {
            await api.post(`/api/templates/${templateId}/automation-rules`, rule);
            await loadAutomationRules();
        } catch (error) {
            console.error('Failed to add automation rule:', error);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Review Workflow
            </Typography>

            {/* Workflow configuration UI */}
            <Box sx={{ mb: 3 }}>
                {workflow.steps.map((step, index) => (
                    <Paper key={step.id} sx={{ p: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle1">
                                Step {index + 1}: {step.name}
                            </Typography>
                            <Box>
                                <IconButton size="small">
                                    <Edit />
                                </IconButton>
                                <IconButton size="small">
                                    <Delete />
                                </IconButton>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                            {step.reviewers.map(reviewer => (
                                <Chip
                                    key={reviewer.id}
                                    avatar={<Avatar src={reviewer.avatar} />}
                                    label={reviewer.name}
                                    size="small"
                                />
                            ))}
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Typography variant="body2" color="textSecondary">
                                Deadline: {step.deadline || 'None'}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Required Approvals: {step.requiredApprovals}
                            </Typography>
                        </Box>
                    </Paper>
                ))}
            </Box>

            {/* Automation rules */}
            <Typography variant="subtitle1" gutterBottom>
                Automation Rules
            </Typography>
            <List>
                {automationRules.map(rule => (
                    <ListItem key={rule.id}>
                        <ListItemText
                            primary={rule.name}
                            secondary={rule.description}
                        />
                        <Switch
                            checked={rule.enabled}
                            onChange={() => toggleRule(rule.id)}
                        />
                    </ListItem>
                ))}
            </List>
        </Paper>
    );
}

export { AdvancedCollaboration, ReviewWorkflowAutomation }; 