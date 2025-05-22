import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar, 
  TextField, 
  InputAdornment,
  Badge,
  Divider,
  IconButton,
  Paper,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Chip,
  OutlinedInput,
  Tooltip,
  CircularProgress,
  AvatarGroup,
  Skeleton,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  Search as SearchIcon,
  MoreVert,
  Circle,
  Add,
  Delete,
  Archive,
  FilterList,
  PersonAdd,
  Group,
  Email,
  GroupAdd,
  Close,
  Clear,
  Lock as LockIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { formatDistanceToNow } from 'date-fns';

// Styled components
const ConversationContainer = styled(Paper)(({ theme }) => ({
  height: '100%',
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  background: 'rgba(26, 26, 26, 0.7)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 215, 0, 0.1)',
  display: 'flex',
  flexDirection: 'column',
}));

const ConversationItem = styled(ListItem)(({ theme, selected }) => ({
  padding: theme.spacing(2),
  background: selected ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
  borderLeft: selected ? `3px solid #FFD700` : '3px solid transparent',
  transition: 'all 0.2s ease',
  '&:hover': {
    background: 'rgba(255, 215, 0, 0.05)',
  }
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

const SearchField = styled(TextField)(({ theme }) => ({
  margin: theme.spacing(2),
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(3),
    background: 'rgba(255, 255, 255, 0.05)',
    '& fieldset': {
      borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 215, 0, 0.5)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#FFD700',
    },
  },
  '& .MuiInputBase-input': {
    color: '#fff',
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  color: '#FFD700',
  borderColor: 'rgba(255, 215, 0, 0.5)',
  '&:hover': {
    borderColor: '#FFD700',
    background: 'rgba(255, 215, 0, 0.1)',
  }
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.7)',
  '&.Mui-selected': {
    color: '#FFD700',
  }
}));

const StyledListItem = styled(ListItem)(({ theme, active }) => ({
  borderRadius: theme.shape.borderRadius,
  transition: 'background-color 0.2s ease',
  cursor: 'pointer',
  marginBottom: theme.spacing(0.5),
  backgroundColor: active ? theme.palette.action.selected : 'transparent',
  '&:hover': {
    backgroundColor: active ? theme.palette.action.selected : theme.palette.action.hover,
  },
}));

const UnreadBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: -3,
    top: 0,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontSize: 10,
    minWidth: 20,
    height: 20,
    padding: '0 6px',
  },
}));

const StatusDot = styled('div')(({ theme, status }) => {
  const colors = {
    online: theme.palette.success.main,
    away: theme.palette.warning.main,
    offline: theme.palette.grey[400],
  };
  
  return {
    width: 12,
    height: 12,
    borderRadius: '50%',
    backgroundColor: colors[status] || colors.offline,
    border: `2px solid ${theme.palette.background.paper}`,
    position: 'absolute',
    bottom: 0,
    right: 0,
  };
});

/**
 * Component that displays a list of conversations 
 */
