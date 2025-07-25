import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Hidden,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import useAuth from '../hooks/useAuth';
import { useMessages } from '../contexts/MessageContext';
import ConversationList from '../components/common/ConversationList';
import Chatbox from '../components/common/Chatbox';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const MessagingPage = () => {
  const { user } = useAuth();
  const { search } = useLocation();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { messagingService } = useMessages();

  useEffect(() => {
    if (user) {
      messagingService.initialize(user.id, user.token);
      messagingService.connect();
    }
    // ConversationList handles its own data fetching
    return () => {
      messagingService.disconnect();
    };
  }, [user]);

  // Auto-create and select conversation when participantId provided in URL
  useEffect(() => {
    const params = new URLSearchParams(search);
    const participantId = params.get('participantId');
    if (participantId && user) {
      messagingService
        .createDirectConversation(participantId)
        .then((convo) => {
          setSelectedConversation(convo);
        })
        .catch((err) => console.error('Error creating conversation:', err));
    }
  }, [search, user]);

  const handleConversationSelect = async (conversation) => {
    setSelectedConversation(conversation);
    try {
      await messagingService.markConversationAsRead(conversation.id);
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const handleCloseChat = () => {
    setSelectedConversation(null);
  };

  const getRecipient = () => {
    if (!selectedConversation || !user) return null;
    return selectedConversation.participants.find((p) => p.id !== user.id);
  };

  const recipient = getRecipient();

  const ChatArea = () =>
    selectedConversation && recipient ? (
      <Chatbox
        conversation={selectedConversation}
        recipientName={recipient.name}
        recipientAvatar={recipient.avatar}
        recipientStatus={recipient.status}
        onClose={handleCloseChat}
      />
    ) : (
      <Paper
        sx={(theme) => ({
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: alpha(theme.palette.primary.main, 0.7),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
        })}
      >
        <Box textAlign="center">
          <img
            src="/assets/images/backgrounds/chat-placeholder.svg"
            alt="Select a conversation"
            style={{ width: '250px', opacity: 0.7 }}
          />
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ mt: 2, color: 'text.primary' }}
          >
            Select a conversation
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ color: 'text.secondary' }}
          >
            Choose one of your existing conversations to start chatting.
          </Typography>
        </Box>
      </Paper>
    );

  return (
    <Box
      sx={{
        height: 'calc(100vh - 64px)',
        p: { xs: 1, sm: 2, md: 3 },
        bgcolor: 'primary.main',
      }}
    >
      <Grid container spacing={2} sx={{ height: '100%' }}>
        {isMobile ? (
          selectedConversation ? (
            <Grid item xs={12}>
              <AppBar
                position="static"
                color="transparent"
                elevation={0}
                sx={(theme) => ({
                  borderBottom: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                })}
              >
                <Toolbar>
                  <IconButton
                    edge="start"
                    color="inherit"
                    onClick={handleCloseChat}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                  <Typography
                    variant="h6"
                    sx={{ flexGrow: 1, color: 'secondary.main' }}
                  >
                    {getRecipient()?.name}
                  </Typography>
                </Toolbar>
              </AppBar>
              <ChatArea />
            </Grid>
          ) : (
            <Grid item xs={12}>
              <ConversationList
                onSelectConversation={handleConversationSelect}
                selectedConversationId={selectedConversation?.id}
              />
            </Grid>
          )
        ) : (
          <>
            <Grid item md={4} lg={3}>
              <ConversationList
                onSelectConversation={handleConversationSelect}
                selectedConversationId={selectedConversation?.id}
              />
            </Grid>
            <Grid item md={8} lg={9}>
              <ChatArea />
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
};

export default MessagingPage;
