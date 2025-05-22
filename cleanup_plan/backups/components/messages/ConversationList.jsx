import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar, 
  Badge, 
  Divider, 
  TextField, 
  InputAdornment,
  IconButton,
  Button,
  styled,
  useTheme,
  CircularProgress
} from '@mui/material';
import { 
  Search as SearchIcon,
  Clear as ClearIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useMessages } from '../../contexts/MessageContext';

// Styled components
const ConversationContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  borderRight: `1px solid ${theme.palette.divider}`,
}));

const ConversationHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  paddingBottom: theme.spacing(1),
}));

const ConversationItem = styled(ListItem)(({ theme, selected }) => ({
  cursor: 'pointer',
  backgroundColor: selected ? theme.palette.action.selected : 'inherit',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  padding: theme.spacing(1.5, 2),
}));

const ConversationList = ({ onCreateConversation }) => {
  const theme = useTheme();
  const { conversations, activeConversation, setActiveConversation, loading } = useMessages();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation => {
    const searchLower = searchQuery.toLowerCase();
    return (
      conversation.recipient.name.toLowerCase().includes(searchLower) ||
      (conversation.lastMessage?.content || '').toLowerCase().includes(searchLower)
    );
  });
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation);
  };
  
  // Format the timestamp to a human-readable format
  const formatTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  };
  
  // Truncate long messages for preview
  const truncateMessage = (message, maxLength = 60) => {
    if (!message) return '';
    
    if (message.length <= maxLength) return message;
    return `${message.substring(0, maxLength)}...`;
  };
  
  return (
    <ConversationContainer>
      <ConversationHeader>
        <Typography variant="h6" fontWeight="medium">
          Messages
        </Typography>
        <Button 
          startIcon={<AddIcon />}
          color="primary"
          size="small"
          onClick={onCreateConversation}
          sx={{ mt: 1 }}
        >
          New Conversation
        </Button>
      </ConversationHeader>
      
      <SearchContainer>
        <TextField
          fullWidth
          placeholder="Search conversations"
          value={searchQuery}
          onChange={handleSearchChange}
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton 
                  size="small" 
                  onClick={() => setSearchQuery('')}
                  edge="end"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </SearchContainer>
      
      {loading && conversations.length === 0 ? (
        <Box display="flex" justifyContent="center" alignItems="center" py={4}>
          <CircularProgress size={30} />
        </Box>
      ) : (
        <List sx={{ overflow: 'auto', flexGrow: 1 }}>
          {filteredConversations.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography color="textSecondary">
                {searchQuery.trim() 
                  ? 'No conversations match your search' 
                  : 'No conversations yet'}
              </Typography>
              {!searchQuery.trim() && (
                <Button 
                  startIcon={<AddIcon />}
                  onClick={onCreateConversation}
                  sx={{ mt: 2 }}
                >
                  Start a conversation
                </Button>
              )}
            </Box>
          ) : (
            filteredConversations.map((conversation, index) => (
              <React.Fragment key={conversation.id}>
                <ConversationItem 
                  alignItems="flex-start"
                  selected={activeConversation?.id === conversation.id}
                  onClick={() => handleSelectConversation(conversation)}
                >
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      variant="dot"
                      color="success"
                      invisible={!conversation.unreadCount}
                    >
                      <Avatar 
                        src={conversation.recipient.avatar}
                        alt={conversation.recipient.name}
                      >
                        {conversation.recipient.name.charAt(0)}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" fontWeight={conversation.unreadCount > 0 ? 'bold' : 'regular'}>
                          {conversation.recipient.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatTime(conversation.lastMessage?.createdAt)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography 
                          variant="body2" 
                          color="textSecondary" 
                          sx={{ 
                            maxWidth: '180px',
                            fontWeight: conversation.unreadCount > 0 ? 'medium' : 'regular'
                          }}
                          noWrap
                        >
                          {conversation.lastMessage 
                            ? truncateMessage(conversation.lastMessage.content) 
                            : 'No messages yet'}
                        </Typography>
                        {conversation.unreadCount > 0 && (
                          <Badge
                            badgeContent={conversation.unreadCount}
                            color="primary"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ConversationItem>
                {index < filteredConversations.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))
          )}
        </List>
      )}
    </ConversationContainer>
  );
};

export default ConversationList;