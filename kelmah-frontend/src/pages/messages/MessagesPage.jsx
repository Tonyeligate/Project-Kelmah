import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Grid, 
  Box, 
  Typography, 
  Divider, 
  IconButton, 
  useTheme, 
  useMediaQuery,
  Paper,
  styled
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ConversationList from '../../components/messages/ConversationList';
import MessageList from '../../components/messages/MessageList';
import MessageInput from '../../components/messages/MessageInput';
import { useMessages } from '../../contexts/MessageContext';
import { useAuth } from '../../contexts/AuthContext';

// Styled components
const PageContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
  height: 'calc(100vh - 64px)', // Subtract app bar height
  [theme.breakpoints.down('sm')]: {
    height: 'calc(100vh - 56px)', // Smaller app bar on mobile
    padding: theme.spacing(1),
  },
}));

const MessagesContainer = styled(Paper)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  boxShadow: theme.shadows[3],
  borderRadius: theme.shape.borderRadius,
}));

const ConversationsContainer = styled(Box)(({ theme }) => ({
  height: '100%',
  borderRight: `1px solid ${theme.palette.divider}`,
  [theme.breakpoints.down('md')]: {
    borderRight: 'none',
  },
}));

const MessagesHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

const MessagesContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  height: 'calc(100% - 64px)', // Subtract header height
}));

const MessageListContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'hidden',
  height: 'calc(100% - 80px)', // Allow space for message input
}));

const MessageInputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0, 2, 2),
}));

const NoConversationContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
  textAlign: 'center',
  padding: theme.spacing(3),
  color: theme.palette.text.secondary,
}));

const MessagesPage = () => {
  const { 
    conversations, 
    activeConversation, 
    messages, 
    loading, 
    error,
    setActiveConversation,
    sendMessage,
    deleteMessage,
    fetchConversations
  } = useMessages();

  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showConversations, setShowConversations] = useState(!isMobile);
  const [showMessages, setShowMessages] = useState(isMobile && activeConversation);

  // Handle screen size changes
  useEffect(() => {
    if (isMobile) {
      setShowConversations(!activeConversation);
      setShowMessages(!!activeConversation);
    } else {
      setShowConversations(true);
      setShowMessages(true);
    }
  }, [isMobile, activeConversation]);

  // Make sure conversations are loaded
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Handle selecting a conversation
  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation);
    if (isMobile) {
      setShowConversations(false);
      setShowMessages(true);
    }
  };

  // Handle back button click to return to conversation list on mobile
  const handleBackToConversations = () => {
    if (isMobile) {
      setShowConversations(true);
      setShowMessages(false);
    }
  };

  // Handle sending a message
  const handleSendMessage = async (content, attachments) => {
    if (activeConversation) {
      await sendMessage(activeConversation.id, content, attachments);
    }
  };

  // Get other participant from the active conversation
  const getOtherParticipant = (conversation) => {
    if (!conversation || !conversation.participants) return null;
    return conversation.participants.find(p => p.id !== 'current-user' && p.id !== user?.id) || null;
  };

  // Render the conversations list
  const renderConversationsList = () => (
    <ConversationsContainer sx={{ display: showConversations ? 'block' : 'none' }}>
      <MessagesHeader>
        <Typography variant="h6">Messages</Typography>
      </MessagesHeader>
      <Box sx={{ height: 'calc(100% - 64px)' }}> {/* Subtract header height */}
        <ConversationList 
          conversations={conversations} 
          activeConversationId={activeConversation?.id}
          onSelectConversation={handleSelectConversation}
          loading={loading}
          error={error}
        />
      </Box>
    </ConversationsContainer>
  );

  // Render the messages area
  const renderMessagesArea = () => {
    const otherParticipant = getOtherParticipant(activeConversation);

    return (
      <Box 
        sx={{ 
          display: showMessages ? 'flex' : 'none',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <MessagesHeader>
          {isMobile && (
            <IconButton 
              edge="start" 
              color="inherit" 
              aria-label="back"
              onClick={handleBackToConversations}
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          {otherParticipant ? (
            <Typography variant="h6">
              {otherParticipant.name}
            </Typography>
          ) : (
            <Typography variant="h6">
              Select a conversation
            </Typography>
          )}
        </MessagesHeader>

        <MessagesContent>
          {activeConversation ? (
            <>
              <MessageListContainer>
                <MessageList 
                  messages={messages} 
                  participants={activeConversation?.participants || []}
                  loading={loading}
                  error={error}
                  onDeleteMessage={deleteMessage}
                />
              </MessageListContainer>
              <MessageInputContainer>
                <MessageInput 
                  onSendMessage={handleSendMessage} 
                  disabled={!activeConversation || loading}
                  loading={loading}
                />
              </MessageInputContainer>
            </>
          ) : (
            <NoConversationContainer>
              <Typography variant="h6" gutterBottom>
                No conversation selected
              </Typography>
              <Typography variant="body2">
                Select a conversation from the list to start chatting
              </Typography>
            </NoConversationContainer>
          )}
        </MessagesContent>
      </Box>
    );
  };

  return (
    <PageContainer maxWidth="xl" disableGutters={isMobile}>
      <Grid container sx={{ height: '100%' }}>
        <Grid 
          item 
          xs={12} 
          md={4} 
          lg={3} 
          sx={{ 
            height: '100%',
            display: { xs: showConversations ? 'block' : 'none', md: 'block' }
          }}
        >
          {renderConversationsList()}
        </Grid>
        
        <Grid 
          item 
          xs={12} 
          md={8} 
          lg={9} 
          sx={{ 
            height: '100%', 
            display: { xs: showMessages ? 'block' : 'none', md: 'block' }
          }}
        >
          <MessagesContainer>
            {renderMessagesArea()}
          </MessagesContainer>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default MessagesPage; 