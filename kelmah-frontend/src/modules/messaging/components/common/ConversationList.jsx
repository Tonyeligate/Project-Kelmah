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
  Autocomplete,
  CircularProgress,
  FormControlLabel,
  Switch,
  useTheme,
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
  Lock as LockIcon,
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import {
  formatDistanceToNow,
  isToday,
  isThisWeek,
  isThisMonth,
} from 'date-fns';
import { useMessages } from '../../contexts/MessageContext';
import searchService from '../../../search/services/searchService';
import Skeleton from '@mui/material/Skeleton';

// Styled components
const ConversationContainer = styled(Paper)(({ theme }) => ({
  height: '100%',
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  backgroundColor: alpha(theme.palette.primary.main, 0.7),
  backdropFilter: 'blur(10px)',
  border: `2px solid ${theme.palette.secondary.main}`,
  boxShadow: `inset 0 0 8px rgba(255, 215, 0, 0.5)`,
  transition: 'box-shadow 0.3s ease-in-out, border-color 0.3s ease-in-out',
  '&:hover': {
    boxShadow: `0 0 12px rgba(255, 215, 0, 0.3), inset 0 0 8px rgba(255, 215, 0, 0.5)`,
    borderColor: theme.palette.secondary.light,
  },
  display: 'flex',
  flexDirection: 'column',
}));

const ConversationItem = styled(ListItem)(({ theme, selected }) => ({
  padding: theme.spacing(2),
  backgroundColor: selected
    ? alpha(theme.palette.secondary.main, 0.1)
    : 'transparent',
  borderLeft: selected
    ? `3px solid ${theme.palette.secondary.main}`
    : '3px solid transparent',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.secondary.main, 0.05),
  },
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.main,
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
    backgroundColor: alpha(theme.palette.common.white, 0.05),
    '& fieldset': {
      borderColor: alpha(theme.palette.secondary.main, 0.3),
    },
    '&:hover fieldset': {
      borderColor: alpha(theme.palette.secondary.main, 0.5),
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.secondary.main,
    },
  },
  '& .MuiInputBase-input': {
    color: theme.palette.common.white,
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  color: theme.palette.secondary.main,
  borderColor: alpha(theme.palette.secondary.main, 0.5),
  '&:hover': {
    borderColor: theme.palette.secondary.main,
    backgroundColor: alpha(theme.palette.secondary.main, 0.1),
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  color: alpha(theme.palette.common.white, 0.7),
  '&.Mui-selected': {
    color: theme.palette.secondary.main,
  },
}));