const ConversationList = ({ 
  conversations = [], 
  onSelectConversation, 
  selectedConversationId,
  loading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState(conversations);
  const [tabValue, setTabValue] = useState('all');
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);
  const [newConversationType, setNewConversationType] = useState('direct');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [enableEncryption, setEnableEncryption] = useState(false);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredConversations(conversations);
    } else {
      const lowerCaseQuery = searchQuery.toLowerCase();
      setFilteredConversations(
        conversations.filter(conv => 
          (conv.name && conv.name.toLowerCase().includes(lowerCaseQuery)) || 
          (conv.latestMessage && conv.latestMessage.content && 
           conv.latestMessage.content.toLowerCase().includes(lowerCaseQuery))
        )
      );
    }
  }, [searchQuery, conversations]);

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const truncateText = (text, maxLength = 30) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      console.error("Error formatting date:", error);
      return '';
    }
  };

  const renderLoadingSkeletons = () => (
    Array(4).fill(0).map((_, index) => (
      <ListItem key={`skeleton-${index}`} sx={{ py: 1.5 }}>
        <ListItemAvatar>
          <Skeleton variant="circular" width={40} height={40} />
        </ListItemAvatar>
        <ListItemText
          primary={<Skeleton variant="text" width="70%" />}
          secondary={<Skeleton variant="text" width="40%" />}
        />
        <Skeleton variant="text" width={40} />
      </ListItem>
    ))
  );

  const handleSelectConversation = (conversation) => {
    if (conversation.unread > 0) {
      setFilteredConversations(prevConversations => 
        prevConversations.map(c => 
          c.id === conversation.id ? { ...c, unread: 0 } : c
        )
      );
    }
    
    onSelectConversation(conversation);
  };

  const handleMenuOpen = (event, conversation) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedConversation(conversation);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedConversation(null);
  };

  const handleFilterMenuOpen = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null);
  };

  const handleArchiveConversation = () => {
    setFilteredConversations(prevConversations => 
      prevConversations.filter(c => c.id !== selectedConversation.id)
    );
    handleMenuClose();
  };

  const handleDeleteConversation = () => {
    setFilteredConversations(prevConversations => 
      prevConversations.filter(c => c.id !== selectedConversation.id)
    );
    handleMenuClose();
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleNewConversationClick = () => {
    setSelectedUsers([]);
    setGroupName('');
    setShowNewConversationDialog(true);
  };

  const handleConversationTypeChange = (type) => {
    setNewConversationType(type);
    setSelectedUsers([]);
  };

  const handleUserSelect = (event) => {
    const { value } = event.target;
    setSelectedUsers(
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  const handleCreateConversation = () => {
    setTimeout(() => {
      const newConversation = {
        id: Date.now(),
        name: newConversationType === 'direct' 
          ? conversations.find(user => user.id === selectedUsers[0])?.name 
          : groupName,
        avatar: newConversationType === 'direct'
          ? conversations.find(user => user.id === selectedUsers[0])?.avatar
          : '',
        latestMessage: {
          content: '',
          timestamp: 'Just now',
          sender: '',
          isCurrentUser: false,
          hasAttachment: false
        },
        unread: 0,
        status: 'offline',
        isGroup: newConversationType === 'group',
        isEncrypted: enableEncryption,
        members: selectedUsers.map(userId => 
          conversations.find(user => user.id === userId)
        ).filter(Boolean)
      };
      
      setFilteredConversations([newConversation, ...filteredConversations]);
      setShowNewConversationDialog(false);
      
      onSelectConversation(newConversation);
    }, 1000);
  };

  return (
    <ConversationContainer elevation={3}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Typography variant="h6" sx={{ color: '#FFD700' }}>
          Messages
        </Typography>
        <Box>
          <Tooltip title="Filter conversations">
            <IconButton 
              size="small" 
              sx={{ color: 'rgba(255, 215, 0, 0.7)' }}
              onClick={handleFilterMenuOpen}
            >
              <FilterList />
            </IconButton>
          </Tooltip>
          <Tooltip title="New conversation">
            <IconButton 
              size="small" 
              sx={{ color: 'rgba(255, 215, 0, 0.7)', ml: 1 }}
              onClick={handleNewConversationClick}
            >
              <Add />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <SearchField
        placeholder="Search conversations..."
        value={searchQuery}
        onChange={handleSearch}
        fullWidth
        variant="outlined"
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'rgba(255, 215, 0, 0.7)' }} />
            </InputAdornment>
          ),
          endAdornment: searchQuery && (
            <InputAdornment position="end">
              <IconButton 
                size="small" 
                onClick={clearSearch} 
                edge="end"
                aria-label="clear search"
              >
                <Clear />
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      
      <Tabs 
        value={tabValue}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{ 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          '& .MuiTabs-indicator': {
            backgroundColor: '#FFD700',
          }
        }}
      >
        <StyledTab value="all" label="All" />
        <StyledTab value="unread" label="Unread" />
        <StyledTab value="direct" label="Direct" />
        <StyledTab value="group" label="Groups" />
      </Tabs>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {loading ? (
          renderLoadingSkeletons()
        ) : filteredConversations.length > 0 ? (
          <List disablePadding>
            {filteredConversations.map((conversation) => {
              const isSelected = selectedConversationId === conversation.id;
              const hasUnread = conversation.unread > 0;

              return (
                <React.Fragment key={conversation.id}>
                  <StyledListItem
                    active={isSelected ? 1 : 0}
                    onClick={() => handleSelectConversation(conversation)}
                  >
                    <ListItemAvatar>
                      <Box sx={{ position: 'relative' }}>
                        {conversation.isGroup ? (
                          <Avatar sx={{ bgcolor: 'primary.light' }}>
                            <Group />
                          </Avatar>
                        ) : (
                          <Avatar src={conversation.avatar || ''} alt={conversation.name || 'User'}>
                            {!conversation.avatar && (conversation.name?.charAt(0) || 'U')}
                          </Avatar>
                        )}
                        <StatusDot status={conversation.status || 'offline'} />
                      </Box>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              fontWeight: hasUnread ? 700 : 400,
                              color: hasUnread ? 'text.primary' : 'text.secondary'
                            }}
                          >
                            {conversation.name || 'Unknown'}
                            {conversation.isEncrypted && (
                              <LockIcon fontSize="inherit" sx={{ ml: 0.5, fontSize: '0.875rem', verticalAlign: 'middle', color: 'rgba(255, 215, 0, 0.7)' }} />
                            )}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ fontSize: '0.7rem', fontWeight: hasUnread ? 600 : 400 }}
                          >
                            {formatMessageTime(conversation.latestMessage?.timestamp)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: hasUnread ? 'text.primary' : 'text.secondary',
                              fontWeight: hasUnread ? 500 : 400,
                              fontSize: '0.8rem',
                              maxWidth: '180px',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {conversation.latestMessage?.sender && !conversation.latestMessage.isCurrentUser && 
                              <Typography component="span" variant="caption" sx={{ mr: 0.5, fontWeight: hasUnread ? 600 : 500 }}>
                                {!conversation.isGroup ? '' : `${conversation.latestMessage.sender}: `}
                              </Typography>
                            }
                            {conversation.latestMessage?.content 
                              ? truncateText(conversation.latestMessage.content) 
                              : 'No messages yet'}
                            {conversation.latestMessage?.hasAttachment && conversation.latestMessage.content.trim() === '' && ' [Attachment]'}
                          </Typography>
                          {hasUnread && (
                            <UnreadBadge badgeContent={conversation.unread} max={99} />
                          )}
                        </Box>
                      }
                    />
                  </StyledListItem>
                  <Divider sx={{ background: 'rgba(255, 255, 255, 0.1)' }} />
                </React.Fragment>
              );
            })}
          </List>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography 
              variant="body1" 
              sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 2 }}
            >
              No conversations found
            </Typography>
            <ActionButton 
              variant="outlined" 
              startIcon={<PersonAdd />}
              size="small"
              onClick={handleNewConversationClick}
            >
              Start a new conversation
            </ActionButton>
          </Box>
        )}
      </Box>
      
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleArchiveConversation}>
          <ListItemIcon>
            <Archive fontSize="small" />
          </ListItemIcon>
          <ListItemText>Archive</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteConversation}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
      
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterMenuClose}
      >
        <MenuItem 
          onClick={() => { setTabValue('all'); handleFilterMenuClose(); }}
          selected={tabValue === 'all'}
        >
          All Conversations
        </MenuItem>
        <MenuItem 
          onClick={() => { setTabValue('unread'); handleFilterMenuClose(); }}
          selected={tabValue === 'unread'}
        >
          Unread
        </MenuItem>
        <MenuItem 
          onClick={() => { setTabValue('direct'); handleFilterMenuClose(); }}
          selected={tabValue === 'direct'}
        >
          Direct Messages
        </MenuItem>
        <MenuItem 
          onClick={() => { setTabValue('group'); handleFilterMenuClose(); }}
          selected={tabValue === 'group'}
        >
          Group Chats
        </MenuItem>
      </Menu>
      
      <Dialog 
        open={showNewConversationDialog} 
        onClose={() => setShowNewConversationDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1a1a1a',
            color: '#fff',
          }
        }}
      >
        <DialogTitle sx={{ color: '#FFD700' }}>
          New Conversation
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
              Conversation Type
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={newConversationType === 'direct' ? 'contained' : 'outlined'}
                startIcon={<Email />}
                onClick={() => handleConversationTypeChange('direct')}
                sx={{ 
                  flexGrow: 1,
                  bgcolor: newConversationType === 'direct' ? 'rgba(255, 215, 0, 0.2)' : 'transparent',
                  color: '#FFD700',
                  borderColor: 'rgba(255, 215, 0, 0.5)',
                  '&:hover': {
                    bgcolor: newConversationType === 'direct' ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 215, 0, 0.1)',
                    borderColor: '#FFD700',
                  }
                }}
              >
                Direct Message
              </Button>
              <Button
                variant={newConversationType === 'group' ? 'contained' : 'outlined'}
                startIcon={<GroupAdd />}
                onClick={() => handleConversationTypeChange('group')}
                sx={{ 
                  flexGrow: 1,
                  bgcolor: newConversationType === 'group' ? 'rgba(255, 215, 0, 0.2)' : 'transparent',
                  color: '#FFD700',
                  borderColor: 'rgba(255, 215, 0, 0.5)',
                  '&:hover': {
                    bgcolor: newConversationType === 'group' ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 215, 0, 0.1)',
                    borderColor: '#FFD700',
                  }
                }}
              >
                Group Chat
              </Button>
            </Box>
          </Box>
          
          {newConversationType === 'group' && (
            <TextField
              fullWidth
              label="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              margin="normal"
              variant="outlined"
              InputLabelProps={{
                sx: { color: 'rgba(255, 255, 255, 0.7)' },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(255, 215, 0, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 215, 0, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#FFD700',
                  },
                  '& input': {
                    color: '#fff',
                  },
                },
              }}
            />
          )}
          
          <FormControl 
            fullWidth 
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(255, 215, 0, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 215, 0, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#FFD700',
                },
              },
            }}
          >
            <InputLabel 
              id="user-select-label"
              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              {newConversationType === 'direct' ? 'Select User' : 'Select Group Members'}
            </InputLabel>
            <Select
              labelId="user-select-label"
              multiple={newConversationType === 'group'}
              value={selectedUsers}
              onChange={handleUserSelect}
              input={
                <OutlinedInput 
                  label={newConversationType === 'direct' ? 'Select User' : 'Select Group Members'} 
                  sx={{ color: '#fff' }}
                />
              }
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const user = conversations.find(user => user.id === value);
                    return user ? (
                      <Chip 
                        key={value} 
                        label={user.name} 
                        avatar={<Avatar src={user.avatar} />}
                        sx={{ 
                          bgcolor: 'rgba(255, 215, 0, 0.2)', 
                          color: '#FFD700',
                          '& .MuiChip-deleteIcon': {
                            color: 'rgba(255, 215, 0, 0.7)',
                            '&:hover': {
                              color: '#FFD700',
                            }
                          }
                        }}
                        onDelete={
                          newConversationType === 'group' 
                            ? () => setSelectedUsers(prev => prev.filter(id => id !== value)) 
                            : undefined
                        }
                      />
                    ) : null;
                  })}
                </Box>
              )}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: '#1a1a1a',
                    color: '#fff',
                    maxHeight: 300,
                  },
                },
              }}
            >
              {conversations.map((user) => (
                <MenuItem 
                  key={user.id} 
                  value={user.id}
                  sx={{
                    '&.Mui-selected': {
                      bgcolor: 'rgba(255, 215, 0, 0.1)',
                    },
                    '&.Mui-selected:hover': {
                      bgcolor: 'rgba(255, 215, 0, 0.2)',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={user.avatar} alt={user.name} />
                  </ListItemAvatar>
                  <ListItemText primary={user.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControlLabel
            control={
              <Switch 
                checked={enableEncryption}
                onChange={(e) => setEnableEncryption(e.target.checked)}
                color="primary"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#FFD700',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: 'rgba(255, 215, 0, 0.5)',
                  },
                }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LockIcon fontSize="small" sx={{ mr: 1, color: enableEncryption ? '#FFD700' : 'rgba(255, 255, 255, 0.5)' }} />
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Enable end-to-end encryption
                </Typography>
              </Box>
            }
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setShowNewConversationDialog(false)}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={handleCreateConversation}
            disabled={
              (newConversationType === 'direct' && selectedUsers.length !== 1) ||
              (newConversationType === 'group' && (selectedUsers.length < 2 || !groupName))
            }
            sx={{ 
              bgcolor: 'rgba(255, 215, 0, 0.8)',
              color: '#000',
              '&:hover': {
                bgcolor: '#FFD700',
              },
              '&.Mui-disabled': {
                bgcolor: 'rgba(255, 215, 0, 0.3)',
                color: 'rgba(0, 0, 0, 0.5)',
              }
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </ConversationContainer>
  );
};

ConversationList.propTypes = {
  conversations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      avatar: PropTypes.string,
      latestMessage: PropTypes.shape({
        content: PropTypes.string,
        timestamp: PropTypes.string,
        sender: PropTypes.string,
        isCurrentUser: PropTypes.bool,
        hasAttachment: PropTypes.bool
      }),
      unread: PropTypes.number,
      status: PropTypes.oneOf(['online', 'away', 'offline']),
      isGroup: PropTypes.bool,
      isEncrypted: PropTypes.bool
    })
  ),
  onSelectConversation: PropTypes.func.isRequired,
  selectedConversationId: PropTypes.string,
  loading: PropTypes.bool
};

export default ConversationList; 