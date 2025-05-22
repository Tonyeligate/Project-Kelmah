import React, { useState, useEffect } from 'react';
import { useMessages } from '../../contexts/MessageContext';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar, 
  Typography, 
  Divider, 
  Badge, 
  IconButton, 
  InputBase, 
  Paper 
} from '@mui/material';
import { 
  Search, 
  MoreVert, 
  ChatBubble, 
  People, 
  Archive 
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { formatDistanceToNow } from 'date-fns';

// Styled components
const ConversationContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  borderRight: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(26, 26, 26, 0.7)',
  backdropFilter: 'blur(10px)',
  width: 320,
}));

const SearchContainer = styled(Paper)(({ theme }) => ({
  margin: theme.spacing(2),
  padding: theme.spacing(0.5, 1),
  display: 'flex',
  alignItems: 'center',
  background: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
}));

const TabButton = styled(Box)(({ theme, selected }) => ({
  padding: theme.spacing(1),
  flex: 1,
  textAlign: 'center',
  borderBottom: selected ? '2px solid #FFA500' : '2px solid transparent',
  color: selected ? '#FFA500' : 'inherit',
  cursor: 'pointer',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.05)',
  },
}));

const ConversationList = ({ onSelectConversation }) => {
  const { conversations, activeConversation, setActiveConversation, onlineUsers, unreadCount } = useMessages();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, unread, archived
  
  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation);
    if (onSelectConversation) {
      onSelectConversation(conversation);
    }
  };
  
  // Filter conversations based on search and active tab
  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = !searchQuery || 
      conversation.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.participants.some(p => 
        p.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
    if (!matchesSearch) return false;
    
    switch (activeTab) {
      case 'unread':
        return conversation.unreadCount > 0;
      case 'archived':
        return conversation.isArchived;
      default: // 'all'
        return !conversation.isArchived;
    }
  });
  
  const getTruncatedContent = (content, maxLength = 30) => {
    if (!content) return '';
    return content.length > maxLength 
      ? `${content.substring(0, maxLength)}...` 
      : content;
  };

  return (
    <ConversationContainer>
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Messages</Typography>
        <Box>
          <IconButton size="small">
            <MoreVert />
          </IconButton>
        </Box>
      </Box>
      
      <SearchContainer>
        <Search sx={{ mr: 1, color: 'text.secondary' }} />
        <InputBase
          fullWidth
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </SearchContainer>
      
      <Box sx={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <TabButton 
          selected={activeTab === 'all'} 
          onClick={() => setActiveTab('all')}
        >
          <ChatBubble fontSize="small" sx={{ mr: 0.5 }} />
          <Typography variant="body2">All</Typography>
        </TabButton>
        
        <TabButton 
          selected={activeTab === 'unread'} 
          onClick={() => setActiveTab('unread')}
        >
          <Badge badgeContent={unreadCount} color="error" sx={{ mr: 0.5 }}>
            <People fontSize="small" />
          </Badge>
          <Typography variant="body2">Unread</Typography>
        </TabButton>
        
        <TabButton 
          selected={activeTab === 'archived'} 
          onClick={() => setActiveTab('archived')}
        >
          <Archive fontSize="small" sx={{ mr: 0.5 }} />
          <Typography variant="body2">Archived</Typography>
        </TabButton>
      </Box>
      
      <List sx={{ overflow: 'auto', flexGrow: 1 }}>
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => {
            const isActive = activeConversation?.id === conversation.id;
            const lastMessage = conversation.lastMessage;
            const otherParticipant = conversation.participants.find(p => p.id !== conversation.userId);
            const isOnline = otherParticipant && onlineUsers.has(otherParticipant.id);
            
            return (
              <React.Fragment key={conversation.id}>
                <ListItem 
                  button
                  selected={isActive}
                  onClick={() => handleSelectConversation(conversation)}
                  sx={{ 
                    bgcolor: isActive ? 'rgba(255, 215, 0, 0.15)' : 'transparent',
                    '&:hover': {
                      bgcolor: isActive ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      variant="dot"
                      color={isOnline ? 'success' : 'error'}
                    >
                      <Avatar alt={otherParticipant?.name} src={otherParticipant?.avatar} />
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography 
                          variant="body1" 
                          noWrap 
                          sx={{ 
                            fontWeight: conversation.unreadCount > 0 ? 700 : 400,
                            maxWidth: '70%',
                          }}
                        >
                          {conversation.title || otherParticipant?.name || 'Conversation'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {lastMessage?.createdAt 
                            ? formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true }) 
                            : ''}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography 
                          variant="body2" 
                          noWrap 
                          sx={{ 
                            fontWeight: conversation.unreadCount > 0 ? 500 : 400,
                            color: conversation.unreadCount > 0 ? 'text.primary' : 'text.secondary',
                            maxWidth: '70%',
                          }}
                        >
                          {lastMessage ? getTruncatedContent(lastMessage.content) : 'No messages yet'}
                        </Typography>
                        {conversation.unreadCount > 0 && (
                          <Badge 
                            badgeContent={conversation.unreadCount} 
                            color="primary"
                            sx={{ '& .MuiBadge-badge': { bgcolor: '#FFA500' } }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            );
          })
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 3 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              {searchQuery 
                ? 'No conversations match your search'
                : activeTab === 'unread'
                  ? 'No unread messages'
                  : activeTab === 'archived'
                    ? 'No archived conversations'
                    : 'No conversations yet'
              }
            </Typography>
          </Box>
        )}
      </List>
    </ConversationContainer>
  );
};

export default ConversationList; 