const StyledListItem = styled(ListItem)(({ theme, active }) => ({
  borderRadius: theme.shape.borderRadius,
  transition: 'background-color 0.2s ease',
  cursor: 'pointer',
  marginBottom: theme.spacing(0.5),
  backgroundColor: active ? theme.palette.action.selected : 'transparent',
  '&:hover': {
    backgroundColor: active
      ? theme.palette.action.selected
      : theme.palette.action.hover,
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
const ConversationList = ({ onSelectConversation, selectedConversationId }) => {
  const theme = useTheme();
  const [userOptions, setUserOptions] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchText, setUserSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [tabValue, setTabValue] = useState('all');
  const [dateFilter, setDateFilter] = useState('allDates');
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showNewConversationDialog, setShowNewConversationDialog] =
    useState(false);
  const [newConversationType, setNewConversationType] = useState('direct');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const { messagingService, userStatuses } = useMessages();
  const [localConversations, setLocalConversations] = useState([]);
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchConversations = async () => {
      try {
        setLocalLoading(true);
        const convos = await messagingService.getConversations();
        if (!cancelled) {
          setLocalConversations(convos);
          setFilteredConversations(convos);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        if (!cancelled) setLocalLoading(false);
      }
    };
    fetchConversations();
    return () => {
      cancelled = true;
    };
  }, [messagingService]);

  // Subscribe to new messages for real-time updates
  useEffect(() => {
    const unsubscribe = messagingService.onNewMessage((data) => {
      setLocalConversations((prevConvos) => {
        const updated = prevConvos.map((convo) => {
          if (convo.id !== data.conversationId) return convo;
          const hasAttach = data.attachments && data.attachments.length > 0;
          return {
            ...convo,
            latestMessage: {
              content: data.content || '',
              timestamp: data.createdAt,
              hasAttachment: hasAttach,
              sender: `${data.sender.firstName} ${data.sender.lastName}`,
              isCurrentUser: data.sender.id === messagingService.userId,
            },
            unread:
              selectedConversationId === data.conversationId
                ? 0
                : (convo.unread || 0) + 1,
          };
        });
        // Reorder conversations by newest message
        return updated.sort(
          (a, b) =>
            new Date(b.latestMessage.timestamp) -
            new Date(a.latestMessage.timestamp),
        );
      });
    });
    return () => unsubscribe();
  }, [messagingService, selectedConversationId]);

  // Fetch user options for new conversation dialog
  useEffect(() => {
    if (!showNewConversationDialog) return;
    let active = true;
    if (!userSearchText.trim()) {
      setUserOptions([]);
      return;
    }
    const loadUsers = async () => {
      setUsersLoading(true);
      try {
        const results = await searchService.searchWorkers({
          query: userSearchText,
          limit: 10,
        });
        if (active) setUserOptions(results.data || results.results || results);
      } catch (err) {
        console.error('Error searching users:', err);
      } finally {
        if (active) setUsersLoading(false);
      }
    };
    loadUsers();
    return () => {
      active = false;
    };
  }, [userSearchText, showNewConversationDialog]);

  useEffect(() => {
    // Filter conversations based on search query and selected tab
    let convos = [...localConversations];
    if (searchQuery.trim() !== '') {
      const lowerCaseQuery = searchQuery.toLowerCase();
      convos = convos.filter(
        (conv) =>
          (conv.name && conv.name.toLowerCase().includes(lowerCaseQuery)) ||
          (conv.latestMessage &&
            conv.latestMessage.content &&
            conv.latestMessage.content.toLowerCase().includes(lowerCaseQuery)),
      );
    }
    // Apply tab filters: unread, direct, group
    if (tabValue === 'unread') {
      convos = convos.filter((c) => c.unread > 0);
    } else if (tabValue === 'direct') {
      convos = convos.filter((c) => !c.isGroup);
    } else if (tabValue === 'group') {
      convos = convos.filter((c) => c.isGroup);
    }
    // Apply date filter: today, this week, this month
    if (dateFilter === 'today') {
      convos = convos.filter((c) => {
        const ts = c.latestMessage?.timestamp;
        return ts && isToday(new Date(ts));
      });
    } else if (dateFilter === 'thisWeek') {
      convos = convos.filter((c) => {
        const ts = c.latestMessage?.timestamp;
        return ts && isThisWeek(new Date(ts), { weekStartsOn: 1 });
      });
    } else if (dateFilter === 'thisMonth') {
      convos = convos.filter((c) => {
        const ts = c.latestMessage?.timestamp;
        return ts && isThisMonth(new Date(ts));
      });
    }
    setFilteredConversations(convos);
  }, [searchQuery, localConversations, tabValue, dateFilter]);

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const truncateText = (text, maxLength = 30) => {
    if (!text) return '';
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const renderLoadingSkeletons = () =>
    Array(4)
      .fill(0)
      .map((_, index) => (
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
      ));

  const handleSelectConversation = (conversation) => {
    if (conversation.unread > 0) {
      setFilteredConversations((prevConversations) =>
        prevConversations.map((c) =>
          c.id === conversation.id ? { ...c, unread: 0 } : c,
        ),
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
    setFilteredConversations((prevConversations) =>
      prevConversations.filter((c) => c.id !== selectedConversation.id),
    );
    handleMenuClose();
  };

  const handleDeleteConversation = () => {
    setFilteredConversations((prevConversations) =>
      prevConversations.filter((c) => c.id !== selectedConversation.id),
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
    setSelectedUsers(typeof value === 'string' ? value.split(',') : value);
  };

  const handleCreateConversation = async () => {
    try {
      let convo;
      if (newConversationType === 'direct') {
        // Use selected user ID for direct conversations
        const recipientId = selectedUsers[0]?.id;
        convo = await messagingService.createDirectConversation(recipientId);
      } else {
        // Use array of selected user IDs for group conversations
        const participantIds = selectedUsers.map((user) => user.id);
        convo = await messagingService.createGroupConversation(
          groupName,
          participantIds,
        );
      }
      // Prepend and select
      setFilteredConversations((prev) => [convo, ...prev]);
      setShowNewConversationDialog(false);
      onSelectConversation(convo);
    } catch (err) {
      console.error('Error creating conversation:', err);
    }
  };

  return (
    <ConversationContainer elevation={3}>
      <Box
        sx={(theme) => ({
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
        })}
      >
        <Typography variant="h6" sx={{ color: 'primary.main' }}>
          Messages
        </Typography>
        <Box>
          <Tooltip title="Filter conversations">
            <IconButton
              size="small"
              sx={(theme) => ({
                color: alpha(theme.palette.secondary.main, 0.7),
              })}
              onClick={handleFilterMenuOpen}
            >
              <FilterList />
            </IconButton>
          </Tooltip>
          <Tooltip title="New conversation">
            <IconButton
              size="small"
              sx={(theme) => ({
                color: alpha(theme.palette.secondary.main, 0.7),
                ml: 1,
              })}
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
              <SearchIcon
                sx={{ color: alpha(theme.palette.primary.main, 0.7) }}
              />
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
          ),
        }}
      />

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={(theme) => ({
          borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
          '& .MuiTabs-indicator': {
            backgroundColor: theme.palette.secondary.main,
          },
        })}
      >
        <StyledTab value="all" label="All" />
        <StyledTab value="unread" label="Unread" />
        <StyledTab value="direct" label="Direct" />
        <StyledTab value="group" label="Groups" />
      </Tabs>

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {localLoading ? (
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
                          <Avatar
                            src={conversation.avatar || ''}
                            alt={conversation.name || 'User'}
                          >
                            {!conversation.avatar &&
                              (conversation.name?.charAt(0) || 'U')}
                          </Avatar>
                        )}
                        {/* Show online status of the other participant for direct chats */}
                        {!conversation.isGroup &&
                          (() => {
                            const other = conversation.participants.find(
                              (p) => p.id !== messagingService.userId,
                            );
                            const status = other
                              ? userStatuses[other.id] || 'offline'
                              : 'offline';
                            return <StatusDot status={status} />;
                          })()}
                        {conversation.isGroup && <StatusDot status="offline" />}
                      </Box>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '100%',
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: hasUnread ? 700 : 400,
                              color: hasUnread
                                ? 'text.primary'
                                : 'text.secondary',
                            }}
                          >
                            {conversation.name || 'Unknown'}
                            {conversation.isEncrypted && (
                              <LockIcon
                                fontSize="inherit"
                                sx={{
                                  ml: 0.5,
                                  fontSize: '0.875rem',
                                  verticalAlign: 'middle',
                                  color:
                                    alpha(theme.palette.primary.main, 0.7),
                                }}
                              />
                            )}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              fontSize: '0.7rem',
                              fontWeight: hasUnread ? 600 : 400,
                            }}
                          >
                            {formatMessageTime(
                              conversation.latestMessage?.timestamp,
                            )}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '100%',
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              color: hasUnread
                                ? 'text.primary'
                                : 'text.secondary',
                              fontWeight: hasUnread ? 500 : 400,
                              fontSize: '0.8rem',
                              maxWidth: '180px',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {conversation.latestMessage?.sender &&
                              !conversation.latestMessage.isCurrentUser && (
                                <Typography
                                  component="span"
                                  variant="caption"
                                  sx={{
                                    mr: 0.5,
                                    fontWeight: hasUnread ? 600 : 500,
                                  }}
                                >
                                  {!conversation.isGroup
                                    ? ''
                                    : `${conversation.latestMessage.sender}: `}
                                </Typography>
                              )}
                            {conversation.latestMessage?.content
                              ? truncateText(conversation.latestMessage.content)
                              : 'No messages yet'}
                            {conversation.latestMessage?.hasAttachment &&
                              conversation.latestMessage.content.trim() ===
                                '' &&
                              ' [Attachment]'}
                          </Typography>
                          {hasUnread && (
                            <UnreadBadge
                              badgeContent={conversation.unread}
                              max={99}
                            />
                          )}
                        </Box>
                      }
                    />
                  </StyledListItem>
                  <Divider sx={{ backgroundColor: 'divider' }} />
                </React.Fragment>
              );
            })}
          </List>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography
              variant="body1"
              sx={{ color: 'text.primary', opacity: 0.5, mb: 2 }}
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
          onClick={() => {
            setTabValue('all');
            handleFilterMenuClose();
          }}
          selected={tabValue === 'all'}
        >
          All Conversations
        </MenuItem>
        <MenuItem
          onClick={() => {
            setTabValue('unread');
            handleFilterMenuClose();
          }}
          selected={tabValue === 'unread'}
        >
          Unread
        </MenuItem>
        <MenuItem
          onClick={() => {
            setTabValue('direct');
            handleFilterMenuClose();
          }}
          selected={tabValue === 'direct'}
        >
          Direct Messages
        </MenuItem>
        <MenuItem
          onClick={() => {
            setTabValue('group');
            handleFilterMenuClose();
          }}
          selected={tabValue === 'group'}
        >
          Group Chats
        </MenuItem>
        <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.2)' }} />
        <MenuItem
          onClick={() => {
            setDateFilter('allDates');
            handleFilterMenuClose();
          }}
          selected={dateFilter === 'allDates'}
        >
          All Dates
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDateFilter('today');
            handleFilterMenuClose();
          }}
          selected={dateFilter === 'today'}
        >
          Today
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDateFilter('thisWeek');
            handleFilterMenuClose();
          }}
          selected={dateFilter === 'thisWeek'}
        >
          This Week
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDateFilter('thisMonth');
            handleFilterMenuClose();
          }}
          selected={dateFilter === 'thisMonth'}
        >
          This Month
        </MenuItem>
      </Menu>

      <Dialog
        open={showNewConversationDialog}
        onClose={() => setShowNewConversationDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            color: 'text.primary',
          },
        }}
      >
        <DialogTitle sx={{ color: 'primary.main' }}>New Conversation</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, mb: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, color: 'text.secondary' }}
            >
              Conversation Type
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={
                  newConversationType === 'direct' ? 'contained' : 'outlined'
                }
                startIcon={<Email />}
                onClick={() => handleConversationTypeChange('direct')}
                sx={{
                  flexGrow: 1,
                  bgcolor:
                    newConversationType === 'direct'
                      ? alpha(theme.palette.primary.main, 0.2)
                      : 'transparent',
                  color: 'primary.main',
                  borderColor: alpha(theme.palette.primary.main, 0.5),
                  '&:hover': {
                    bgcolor:
                      newConversationType === 'direct'
                        ? alpha(theme.palette.primary.main, 0.3)
                        : alpha(theme.palette.primary.main, 0.1),
                    borderColor: theme.palette.primary.main,
                  },
                }}
              >
                Direct Message
              </Button>
              <Button
                variant={
                  newConversationType === 'group' ? 'contained' : 'outlined'
                }
                startIcon={<GroupAdd />}
                onClick={() => handleConversationTypeChange('group')}
                sx={{
                  flexGrow: 1,
                  bgcolor:
                    newConversationType === 'group'
                      ? alpha(theme.palette.primary.main, 0.2)
                      : 'transparent',
                  color: 'primary.main',
                  borderColor: alpha(theme.palette.primary.main, 0.5),
                  '&:hover': {
                    bgcolor:
                      newConversationType === 'group'
                        ? alpha(theme.palette.primary.main, 0.3)
                        : alpha(theme.palette.primary.main, 0.1),
                    borderColor: theme.palette.primary.main,
                  },
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
                sx: { color: 'text.secondary' },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                  },
                  '&:hover fieldset': {
                    borderColor: alpha(theme.palette.primary.main, 0.5),
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                  '& input': {
                    color: theme.palette.text.primary,
                  },
                },
              }}
            />
          )}

          {/* User search and select via Autocomplete */}
          <Autocomplete
            multiple={newConversationType === 'group'}
            disableCloseOnSelect={newConversationType === 'group'}
            options={userOptions}
            getOptionDisabled={(option) =>
              newConversationType === 'direct' &&
              selectedUsers.length >= 1 &&
              !selectedUsers.some((u) => u.id === option.id)
            }
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    src={option.avatar}
                    alt={option.name}
                    sx={{ width: 24, height: 24, mr: 1 }}
                  />
                  <Typography variant="body2" sx={{ color: 'text.primary' }}>
                    {option.name}
                  </Typography>
                </Box>
              </li>
            )}
            noOptionsText="No users found"
            getOptionLabel={(option) => option.name || ''}
            filterOptions={(x) => x}
            onInputChange={(event, value) => setUserSearchText(value)}
            loading={usersLoading}
            value={selectedUsers}
            onChange={(event, value) =>
              setSelectedUsers(Array.isArray(value) ? value : [value])
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={
                  newConversationType === 'direct'
                    ? 'Select User'
                    : 'Select Group Members'
                }
                variant="outlined"
                fullWidth
                InputLabelProps={{
                  sx: { color: 'text.secondary' },
                }}
                InputProps={{
                  ...params.InputProps,
                  sx: { color: theme.palette.text.primary },
                  endAdornment: (
                    <>
                      {usersLoading ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    },
                    '&:hover fieldset': {
                      borderColor: alpha(theme.palette.primary.main, 0.5),
                    },
                    '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                    '& input': { color: theme.palette.text.primary },
                  },
                }}
              />
            )}
          />

          {/* Encryption toggle removed — E2E encryption not implemented */}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setShowNewConversationDialog(false)}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateConversation}
            disabled={
              (newConversationType === 'direct' &&
                selectedUsers.length !== 1) ||
              (newConversationType === 'group' &&
                (selectedUsers.length < 2 || !groupName))
            }
            color="primary"
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </ConversationContainer>
  );
};

ConversationList.propTypes = {
  onSelectConversation: PropTypes.func.isRequired,
  selectedConversationId: PropTypes.string,
};

export default ConversationList;
