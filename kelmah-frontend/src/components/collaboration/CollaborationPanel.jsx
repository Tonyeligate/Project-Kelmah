import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    TextField,
    IconButton,
    Badge,
    Tooltip,
    Divider
} from '@mui/material';
import {
    Send,
    PersonAdd,
    History,
    Save
} from '@mui/icons-material';

function CollaborationPanel({ sessionId }) {
    const [connected, setConnected] = useState(false);
    const [collaborators, setCollaborators] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const wsRef = useRef(null);
    const cursorUpdateTimeout = useRef(null);

    useEffect(() => {
        connectWebSocket();
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [sessionId]);

    const connectWebSocket = () => {
        const ws = new WebSocket(`${process.env.REACT_APP_WS_URL}/collaborate`);
        
        ws.onopen = () => {
            setConnected(true);
            ws.send(JSON.stringify({
                type: 'join',
                sessionId
            }));
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            handleMessage(message);
        };

        ws.onclose = () => {
            setConnected(false);
            // Attempt to reconnect
            setTimeout(connectWebSocket, 3000);
        };

        wsRef.current = ws;
    };

    const handleMessage = (message) => {
        switch (message.type) {
            case 'init':
                handleInitialState(message.data);
                break;
            case 'cursor':
                updateCollaboratorCursor(message.clientId, message.position);
                break;
            case 'chat':
                setMessages(prev => [...prev, message]);
                break;
            case 'operation':
                handleOperation(message.operation);
                break;
        }
    };

    const handleCursorMove = (position) => {
        if (cursorUpdateTimeout.current) {
            clearTimeout(cursorUpdateTimeout.current);
        }

        cursorUpdateTimeout.current = setTimeout(() => {
            wsRef.current?.send(JSON.stringify({
                type: 'cursor',
                sessionId,
                position
            }));
        }, 50);
    };

    const sendMessage = () => {
        if (!newMessage.trim()) return;

        wsRef.current?.send(JSON.stringify({
            type: 'chat',
            sessionId,
            content: newMessage
        }));

        setNewMessage('');
    };

    return (
        <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
                Collaborators
            </Typography>
            
            <List>
                {collaborators.map(collaborator => (
                    <ListItem key={collaborator.id}>
                        <ListItemAvatar>
                            <Badge
                                color={collaborator.active ? 'success' : 'error'}
                                variant="dot"
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                }}
                            >
                                <Avatar>{collaborator.name[0]}</Avatar>
                            </Badge>
                        </ListItemAvatar>
                        <ListItemText
                            primary={collaborator.name}
                            secondary={collaborator.status}
                        />
                    </ListItem>
                ))}
            </List>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2 }}>
                {messages.map((message, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                        <Typography variant="caption" color="textSecondary">
                            {message.sender}
                        </Typography>
                        <Typography>{message.content}</Typography>
                    </Box>
                ))}
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
                <IconButton onClick={sendMessage}>
                    <Send />
                </IconButton>
            </Box>
        </Paper>
    );
}

export default CollaborationPanel; 