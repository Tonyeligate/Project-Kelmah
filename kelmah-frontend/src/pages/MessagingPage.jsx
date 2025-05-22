import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, Fab, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Search, Add, Menu } from '@mui/icons-material';
import ConversationList from '../components/chat/ConversationList';
import ChatComponent from '../components/chat/ChatComponent';
import MessageSearch from '../components/chat/MessageSearch';
import { useMessages } from '../contexts/MessageContext';
import { useAuth } from '../contexts/AuthContext';

const MessagingPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { activeConversation, setActiveConversation } = useMessages();
  const { user } = useAuth();

  // Close mobile sidebar when selecting a conversation
  useEffect(() => {
    if (isMobile && activeConversation) {
      setMobileSidebarOpen(false);
    }
  }, [activeConversation, isMobile]);

  const handleSearchOpen = () => {
    setSearchOpen(true);
  };

  const handleSearchClose = () => {
    setSearchOpen(false);
  };

  const handleMessageSelect = (message) => {
    // Set active conversation to the one containing this message
    if (message && message.conversationId) {
      setActiveConversation({
        id: message.conversationId,
        title: message.conversation?.title
      });
    }
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      height: 'calc(100vh - 64px)', // Adjust based on your app's header height
      overflow: 'hidden'
    }}>
      {/* Conversation sidebar - hidden on mobile when viewing a conversation */}
      <Box 
        sx={{ 
          display: { 
            xs: mobileSidebarOpen || !activeConversation ? 'block' : 'none',
            md: 'block'
          },
          flex: { xs: '1 0 100%', md: '0 0 320px' },
          height: '100%',
        }}
      >
        <ConversationList 
          onSelectConversation={(conversation) => setActiveConversation(conversation)} 
        />
      </Box>
      
      {/* Chat area - shown when a conversation is selected */}
      {activeConversation ? (
        <Box 
          sx={{ 
            display: { 
              xs: !mobileSidebarOpen ? 'flex' : 'none',
              md: 'flex'
            },
            flex: 1,
            flexDirection: 'column',
            height: '100%',
            position: 'relative'
          }}
        >
          {isMobile && (
            <IconButton 
              onClick={toggleMobileSidebar}
              sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}
            >
              <Menu />
            </IconButton>
          )}
          
          <ChatComponent 
            jobId={activeConversation.id}
            currentUserId={user?.id}
            otherUserId={activeConversation.participants?.[0]?.id || null}
          />
        </Box>
      ) : (
        <Box 
          sx={{ 
            display: { xs: 'none', md: 'flex' },
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.paper'
          }}
        >
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              maxWidth: 400,
              bgcolor: 'rgba(26, 26, 26, 0.7)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 215, 0, 0.1)',
            }}
          >
            <Typography variant="h5" gutterBottom>
              Select a conversation
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Choose a conversation from the sidebar or start a new one to begin messaging
            </Typography>
          </Paper>
        </Box>
      )}
      
      {/* Message search drawer */}
      <MessageSearch 
        open={searchOpen} 
        onClose={handleSearchClose}
        onSelectMessage={handleMessageSelect}
      />
      
      {/* Floating action buttons */}
      <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 10 }}>
        <Fab 
          color="primary" 
          aria-label="search messages" 
          onClick={handleSearchOpen}
          sx={{ mr: 2, bgcolor: 'rgba(255, 215, 0, 0.8)' }}
        >
          <Search />
        </Fab>
        <Fab 
          color="primary" 
          aria-label="new conversation"
          sx={{ bgcolor: 'rgba(255, 215, 0, 0.8)' }}
        >
          <Add />
        </Fab>
      </Box>
    </Box>
  );
};

export default MessagingPage; 